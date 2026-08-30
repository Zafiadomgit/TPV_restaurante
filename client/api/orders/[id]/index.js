import { supabase } from "../../_lib/supabaseClient.js";
import { mapRow } from "../../_lib/orders.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.query;
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
  res.status(200).json(mapRow(data));
}
