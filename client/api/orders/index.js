import { supabase } from "../_lib/supabaseClient.js";
import { findProduct } from "../_lib/menu.js";
import { calcularTotales, mapRow } from "../_lib/orders.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { estado } = req.query;
    let query = supabase.from("orders").select("*").order("creado_en", { ascending: true });
    if (estado) query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data.map(mapRow));
  }

  if (req.method === "POST") {
    const { mesa, items, notasGenerales } = req.body || {};

    if (!mesa || typeof mesa !== "string" || !mesa.trim()) {
      return res.status(400).json({ error: "La mesa es obligatoria" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El pedido debe tener al menos un producto" });
    }

    const itemsResueltos = [];
    for (const item of items) {
      const producto = findProduct(item.productId);
      if (!producto) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.productId}` });
      }
      const cantidad = Number(item.cantidad) || 1;
      if (cantidad <= 0) {
        return res.status(400).json({ error: `Cantidad inválida para ${producto.nombre}` });
      }
      itemsResueltos.push({
        productId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad,
        notas: item.notas || "",
      });
    }

    const { subtotal, iva, total } = calcularTotales(itemsResueltos);

    const { data, error } = await supabase
      .from("orders")
      .insert({
        mesa: mesa.trim(),
        items: itemsResueltos,
        notas_generales: notasGenerales || "",
        estado: "pendiente",
        pagado: false,
        subtotal,
        iva,
        total,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(mapRow(data));
  }

  res.status(405).json({ error: "Método no permitido" });
}
