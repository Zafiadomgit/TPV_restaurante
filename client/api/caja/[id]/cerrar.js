import { supabase } from "../../_lib/supabaseClient.js";
import { calcularCierre, mapTurnoRow } from "../../_lib/caja.js";
import { exigirRol } from "../../_lib/auth.js";

export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { id } = req.query;
  const { efectivoFinalDeclarado } = req.body || {};
  const declarado = Number(efectivoFinalDeclarado);

  if (!Number.isFinite(declarado) || declarado < 0) {
    return res.status(400).json({ error: "El efectivo final declarado debe ser un número válido" });
  }

  const { data: turno, error: errorTurno } = await supabase
    .from("turnos_caja")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errorTurno) return res.status(500).json({ error: errorTurno.message });
  if (!turno) return res.status(404).json({ error: "Turno de caja no encontrado" });

  // No se puede cerrar un turno que no está abierto.
  if (turno.estado !== "abierto") {
    return res.status(400).json({ error: "Este turno de caja ya está cerrado" });
  }

  // Pedidos cobrados en efectivo durante este turno (vinculados vía
  // turno_caja_id, asignado por el backend al cobrar en /orders/[id]/pagar).
  const { data: pedidosEfectivo, error: errorPedidos } = await supabase
    .from("orders")
    .select("total")
    .eq("turno_caja_id", id)
    .eq("metodo_pago", "efectivo")
    .eq("pagado", true);

  if (errorPedidos) return res.status(500).json({ error: errorPedidos.message });

  const totalCobradoEfectivo = (pedidosEfectivo || []).reduce(
    (acc, pedido) => acc + Number(pedido.total),
    0
  );

  const { esperado, declarado: declaradoRedondeado, diferencia } = calcularCierre({
    efectivoInicial: turno.efectivo_inicial,
    totalCobradoEfectivo,
    efectivoFinalDeclarado: declarado,
  });

  const { data, error } = await supabase
    .from("turnos_caja")
    .update({
      estado: "cerrado",
      efectivo_final_declarado: declaradoRedondeado,
      total_efectivo_esperado: esperado,
      diferencia,
      cerrado_en: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("estado", "abierto")
    .select()
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) {
    // Otro cierre concurrente ganó la carrera entre la comprobación de
    // arriba y este update.
    return res.status(400).json({ error: "Este turno de caja ya está cerrado" });
  }
  res.status(200).json(mapTurnoRow(data));
}
