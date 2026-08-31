import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import MenuItemCard from "../components/MenuItemCard.jsx";
import CartSidebar from "../components/CartSidebar.jsx";
import Personalizar from "../components/Personalizar.jsx";

const TIPO_SERVICIO_LABEL = {
  aqui: "Comer aquí",
  llevar: "Para llevar",
};

function nuevoLineId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Order() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState("inicio");
  const [tipoServicio, setTipoServicio] = useState(null);
  const [menu, setMenu] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [items, setItems] = useState([]);
  const [notasGenerales, setNotasGenerales] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);

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

  const elegirTipoServicio = (tipo) => {
    setTipoServicio(tipo);
    setPaso("categorias");
  };

  const elegirCategoria = (categoria) => {
    setCategoriaActiva(categoria);
    setPaso("menu");
  };

  const cancelarPedido = () => {
    setItems([]);
    setNotasGenerales("");
    setTipoServicio(null);
    setPaso("inicio");
  };

  const onAddProducto = (producto) => {
    if (producto.modificadores) {
      setProductoPersonalizando(producto);
      return;
    }
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === producto.id && !i.modificadoresTexto);
      if (existente) {
        return prev.map((i) =>
          i.lineId === existente.lineId ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...prev,
        {
          lineId: nuevoLineId(),
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          notas: "",
          modificadores: null,
          modificadoresTexto: "",
        },
      ];
    });
  };

  const confirmarPersonalizacion = ({ seleccion, cantidad, precioUnidad, modificadoresTexto }) => {
    const producto = productoPersonalizando;
    setItems((prev) => [
      ...prev,
      {
        lineId: nuevoLineId(),
        productId: producto.id,
        nombre: producto.nombre,
        precio: precioUnidad,
        cantidad,
        notas: "",
        modificadores: seleccion,
        modificadoresTexto,
      },
    ]);
    setProductoPersonalizando(null);
  };

  const increase = (lineId) =>
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad + 1 } : i)));

  const decrease = (lineId) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0)
    );

  const remove = (lineId) => setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const notaChange = (lineId, notas) =>
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, notas } : i)));

  const { subtotal, iva, total } = useMemo(() => calcularTotales(items), [items]);

  const enviarComanda = async () => {
    setError("");
    setEnviando(true);
    try {
      const order = await api.createOrder({
        mesa: TIPO_SERVICIO_LABEL[tipoServicio],
        notasGenerales,
        items: items.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          notas: i.notas,
          modificadores: i.modificadores,
        })),
      });
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

  if (paso === "inicio") {
    return (
      <div className="kiosk-inicio">
        <div className="kiosk-inicio-centro">
          <div className="kiosk-logo">
            <div className="kiosk-logo-circulo">CA</div>
            <h1>CALIFORNIA</h1>
            <p>Toca para empezar tu pedido</p>
          </div>
          <div className="kiosk-opciones">
            <button className="kiosk-opcion" onClick={() => elegirTipoServicio("aqui")}>
              <span className="kiosk-opcion-titulo">COMER AQUÍ</span>
              <span className="kiosk-opcion-sub">En el local</span>
            </button>
            <button className="kiosk-opcion kiosk-opcion-primaria" onClick={() => elegirTipoServicio("llevar")}>
              <span className="kiosk-opcion-titulo">PARA LLEVAR</span>
              <span className="kiosk-opcion-sub">Para llevar</span>
            </button>
          </div>
        </div>
        <div className="kiosk-footer">Cocina abierta</div>
      </div>
    );
  }

  if (paso === "categorias") {
    return (
      <div className="kiosk-categorias-page">
        <div className="kiosk-menu-header">
          <span>
            Tu pedido · <strong>{TIPO_SERVICIO_LABEL[tipoServicio]}</strong>
          </span>
          <button className="kiosk-cancelar" onClick={cancelarPedido}>
            Cancelar pedido
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        <h2 className="kiosk-categorias-titulo">¿Qué te apetece?</h2>
        <div className="kiosk-categorias-grid">
          {menu.map((cat) => (
            <button key={cat.categoria} className="kiosk-categoria-tile" onClick={() => elegirCategoria(cat.categoria)}>
              <span className="kiosk-categoria-nombre">{cat.categoria}</span>
              <span className="kiosk-categoria-cantidad">{cat.productos.length} productos</span>
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <button className="kiosk-ver-carrito" onClick={() => setPaso("menu")}>
            Ver carrito ({items.reduce((acc, i) => acc + i.cantidad, 0)}) · {total.toFixed(2)} €
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="order-page">
      {productoPersonalizando && (
        <Personalizar
          producto={productoPersonalizando}
          onConfirmar={confirmarPersonalizacion}
          onCancelar={() => setProductoPersonalizando(null)}
        />
      )}

      <div className="menu-area">
        <div className="kiosk-menu-header">
          <span>
            Tu pedido · <strong>{TIPO_SERVICIO_LABEL[tipoServicio]}</strong>
          </span>
          <div className="kiosk-menu-header-acciones">
            <button className="kiosk-ver-categorias" onClick={() => setPaso("categorias")}>
              ◀ Categorías
            </button>
            <button className="kiosk-cancelar" onClick={cancelarPedido}>
              Cancelar pedido
            </button>
          </div>
        </div>

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
            ?.productos.filter((producto) => producto.disponible !== false)
            .map((producto) => (
              <MenuItemCard key={producto.id} producto={producto} onAdd={onAddProducto} />
            ))}
        </div>
      </div>

      <CartSidebar
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
