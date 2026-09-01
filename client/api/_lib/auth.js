import crypto from "crypto";

// Roles con PIN: solo "caja" y "cocina" necesitan iniciar sesión. El
// kiosco de pedidos (/) es público a propósito — lo usa el cliente
// directamente, no tiene sentido pedirle un PIN de personal.
//
// Los valores por defecto son solo para poder probar la app sin configurar
// nada — CAMBIA PIN_CAJA, PIN_COCINA y AUTH_SECRET como variables de
// entorno en Vercel antes de usar esto en producción de verdad. AUTH_SECRET
// en particular no es como la clave "anon" de Supabase (esa es pública a
// propósito, protegida por RLS): si alguien conoce este secreto puede
// fabricar tokens de sesión válidos sin saber ningún PIN.
const SECRET = process.env.AUTH_SECRET || "california-tpv-cambia-este-secreto";
const PINES = {
  caja: process.env.PIN_CAJA || "1234",
  cocina: process.env.PIN_COCINA || "5678",
};
const DURACION_MS = 12 * 60 * 60 * 1000; // 12h — una jornada de trabajo

export function verificarPin(rol, pin) {
  return Boolean(PINES[rol]) && String(pin) === String(PINES[rol]);
}

export function crearToken(rol) {
  const expira = Date.now() + DURACION_MS;
  const payload = `${rol}.${expira}`;
  const firma = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${firma}`;
}

// Verifica firma + caducidad + (opcionalmente) que el rol esté en la lista
// permitida. Nunca se confía en un rol que mande el cliente sin este
// token — mismo principio que con el precio de los modificadores o la
// disponibilidad de un producto.
export function verificarToken(token, rolesPermitidos) {
  if (!token || typeof token !== "string") return null;
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  const [rol, expira, firma] = partes;

  const payload = `${rol}.${expira}`;
  const firmaEsperada = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (firma.length !== firmaEsperada.length || !crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(firmaEsperada))) {
    return null;
  }
  if (Date.now() > Number(expira)) return null;
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) return null;
  return rol;
}

// Helper para los handlers: extrae el token del header Authorization y
// devuelve el rol si es válido para alguno de los rolesPermitidos, o
// responde 401 y devuelve null si no lo es. Uso:
//   const rol = exigirRol(req, res, ["caja"]);
//   if (!rol) return;
export function exigirRol(req, res, rolesPermitidos) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const rol = verificarToken(token, rolesPermitidos);
  if (!rol) {
    res.status(401).json({ error: "No autorizado" });
    return null;
  }
  return rol;
}
