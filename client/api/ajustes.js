import { supabase } from "./_lib/supabaseClient.js";
import { exigirRol } from "./_lib/auth.js";
import { LOCALES_VALIDOS } from "./_lib/orders.js";

function mapRow(row) {
  return { tiempoEsperaMinutos: row.tiempo_espera_minutos };
}

// Ajustes del negocio (de momento, solo el tiempo de espera estimado que
// se le muestra al cliente en la pantalla de inicio del kiosco). Es POR
// SEDE (columna `local`) — antes era una única fila global y los
// cajeros de Villarcayo y Medina de Pomar se pisaban el valor el uno al
// otro sin darse cuenta. GET es público a propósito — el kiosco (/) lo
// lee sin sesión, igual que GET /api/menu. PATCH exige rol caja: se
// edita desde /caja, como pidió el dueño.
export default async function handler(req, res) {
  if (req.method === "GET") {
    const { local } = req.query;
    // Fila legado (id=1, local null) de antes de separar por sede — se
    // mantiene como fallback si no se manda `local` o si esa sede
    // todavía no tiene fila propia, para no romper una pantalla vieja en
    // caché justo después de desplegar.
    const query =
      local && LOCALES_VALIDOS.includes(local)
        ? supabase.from("ajustes").select("*").eq("local", local)
        : supabase.from("ajustes").select("*").eq("id", 1);
    const { data, error } = await query.maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(mapRow(data));
  }

  if (req.method === "PATCH") {
    if (!exigirRol(req, res, ["caja"])) return;

    const { tiempoEsperaMinutos, local } = req.body || {};
    if (!LOCALES_VALIDOS.includes(local)) {
      return res.status(400).json({ error: "Sede no válida" });
    }
    const minutos = Number(tiempoEsperaMinutos);
    if (!Number.isFinite(minutos) || minutos <= 0) {
      return res.status(400).json({ error: "El tiempo de espera debe ser un número mayor que 0" });
    }

    const { data, error } = await supabase
      .from("ajustes")
      .update({ tiempo_espera_minutos: Math.round(minutos) })
      .eq("local", local)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "No hay ajustes para esa sede" });
    return res.status(200).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
