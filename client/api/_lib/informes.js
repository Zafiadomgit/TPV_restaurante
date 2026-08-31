// Horas que se muestran en el gráfico de ventas por hora del panel del
// dueño. Es una franja horaria fija (no calculada a partir de los pedidos)
// para que el eje del gráfico no salte de forma según haya o no ventas en
// una hora concreta — cubre el horario habitual de un local de comida.
const HORAS_PANEL = Array.from({ length: 16 }, (_, i) => i + 8); // 8..23

// Toma pedidos ya mapeados (mapRow de _lib/orders.js) del día y calcula el
// resumen del panel del dueño. Separado del handler HTTP para poder
// probarlo con datos de ejemplo sin depender de Supabase.
export function calcularResumen(orders) {
  const pagados = orders.filter((o) => o.pagado);

  const ventasHoy = Number(pagados.reduce((acc, o) => acc + o.total, 0).toFixed(2));
  const tickets = pagados.length;
  const ticketMedio = tickets > 0 ? Number((ventasHoy / tickets).toFixed(2)) : 0;

  const conTiempoCocina = orders.filter((o) => o.listoEn);
  const tiempoMedioCocinaSegundos =
    conTiempoCocina.length > 0
      ? Math.round(
          conTiempoCocina.reduce(
            (acc, o) => acc + (new Date(o.listoEn).getTime() - new Date(o.creadoEn).getTime()) / 1000,
            0
          ) / conTiempoCocina.length
        )
      : null;

  const ventasPorHoraMap = new Map(HORAS_PANEL.map((h) => [h, 0]));
  for (const o of pagados) {
    const hora = new Date(o.creadoEn).getUTCHours();
    if (ventasPorHoraMap.has(hora)) {
      ventasPorHoraMap.set(hora, ventasPorHoraMap.get(hora) + o.total);
    }
  }
  const ventasPorHora = HORAS_PANEL.map((hora) => ({
    hora,
    total: Number((ventasPorHoraMap.get(hora) || 0).toFixed(2)),
  }));

  const cantidadPorProducto = new Map();
  for (const o of pagados) {
    for (const item of o.items) {
      cantidadPorProducto.set(item.nombre, (cantidadPorProducto.get(item.nombre) || 0) + item.cantidad);
    }
  }
  const topProductos = [...cantidadPorProducto.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }));

  return { ventasHoy, tickets, ticketMedio, tiempoMedioCocinaSegundos, ventasPorHora, topProductos };
}

export function formatDuracion(segundos) {
  if (segundos === null || segundos === undefined) return "—";
  const minutos = Math.floor(segundos / 60);
  const resto = Math.round(segundos % 60);
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}
