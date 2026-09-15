import { useState } from "react";
import { t, conIdioma } from "../textos.js";
import { seleccionInicial, toggleOpcionEnSeleccion, calcularPersonalizacion } from "../personalizarCalculo.js";

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
    <div className="personalizar-overlay" onClick={onCancelar}>
      <div className="personalizar-modal" onClick={(e) => e.stopPropagation()}>
        {producto.imagen && (
          <div className="personalizar-imagen">
            <img src={producto.imagen} alt="" />
          </div>
        )}
        <div className="personalizar-header">
          <div>
            <h3>{conIdioma(producto.nombre, producto.nombreEn, idioma).toUpperCase()}</h3>
            <p>{conIdioma(producto.descripcion, producto.descripcionEn, idioma)}</p>
          </div>
          <button className="personalizar-cerrar" onClick={onCancelar}>
            ✕
          </button>
        </div>

        <div className="personalizar-body">
          {(producto.modificadores || []).map((paso) => (
            <div key={paso.id} className="personalizar-paso">
              <div className="personalizar-paso-titulo">
                <span>{paso.titulo}</span>
                {paso.nota && <span className="personalizar-paso-nota">{paso.nota}</span>}
              </div>
              <div className="personalizar-opciones">
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
                      className={`personalizar-opcion ${elegida ? "elegida" : ""}`}
                      onClick={() => toggleOpcion(paso, opcion.id)}
                    >
                      <span>{opcion.nombre}</span>
                      {precioMostrado > 0 && (
                        <span className="personalizar-opcion-nota">
                          {paso.esSelectorTamano ? "" : "+"}
                          {precioMostrado.toFixed(2)} €
                        </span>
                      )}
                      <span className={`personalizar-marca ${elegida ? "elegida" : ""}`}>
                        {elegida ? "✓" : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="personalizar-footer">
          <div className="qty-controls">
            <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}>-</button>
            <span>{cantidad}</span>
            <button onClick={() => setCantidad((c) => c + 1)}>+</button>
          </div>
          <button className="personalizar-confirmar" onClick={confirmar}>
            {t(idioma, "anadir")} · {precioTotal.toFixed(2)} €
          </button>
        </div>
      </div>
    </div>
  );
}
