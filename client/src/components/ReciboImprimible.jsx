import { formatTicket } from "../format.js";

function formatFechaHora(iso) {
  if (!iso) return "";
  const fecha = new Date(iso);
  return `${fecha.toLocaleDateString()} · ${fecha.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const NOMBRE_METODO_PAGO = { efectivo: "Efectivo", tarjeta: "Tarjeta" };

// Se queda fuera de la vista en pantalla (ver .recibo-imprimible en
// styles.css) y solo se muestra cuando el navegador imprime — no es un
// modal, así que no necesita botón de cerrar ni overlay.
export default function ReciboImprimible({ venta }) {
  if (!venta) return null;

  return (
    <div className="recibo-imprimible">
      <div className="recibo-header">
        <img src="/brand/svg/logo-ticket-negro.svg" alt="California" className="recibo-logo" />
        <p className="recibo-tagline">Kebab · Hamburguesería · Pizzería</p>
      </div>

      <p className="recibo-ticket">{formatTicket(venta.ticketNumero)}</p>
      <p className="recibo-fecha">{formatFechaHora(venta.pagadoEn || venta.creadoEn)}</p>
      <p className="recibo-origen">{venta.mesa}</p>

      <hr />

      <table className="recibo-items">
        <tbody>
          {venta.items.map((item, i) => (
            <tr key={i}>
              <td className="recibo-item-nombre">
                {item.cantidad}× {item.nombre}
                {item.modificadoresTexto && (
                  <span className="recibo-item-mods">{item.modificadoresTexto}</span>
                )}
                {item.notas && <span className="recibo-item-mods">{item.notas}</span>}
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

      {venta.metodoPago && (
        <p className="recibo-pago">Pagado con {NOMBRE_METODO_PAGO[venta.metodoPago] || venta.metodoPago}</p>
      )}

      <p className="recibo-footer">¡Gracias por tu visita!</p>
    </div>
  );
}
