// Misma fórmula que calcularTotales() en client/api/_lib/orders.js (IVA 10%),
// duplicada aquí porque el frontend no comparte bundle con el backend serverless.
export const IVA_RATE = 0.1;

export function calcularTotales(items) {
  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const iva = Number((subtotal * IVA_RATE).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), iva, total };
}
