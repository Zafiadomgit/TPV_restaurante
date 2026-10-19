import { createPortal } from "react-dom";
import { formatTicket } from "../format.js";
import { lineasCambios, lineasCliente } from "../seccionesTicket.js";
import { datosTicketSede } from "../sede.js";

function formatFechaHora(iso) {
  if (!iso) return "";
  const fecha = new Date(iso);
  return `${fecha.toLocaleDateString()} · ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const NOMBRE_METODO_PAGO = { efectivo: "Efectivo", tarjeta: "Tarjeta" };

// Datos fiscales del negocio para el recibo impreso. Cambian rara vez —
// si el dueño los actualiza (ej. nuevo CIF, cambio de dirección), es
// este objeto el que hay que tocar, no el JSX de abajo.
const DATOS_NEGOCIO = {
  cif: "X6995146H",
  telefono: "605 665 040",
};
// Dirección y correo: los de la sede del pedido (ver datosTicketSede en
// sede.js).

// Imprime el recibo ajustando el largo del papel al del ticket (a
// petición del cliente: "que salga menos ticket"). Sin esto el navegador
// imprime una página entera (A4/carta) y la impresora de rollo saca un
// tramo largo de papel en blanco. Mide el recibo, fija @page a 80 mm de
// ancho x su alto real, imprime y quita la regla.
export function imprimirRecibo() {
  const recibo = document.querySelector(".recibo-imprimible");
  let estilo = null;
  if (recibo) {
    const antes = recibo.getAttribute("style");
    recibo.setAttribute("style", "display:block;position:fixed;left:-10000px;top:0;width:80mm;visibility:hidden");
    const altoMm = Math.ceil((recibo.scrollHeight * 25.4) / 96) + 6;
    if (antes === null) recibo.removeAttribute("style");
    else recibo.setAttribute("style", antes);
    estilo = document.createElement("style");
    estilo.textContent = `@page { size: 80mm ${altoMm}mm; margin: 0; }`;
    document.head.appendChild(estilo);
  }
  window.print();
  if (estilo) setTimeout(() => estilo.remove(), 1000);
}

// Se queda fuera de la vista en pantalla (ver .recibo-imprimible en
// styles.css) y solo se muestra cuando el navegador imprime — no es un
// modal, así que no necesita botón de cerrar ni overlay. Va directo en
// <body> (portal) para que al imprimir se pueda ocultar todo lo demás con
// display:none y no ocupe papel.
export default function ReciboImprimible({ venta }) {
  if (!venta) return null;

  return createPortal(
    <div className="recibo-imprimible">
      <div className="recibo-header">
        <img src="/brand/svg/logo-ticket-negro.svg" alt="California" className="recibo-logo" />
        <p className="recibo-tagline">Kebab · Hamburguesería · Pizzería</p>
        <div className="recibo-datos-fiscales">
          <p>CIF {DATOS_NEGOCIO.cif}</p>
          <p>{datosTicketSede(venta.local).direccion}</p>
          <p>
            Tel. {DATOS_NEGOCIO.telefono} · {datosTicketSede(venta.local).email}
          </p>
        </div>
      </div>

      <p className="recibo-ticket">{formatTicket(venta.ticketNumero)}</p>
      <p className="recibo-fecha">{formatFechaHora(venta.pagadoEn || venta.creadoEn)}</p>
      <p className="recibo-origen">{venta.mesa}</p>
      {lineasCliente(venta).map((linea) => (
        <p key={linea} className="recibo-origen">
          {linea}
        </p>
      ))}
      {venta.notasGenerales && <p className="recibo-origen">{venta.notasGenerales}</p>}

      <hr />

      <table className="recibo-items">
        <tbody>
          {venta.items.map((item, i) => (
            <tr key={i}>
              <td className="recibo-item-nombre">
                {item.cantidad}× {item.nombre}
                {/* Secciones con punto (Solo/En menú, patatas, extras,
                    bebida) y lo de dentro con guion, como la comanda. */}
                {lineasCambios(item).map(({ tipo, texto }, j) => (
                  <span key={j} className={`recibo-item-mods ${tipo === "punto" ? "recibo-item-seccion" : "recibo-item-sub"}`}>
                    {tipo === "punto" ? "• " : "- "}
                    {texto}
                  </span>
                ))}
              </td>
              <td className="recibo-item-precio">{(item.precio * item.cantidad).toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <div className="recibo-totales">
        <div>
          <span>Subtotal</span>
          <span>{venta.subtotal.toFixed(2)} €</span>
        </div>
        <div>
          <span>IVA (10%)</span>
          <span>{venta.iva.toFixed(2)} €</span>
        </div>
        <div className="recibo-total-final">
          <span>TOTAL</span>
          <span>{venta.total.toFixed(2)} €</span>
        </div>
      </div>

      {!venta.pagado && !venta.metodoPago && <p className="recibo-total-final">PENDIENTE DE PAGO</p>}
      {venta.metodoPago && (
        <p className="recibo-pago">Pagado con {NOMBRE_METODO_PAGO[venta.metodoPago] || venta.metodoPago}</p>
      )}

      <p className="recibo-footer">¡Gracias por tu visita!</p>
    </div>,
    document.body
  );
}
