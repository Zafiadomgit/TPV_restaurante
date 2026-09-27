import { t } from "../textos.js";
import MenuItemCard from "./MenuItemCard.jsx";

// Aparece una vez, justo antes de enviar la comanda, ofreciendo la
// categoría "Complementos" (aros de cebolla, samosas, cheese bites,
// falafel...) — a petición del cliente, que quiere que este upsell salga
// automáticamente al finalizar el pedido en vez de depender de que el
// cliente navegue hasta esa categoría por su cuenta.
export default function UpsellComplementos({ productos, idioma, onAdd, onFinalizar }) {
  return (
    <div className="k-overlay" onClick={onFinalizar}>
      <div className="k-modal k-upsell" onClick={(e) => e.stopPropagation()}>
        <div className="k-modal-cabecera">
          <div>
            <h3 className="k-modal-titulo">{t(idioma, "upsellTitulo")}</h3>
            <p className="k-modal-sub">{t(idioma, "upsellSubtitulo")}</p>
          </div>
          <button type="button" className="k-cerrar" onClick={onFinalizar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="k-upsell-cuerpo">
          <div className="k-productos">
            {productos.map((producto) => (
              <MenuItemCard key={producto.id} producto={producto} idioma={idioma} onAdd={onAdd} />
            ))}
          </div>
        </div>

        <div className="k-modal-pie">
          <button type="button" className="k-boton-confirmar" onClick={onFinalizar}>
            {t(idioma, "upsellFinalizar")}
          </button>
        </div>
      </div>
    </div>
  );
}
