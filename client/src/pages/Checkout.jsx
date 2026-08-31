import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { formatTicket } from "../format.js";

const ESTADOS_LABEL = {
  pendiente: "Recibido por cocina",
  en_preparacion: "En preparación",
  listo: "Listo para servir",
  entregado: "Entregado en mesa",
  cancelado: "Cancelado",
};

const POLL_MS = 3000;

export default function Checkout() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargar = () =>
      api
        .getOrder(orderId)
        .then((data) => {
          if (activo) setOrder(data);
        })
        .catch(() => {
          if (activo) setError("No se encontró el pedido");
        });

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const pagar = async (metodoPago) => {
    setPagando(true);
    try {
      const updated = await api.pagarOrder(orderId, metodoPago);
      setOrder(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setPagando(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="loading">Cargando pedido...</p>;

  return (
    <div className="checkout-page">
      <h2>Comanda enviada a cocina ✅</h2>
      <p className="estado-actual">
        Estado: <strong>{ESTADOS_LABEL[order.estado] || order.estado}</strong>
      </p>

      <div className="ticket">
        <div className="ticket-header-titulo">
          <h3>{formatTicket(order.ticketNumero)}</h3>
          <span className="ticket-mesa">Mesa {order.mesa}</span>
        </div>
        <ul>
          {order.items.map((item) => (
            <li key={item.productId}>
              <span>
                {item.cantidad}x {item.nombre}
                {(item.modificadoresTexto || item.notas) && (
                  <em> ({[item.modificadoresTexto, item.notas].filter(Boolean).join(" · ")})</em>
                )}
              </span>
              <span>{(item.precio * item.cantidad).toFixed(2)} €</span>
            </li>
          ))}
        </ul>
        {order.notasGenerales && <p className="notas">Nota: {order.notasGenerales}</p>}

        <div className="totales">
          <div>
            <span>Subtotal</span>
            <span>{order.subtotal.toFixed(2)} €</span>
          </div>
          <div>
            <span>IVA (10%)</span>
            <span>{order.iva.toFixed(2)} €</span>
          </div>
          <div className="total-final">
            <span>TOTAL A PAGAR</span>
            <span>{order.total.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {order.pagado ? (
        <p className="pagado-ok">Pagado con {order.metodoPago} ✔️</p>
      ) : (
        <div className="pago-botones">
          <button disabled={pagando} onClick={() => pagar("efectivo")}>
            Cobrar en efectivo
          </button>
          <button disabled={pagando} onClick={() => pagar("tarjeta")}>
            Cobrar con tarjeta
          </button>
        </div>
      )}

      <Link to="/" className="nuevo-pedido">
        + Nuevo pedido
      </Link>
    </div>
  );
}
