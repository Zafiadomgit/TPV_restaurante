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

    const { estado, pagado } = req.query;
    let query = supabase.from("orders").select("*").order("creado_en", { ascending: true });
    if (estado) query = query.eq("estado", estado);
    // Usado por la cola de "pedidos del kiosco sin cobrar" en /caja —
    // pagado=false (los pedidos de venta rápida de caja nunca aparecen
    // aquí porque se crean y se cobran en el mismo paso, nunca quedan
    // pendientes de cobro).
    if (pagado !== undefined) query = query.eq("pagado", pagado === "true");

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
        const seleccionadas = seleccionValida
          .map((optId) => paso.opciones.find((o) => o.id === optId))
          .filter(Boolean);

        // Si el paso trae precioSiTodoQuitado, el precio base pasa a ser
        // ese valor fijo — pensado para vender el kebab/dürüm/lahmacum
        // "solo carne" más barato cuando el cliente quita "de más".
        // Dos formas de disparar el precio alternativo (validado siempre
        // contra seleccionValida, nunca lo que mande el cliente sin
        // comprobar):
        //  - Si el paso trae disparadoresPrecioAlternativo (array de ids
        //    de opción): se dispara si el cliente marcó ALGUNA de esas
        //    opciones — ej. quitar la lechuga SOLA ya obliga a echar más
        //    carne, no hace falta que quite también tomate/cebolla. No es
        //    "todas", es "cualquiera de estas".
        //  - Si no trae ese campo (productos antiguos, sin tocar):
        //    comportamiento de siempre — se dispara solo si se marcaron
        //    TODAS las opciones del paso.
        if (!baseSobrescrita && typeof paso.precioSiTodoQuitado === "number" && paso.opciones.length > 0) {
          const disparadores = paso.disparadoresPrecioAlternativo;
          const activa = Array.isArray(disparadores)
            ? disparadores.some((id) => seleccionValida.includes(id))
            : paso.opciones.every((o) => seleccionValida.includes(o.id));
          if (activa) {
            precioBase = paso.precioSiTodoQuitado;
            baseSobrescrita = true;
          }
        }

        // primerosGratis (ej. "Pizza a tu gusto"): las primeras N opciones
        // elegidas no suman precioExtra, el resto sí — "las primeras" se
        // decide por precio ascendente (las más baratas cuentan como las
        // gratis), nunca por el orden en que las mandó el cliente.
        const gratis = typeof paso.primerosGratis === "number" ? paso.primerosGratis : 0;
        const idsGratis = new Set(
          [...seleccionadas]
            .sort((a, b) => a.precioExtra - b.precioExtra)
            .slice(0, gratis)
            .map((o) => o.id)
        );
        for (const opcion of seleccionadas) {
          if (!idsGratis.has(opcion.id)) extra += opcion.precioExtra;
        }

        // Texto para cocina. Tres modos, en este orden:
        //  1. resumenQuitarMuchos (paso "quitar ingredientes" tipo kebab/
        //     dürüm/lahmacum): si se quitan `umbral` o más, en vez de
        //     listar cada "Sin X" se resume lo que SÍ queda ("Solo con
        //     lechuga"); si no queda nada, usa `siTodoVacio` ("Solo
        //     carne") en vez de no decir nada.
        //  2. textoSiVacio (paso tipo "elige tus salsas", con opciones
        //     por defecto): si el cliente quita TODAS las opciones que
        //     venían marcadas y no añade ninguna otra, usa ese texto
        //     ("Sin salsa") en vez de listar cada "Sin salsa X" suelta.
        //  3. Por defecto: solo se listan los CAMBIOS respecto a lo que
        //     venía marcado por defecto — lo añadido (nombre tal cual,
        //     ej. "Salsa picante") y lo quitado que sí venía por defecto
        //     ("Sin " + ingrediente). Una opción nunca marcada por
        //     defecto (ej. "Sin tomate" en el paso de quitar) siempre
        //     cuenta como "añadida" si se marca, así que este modo
        //     reproduce el comportamiento de siempre para esos pasos.
        const umbral = paso.resumenQuitarMuchos?.umbral;
        if (typeof umbral === "number" && seleccionadas.length >= umbral) {
          const restantes = paso.opciones.filter((o) => !seleccionValida.includes(o.id));
          if (restantes.length > 0) {
            nombresSeleccionados.push(`Solo con ${restantes.map((o) => o.ingrediente || o.nombre).join(" y ")}`);
          } else if (paso.resumenQuitarMuchos.siTodoVacio) {
            nombresSeleccionados.push(paso.resumenQuitarMuchos.siTodoVacio);
          }
        } else if (seleccionadas.length === 0 && paso.textoSiVacio) {
          nombresSeleccionados.push(paso.textoSiVacio);
        } else {
          const porDefectoIds = new Set(paso.opciones.filter((o) => o.porDefecto).map((o) => o.id));
          for (const opcion of seleccionadas) {
            if (!porDefectoIds.has(opcion.id)) nombresSeleccionados.push(opcion.nombre);
          }
          for (const opcion of paso.opciones) {
            if (porDefectoIds.has(opcion.id) && !seleccionValida.includes(opcion.id)) {
              nombresSeleccionados.push(`Sin ${opcion.ingrediente || opcion.nombre}`);
            }
          }
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
