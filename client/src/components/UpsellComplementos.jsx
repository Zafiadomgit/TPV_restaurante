import { t } from "../textos.js";
import MenuItemCard from "./MenuItemCard.jsx";

// Aparece una vez, justo antes de enviar la comanda, ofreciendo la
// categoría "Complementos" (aros de cebolla, samosas, cheese bites,
// falafel...) — a petición del cliente, que quiere que este upsell salga
// automáticamente al finalizar el pedido en vez de depender de que el
// cliente navegue hasta esa categoría por su cuenta.
export default function UpsellComplementos({ productos, idioma, onAdd, onFinalizar }) {
  return (
    <div className="personalizar-overlay" onClick={onFinalizar}>
      <div className="personalizar-modal upsell-modal" onClick={(e) => e.stopPropagation()}>
        <div className="personalizar-header">
          <div>
            <h3>{t(idioma, "upsellTitulo")}</h3>
            <p>{t(idioma, "upsellSubtitulo")}</p>
          </div>
          <button className="personalizar-cerrar" onClick={onFinalizar}>
            ✕
          </button>
        </div>

        <div className="personalizar-body">
          <div className="menu-grid">
            {productos.map((producto) => (
              <MenuItemCard key={producto.id} producto={producto} idioma={idioma} onAdd={onAdd} />
            ))}
          </div>
        </div>

        <div className="personalizar-footer">
          <button className="personalizar-confirmar" onClick={onFinalizar}>
            {t(idioma, "upsellFinalizar")}
          </button>
        </div>
      </div>
    </div>
  );
}
