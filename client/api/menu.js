import { menu } from "./_lib/menu.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  res.status(200).json(menu);
}
