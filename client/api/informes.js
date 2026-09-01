import { supabase } from "./_lib/supabaseClient.js";
import { mapRow } from "./_lib/orders.js";
import { calcularResumen } from "./_lib/informes.js";
import { exigirRol } from "./_lib/auth.js";

export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const inicioHoy = new Date();
  inicioHoy.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .gte("creado_en", inicioHoy.toISOString());

  if (error) return res.status(500).json({ error: error.message });

  const resumen = calcularResumen(data.map(mapRow));
  res.status(200).json(resumen);
}
