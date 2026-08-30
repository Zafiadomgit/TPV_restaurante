const ESTADOS_LABEL = {
  pendiente: "Recibido",
  en_preparacion: "En preparación",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const REVERTIR_A = {
  entregado: "listo",
  cancelado: "pendiente",
};

const REVERTIR_LABEL = {
  entregado: "↺ Revertir a Listo",
  cancelado: "↺ Revertir a Pendiente",
};

export default function HistorialTicket({ order, onRevertir }) {
  const estadoAnterior = REVERTIR_A[order.estado];

  return (
    <div className={`ticket-cocina historial-ticket estado-${order.estado}`}>
      <div className="ticket-header">
        <h3>Mesa {order.mesa}</h3>
        <span className="hora">
          {new Date(order.creadoEn).toLocaleString([], {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <span className={`badge-estado badge-${order.estado}`}>
        {ESTADOS_LABEL[order.estado] || order.estado}
      </span>
      <ul>
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="cantidad">{item.cantidad}x</span> {item.nombre}
            {item.notas && <div className="nota">↳ {item.notas}</div>}
          </li>
        ))}
      </ul>
      {order.notasGenerales && <p className="nota-general">Nota: {order.notasGenerales}</p>}
      <p className="historial-total">Total: {order.total.toFixed(2)} €</p>

      {estadoAnterior && (
        <button className="btn-avanzar btn-revertir" onClick={() => onRevertir(order.id, estadoAnterior)}>
          {REVERTIR_LABEL[order.estado]}
        </button>
      )}
    </div>
  );
}
