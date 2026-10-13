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
  const firma = crypto.createSign("RSA-SHA512").update(mensaje).sign(clave.replace(/\\n/g, "\n"), "base64");
  return res.status(200).json({ firma });
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
