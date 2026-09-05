// Misma fórmula que calcularTotales() en client/api/_lib/orders.js (IVA 10%),
// duplicada aquí porque el frontend no comparte bundle con el backend serverless.
export const IVA_RATE = 0.1;

// Los precios de la carta ya llevan el IVA incluido — se desglosa DENTRO
// del precio, no se suma encima (si no, se cobraría IVA dos veces).
export function calcularTotales(items) {
  const total = Number(items.reduce((acc, it) => acc + it.precio * it.cantidad, 0).toFixed(2));
  const subtotal = Number((total / (1 + IVA_RATE)).toFixed(2));
  const iva = Number((total - subtotal).toFixed(2));
  return { subtotal, iva, total };
}
