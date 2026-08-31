export default function MenuItemCard({ producto, onAdd }) {
  return (
    <div className="menu-card">
      <div className="menu-card-info">
        <h4>{producto.nombre}</h4>
        {producto.descripcion && <p>{producto.descripcion}</p>}
        <div className="menu-card-precio-row">
          <span className="price">{producto.precio.toFixed(2)} €</span>
          {producto.modificadores && <span className="badge-personalizable">Personalizable</span>}
          {producto.avisoStock && <span className="badge-stock-bajo">{producto.avisoStock}</span>}
        </div>
      </div>
      <button className="btn-add" onClick={() => onAdd(producto)}>
        {producto.modificadores ? "Personalizar" : "Añadir"}
      </button>
    </div>
  );
}
