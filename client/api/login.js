import { verificarPin, crearToken } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { rol, pin } = req.body || {};
  if (!rol || !pin) {
    return res.status(400).json({ error: "Rol y PIN son obligatorios" });
  }
  if (!verificarPin(rol, pin)) {
    return res.status(401).json({ error: "PIN incorrecto" });
  }

  res.status(200).json({ rol, token: crearToken(rol) });
}
