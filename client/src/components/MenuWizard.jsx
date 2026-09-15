import { useState } from "react";
import { t } from "../textos.js";
import { seleccionInicial, toggleOpcionEnSeleccion, calcularPersonalizacion } from "../personalizarCalculo.js";

// Flujo a pantalla completa para "Haz tu menú" — a petición del cliente,
// en vez de un solo modal con todos los pasos apilados (Personalizar.jsx,
// que se sigue usando para el resto de la carta), cada paso (carne,
// patatas, salsas, bebida...) se ve como su propia pantalla, para que se
// sienta como recorrer la carta (elegir tu plato, tus patatas, tu
// bebida) en vez de rellenar un formulario largo. El precio final es
// exactamente el mismo de siempre — misma lógica que Personalizar.jsx,
// compartida vía personalizarCalculo.js, así que un menú cuesta igual
// elegido aquí que desde el modal antiguo.
export default function MenuWizard({ producto, idioma, onConfirmar, onCancelar }) {
  const pasos = producto.modificadores || [];
  const [pasoIndex, setPasoIndex] = useState(0);
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(producto));
  const [cantidad, setCantidad] = useState(1);

  const enResumen = pasoIndex >= pasos.length;
  const pasoActual = pasos[pasoIndex];

  const { precioUnidad, detallePasos } = calcularPersonalizacion(producto, seleccion);
  const precioTotal = precioUnidad * cantidad;

  const siguiente = () => setPasoIndex((i) => Math.min(i + 1, pasos.length));
  const atras = () => {
    if (pasoIndex === 0) {
      onCancelar();
      return;
    }
    setPasoIndex((i) => i - 1);
  };

  // En los pasos de "elige uno" (carne, patatas, bebida...) tocar una
  // opción ya la deja decidida — avanza solo, como si hubieras entrado a
  // la sección siguiente de la carta. En los de varios (quitar
  // ingredientes, extras) hace falta el botón "Siguiente" de abajo.
  const elegirOpcion = (paso, opcionId) => {
    setSeleccion((prev) => toggleOpcionEnSeleccion(prev, paso, opcionId));
    if (paso.maxSeleccion === 1) siguiente();
  };

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
    <div className="menu-wizard">
      <div className="menu-wizard-header">
        <button type="button" className="menu-wizard-atras" onClick={atras}>
          {pasoIndex === 0 ? "✕" : "◀"}
        </button>
        <div className="menu-wizard-progreso">
          {pasos.map((paso, i) => (
            <span key={paso.id} className={`menu-wizard-punto ${i <= pasoIndex ? "activo" : ""}`} />
          ))}
        </div>
        <span className="menu-wizard-precio-parcial">{precioTotal.toFixed(2)} €</span>
      </div>

      {!enResumen ? (
        <div className="menu-wizard-paso">
          <h2 className="menu-wizard-titulo">{pasoActual.titulo}</h2>
          {pasoActual.nota && <p className="menu-wizard-nota">{pasoActual.nota}</p>}
          <div className="menu-wizard-opciones">
            {pasoActual.opciones.map((opcion) => {
              const elegida = (seleccion[pasoActual.id] || []).includes(opcion.id);
              // El paso de tamaño (si lo hubiera) muestra el precio
              // absoluto de esa opción, no un recargo — los demás pasos
              // muestran el recargo de precioExtra, y nada si es gratis.
              const precioMostrado = pasoActual.esSelectorTamano ? opcion.precioBase : opcion.precioExtra || null;
              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={`menu-wizard-opcion ${elegida ? "elegida" : ""}`}
                  onClick={() => elegirOpcion(pasoActual, opcion.id)}
                >
                  <span className="menu-wizard-opcion-nombre">{opcion.nombre}</span>
                  {precioMostrado > 0 && (
                    <span className="menu-wizard-opcion-precio">
                      {pasoActual.esSelectorTamano ? "" : "+"}
                      {precioMostrado.toFixed(2)} €
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="menu-wizard-paso menu-wizard-resumen">
          <h2 className="menu-wizard-titulo">Resumen de tu menú</h2>
          <ul className="menu-wizard-resumen-lista">
            {detallePasos.map((d, i) =>
              d.textos.length > 0 ? (
                <li key={pasos[i].id}>
                  <strong>{pasos[i].titulo}:</strong> {d.textos.join(", ")}
                </li>
              ) : null
            )}
          </ul>
          <div className="qty-controls">
            <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
              -
            </button>
            <span>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((c) => c + 1)}>
              +
            </button>
          </div>
        </div>
      )}

      <div className="menu-wizard-footer">
        {!enResumen ? (
          <button type="button" className="menu-wizard-siguiente" onClick={siguiente}>
            Siguiente
          </button>
        ) : (
          <button type="button" className="menu-wizard-confirmar" onClick={confirmar}>
            {t(idioma, "anadir")} · {precioTotal.toFixed(2)} €
          </button>
        )}
      </div>
    </div>
  );
}
