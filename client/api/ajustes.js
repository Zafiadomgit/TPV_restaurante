import { supabase } from "./_lib/supabaseClient.js";
import { exigirRol } from "./_lib/auth.js";
import { LOCALES_VALIDOS } from "./_lib/orders.js";

function mapRow(row) {
  return {
    tiempoEsperaMinutos: row.tiempo_espera_minutos,
    fondoRecogidaUrl: row.fondo_recogida_url,
    logoRecogidaUrl: row.logo_recogida_url,
  };
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

    const { tiempoEsperaMinutos, fondoRecogidaUrl, logoRecogidaUrl, local } = req.body || {};
    if (!LOCALES_VALIDOS.includes(local)) {
      return res.status(400).json({ error: "Sede no válida" });
    }

    // Cada bloque del formulario de Caja (tiempo de espera / fondo y logo
    // de recogida) se guarda por separado, así que solo se valida y
    // actualiza lo que venga presente en el body.
    const cambios = {};
    if (tiempoEsperaMinutos !== undefined) {
      const minutos = Number(tiempoEsperaMinutos);
      if (!Number.isFinite(minutos) || minutos <= 0) {
        return res.status(400).json({ error: "El tiempo de espera debe ser un número mayor que 0" });
      }
      cambios.tiempo_espera_minutos = Math.round(minutos);
    }
    if (fondoRecogidaUrl !== undefined) cambios.fondo_recogida_url = fondoRecogidaUrl.trim() || null;
    if (logoRecogidaUrl !== undefined) cambios.logo_recogida_url = logoRecogidaUrl.trim() || null;

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: "No hay cambios que guardar" });
    }

    const { data, error } = await supabase
      .from("ajustes")
      .update(cambios)
      .eq("local", local)
      .select()
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "No hay ajustes para esa sede" });
    return res.status(200).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
