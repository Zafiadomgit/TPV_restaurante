export const IVA_RATE = 0.1;

export const ESTADOS_VALIDOS = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
  "cancelado",
];

export function calcularTotales(items) {
  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const iva = Number((subtotal * IVA_RATE).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), iva, total };
}

export function mapRow(row) {
  return {
    id: row.id,
    ticketNumero: row.ticket_numero,
    mesa: row.mesa,
    items: row.items,
    notasGenerales: row.notas_generales || "",
    estado: row.estado,
    pagado: row.pagado,
    metodoPago: row.metodo_pago || null,
    subtotal: Number(row.subtotal),
    iva: Number(row.iva),
    total: Number(row.total),
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
    pagadoEn: row.pagado_en || null,
    turnoCajaId: row.turno_caja_id || null,
    listoEn: row.listo_en || null,
    telefonoWhatsapp: row.telefono_whatsapp || null,
  };
}

// Ticket legible para mostrar en cocina/caja/checkout en vez del uuid, ej. "#A-118".
export function formatTicket(ticketNumero) {
  return `#A-${ticketNumero}`;
}

// Normaliza lo que teclea el cliente a un número en formato E.164 sin "+"
// (lo que espera la API de WhatsApp, ej. "34612345678"). Un móvil español
// de 9 dígitos sin prefijo se asume +34 — es el caso normal para el
// negocio (Medina de Pomar/Villarcayo); si el cliente ya escribe su
// prefijo de país, se respeta tal cual. Devuelve null si no parece un
// número válido, para que el endpoint pueda rechazarlo con un 400 claro.
export function normalizarTelefonoWhatsapp(input) {
  if (typeof input !== "string") return null;
  const soloDigitos = input.replace(/[^\d+]/g, "");
  const sinMas = soloDigitos.startsWith("+") ? soloDigitos.slice(1) : soloDigitos;
  const normalizado = sinMas.length === 9 ? `34${sinMas}` : sinMas;
  if (normalizado.length < 8 || normalizado.length > 15) return null;
  return normalizado;
}
