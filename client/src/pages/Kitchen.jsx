import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import OrderTicket from "../components/OrderTicket.jsx";

const ACTIVOS = ["pendiente", "en_preparacion", "listo"];
const POLL_MS = 3000;

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const enVuelo = useRef(false);

  useEffect(() => {
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders();
        setOrders(data.filter((o) => ACTIVOS.includes(o.estado)));
      } catch {
        // se reintenta en el siguiente ciclo
      } finally {
        enVuelo.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const avanzarEstado = async (id, estado) => {
    setOrders((prev) =>
      ACTIVOS.includes(estado)
        ? prev.map((o) => (o.id === id ? { ...o, estado } : o))
        : prev.filter((o) => o.id !== id)
    );
    try {
      await api.updateEstado(id, estado);
    } catch {
      // el siguiente ciclo de polling corrige el estado si algo falló
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
