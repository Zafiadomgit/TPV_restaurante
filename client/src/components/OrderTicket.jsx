import { formatTicket } from "../format.js";

const SIGUIENTE_ESTADO = {
  pendiente: "en_preparacion",
  en_preparacion: "listo",
  listo: "entregado",
};

const ACCION_LABEL = {
  pendiente: "Empezar a preparar",
  en_preparacion: "Marcar listo",
  listo: "Marcar entregado",
};

export default function OrderTicket({ order, onAvanzar }) {
  const siguiente = SIGUIENTE_ESTADO[order.estado];

  return (
    <div className={`ticket-cocina estado-${order.estado}`}>
      <div className="ticket-header">
        <div className="ticket-header-titulo">
          <h3>{formatTicket(order.ticketNumero)}</h3>
          <span className="ticket-mesa">Mesa {order.mesa}</span>
        </div>
        <span className="hora">
          {new Date(order.creadoEn).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <ul>
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="cantidad">{item.cantidad}x</span> {item.nombre}
            {item.notas && <div className="nota">↳ {item.notas}</div>}
          </li>
        ))}
      </ul>
      {order.notasGenerales && <p className="nota-general">Nota: {order.notasGenerales}</p>}

      {siguiente && (
        <button className="btn-avanzar" onClick={() => onAvanzar(order.id, siguiente)}>
          {ACCION_LABEL[order.estado]}
        </button>
      )}
    </div>
  );
}
