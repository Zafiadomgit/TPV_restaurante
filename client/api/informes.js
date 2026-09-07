import { supabase } from "./_lib/supabaseClient.js";
import { mapRow } from "./_lib/orders.js";
import { calcularResumen } from "./_lib/informes.js";
import { exigirRol } from "./_lib/auth.js";

export default async function handler(req, res) {
  // Solo rol "panel" — a propósito distinto de "caja", ver _lib/auth.js.
  if (!exigirRol(req, res, ["panel"])) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const inicioHoy = new Date();
  inicioHoy.setUTCHours(0, 0, 0, 0);

  // `local`: el dueño puede filtrar el panel a una sede concreta; sin
  // este parámetro se ven las dos combinadas (comportamiento de siempre).
  const { local } = req.query;
  let query = supabase.from("orders").select("*").gte("creado_en", inicioHoy.toISOString());
  if (local) query = query.eq("local", local);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const resumen = calcularResumen(data.map(mapRow));
  res.status(200).json(resumen);
}
