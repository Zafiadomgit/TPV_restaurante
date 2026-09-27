// Ticket legible para mostrar en cocina/caja/checkout en vez del uuid, ej. "#A-118".
// Duplica client/api/_lib/orders.js::formatTicket porque client/api es
// backend serverless y client/src es el bundle del navegador — no comparten
// módulos entre sí.
export function formatTicket(ticketNumero) {
  return `#A-${ticketNumero}`;
}

// Importe con coma decimal, como se escribe en España ("24,20 €") — lo usa
// la pantalla de cliente (kiosco); caja/cocina siguen con toFixed(2).
export function formatEuros(importe) {
  return `${importe.toFixed(2).replace(".", ",")} €`;
}
