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

      // El precio de las modificaciones (ej. salsa extra) se recalcula
      // siempre aquí a partir de la definición del menú — nunca se confía
      // en el precio ni el recargo que mande el cliente.
      let extra = 0;
      const nombresSeleccionados = [];
      for (const paso of producto.modificadores || []) {
        const seleccionCliente = Array.isArray(item.modificadores?.[paso.id])
          ? item.modificadores[paso.id]
          : [];
        const seleccionValida = seleccionCliente
          .filter((optId) => paso.opciones.some((o) => o.id === optId))
          .slice(0, paso.maxSeleccion ?? seleccionCliente.length);
        for (const optId of seleccionValida) {
          const opcion = paso.opciones.find((o) => o.id === optId);
          extra += opcion.precioExtra;
          nombresSeleccionados.push(opcion.nombre);
        }
      }

      itemsResueltos.push({
        productId: producto.id,
        nombre: producto.nombre,
        precio: Number((producto.precio + extra).toFixed(2)),
        cantidad,
        notas: item.notas || "",
        modificadoresTexto: nombresSeleccionados.join(", "),
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
