import { t, conIdioma } from "../textos.js";

export default function MenuItemCard({ producto, idioma, onAdd }) {
  const nombre = conIdioma(producto.nombre, producto.nombreEn, idioma);
  const descripcion = conIdioma(producto.descripcion, producto.descripcionEn, idioma);
  return (
    <div className="menu-card">
      <div className="menu-card-info">
        <h4>{nombre}</h4>
        {descripcion && <p>{descripcion}</p>}
        <div className="menu-card-precio-row">
          <span className="price">{producto.precio.toFixed(2)} €</span>
          {producto.modificadores && (
            <span className="badge-personalizable">{t(idioma, "personalizable")}</span>
          )}
        </div>
      </div>
      <button className="btn-add" onClick={() => onAdd(producto)}>
        {producto.modificadores ? t(idioma, "personalizar") : t(idioma, "anadir")}
      </button>
    </div>
  );
}
