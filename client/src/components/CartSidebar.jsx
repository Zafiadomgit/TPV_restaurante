import { t, conIdioma } from "../textos.js";
import { formatEuros } from "../format.js";

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
    <aside className="k-carrito">
      <div className="k-carrito-cabecera">
        <span className="k-carrito-titulo">{t(idioma, "tuPedido")}</span>
        <span className="k-mono-etiqueta">
          {items.length} {t(idioma, items.length === 1 ? "linea" : "lineas")}
        </span>
      </div>

      <div className="k-carrito-lineas">
        {faltaItems ? (
          <p className="k-carrito-vacio">{t(idioma, "anadeProductos")}</p>
        ) : (
          <>
            {items.map((item) => (
              <div key={item.lineId} className="k-linea">
                <div className="k-linea-top">
                  <span className="k-linea-nombre">{conIdioma(item.nombre, item.nombreEn, idioma)}</span>
                  <span className="k-linea-importe">{formatEuros(item.precio * item.cantidad)}</span>
                </div>
                {item.modificadoresTexto && <p className="k-linea-mods">{item.modificadoresTexto}</p>}
                <div className="k-linea-controles">
                  <div className="k-cantidad">
                    <button type="button" onClick={() => onDecrease(item.lineId)} aria-label="-1">
                      −
                    </button>
                    <span>{item.cantidad}</span>
                    <button type="button" onClick={() => onIncrease(item.lineId)} aria-label="+1">
                      +
                    </button>
                  </div>
                  <button type="button" className="k-linea-quitar" onClick={() => onRemove(item.lineId)}>
                    {t(idioma, "quitar")}
                  </button>
                </div>
                <input
                  type="text"
                  className="k-campo k-linea-nota"
                  placeholder={t(idioma, "notasItemPlaceholder")}
                  value={item.notas}
                  onChange={(e) => onNotaChange(item.lineId, e.target.value)}
                />
              </div>
            ))}
            <textarea
              className="k-campo k-notas-generales"
              placeholder={t(idioma, "notasGeneralesPlaceholder")}
              value={notasGenerales}
              onChange={(e) => setNotasGenerales(e.target.value)}
            />
          </>
        )}
      </div>

      <div className="k-carrito-totales">
        <div className="k-total-fila">
          <span>{t(idioma, "subtotal")}</span>
          <span>{formatEuros(subtotal)}</span>
        </div>
        <div className="k-total-fila">
          <span>{t(idioma, "iva")}</span>
          <span>{formatEuros(iva)}</span>
        </div>
        <div className="k-total-final">
          <span>{t(idioma, "total")}</span>
          <span className="k-total-importe">{formatEuros(total)}</span>
        </div>
        <button type="button" className="k-boton-confirmar" disabled={faltaItems || enviando} onClick={onEnviar}>
          {enviando ? t(idioma, "enviando") : t(idioma, "enviarComanda")}
        </button>
        {!enviando && faltaItems && <p className="k-hint">{t(idioma, "anadeAlMenos")}</p>}
      </div>
    </aside>
  );
}
