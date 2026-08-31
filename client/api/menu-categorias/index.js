import { supabase } from "../_lib/supabaseClient.js";

function mapRow(row) {
  return { id: row.id, nombre: row.nombre, orden: row.orden };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("menu_categorias")
      .select("*")
      .order("orden", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapRow));
  }

  if (req.method === "POST") {
    const { nombre } = req.body || {};
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre de la categoría es obligatorio" });
    }

    const { count } = await supabase.from("menu_categorias").select("*", { count: "exact", head: true });

    const { data, error } = await supabase
      .from("menu_categorias")
      .insert({ nombre: nombre.trim(), orden: count ?? 0 })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: `Ya existe una categoría llamada "${nombre}"` });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
