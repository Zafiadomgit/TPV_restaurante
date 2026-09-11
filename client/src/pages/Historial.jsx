import { useEffect, useState } from "react";
import { api } from "../api.js";
import { getSede } from "../sede.js";
import HistorialTicket from "../components/HistorialTicket.jsx";

const POLL_MS = 5000;

const FILTROS = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "pendiente", etiqueta: "Recibidos" },
  { valor: "en_preparacion", etiqueta: "En preparación" },
  { valor: "listo", etiqueta: "Listos" },
  { valor: "entregado", etiqueta: "Entregados" },
  { valor: "cancelado", etiqueta: "Cancelados" },
  // Aparte de "estado" (el ciclo de vida del pedido en cocina) — un
  // pedido anulado conserva su estado original (ej. "entregado"), esto
  // es una anulación posterior al cobro, no una etapa más del pedido.
  { valor: "anulados", etiqueta: "Anulados" },
];

export default function Historial() {
  const [orders, setOrders] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    // Filtra por la sede de este dispositivo (ver client/src/sede.js) —
    // sin ella (dispositivo todavía sin configurar) se ve todo, igual que
    // antes de que existiera el concepto de sede.
    const cargar = () =>
      api
        .getOrders(undefined, getSede())
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

  // Pide motivo obligatorio — la anulación queda registrada para
  // siempre en el historial, no es un borrado (ver client/api/orders/[id]/pagar.js).
  const anular = async (id) => {
    const motivo = window.prompt("Motivo de la anulación (obligatorio):");
    if (motivo === null) return;
    if (!motivo.trim()) {
      setError("El motivo de la anulación es obligatorio");
      return;
    }
    try {
      const actualizado = await api.anularOrder(id, motivo.trim());
      setOrders((prev) => prev.map((o) => (o.id === id ? actualizado : o)));
    } catch (e) {
      setError(e.message);
    }
  };

  const visibles = orders
    .filter((o) => {
      if (filtro === "todos") return true;
      if (filtro === "anulados") return o.anulado;
      return o.estado === filtro;
    })
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
            <HistorialTicket key={order.id} order={order} onRevertir={revertir} onAnular={anular} />
          ))}
        </div>
      )}
    </div>
  );
}
