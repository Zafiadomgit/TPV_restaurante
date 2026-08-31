import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import OrderTicket from "../components/OrderTicket.jsx";

const POLL_MS = 3000;

const COLUMNAS = [
  { estado: "pendiente", titulo: "NUEVO", accentClass: "accent-rojo" },
  { estado: "en_preparacion", titulo: "PREPARANDO", accentClass: "accent-naranja" },
  { estado: "listo", titulo: "LISTO", accentClass: "accent-verde" },
];

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const enVuelo = useRef(false);

  useEffect(() => {
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders();
        setOrders(data.filter((o) => COLUMNAS.some((c) => c.estado === o.estado)));
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
      COLUMNAS.some((c) => c.estado === estado)
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
    <div className="kds-page">
      <div className="kds-header">
        <span className="kds-titulo">COCINA · CALIFORNIA</span>
        <span className="kds-contador">{ordenadas.length} comandas activas</span>
      </div>
      <div className="kds-columnas">
        {COLUMNAS.map((col) => {
          const pedidos = ordenadas.filter((o) => o.estado === col.estado);
          return (
            <div className="kds-columna" key={col.estado}>
              <div className={`kds-columna-header ${col.accentClass}`}>
                <span>{col.titulo}</span>
                <span>{pedidos.length}</span>
              </div>
              <div className="kds-columna-body">
                {pedidos.length === 0 ? (
                  <p className="kds-empty">Sin comandas</p>
                ) : (
                  pedidos.map((order) => (
                    <OrderTicket key={order.id} order={order} onAvanzar={avanzarEstado} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
