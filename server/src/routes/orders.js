import { Router } from "express";
import { randomUUID } from "crypto";
import {
  addOrder,
  findProduct,
  getOrder,
  getOrders,
  updateOrder,
  IVA_RATE,
} from "../store.js";

const ESTADOS_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"];

function calcularTotales(items) {
  const subtotal = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
  const iva = Number((subtotal * IVA_RATE).toFixed(2));
  const total = Number((subtotal + iva).toFixed(2));
  return { subtotal: Number(subtotal.toFixed(2)), iva, total };
}

export default function ordersRouter(io) {
  const router = Router();

  router.get("/", (req, res) => {
    const { estado } = req.query;
    let orders = getOrders();
    if (estado) orders = orders.filter((o) => o.estado === estado);
    orders.sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn));
    res.json(orders);
  });

  router.get("/:id", (req, res) => {
    const order = getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(order);
  });

  router.post("/", (req, res) => {
    const { mesa, items, notasGenerales } = req.body;

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

    const order = {
      id: randomUUID(),
      mesa: mesa.trim(),
      items: itemsResueltos,
      notasGenerales: notasGenerales || "",
      estado: "pendiente",
      pagado: false,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
      subtotal,
      iva,
      total,
    };

    addOrder(order);
    io.emit("pedido:nuevo", order);
    res.status(201).json(order);
  });

  router.patch("/:id/estado", (req, res) => {
    const { estado } = req.body;
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }
    const updated = updateOrder(req.params.id, (order) => ({
      ...order,
      estado,
      actualizadoEn: new Date().toISOString(),
    }));
    if (!updated) return res.status(404).json({ error: "Pedido no encontrado" });
    io.emit("pedido:actualizado", updated);
    res.json(updated);
  });

  router.patch("/:id/pagar", (req, res) => {
    const { metodoPago } = req.body;
    const order = getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    const updated = updateOrder(req.params.id, (o) => ({
      ...o,
      pagado: true,
      metodoPago: metodoPago || "efectivo",
      actualizadoEn: new Date().toISOString(),
    }));
    io.emit("pedido:actualizado", updated);
    res.json(updated);
  });

  return router;
}
