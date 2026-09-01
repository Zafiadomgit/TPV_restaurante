import { supabase } from "../_lib/supabaseClient.js";
import { findProducts } from "../_lib/menu.js";
import { calcularTotales, mapRow } from "../_lib/orders.js";
import { verificarToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    // Listar pedidos con todo el detalle (para cocina/historial) exige
    // rol. Pero /recogida es a propósito un tablero público sin login —
    // un monitor de cara al cliente que nadie atiende, así que no puede
    // depender de una sesión que expira. Sin token válido, en vez de
    // rechazar con 401, se sirve una vista pública reducida: solo id/
    // ticket/estado de los pedidos en_preparacion o listo, sin items ni
    // ningún otro dato del pedido.
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const rol = verificarToken(token, ["cocina", "caja"]);

    if (!rol) {
      const { data, error } = await supabase
        .from("orders")
        .select("id, ticket_numero, estado")
        .in("estado", ["en_preparacion", "listo"])
        .order("creado_en", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(
        data.map((row) => ({ id: row.id, ticketNumero: row.ticket_numero, estado: row.estado }))
      );
    }

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

    let productosPorId;
    try {
      productosPorId = await findProducts(items.map((item) => item.productId));
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }

    const itemsResueltos = [];
    for (const item of items) {
      const producto = productosPorId.get(item.productId);
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
      let precioBase = producto.precio;
      let baseSobrescrita = false;
      const nombresSeleccionados = [];
      for (const paso of producto.modificadores || []) {
        const seleccionCliente = Array.isArray(item.modificadores?.[paso.id])
          ? item.modificadores[paso.id]
          : [];
        const seleccionValida = seleccionCliente
          .filter((optId) => paso.opciones.some((o) => o.id === optId))
          .slice(0, paso.maxSeleccion ?? seleccionCliente.length);

        // Si el paso trae precioSiTodoQuitado y el cliente marcó TODAS sus
        // opciones (validadas arriba, nunca lo que mande el cliente sin
        // comprobar), el precio base pasa a ser ese valor fijo — pensado
        // para vender el kebab/dürüm/lahmacum "solo carne" más barato.
        if (
          !baseSobrescrita &&
          typeof paso.precioSiTodoQuitado === "number" &&
          paso.opciones.length > 0 &&
          paso.opciones.every((o) => seleccionValida.includes(o.id))
        ) {
          precioBase = paso.precioSiTodoQuitado;
          baseSobrescrita = true;
        }

        for (const optId of seleccionValida) {
          const opcion = paso.opciones.find((o) => o.id === optId);
          extra += opcion.precioExtra;
          nombresSeleccionados.push(opcion.nombre);
        }
      }

      itemsResueltos.push({
        productId: producto.id,
        nombre: producto.nombre,
        precio: Number((precioBase + extra).toFixed(2)),
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
