import { supabase } from "../../_lib/supabaseClient.js";
import { mapRow, normalizarTelefonoWhatsapp } from "../../_lib/orders.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "PATCH") {
    // Público a propósito, igual que el GET de arriba: el cliente lo
    // llama desde /pago/:orderId sin sesión, para dejar su WhatsApp y
    // que le avisemos cuando cocina marque el pedido "listo" (ver
    // _lib/whatsapp.js). Este endpoint SOLO permite tocar
    // telefono_whatsapp — nunca estado/pagado/importes, que tienen sus
    // propios endpoints protegidos por rol (estado.js, pagar.js).
    const { telefonoWhatsapp } = req.body || {};
    const normalizado = normalizarTelefonoWhatsapp(telefonoWhatsapp);
    if (!normalizado) {
      return res.status(400).json({ error: "Número de WhatsApp inválido" });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ telefono_whatsapp: normalizado })
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.status(200).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
