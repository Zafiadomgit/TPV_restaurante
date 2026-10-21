import { formatTicket } from "../format.js";
import { nombreCocina, lineasCliente, lineasCambios } from "../seccionesTicket.js";

// Sin paso "Empezar": un pedido recién llegado ya está en "Preparando" y
// su botón lo marca directamente como listo.
const SIGUIENTE_ESTADO = {
  pendiente: "listo",
  en_preparacion: "listo",
  listo: "entregado",
};

const ACCION_LABEL = {
  pendiente: "Marcar listo",
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

export default function OrderTicket({ order, onAvanzar, onReimprimir, imprimiendo }) {
  const siguiente = SIGUIENTE_ESTADO[order.estado];
  const urgente = minutosDesde(order.creadoEn) >= MINUTOS_URGENTE;
  const paraLlevar = ["Para llevar", "Recoger en tienda", "A domicilio"].includes(order.mesa);
  const mostrador = order.mesa === "Mostrador";
  const origenClass = paraLlevar ? "kds-ticket-llevar" : mostrador ? "kds-ticket-mostrador" : "";

  return (
    <div className={`kds-ticket ${origenClass}`}>
      <div className="kds-ticket-top">
        <span className="kds-ticket-id">{formatTicket(order.ticketNumero)}</span>
        <span className={`kds-ticket-tiempo ${urgente ? "urgente" : ""}`}>
          {formatTranscurrido(order.creadoEn)}
        </span>
      </div>
      <div className="kds-ticket-origen">{order.mesa}</div>
      {lineasCliente(order).length > 0 && (
        <div className="kds-cliente">
          {lineasCliente(order).map((linea) => (
            <span key={linea}>{linea}</span>
          ))}
        </div>
      )}
      <ul>
        {order.items.map((item) => (
          <li key={item.productId}>
            <span className="kds-cantidad">{item.cantidad}x</span>
            <div className="kds-item-texto">
              <span className="kds-item-nombre">{nombreCocina(item.nombre)}</span>
              {/* Mismo formato que la comanda impresa: secciones con punto
                  (Menú, patatas, extras, bebida) y lo de dentro con guion. */}
              {(item.modificadoresTexto || item.notas) && (
                <div className="kds-cambios">
                  {lineasCambios(item).map(({ tipo, texto }, i) => (
                    <span key={i} className={tipo === "punto" ? "kds-cambio-seccion" : "kds-cambio"}>
                      {tipo === "punto" ? "• " : "- "}
                      {texto}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      {order.notasGenerales && <p className="kds-nota-general">Nota: {order.notasGenerales}</p>}

      <div className="kds-ticket-acciones">
        {onReimprimir && (
          <button
            type="button"
            className="kds-btn-reimprimir"
            onClick={() => onReimprimir(order)}
            disabled={imprimiendo}
          >
            {imprimiendo ? "..." : <>🖨️<span className="kds-btn-texto"> Reimprimir</span></>}
          </button>
        )}
        {siguiente && (
          <button className="kds-btn-avanzar" onClick={() => onAvanzar(order.id, siguiente)}>
            {ACCION_LABEL[order.estado]}
          </button>
        )}
      </div>
    </div>
  );
}
