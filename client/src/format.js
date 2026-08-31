// Ticket legible para mostrar en cocina/caja/checkout en vez del uuid, ej. "#A-118".
// Duplica client/api/_lib/orders.js::formatTicket porque client/api es
// backend serverless y client/src es el bundle del navegador — no comparten
// módulos entre sí.
export function formatTicket(ticketNumero) {
  return `#A-${ticketNumero}`;
}
