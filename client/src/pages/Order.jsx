import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import { getIdioma, guardarIdioma } from "../idioma.js";
import { getSede, guardarSede } from "../sede.js";
import { t, TIPO_SERVICIO_DISPLAY, conIdioma } from "../textos.js";
import MenuItemCard from "../components/MenuItemCard.jsx";
import CartSidebar from "../components/CartSidebar.jsx";
import Personalizar from "../components/Personalizar.jsx";
import SelectorIdioma from "../components/SelectorIdioma.jsx";
import UpsellComplementos from "../components/UpsellComplementos.jsx";
import SelectorSede from "../components/SelectorSede.jsx";

const CATEGORIA_UPSELL = "Complementos";

// Collage de fotos para la pantalla de bienvenida — reutiliza las mismas
// fotos ya subidas para las fichas de producto/categoría (ver
// menu_imagenes.sql), no son fotos nuevas.
const FOTOS_BIENVENIDA = [
  "/menu/hamburguesa-xxl.webp",
  "/menu/pollo-asado.webp",
  "/menu/pedratas.webp",
  "/menu/ensalada-cocktail.webp",
  "/menu/perrito-caliente.webp",
  "/menu/alitas-pollo.webp",
  "/menu/durum-loco.webp",
  "/menu/patatas-deluxe.webp",
];

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
  const [paso, setPaso] = useState("bienvenida");
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
  const [mostrarUpsell, setMostrarUpsell] = useState(false);
  const [upsellVisto, setUpsellVisto] = useState(false);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const [sede, setSede] = useState(() => getSede());

  const cambiarIdioma = (nuevo) => {
    setIdioma(nuevo);
    guardarIdioma(nuevo);
  };

  // Elegir idioma en la pantalla de bienvenida es lo que lleva a la
  // sección de empezar el pedido (a petición del cliente) — no hace
  // falta un botón "continuar" aparte.
  const elegirIdiomaInicial = (nuevo) => {
    cambiarIdioma(nuevo);
    setPaso("inicio");
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
      .getAjustes(sede)
      .then((data) => setTiempoEsperaMinutos(data.tiempoEsperaMinutos))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elegirTipoServicio = (tipo) => {
    setTipoServicio(tipo);
    setPaso("categorias");
  };

  const elegirCategoria = (categoria) => {
    setCategoriaActiva(categoria);
    setPaso("menu");
  };

  // Pide confirmación antes de tirar el pedido — un toque accidental en
  // "Cancelar pedido" no debe borrar sin avisar lo que el cliente ya
  // había añadido al carrito.
  const pedirConfirmacionCancelar = () => setConfirmandoCancelar(true);

  const confirmarCancelar = () => {
    setItems([]);
    setNotasGenerales("");
    setTipoServicio(null);
    setPaso("inicio");
    setUpsellVisto(false);
    setConfirmandoCancelar(false);
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

  // La categoría "Complementos" se ofrece una vez, justo al pulsar
  // "Enviar comanda" (a petición del cliente) — no se vuelve a mostrar en
  // este mismo pedido tras cerrarla, para no ser pesados si el cliente
  // toca "enviar" varias veces (ej. tras editar una nota).
  const categoriaComplementos = menu.find((cat) => cat.categoria === CATEGORIA_UPSELL);
  const yaTieneComplementos =
    !!categoriaComplementos && items.some((i) => categoriaComplementos.productos.some((p) => p.id === i.productId));

  const intentarFinalizar = () => {
    if (!upsellVisto && categoriaComplementos?.productos.length && !yaTieneComplementos) {
      setMostrarUpsell(true);
      return;
    }
    enviarComanda();
  };

  const cerrarUpsell = () => {
    setMostrarUpsell(false);
    setUpsellVisto(true);
    enviarComanda();
  };

  const enviarComanda = async () => {
    setError("");
    setEnviando(true);
    try {
      const order = await api.createOrder({
        mesa: TIPO_SERVICIO_LABEL[tipoServicio],
        local: sede,
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

  // Antes de cualquier otra cosa: este dispositivo necesita saber en qué
  // local está (ver client/src/sede.js) — sin eso, los pedidos no se
  // podrían separar entre Villarcayo y Medina de Pomar. Se pregunta una
  // sola vez por dispositivo (queda guardado en localStorage).
  if (!sede) {
    return (
      <SelectorSede
        onElegir={(elegida) => {
          guardarSede(elegida);
          setSede(elegida);
        }}
      />
    );
  }

  // Pantalla de bienvenida: fotos del menú + elegir idioma, antes de
  // cargar nada — a petición del cliente, elegir idioma aquí es lo que
  // lleva directo a la pantalla de empezar el pedido (no hace falta
  // esperar a que el menú termine de cargar para ver esto).
  if (paso === "bienvenida") {
    return (
      <div className="kiosk-bienvenida">
        <div className="kiosk-bienvenida-fotos">
          {FOTOS_BIENVENIDA.map((src) => (
            <div className="kiosk-bienvenida-foto" key={src}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
        <div className="kiosk-bienvenida-overlay">
          <img
            src="/brand/svg/logo-horizontal-color.svg"
            alt="California — Kebab, Hamburguesería, Pizzería"
            className="kiosk-logo-img"
          />
          <p className="kiosk-bienvenida-titulo">Elige tu idioma · Choose your language</p>
          <div className="kiosk-bienvenida-idiomas">
            <button type="button" onClick={() => elegirIdiomaInicial("es")}>
              Español
            </button>
            <button type="button" onClick={() => elegirIdiomaInicial("en")}>
              English
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <span className="tiempo-espera-badge">
                {t(idioma, "tiempoEsperaLabel")}: ~{tiempoEsperaMinutos} min
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  const tipoServicioDisplay = TIPO_SERVICIO_DISPLAY[idioma]?.[tipoServicio];

  // Chip del tiempo de espera — a petición del dueño, más visible que
  // antes (antes solo salía en gris tenue en el pie de la pantalla de
  // inicio) y ahora también visible mientras el cliente está pidiendo,
  // no solo en la pantalla de bienvenida.
  const tiempoEsperaBadge = tiempoEsperaMinutos != null && (
    <span className="tiempo-espera-badge">
      {t(idioma, "tiempoEsperaLabel")}: ~{tiempoEsperaMinutos} min
    </span>
  );

  const confirmarCancelarModal = confirmandoCancelar && (
    <div className="personalizar-overlay" onClick={() => setConfirmandoCancelar(false)}>
      <div className="confirmar-cancelar-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t(idioma, "confirmarCancelarTitulo")}</h3>
        <p>{t(idioma, "confirmarCancelarTexto")}</p>
        <div className="confirmar-cancelar-acciones">
          <button className="confirmar-cancelar-no" onClick={() => setConfirmandoCancelar(false)}>
            {t(idioma, "confirmarCancelarNo")}
          </button>
          <button className="confirmar-cancelar-si" onClick={confirmarCancelar}>
            {t(idioma, "confirmarCancelarSi")}
          </button>
        </div>
      </div>
    </div>
  );

  if (paso === "categorias") {
    return (
      <div className="kiosk-categorias-page">
        {confirmarCancelarModal}
        <div className="kiosk-menu-header">
          <span>
            {t(idioma, "tuPedido")} · <strong>{tipoServicioDisplay}</strong>
            {tiempoEsperaBadge}
          </span>
          <div className="kiosk-menu-header-acciones">
            <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} />
            <button className="kiosk-cancelar" onClick={pedirConfirmacionCancelar}>
              {t(idioma, "cancelarPedido")}
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}

        <h2 className="kiosk-categorias-titulo">{t(idioma, "queTeApetece")}</h2>
        <div className="kiosk-categorias-grid">
          {menu.map((cat) => (
            <button key={cat.categoria} className="kiosk-categoria-tile" onClick={() => elegirCategoria(cat.categoria)}>
              {cat.imagenUrl && (
                <div className="kiosk-categoria-imagen">
                  <img src={cat.imagenUrl} alt="" loading="lazy" />
                </div>
              )}
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
      {confirmarCancelarModal}

      {mostrarUpsell && categoriaComplementos && (
        <UpsellComplementos
          productos={categoriaComplementos.productos}
          idioma={idioma}
          onAdd={onAddProducto}
          onFinalizar={cerrarUpsell}
        />
      )}

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
            {tiempoEsperaBadge}
          </span>
          <div className="kiosk-menu-header-acciones">
            <SelectorIdioma idioma={idioma} onCambiar={cambiarIdioma} />
            <button className="kiosk-ver-categorias" onClick={() => setPaso("categorias")}>
              {t(idioma, "volverCategorias")}
            </button>
            <button className="kiosk-cancelar" onClick={pedirConfirmacionCancelar}>
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
        onEnviar={intentarFinalizar}
        enviando={enviando}
      />
    </div>
  );
}
