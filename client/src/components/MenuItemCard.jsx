export default function MenuItemCard({ producto, onAdd }) {
  return (
    <div className="menu-card">
      <div className="menu-card-info">
        <h4>{producto.nombre}</h4>
        {producto.descripcion && <p>{producto.descripcion}</p>}
        <span className="price">{producto.precio.toFixed(2)} €</span>
      </div>
      <button className="btn-add" onClick={() => onAdd(producto)}>
        Añadir
      </button>
    </div>
  );
}
