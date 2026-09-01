import { t, conIdioma } from "../textos.js";

export default function CartSidebar({
  items,
  idioma,
  onIncrease,
  onDecrease,
  onRemove,
  onNotaChange,
  notasGenerales,
  setNotasGenerales,
  subtotal,
  iva,
  total,
  onEnviar,
  enviando,
}) {
  const faltaItems = items.length === 0;

  return (
    <aside className="cart">
      <h3>{t(idioma, "pedido")}</h3>

      {items.length === 0 ? (
        <p className="empty">{t(idioma, "anadeProductos")}</p>
      ) : (
        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.lineId} className="cart-item">
              <div className="cart-item-row">
                <span className="cart-item-name">{conIdioma(item.nombre, item.nombreEn, idioma)}</span>
                <button className="btn-remove" onClick={() => onRemove(item.lineId)}>
                  ✕
                </button>
              </div>
              {item.modificadoresTexto && (
                <p className="cart-item-mods">{item.modificadoresTexto}</p>
              )}
              <div className="cart-item-row">
                <div className="qty-controls">
                  <button onClick={() => onDecrease(item.lineId)}>-</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => onIncrease(item.lineId)}>+</button>
                </div>
                <span>{(item.precio * item.cantidad).toFixed(2)} €</span>
              </div>
              <input
                type="text"
                className="nota-input"
                placeholder={t(idioma, "notasItemPlaceholder")}
                value={item.notas}
                onChange={(e) => onNotaChange(item.lineId, e.target.value)}
              />
            </li>
          ))}
        </ul>
      )}

      <textarea
        className="notas-generales"
        placeholder={t(idioma, "notasGeneralesPlaceholder")}
        value={notasGenerales}
        onChange={(e) => setNotasGenerales(e.target.value)}
      />

      <div className="totales">
        <div>
          <span>{t(idioma, "subtotal")}</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>
        <div>
          <span>{t(idioma, "iva")}</span>
          <span>{iva.toFixed(2)} €</span>
        </div>
        <div className="total-final">
          <span>{t(idioma, "total")}</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>

      <button className="btn-enviar" disabled={faltaItems || enviando} onClick={onEnviar}>
        {enviando ? t(idioma, "enviando") : t(idioma, "enviarComanda")}
      </button>

      {!enviando && faltaItems && (
        <p className="hint-enviar">{t(idioma, "anadeAlMenos")}</p>
      )}
    </aside>
  );
}
