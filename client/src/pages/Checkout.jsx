import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { formatTicket } from "../format.js";
import { getIdioma, guardarIdioma } from "../idioma.js";
import { t, ESTADOS_LABEL, METODO_PAGO_LABEL } from "../textos.js";
import SelectorIdioma from "../components/SelectorIdioma.jsx";

const POLL_MS = 3000;

const ESTADOS_SIN_AVISO = ["listo", "entregado", "cancelado"];

export default function Checkout() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [idioma, setIdioma] = useState(() => getIdioma());
  const [telefonoInput, setTelefonoInput] = useState("");
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [errorTelefono, setErrorTelefono] = useState("");

  const cambiarIdioma = (nuevo) => {
    setIdioma(nuevo);
    guardarIdioma(nuevo);
  };

  const guardarTelefono = async (e) => {
    e.preventDefault();
    if (!telefonoInput.trim()) return;
    setErrorTelefono("");
    setGuardandoTelefono(true);
    try {
      const actualizado = await api.guardarTelefonoWhatsapp(orderId, telefonoInput.trim());
      setOrder(actualizado);
    } catch {
      setErrorTelefono(t(idioma, "avisoWhatsappError"));
    } finally {
      setGuardandoTelefono(false);
    }
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

      {!ESTADOS_SIN_AVISO.includes(order.estado) && (
        <div className="aviso-whatsapp">
          {order.telefonoWhatsapp ? (
            <p className="aviso-whatsapp-ok">
              {t(idioma, "avisoWhatsappGuardado")} <strong>+{order.telefonoWhatsapp}</strong> 📲
            </p>
          ) : (
            <form className="aviso-whatsapp-form" onSubmit={guardarTelefono}>
              <label htmlFor="telefono-whatsapp">{t(idioma, "avisoWhatsappTitulo")}</label>
              <div className="aviso-whatsapp-row">
                <input
                  id="telefono-whatsapp"
                  type="tel"
                  placeholder={t(idioma, "avisoWhatsappPlaceholder")}
                  value={telefonoInput}
                  onChange={(e) => setTelefonoInput(e.target.value)}
                />
                <button type="submit" disabled={guardandoTelefono || !telefonoInput.trim()}>
                  {guardandoTelefono ? t(idioma, "avisoWhatsappGuardando") : t(idioma, "avisoWhatsappGuardar")}
                </button>
              </div>
              {errorTelefono && <p className="error">{errorTelefono}</p>}
            </form>
          )}
        </div>
      )}

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
