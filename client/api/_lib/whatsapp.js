import { formatTicket } from "./orders.js";

const GRAPH_VERSION = "v21.0";

// Envía el aviso de "pedido listo" por WhatsApp vía Meta Cloud API
// (WhatsApp Business Platform), directamente, sin intermediario tipo
// Twilio. Requiere tres variables de entorno en Vercel:
//   WHATSAPP_TOKEN            — token de acceso permanente de la app de Meta
//   WHATSAPP_PHONE_NUMBER_ID  — Phone Number ID del número de WhatsApp Business
//   WHATSAPP_TEMPLATE_NAME    — nombre de la plantilla aprobada por Meta,
//                               con un único parámetro de texto (el ticket,
//                               ej. "#A-118")
// Mientras no estén configuradas, esta función no hace nada — no rompe
// el flujo de cocina si el dueño todavía no ha dado de alta WhatsApp.
// Tampoco lanza nunca si Meta responde con error: marcar un pedido como
// "listo" en cocina tiene que funcionar siempre, aunque el aviso falle.
export async function enviarAvisoPedidoListo(telefonoWhatsapp, ticketNumero) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  if (!token || !phoneNumberId || !templateName) return;

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefonoWhatsapp,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: formatTicket(ticketNumero) }],
            },
          ],
        },
      }),
    });
    if (!res.ok) {
      const detalle = await res.text().catch(() => "");
      console.error("Meta WhatsApp API respondió con error:", res.status, detalle);
    }
  } catch (e) {
    console.error("Error enviando aviso de WhatsApp:", e.message);
  }
}
