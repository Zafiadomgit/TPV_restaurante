import { supabase } from "../_lib/supabaseClient.js";
import { exigirRol } from "../_lib/auth.js";

function mapRow(row) {
  return {
    id: row.id,
    categoriaId: row.categoria_id,
    nombre: row.nombre,
    descripcion: row.descripcion || "",
    precio: Number(row.precio),
    modificadores: row.modificadores || null,
    activo: row.activo,
    orden: row.orden,
  };
}

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function handler(req, res) {
  if (!exigirRol(req, res, ["caja"])) return;

  if (req.method === "GET") {
    // Lista completa (incluye inactivos) para la pantalla de gestión —
    // GET /api/menu ya filtra los inactivos para el kiosco.
    const { data, error } = await supabase
      .from("menu_productos")
      .select("*")
      .order("orden", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapRow));
  }

  if (req.method === "POST") {
    const { categoriaId, nombre, descripcion, precio, modificadores } = req.body || {};

    if (!categoriaId) {
      return res.status(400).json({ error: "La categoría es obligatoria" });
    }
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }
    const precioNumero = Number(precio);
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      return res.status(400).json({ error: "El precio debe ser un número válido" });
    }

    const baseId = slugify(nombre);
    if (!baseId) {
      return res.status(400).json({ error: "No se pudo generar un identificador a partir del nombre" });
    }

    const { count } = await supabase
      .from("menu_productos")
      .select("*", { count: "exact", head: true })
      .eq("categoria_id", categoriaId);

    let id = baseId;
    let intento = 1;
    // Reintenta con sufijo si el id ya existe (ej. dos productos que se
    // llamarían igual en slug, como "Kebab" y "kebab!").
    for (;;) {
      const { data: existente } = await supabase.from("menu_productos").select("id").eq("id", id).maybeSingle();
      if (!existente) break;
      intento += 1;
      id = `${baseId}-${intento}`;
    }

    const { data, error } = await supabase
      .from("menu_productos")
      .insert({
        id,
        categoria_id: categoriaId,
        nombre: nombre.trim(),
        descripcion: descripcion || "",
        precio: precioNumero,
        modificadores: modificadores || null,
        orden: count ?? 0,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
