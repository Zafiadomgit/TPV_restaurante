import { useEffect, useState } from "react";
import { api } from "../api.js";
import { socket } from "../socket.js";
import OrderTicket from "../components/OrderTicket.jsx";

const ACTIVOS = ["pendiente", "en_preparacion", "listo"];

export default function Kitchen() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.getOrders().then((data) => setOrders(data.filter((o) => ACTIVOS.includes(o.estado))));
  }, []);

  useEffect(() => {
    const upsert = (order) => {
      setOrders((prev) => {
        const sinOrden = prev.filter((o) => o.id !== order.id);
        if (!ACTIVOS.includes(order.estado)) return sinOrden;
        return [...sinOrden, order];
      });
    };
    socket.on("pedido:nuevo", upsert);
    socket.on("pedido:actualizado", upsert);
    return () => {
      socket.off("pedido:nuevo", upsert);
      socket.off("pedido:actualizado", upsert);
    };
  }, []);

  const avanzarEstado = async (id, estado) => {
    try {
      await api.updateEstado(id, estado);
    } catch {
      // el evento de socket revertirá el estado visible si falla
    }
  };

  const ordenadas = [...orders].sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn));

  return (
    <div className="kitchen-page">
      <h2>Comandas en cocina</h2>
      {ordenadas.length === 0 ? (
        <p className="empty">No hay pedidos activos</p>
      ) : (
        <div className="tickets-grid">
          {ordenadas.map((order) => (
            <OrderTicket key={order.id} order={order} onAvanzar={avanzarEstado} />
          ))}
        </div>
      )}
    </div>
  );
}
