import { SEDES } from "../sede.js";

// Pantalla que bloquea el resto de la app hasta que el dispositivo tiene
// una sede configurada (ver sede.js). Se usa igual en el kiosco, caja,
// cocina y recogida — cada una la muestra con `if (!sede) return
// <SelectorSede onElegir={...} />` antes de su contenido normal.
export default function SelectorSede({ onElegir }) {
  return (
    <div className="selector-sede-page">
      <h2>¿En qué local está este dispositivo?</h2>
      <p>Se pregunta una sola vez por dispositivo — luego queda guardado.</p>
      <div className="selector-sede-opciones">
        {Object.entries(SEDES).map(([id, sede]) => (
          <button key={id} type="button" className="selector-sede-boton" onClick={() => onElegir(id)}>
            <span className="selector-sede-nombre">{sede.nombre}</span>
            <span className="selector-sede-direccion">{sede.direccion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
