import { supabase } from "../../_lib/supabaseClient.js";
import { mapRow } from "../../_lib/orders.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.query;
  const { metodoPago } = req.body || {};

  // El pedido queda vinculado al turno de caja abierto en el momento de
  // cobrar (si hay uno), para poder calcular el efectivo esperado al
  // cerrar turno. Cobrar sigue funcionando igual aunque no haya ningún
  // turno abierto: no se bloquea el checkout por esto.
  const { data: turnoAbierto } = await supabase
    .from("turnos_caja")
    .select("id")
    .eq("estado", "abierto")
    .maybeSingle();

  const { data, error } = await supabase
    .from("orders")
    .update({
      pagado: true,
      metodo_pago: metodoPago || "efectivo",
      pagado_en: new Date().toISOString(),
      turno_caja_id: turnoAbierto ? turnoAbierto.id : null,
      actualizado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
  res.status(200).json(mapRow(data));
}
