import { useState } from "react";
import { t, conIdioma } from "../textos.js";
import { formatEuros } from "../format.js";
import { seleccionInicial, toggleOpcionEnSeleccion, calcularPersonalizacion, pasoVisible } from "../personalizarCalculo.js";

export default function Personalizar({ producto, idioma, onConfirmar, onCancelar }) {
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(producto));
  const [cantidad, setCantidad] = useState(1);

  const toggleOpcion = (paso, opcionId) => {
    setSeleccion((prev) => toggleOpcionEnSeleccion(prev, paso, opcionId));
  };

  // Cálculo de precio/texto compartido con MenuWizard.jsx — ver
  // personalizarCalculo.js. Se calcula una vez por render y se reutiliza
  // tanto para el precio en vivo como para el texto al confirmar, para
  // que el modal nunca muestre un precio o un texto que luego no
  // coincida con lo que realmente cobra/guarda el backend.
  const { precioUnidad, detallePasos } = calcularPersonalizacion(producto, seleccion);
  const precioTotal = precioUnidad * cantidad;

  const confirmar = () => {
    const modificadoresTexto = detallePasos.flatMap((d) => d.textos).join(", ");
    onConfirmar({
      seleccion,
      cantidad,
      precioUnidad: Number(precioUnidad.toFixed(2)),
      modificadoresTexto,
    });
  };

  return (
    <div className="k-overlay" onClick={onCancelar}>
      <div className="k-modal k-personalizar" onClick={(e) => e.stopPropagation()}>
        <div className="k-personalizar-hero">
          {producto.imagen && <img src={producto.imagen} alt="" />}
          <div className="k-personalizar-velo" />
          <button type="button" className="k-cerrar" onClick={onCancelar} aria-label="Cerrar">
            ✕
          </button>
          <div className="k-personalizar-hero-texto">
            <div>
              <div className="k-personalizar-nombre">
                {conIdioma(producto.nombre, producto.nombreEn, idioma).toUpperCase()}
              </div>
              {producto.descripcion && (
                <div className="k-personalizar-desc">
                  {conIdioma(producto.descripcion, producto.descripcionEn, idioma)}
                </div>
              )}
            </div>
            <span className="k-personalizar-precio">{formatEuros(precioUnidad)}</span>
          </div>
        </div>

        <div className="k-personalizar-pasos">
          {(producto.modificadores || [])
            .filter((paso) => pasoVisible(paso, seleccion))
            .map((paso) => (
              <div key={paso.id} className="k-paso">
                <div className="k-paso-titulo">
                  <span className="k-paso-nombre">{paso.titulo}</span>
                  {paso.nota && <span className="k-paso-nota">{paso.nota}</span>}
                </div>
                <div className="k-opciones">
                  {paso.opciones.map((opcion) => {
                    const elegida = (seleccion[paso.id] || []).includes(opcion.id);
                    // El paso de tamaño muestra el precio absoluto de esa
                    // opción (ej. "10,00 €"), no un recargo — los demás
                    // pasos muestran el recargo de precioExtra como hasta
                    // ahora ("+1,00 €"), y nada si es gratis.
                    const precioMostrado = paso.esSelectorTamano ? opcion.precioBase : opcion.precioExtra || null;
                    return (
                      <button
                        key={opcion.id}
                        type="button"
                        aria-pressed={elegida}
                        className={`k-opcion ${elegida ? "elegida" : ""}`}
                        onClick={() => toggleOpcion(paso, opcion.id)}
                      >
                        <span className="k-opcion-nombre">{opcion.nombre}</span>
                        {precioMostrado > 0 && (
                          <span className="k-opcion-extra">
                            {paso.esSelectorTamano ? "" : "+"}
                            {formatEuros(precioMostrado)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>

        <div className="k-modal-pie">
          <div className="k-cantidad k-cantidad--grande">
            <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} aria-label="-1">
              −
            </button>
            <span>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((c) => c + 1)} aria-label="+1">
              +
            </button>
          </div>
          <button type="button" className="k-boton-confirmar" onClick={confirmar}>
            {t(idioma, "anadirAlPedido")} <span className="k-separador">·</span> {formatEuros(precioTotal)}
          </button>
        </div>
      </div>
    </div>
  );
}
