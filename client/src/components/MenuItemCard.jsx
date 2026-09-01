import { t } from "../textos.js";

export default function MenuItemCard({ producto, idioma, onAdd }) {
  return (
    <div className="menu-card">
      <div className="menu-card-info">
        <h4>{producto.nombre}</h4>
        {producto.descripcion && <p>{producto.descripcion}</p>}
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
