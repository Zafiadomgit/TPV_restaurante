export const ESTADOS_TURNO_VALIDOS = ["abierto", "cerrado"];

export function mapTurnoRow(row) {
  return {
    id: row.id,
    estado: row.estado,
    efectivoInicial: Number(row.efectivo_inicial),
    efectivoFinalDeclarado:
      row.efectivo_final_declarado != null ? Number(row.efectivo_final_declarado) : null,
    totalEfectivoEsperado:
      row.total_efectivo_esperado != null ? Number(row.total_efectivo_esperado) : null,
    diferencia: row.diferencia != null ? Number(row.diferencia) : null,
    notas: row.notas || "",
    abiertoEn: row.abierto_en,
    cerradoEn: row.cerrado_en,
  };
}

// Redondea siempre a 2 decimales, igual que calcularTotales() en _lib/orders.js.
export function round2(valor) {
  return Number(Number(valor).toFixed(2));
}

// Esperado = efectivo inicial + suma de pedidos cobrados en efectivo durante
// el turno. La diferencia se calcula sin ocultar signo ni redondear en
// silencio: positivo = sobra dinero, negativo = falta dinero.
export function calcularCierre({ efectivoInicial, totalCobradoEfectivo, efectivoFinalDeclarado }) {
  const esperado = round2(Number(efectivoInicial) + Number(totalCobradoEfectivo));
  const declarado = round2(efectivoFinalDeclarado);
  const diferencia = round2(declarado - esperado);
  return { esperado, declarado, diferencia };
}
