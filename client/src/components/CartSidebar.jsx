export default function CartSidebar({
  mesa,
  setMesa,
  items,
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
  return (
    <aside className="cart">
      <h3>Pedido</h3>
      <label className="mesa-input">
        Mesa
        <input
          type="text"
          placeholder="Nº mesa"
          value={mesa}
          onChange={(e) => setMesa(e.target.value)}
        />
      </label>

      {items.length === 0 ? (
        <p className="empty">Añade productos del menú</p>
      ) : (
        <ul className="cart-items">
          {items.map((item) => (
            <li key={item.productId} className="cart-item">
              <div className="cart-item-row">
                <span className="cart-item-name">{item.nombre}</span>
                <button className="btn-remove" onClick={() => onRemove(item.productId)}>
                  ✕
                </button>
              </div>
              <div className="cart-item-row">
                <div className="qty-controls">
                  <button onClick={() => onDecrease(item.productId)}>-</button>
                  <span>{item.cantidad}</span>
                  <button onClick={() => onIncrease(item.productId)}>+</button>
                </div>
                <span>{(item.precio * item.cantidad).toFixed(2)} €</span>
              </div>
              <input
                type="text"
                className="nota-input"
                placeholder="Notas (ej. sin cebolla)"
                value={item.notas}
                onChange={(e) => onNotaChange(item.productId, e.target.value)}
              />
            </li>
          ))}
        </ul>
      )}

      <textarea
        className="notas-generales"
        placeholder="Notas generales del pedido"
        value={notasGenerales}
        onChange={(e) => setNotasGenerales(e.target.value)}
      />

      <div className="totales">
        <div>
          <span>Subtotal</span>
          <span>{subtotal.toFixed(2)} €</span>
        </div>
        <div>
          <span>IVA (10%)</span>
          <span>{iva.toFixed(2)} €</span>
        </div>
        <div className="total-final">
          <span>Total</span>
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>

      <button
        className="btn-enviar"
        disabled={items.length === 0 || !mesa.trim() || enviando}
        onClick={onEnviar}
      >
        {enviando ? "Enviando..." : "Enviar comanda a cocina"}
      </button>
    </aside>
  );
}
