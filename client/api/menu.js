import { getMenu } from "./_lib/menu.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  try {
    const menu = await getMenu();
    res.status(200).json(menu);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
