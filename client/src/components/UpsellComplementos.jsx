import { t } from "../textos.js";
import MenuItemCard from "./MenuItemCard.jsx";

// Aparece una vez, justo antes de enviar la comanda, ofreciendo la
// categoría "Complementos" (aros de cebolla, samosas, cheese bites,
// falafel...) — a petición del cliente, que quiere que este upsell salga
// automáticamente al finalizar el pedido en vez de depender de que el
// cliente navegue hasta esa categoría por su cuenta.
export default function UpsellComplementos({ productos, cantidadPorProducto = {}, idioma, onAdd, onFinalizar }) {
  // Cuántas unidades de Complementos lleva ya el pedido — se enseña en un
  // contador que "salta" con cada producto añadido desde aquí, y el botón
  // de finalizar lo repite (a petición del cliente: que se note el efecto
  // de añadir, sobre todo en este paso final).
  const anadidos = productos.reduce((acc, p) => acc + (cantidadPorProducto[p.id] || 0), 0);
  return (
    <div className="k-overlay" onClick={onFinalizar}>
      <div className="k-modal k-upsell" onClick={(e) => e.stopPropagation()}>
        <div className="k-modal-cabecera">
          <div>
            <h3 className="k-modal-titulo">{t(idioma, "upsellTitulo")}</h3>
            <p className="k-modal-sub">{t(idioma, "upsellSubtitulo")}</p>
          </div>
          {anadidos > 0 && (
            <span className="k-upsell-contador k-pop" key={anadidos}>
              ✓ {anadidos} {t(idioma, anadidos === 1 ? "upsellAnadido" : "upsellAnadidos")}
            </span>
          )}
          <button type="button" className="k-cerrar" onClick={onFinalizar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="k-upsell-cuerpo">
          <div className="k-productos">
            {productos.map((producto) => (
              <MenuItemCard
                key={producto.id}
                producto={producto}
                idioma={idioma}
                onAdd={onAdd}
                cantidadEnPedido={cantidadPorProducto[producto.id] || 0}
              />
            ))}
          </div>
        </div>

        <div className="k-modal-pie">
          <button
            type="button"
            className={`k-boton-confirmar ${anadidos > 0 ? "k-boton-confirmar--brillo" : ""}`}
            onClick={onFinalizar}
          >
            {t(idioma, "upsellFinalizar")}
            {anadidos > 0 && (
              <>
                {" "}
                <span className="k-separador">·</span> +{anadidos}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
