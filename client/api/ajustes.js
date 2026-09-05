import { supabase } from "./_lib/supabaseClient.js";
import { exigirRol } from "./_lib/auth.js";

function mapRow(row) {
  return { tiempoEsperaMinutos: row.tiempo_espera_minutos };
}

// Ajustes globales del negocio (de momento, solo el tiempo de espera
// estimado que se le muestra al cliente en la pantalla de inicio del
// kiosco). GET es público a propósito — el kiosco (/) lo lee sin
// sesión, igual que GET /api/menu. PATCH exige rol caja: se edita desde
// /caja, como pidió el dueño.
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("ajustes").select("*").eq("id", 1).maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "PATCH") {
    if (!exigirRol(req, res, ["caja"])) return;

    const { tiempoEsperaMinutos } = req.body || {};
    const minutos = Number(tiempoEsperaMinutos);
    if (!Number.isFinite(minutos) || minutos <= 0) {
      return res.status(400).json({ error: "El tiempo de espera debe ser un número mayor que 0" });
    }

    const { data, error } = await supabase
      .from("ajustes")
      .update({ tiempo_espera_minutos: Math.round(minutos) })
      .eq("id", 1)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
