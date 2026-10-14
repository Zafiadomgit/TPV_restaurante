import crypto from "crypto";
import { verificarPin, crearToken, exigirRol } from "./_lib/auth.js";

// Firma para QZ Tray (POST /api/login?accion=firmar-qz): caja y cocina
// mandan aquí el texto que QZ Tray pide firmar y se devuelve firmado con
// la clave privada del certificado de client/public/qz/override.crt. Así
// QZ Tray reconoce la web como de confianza y deja de preguntar
// "Allow/Block" cada vez que se abre el cajón o se imprime una comanda.
// Va dentro de login.js y no en un archivo propio porque el plan de
// Vercel admite 12 funciones y ya están todas usadas.
// La clave privada vive SOLO en la variable de entorno QZ_CLAVE_PRIVADA
// de Vercel (nunca en el repositorio).
function firmarQz(req, res) {
  if (!exigirRol(req, res, ["caja", "cocina"])) return;
  const { mensaje } = req.body || {};
  if (typeof mensaje !== "string" || mensaje.length === 0 || mensaje.length > 100000) {
    return res.status(400).json({ error: "Mensaje no válido" });
  }
  const clave = process.env.QZ_CLAVE_PRIVADA;
  if (!clave) {
    return res.status(500).json({ error: "Falta configurar QZ_CLAVE_PRIVADA en Vercel" });
  }
  try {
    const firma = crypto.createSign("RSA-SHA512").update(mensaje).sign(normalizarClavePem(clave), "base64");
    return res.status(200).json({ firma });
  } catch (e) {
    console.error("firmar-qz:", e.message);
    return res.status(500).json({
      error: `La clave QZ_CLAVE_PRIVADA de Vercel no es válida (${describirClave(clave)}; tiene que ser PRIVATE KEY con 1624 caracteres)`,
    });
  }
}

// Para diagnosticar sin enseñar la clave: qué cabecera tiene (o ninguna) y
// cuántos caracteres de base64 hay entre BEGIN y END. La buena es
// "PRIVATE KEY" con 1624; "CERTIFICATE" (1308) es que se pegó override.crt.
function describirClave(valor) {
  const texto = String(valor);
  const m = texto.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)(-----END|$)/);
  if (!m) return `sin cabecera BEGIN, ${texto.length} caracteres`;
  const cuerpo = m[2].replace(/\\n/g, "").replace(/[^A-Za-z0-9+/=]/g, "");
  return `${m[1]}, ${cuerpo.length} caracteres${m[3] ? "" : ", sin END"}`;
}

// Al pegar la clave en el panel de Vercel es fácil que se pierdan los
// saltos de línea (quedan espacios), que queden "\n" literales o comillas
// alrededor — y entonces OpenSSL no la entiende ("DECODER routines::
// unsupported"). Se reconstruye el PEM: cabecera, cuerpo en base64 sin
// nada más, en líneas de 64, y pie.
function normalizarClavePem(valor) {
  const texto = String(valor).trim().replace(/^["']+|["']+$/g, "").replace(/\\n/g, "\n");
  const m = texto.match(/-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/);
  if (!m) {
    // Solo se pegó el cuerpo, sin las líneas BEGIN/END: se le ponen.
    const soloBase64 = texto.replace(/\s/g, "");
    if (/^[A-Za-z0-9+/=]{200,}$/.test(soloBase64)) {
      const lineas = soloBase64.match(/.{1,64}/g);
      return `-----BEGIN PRIVATE KEY-----\n${lineas.join("\n")}\n-----END PRIVATE KEY-----\n`;
    }
    return texto;
  }
  const cuerpo = m[2].replace(/[^A-Za-z0-9+/=]/g, "");
  const lineas = cuerpo.match(/.{1,64}/g) || [];
  return `-----BEGIN ${m[1]}-----\n${lineas.join("\n")}\n-----END ${m[1]}-----\n`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  if (req.query?.accion === "firmar-qz") return firmarQz(req, res);

  const { rol, pin } = req.body || {};
  if (!rol || !pin) {
    return res.status(400).json({ error: "Rol y PIN son obligatorios" });
  }
  if (!verificarPin(rol, pin)) {
    return res.status(401).json({ error: "PIN incorrecto" });
  }

  res.status(200).json({ rol, token: crearToken(rol) });
}
