import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { socket } from "../socket.js";

const ESTADOS_LABEL = {
  pendiente: "Recibido por cocina",
  en_preparacion: "En preparación",
  listo: "Listo para servir",
  entregado: "Entregado en mesa",
  cancelado: "Cancelado",
};

export default function Checkout() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [pagando, setPagando] = useState(false);

  useEffect(() => {
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("No se encontró el pedido"));
  }, [orderId]);

  useEffect(() => {
    const onActualizado = (updated) => {
      if (updated.id === orderId) setOrder(updated);
    };
    socket.on("pedido:actualizado", onActualizado);
    return () => socket.off("pedido:actualizado", onActualizado);
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
        <h3>Mesa {order.mesa}</h3>
        <ul>
          {order.items.map((item) => (
            <li key={item.productId}>
              <span>
                {item.cantidad}x {item.nombre}
                {item.notas && <em> ({item.notas})</em>}
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
