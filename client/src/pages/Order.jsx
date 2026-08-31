import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import MenuItemCard from "../components/MenuItemCard.jsx";
import CartSidebar from "../components/CartSidebar.jsx";

export default function Order() {
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [mesa, setMesa] = useState("");
  const [items, setItems] = useState([]);
  const [notasGenerales, setNotasGenerales] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setMenu(data);
        if (data.length > 0) setCategoriaActiva(data[0].categoria);
      })
      .catch(() => setError("No se pudo cargar el menú"))
      .finally(() => setCargando(false));
  }, []);

  const addItem = (producto) => {
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          notas: "",
        },
      ];
    });
  };

  const increase = (productId) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, cantidad: i.cantidad + 1 } : i))
    );

  const decrease = (productId) =>
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );

  const remove = (productId) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const notaChange = (productId, notas) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, notas } : i))
    );

  const { subtotal, iva, total } = useMemo(() => calcularTotales(items), [items]);

  const enviarComanda = async () => {
    setError("");
    setEnviando(true);
    try {
      const order = await api.createOrder({ mesa, items, notasGenerales });
      setItems([]);
      setNotasGenerales("");
      navigate(`/pago/${order.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <p className="loading">Cargando menú...</p>;

  return (
    <div className="order-page">
      <div className="menu-area">
        <div className="categorias">
          {menu.map((cat) => (
            <button
              key={cat.categoria}
              className={categoriaActiva === cat.categoria ? "active" : ""}
              onClick={() => setCategoriaActiva(cat.categoria)}
            >
              {cat.categoria}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="menu-grid">
          {menu
            .find((cat) => cat.categoria === categoriaActiva)
            ?.productos.map((producto) => (
              <MenuItemCard key={producto.id} producto={producto} onAdd={addItem} />
            ))}
        </div>
      </div>

      <CartSidebar
        mesa={mesa}
        setMesa={setMesa}
        items={items}
        onIncrease={increase}
        onDecrease={decrease}
        onRemove={remove}
        onNotaChange={notaChange}
        notasGenerales={notasGenerales}
        setNotasGenerales={setNotasGenerales}
        subtotal={subtotal}
        iva={iva}
        total={total}
        onEnviar={enviarComanda}
        enviando={enviando}
      />
    </div>
  );
}
