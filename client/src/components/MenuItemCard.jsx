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
const DURACION_EFECTO = 1100;

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

  return (
    // Dos clases alternas para que el brillo vuelva a empezar si se añade
    // otra vez antes de que termine (un cambio de animation-name reinicia
    // la animación en CSS; repetir la misma clase no).
    <div className={`k-producto ${efecto ? `k-producto--anadido-${efecto % 2}` : ""}`}>
      <div className="k-producto-foto">
        {producto.imagen && <img src={producto.imagen} alt="" loading="lazy" />}
        {producto.modificadores && <span className="k-badge">{t(idioma, "personalizable")}</span>}
        {cantidadEnPedido > 0 && (
          <span className="k-producto-en-pedido" key={cantidadEnPedido}>
            ✓ {cantidadEnPedido}
          </span>
        )}
        {efecto > 0 && (
          <span className="k-rafaga" aria-hidden="true" key={efecto}>
            {Array.from({ length: 10 }, (_, i) => (
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
          <button
            type="button"
            className={`k-boton-anadir ${efecto ? "k-boton-anadir--hecho" : ""}`}
            onClick={() => onAdd(producto)}
          >
            {efecto
              ? `✓ ${t(idioma, "anadido")}`
              : producto.modificadores
                ? t(idioma, "personalizar")
                : t(idioma, "anadir")}
          </button>
        </div>
      </div>
    </div>
  );
}
