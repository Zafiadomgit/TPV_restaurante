import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import { getIdioma, guardarIdioma } from "../idioma.js";
import { t, TIPO_SERVICIO_DISPLAY, conIdioma } from "../textos.js";
import MenuItemCard from "../components/MenuItemCard.jsx";
import CartSidebar from "../components/CartSidebar.jsx";
import Personalizar from "../components/Personalizar.jsx";
import SelectorIdioma from "../components/SelectorIdioma.jsx";

// Lo que ve el personal (cocina/historial/caja) en order.mesa se guarda
// SIEMPRE en español, sin importar el idioma que elija el cliente en
// pantalla — de esto depende también el color por origen en /cocina
// (.kds-ticket-llevar busca exactamente "Para llevar"). Para lo que se
// le muestra al cliente se usa TIPO_SERVICIO_DISPLAY (textos.js) aparte.
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
  const [idioma, setIdioma] = useState(() => getIdioma());
  const [tiempoEsperaMinutos, setTiempoEsperaMinutos] = useState(null);

  const cambiarIdioma = (nuevo) => {
    setIdioma(nuevo);
    guardarIdioma(nuevo);
  };

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setMenu(data);
        if (data.length > 0) setCategoriaActiva(data[0].categoria);
      })
      .catch(() => setError("No se pudo cargar el menú"))
      .finally(() => setCargando(false));
    api
      .getAjustes()
      .then((data) => setTiempoEsperaMinutos(data.tiempoEsperaMinutos))
      .catch(() => {});
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
          nombreEn: producto.nombreEn,
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
        nombreEn: producto.nombreEn,
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

  if (cargando) return <p className="loading">{t(idioma, "cargandoMenu")}</p>;

  if (paso === "inicio") {
    return (
      <div className="kiosk-inicio">
        <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} className="kiosk-idioma-selector" />
        <div className="kiosk-inicio-centro">
          <div className="kiosk-logo">
            <img src="/brand/svg/logo-horizontal-color.svg" alt="California — Kebab, Hamburguesería, Pizzería" className="kiosk-logo-img" />
            <p>{t(idioma, "tocaParaEmpezar")}</p>
          </div>
          <div className="kiosk-opciones">
            <button className="kiosk-opcion" onClick={() => elegirTipoServicio("aqui")}>
              <span className="kiosk-opcion-titulo">{t(idioma, "comerAqui")}</span>
              <span className="kiosk-opcion-sub">{t(idioma, "enElLocal")}</span>
            </button>
            <button className="kiosk-opcion kiosk-opcion-primaria" onClick={() => elegirTipoServicio("llevar")}>
              <span className="kiosk-opcion-titulo">{t(idioma, "paraLlevar")}</span>
              <span className="kiosk-opcion-sub">{t(idioma, "paraLlevarSub")}</span>
            </button>
          </div>
        </div>
        <div className="kiosk-footer">
          <span>{t(idioma, "cocinaAbierta")}</span>
          {tiempoEsperaMinutos != null && (
            <>
              <span className="kiosk-footer-separador">·</span>
              <span>
                {t(idioma, "tiempoEsperaLabel")}: ~{tiempoEsperaMinutos} min
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  const tipoServicioDisplay = TIPO_SERVICIO_DISPLAY[idioma]?.[tipoServicio];

  if (paso === "categorias") {
    return (
      <div className="kiosk-categorias-page">
        <div className="kiosk-menu-header">
          <span>
            {t(idioma, "tuPedido")} · <strong>{tipoServicioDisplay}</strong>
          </span>
          <div className="kiosk-menu-header-acciones">
            <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} />
            <button className="kiosk-cancelar" onClick={cancelarPedido}>
              {t(idioma, "cancelarPedido")}
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <h2 className="kiosk-categorias-titulo">{t(idioma, "queTeApetece")}</h2>
        <div className="kiosk-categorias-grid">
          {menu.map((cat) => (
            <button key={cat.categoria} className="kiosk-categoria-tile" onClick={() => elegirCategoria(cat.categoria)}>
              <span className="kiosk-categoria-nombre">{conIdioma(cat.categoria, cat.categoriaEn, idioma)}</span>
              <span className="kiosk-categoria-cantidad">
                {cat.productos.length} {t(idioma, "productos")}
              </span>
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <button className="kiosk-ver-carrito" onClick={() => setPaso("menu")}>
            {t(idioma, "verCarrito")} ({items.reduce((acc, i) => acc + i.cantidad, 0)}) · {total.toFixed(2)} €
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
          idioma={idioma}
          onConfirmar={confirmarPersonalizacion}
          onCancelar={() => setProductoPersonalizando(null)}
        />
      )}

      <div className="menu-area">
        <div className="kiosk-menu-header">
          <span>
            {t(idioma, "tuPedido")} · <strong>{tipoServicioDisplay}</strong>
          </span>
          <div className="kiosk-menu-header-acciones">
            <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} />
            <button className="kiosk-ver-categorias" onClick={() => setPaso("categorias")}>
              {t(idioma, "volverCategorias")}
            </button>
            <button className="kiosk-cancelar" onClick={cancelarPedido}>
              {t(idioma, "cancelarPedido")}
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
              {conIdioma(cat.categoria, cat.categoriaEn, idioma)}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="menu-grid">
          {menu
            .find((cat) => cat.categoria === categoriaActiva)
            ?.productos.map((producto) => (
              <MenuItemCard key={producto.id} producto={producto} idioma={idioma} onAdd={onAddProducto} />
            ))}
        </div>
      </div>

      <CartSidebar
        items={items}
        idioma={idioma}
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
