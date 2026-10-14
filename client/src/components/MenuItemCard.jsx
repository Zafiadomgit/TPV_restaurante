import { useEffect, useRef, useState } from "react";
import { t, conIdioma } from "../textos.js";
import { formatEuros } from "../format.js";

// Pizzas: el precio de la tarjeta es el de los 3 tamaños (a petición del
// cliente), no solo el de la pequeña. Sale del propio paso de tamaño
// (id "tamano", esSelectorTamano) — no del paso "menu" de Kebab/Dürüm/
// Lahmacum, que también es esSelectorTamano pero es Solo/En menú.
function preciosPorTamano(producto) {
  const paso = (producto.modificadores || []).find((p) => p.id === "tamano" && p.esSelectorTamano);
  if (!paso) return null;
  const opciones = paso.opciones.filter((o) => typeof o.precioBase === "number");
  return opciones.length > 1 ? opciones : null;
}

// Cuánto dura el efecto de "añadido" sobre la tarjeta (ms) — igual que la
// animación .k-producto--anadido en styles.css.
const DURACION_EFECTO = 1400;

export default function MenuItemCard({ producto, idioma, onAdd, cantidadEnPedido = 0 }) {
  const nombre = conIdioma(producto.nombre, producto.nombreEn, idioma);
  const descripcion = conIdioma(producto.descripcion, producto.descripcionEn, idioma);
  const tamanos = preciosPorTamano(producto);

  // Efecto al añadir (a petición del cliente): la tarjeta brilla y salta
  // una ráfaga de puntos cada vez que sube la cantidad de este producto en
  // el pedido — sirve igual para "Añadir" directo que para un producto
  // personalizable (el efecto sale al confirmar el modal, que es cuando
  // de verdad entra en el pedido).
  const [efecto, setEfecto] = useState(0);
  const cantidadAnterior = useRef(cantidadEnPedido);
  useEffect(() => {
    if (cantidadEnPedido > cantidadAnterior.current) setEfecto((n) => n + 1);
    cantidadAnterior.current = cantidadEnPedido;
  }, [cantidadEnPedido]);
  useEffect(() => {
    if (!efecto) return undefined;
    const id = setTimeout(() => setEfecto(0), DURACION_EFECTO);
    return () => clearTimeout(id);
  }, [efecto]);

  // Productos personalizables: sin botón "Personalizar" (a petición del
  // cliente) — se toca la tarjeta/foto y se abre directamente el asistente.
  const personalizable = Boolean(producto.modificadores);
  const abrir = (e) => onAdd(producto, e.currentTarget.closest(".k-producto"));

  return (
    // Dos clases alternas para que el brillo vuelva a empezar si se añade
    // otra vez antes de que termine (un cambio de animation-name reinicia
    // la animación en CSS; repetir la misma clase no).
    <div
      className={`k-producto ${personalizable ? "k-producto--tocable" : ""} ${efecto ? `k-producto--anadido-${efecto % 2}` : ""}`}
      {...(personalizable
        ? {
            role: "button",
            tabIndex: 0,
            "aria-label": `${t(idioma, "personalizar")}: ${nombre}`,
            onClick: abrir,
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                abrir(e);
              }
            },
          }
        : {})}
    >
      <div className="k-producto-foto">
        {producto.imagen && <img src={producto.imagen} alt="" loading="lazy" />}
        {producto.modificadores && <span className="k-badge">{t(idioma, "personalizable")}</span>}
        {cantidadEnPedido > 0 && (
          <span className="k-producto-en-pedido" key={cantidadEnPedido}>
            ✓ {cantidadEnPedido}
          </span>
        )}
        {efecto > 0 && (
          <span className="k-producto-check" aria-hidden="true" key={`check-${efecto}`}>
            <span>✓</span>
          </span>
        )}
        {efecto > 0 && (
          <span className="k-rafaga" aria-hidden="true" key={efecto}>
            {Array.from({ length: 14 }, (_, i) => (
              <span key={i} style={{ "--i": i }} />
            ))}
          </span>
        )}
      </div>
      <div className="k-producto-info">
        <h4 className="k-producto-nombre">{nombre}</h4>
        {descripcion && <p className="k-producto-desc">{descripcion}</p>}
        {tamanos && (
          <ul className="k-producto-tamanos">
            {tamanos.map((o) => (
              <li key={o.id}>
                <span>{idioma === "en" && o.nombreEn ? o.nombreEn : o.nombre}</span>
                <span className="k-producto-tamanos-precio">{formatEuros(o.precioBase)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="k-producto-pie">
          {!tamanos && <span className="k-producto-precio">{formatEuros(producto.precio)}</span>}
          {!personalizable && (
            <button
              type="button"
              className={`k-boton-anadir ${efecto ? "k-boton-anadir--hecho" : ""}`}
              onClick={abrir}
            >
              {efecto ? `✓ ${t(idioma, "anadido")}` : t(idioma, "anadir")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
