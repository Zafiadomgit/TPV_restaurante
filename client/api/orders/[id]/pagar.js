import { supabase } from "../../_lib/supabaseClient.js";
import { mapRow } from "../../_lib/orders.js";
import { exigirRol } from "../../_lib/auth.js";

// Marcar un pedido como pagado exige rol caja — el cliente ya no puede
// auto-marcarse como pagado desde /pago/:orderId (ver Checkout.jsx):
// solo un cajero cobra de verdad y lo confirma aquí. Si esto no se
// protegiera, cualquiera podría llamar a este endpoint directamente
// (sin pasar por la UI) y marcar su propio pedido como pagado gratis.
//
// También vive aquí la ANULACIÓN de un pedido ya cobrado (`body.anular`)
// — no es un endpoint nuevo por el límite de 12 funciones del plan
// Hobby de Vercel, y encaja: es otra acción financiera sobre el pedido
// que solo puede hacer caja. El cliente pidió poder "borrar el pedido
// para que no quede registrado el cobro" — eso es ocultar una venta ya
// cobrada, así que en vez de eso se anula CON MOTIVO: el pedido se queda
// para siempre en el historial, solo deja de contar como venta/efectivo
// esperado (ver calcularResumen en _lib/informes.js y el cierre de
// turno en caja/[id]/cerrar.js).
export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.query;
  const { metodoPago, anular, motivo } = req.body || {};

  if (anular) {
    const motivoLimpio = typeof motivo === "string" ? motivo.trim() : "";
    if (!motivoLimpio) {
      return res.status(400).json({ error: "El motivo de la anulación es obligatorio" });
    }

    const { data: actual, error: errorActual } = await supabase
      .from("orders")
      .select("pagado, anulado")
      .eq("id", id)
      .maybeSingle();
    if (errorActual) return res.status(500).json({ error: errorActual.message });
    if (!actual) return res.status(404).json({ error: "Pedido no encontrado" });
    if (!actual.pagado) {
      return res.status(400).json({ error: "Solo se puede anular un pedido ya cobrado" });
    }
    if (actual.anulado) {
      return res.status(400).json({ error: "Este pedido ya estaba anulado" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        anulado: true,
        anulado_motivo: motivoLimpio,
        anulado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.status(200).json(mapRow(data));
  }

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
