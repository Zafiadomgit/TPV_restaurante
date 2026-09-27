import { t, conIdioma } from "../textos.js";
import { formatEuros } from "../format.js";

export default function MenuItemCard({ producto, idioma, onAdd }) {
  const nombre = conIdioma(producto.nombre, producto.nombreEn, idioma);
  const descripcion = conIdioma(producto.descripcion, producto.descripcionEn, idioma);
  return (
    <div className="k-producto">
      <div className="k-producto-foto">
        {producto.imagen && <img src={producto.imagen} alt="" loading="lazy" />}
        {producto.modificadores && <span className="k-badge">{t(idioma, "personalizable")}</span>}
      </div>
      <div className="k-producto-info">
        <h4 className="k-producto-nombre">{nombre}</h4>
        {descripcion && <p className="k-producto-desc">{descripcion}</p>}
        <div className="k-producto-pie">
          <span className="k-producto-precio">{formatEuros(producto.precio)}</span>
          <button type="button" className="k-boton-anadir" onClick={() => onAdd(producto)}>
            {producto.modificadores ? t(idioma, "personalizar") : t(idioma, "anadir")}
          </button>
        </div>
      </div>
    </div>
  );
}
