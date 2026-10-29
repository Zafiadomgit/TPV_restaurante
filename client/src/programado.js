// Pedidos programados desde caja ("Recoger en tienda" / "A domicilio" con
// hora): cocina no los ve hasta MINUTOS_ANTES_COCINA antes de esa hora (a
// petición del cliente: primero "unos 15 minutos", desde el 28/10/2026 media hora). Al aparecer, cocina los trata
// como un pedido nuevo: suena el aviso y se imprime la comanda.
export const MINUTOS_ANTES_COCINA = 30;

export function visibleEnCocina(order, ahora = Date.now()) {
  if (!order?.programadoPara) return true;
  return new Date(order.programadoPara).getTime() - MINUTOS_ANTES_COCINA * 60000 <= ahora;
}

export function horaProgramada(order) {
  if (!order?.programadoPara) return "";
  const fecha = new Date(order.programadoPara);
  const hora = fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  return esHoy ? hora : `${fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} ${hora}`;
}

// "HH:MM" de un <input type="time"> -> fecha ISO de hoy a esa hora; si esa
// hora ya ha pasado hoy, se entiende que es mañana.
export function isoDesdeHora(hhmm, ahora = new Date()) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  if (!m) return null;
  const fecha = new Date(ahora);
  fecha.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (fecha.getTime() < ahora.getTime() - 60000) fecha.setDate(fecha.getDate() + 1);
  return fecha.toISOString();
}
