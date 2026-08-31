import { supabase } from "../_lib/supabaseClient.js";
import { mapRow } from "../_lib/inventario.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase.from("inventario").select("*").order("nombre", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapRow));
  }

  if (req.method === "POST") {
    const { clave, nombre, categoria, stock, unidad, umbralBajo } = req.body || {};

    if (!clave || typeof clave !== "string" || !clave.trim()) {
      return res.status(400).json({ error: "La clave es obligatoria" });
    }
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const { data, error } = await supabase
      .from("inventario")
      .insert({
        clave: clave.trim(),
        nombre: nombre.trim(),
        categoria: categoria || "",
        stock: Number(stock) || 0,
        unidad: unidad || "uds",
        umbral_bajo: Number(umbralBajo) || 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: `Ya existe un ingrediente con la clave "${clave}"` });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
