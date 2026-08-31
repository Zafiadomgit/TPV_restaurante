import { formatTicket } from "../format.js";

const SIGUIENTE_ESTADO = {
  pendiente: "en_preparacion",
  en_preparacion: "listo",
  listo: "entregado",
};

const ACCION_LABEL = {
  pendiente: "Empezar",
  en_preparacion: "Marcar listo",
  listo: "Entregado",
};

const MINUTOS_URGENTE = 6;

function minutosDesde(iso) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function formatTranscurrido(iso) {
  const totalSegundos = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${String(segundos).padStart(2, "0")}`;
}

export default function OrderTicket({ order, onAvanzar }) {
  const siguiente = SIGUIENTE_ESTADO[order.estado];
  const urgente = minutosDesde(order.creadoEn) >= MINUTOS_URGENTE;

  return (
    <div className="kds-ticket">
      <div className="kds-ticket-top">
        <span className="kds-ticket-id">{formatTicket(order.ticketNumero)}</span>
        <span className={`kds-ticket-tiempo ${urgente ? "urgente" : ""}`}>
          {formatTranscurrido(order.creadoEn)}
        </span>
      </div>
      <div className="kds-ticket-origen">Mesa {order.mesa}</div>
      <ul>
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="kds-cantidad">{item.cantidad}x</span>
            <div className="kds-item-texto">
              <span>{item.nombre}</span>
              {item.notas && <span className="kds-nota">↳ {item.notas}</span>}
            </div>
          </li>
        ))}
      </ul>
      {order.notasGenerales && <p className="kds-nota-general">Nota: {order.notasGenerales}</p>}

      {siguiente && (
        <button className="kds-btn-avanzar" onClick={() => onAvanzar(order.id, siguiente)}>
          {ACCION_LABEL[order.estado]}
        </button>
      )}
    </div>
  );
}
