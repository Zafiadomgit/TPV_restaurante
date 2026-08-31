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

  const cambios = { estado, actualizado_en: new Date().toISOString() };

  // listo_en se fija una sola vez, la primera vez que el pedido llega a
  // "listo" — sirve para medir el tiempo real de cocina en el panel del
  // dueño. Si más tarde se revierte y se vuelve a marcar "listo" desde el
  // historial, no se pisa el dato original.
  if (estado === "listo") {
    const { data: actual } = await supabase.from("orders").select("listo_en").eq("id", id).maybeSingle();
    if (actual && !actual.listo_en) {
      cambios.listo_en = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update(cambios)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
  res.status(200).json(mapRow(data));
}
