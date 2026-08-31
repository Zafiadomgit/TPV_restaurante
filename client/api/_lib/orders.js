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
  };
}

// Ticket legible para mostrar en cocina/caja/checkout en vez del uuid, ej. "#A-118".
export function formatTicket(ticketNumero) {
  return `#A-${ticketNumero}`;
}
