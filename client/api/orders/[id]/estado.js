import { supabase } from "../../_lib/supabaseClient.js";
import { ESTADOS_VALIDOS, mapRow } from "../../_lib/orders.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.query;
  const { estado } = req.body || {};

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
  res.status(200).json(mapRow(data));
}
