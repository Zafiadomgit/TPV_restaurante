import { supabase } from "../_lib/supabaseClient.js";
import { mapTurnoRow } from "../_lib/caja.js";
import { exigirRol } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  if (req.method === "GET") {
    const { estado } = req.query;
    let query = supabase.from("turnos_caja").select("*").order("abierto_en", { ascending: false });
    if (estado) query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapTurnoRow));
  }

  if (req.method === "POST") {
    const { efectivoInicial } = req.body || {};
    const inicial = Number(efectivoInicial);

    if (!Number.isFinite(inicial) || inicial < 0) {
      return res.status(400).json({ error: "El efectivo inicial debe ser un número válido" });
    }

    // No se puede abrir un turno nuevo si ya hay uno abierto.
    const { data: turnoAbierto, error: errorAbierto } = await supabase
      .from("turnos_caja")
      .select("id")
      .eq("estado", "abierto")
      .maybeSingle();

    if (errorAbierto) return res.status(500).json({ error: errorAbierto.message });
    if (turnoAbierto) {
      return res.status(409).json({ error: "Ya hay un turno de caja abierto" });
    }

    const { data, error } = await supabase
      .from("turnos_caja")
      .insert({
        efectivo_inicial: Number(inicial.toFixed(2)),
        estado: "abierto",
      })
      .select()
      .single();

    // Si dos aperturas llegan a la vez, el índice único parcial de la BD
    // (turnos_caja_unico_abierto_idx) rechaza la segunda aunque la
    // comprobación anterior no la haya detectado a tiempo.
    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Ya hay un turno de caja abierto" });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(mapTurnoRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
