import { useEffect, useState } from "react";
import { api } from "../api.js";
import HistorialTicket from "../components/HistorialTicket.jsx";

const POLL_MS = 5000;

const FILTROS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Recibidos" },
  { valor: "en_preparacion", etiqueta: "En preparación" },
  { valor: "listo", etiqueta: "Listos" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
];

export default function Historial() {
  const [orders, setOrders] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = () =>
      api
        .getOrders()
        .then((data) => {
          if (activo) setOrders(data);
        })
        .catch(() => {
          if (activo) setError("No se pudo cargar el historial");
        });

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, []);

  const revertir = async (id, estado) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
    try {
      await api.updateEstado(id, estado);
    } catch {
      // el siguiente ciclo de polling corrige el estado si algo falló
    }
  };

  const visibles = orders
    .filter((o) => filtro === "todos" || o.estado === filtro)
    .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));

  return (
    <div className="historial-page">
      <h2>Historial de pedidos</h2>

      <div className="categorias">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            className={filtro === f.valor ? "active" : ""}
            onClick={() => setFiltro(f.valor)}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}

      {visibles.length === 0 ? (
        <p className="empty">No hay pedidos que mostrar</p>
      ) : (
        <div className="tickets-grid">
          {visibles.map((order) => (
            <HistorialTicket key={order.id} order={order} onRevertir={revertir} />
          ))}
        </div>
      )}
    </div>
  );
}
