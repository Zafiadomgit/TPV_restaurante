import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { formatTicket } from "../format.js";
import { getIdioma, guardarIdioma } from "../idioma.js";
import { t, ESTADOS_LABEL, METODO_PAGO_LABEL } from "../textos.js";
import SelectorIdioma from "../components/SelectorIdioma.jsx";

const POLL_MS = 3000;

export default function Checkout() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [idioma, setIdioma] = useState(() => getIdioma());

  const cambiarIdioma = (nuevo) => {
    setIdioma(nuevo);
    guardarIdioma(nuevo);
  };

  useEffect(() => {
    let activo = true;

    const cargar = () =>
      api
        .getOrder(orderId)
        .then((data) => {
          if (activo) setOrder(data);
        })
        .catch(() => {
          if (activo) setError(t(idioma, "pedidoNoEncontrado"));
        });

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => {
      activo = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (error) return <p className="error">{error}</p>;
  if (!order) return <p className="loading">{t(idioma, "cargandoPedido")}</p>;

  const estadoLabel = ESTADOS_LABEL[idioma]?.[order.estado] || order.estado;
  const metodoPagoLabel = METODO_PAGO_LABEL[idioma]?.[order.metodoPago] || order.metodoPago;

  return (
    <div className="checkout-page">
      <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} className="checkout-idioma-selector" />

      <h2>{t(idioma, "comandaEnviada")} ✅</h2>
      <p className="estado-actual">
        {t(idioma, "estado")} <strong>{estadoLabel}</strong>
      </p>

      <div className="ticket">
        <div className="ticket-header-titulo">
          <h3>{formatTicket(order.ticketNumero)}</h3>
          <span className="ticket-origen">{order.mesa}</span>
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
        {order.notasGenerales && (
          <p className="notas">
            {t(idioma, "nota")} {order.notasGenerales}
          </p>
        )}

        <div className="totales">
          <div>
            <span>{t(idioma, "subtotal")}</span>
            <span>{order.subtotal.toFixed(2)} €</span>
          </div>
          <div>
            <span>{t(idioma, "iva")}</span>
            <span>{order.iva.toFixed(2)} €</span>
          </div>
          <div className="total-final">
            <span>{t(idioma, "totalAPagar")}</span>
            <span>{order.total.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {order.pagado ? (
        <p className="pagado-ok">
          {t(idioma, "pagadoCon")} {metodoPagoLabel} ✔️
        </p>
      ) : (
        <div className="pasa-a-caja">
          <p className="pasa-a-caja-titulo">{t(idioma, "pasaACajaTitulo")}</p>
          <p className="pasa-a-caja-sub">
            {t(idioma, "dilesElNumero")} <strong>{formatTicket(order.ticketNumero)}</strong>
          </p>
        </div>
      )}

      <Link to="/" className="nuevo-pedido">
        {t(idioma, "nuevoPedido")}
      </Link>
    </div>
  );
}
