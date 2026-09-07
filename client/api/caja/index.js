import { supabase } from "../_lib/supabaseClient.js";
import { mapTurnoRow } from "../_lib/caja.js";
import { exigirRol } from "../_lib/auth.js";
import { LOCALES_VALIDOS } from "../_lib/orders.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // El panel del dueño también lee esto (para "Últimos cierres" en
    // /panel), pero solo lectura — abrir/cerrar turno sigue siendo
    // exclusivo de caja, ver el POST más abajo. `local`: caja filtra
    // siempre por su propia sede (ver client/src/sede.js); el panel lo
    // manda solo si el dueño elige ver un local concreto en vez de todos.
    if (!exigirRol(req, res, ["caja", "panel"])) return;

    const { estado, local } = req.query;
    let query = supabase.from("turnos_caja").select("*").order("abierto_en", { ascending: false });
    if (estado) query = query.eq("estado", estado);
    if (local) query = query.eq("local", local);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapTurnoRow));
  }

  if (req.method === "POST") {
    if (!exigirRol(req, res, ["caja"])) return;

    const { efectivoInicial, local } = req.body || {};
    const inicial = Number(efectivoInicial);

    if (!Number.isFinite(inicial) || inicial < 0) {
      return res.status(400).json({ error: "El efectivo inicial debe ser un número válido" });
    }
    // A diferencia de POST /api/orders, aquí `local` es obligatorio: es
    // lo que separa "hay un turno abierto en Villarcayo" de "hay un
    // turno abierto en Medina de Pomar" — sin sede conocida no se puede
    // aplicar esa regla correctamente.
    if (!LOCALES_VALIDOS.includes(local)) {
      return res.status(400).json({ error: "Sede no válida" });
    }

    // No se puede abrir un turno nuevo si ya hay uno abierto EN ESA SEDE
    // — cada local opera su propio turno de caja en paralelo.
    const { data: turnoAbierto, error: errorAbierto } = await supabase
      .from("turnos_caja")
      .select("id")
      .eq("estado", "abierto")
      .eq("local", local)
      .maybeSingle();

    if (errorAbierto) return res.status(500).json({ error: errorAbierto.message });
    if (turnoAbierto) {
      return res.status(409).json({ error: "Ya hay un turno de caja abierto en esta sede" });
    }

    const { data, error } = await supabase
      .from("turnos_caja")
      .insert({
        efectivo_inicial: Number(inicial.toFixed(2)),
        estado: "abierto",
        local,
      })
      .select()
      .single();

    // Si dos aperturas de la misma sede llegan a la vez, el índice único
    // parcial de la BD (turnos_caja_unico_abierto_por_local_idx) rechaza
    // la segunda aunque la comprobación anterior no la haya detectado a
    // tiempo.
    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "Ya hay un turno de caja abierto en esta sede" });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(mapTurnoRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
