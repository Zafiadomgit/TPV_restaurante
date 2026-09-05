import { useState } from "react";
import { t, conIdioma } from "../textos.js";

function seleccionInicial(producto) {
  const inicial = {};
  for (const paso of producto.modificadores || []) {
    inicial[paso.id] = paso.opciones.filter((o) => o.porDefecto).map((o) => o.id);
  }
  return inicial;
}

export default function Personalizar({ producto, idioma, onConfirmar, onCancelar }) {
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(producto));
  const [cantidad, setCantidad] = useState(1);

  const toggleOpcion = (paso, opcionId) => {
    setSeleccion((prev) => {
      const actual = prev[paso.id] || [];
      const yaElegida = actual.includes(opcionId);
      if (yaElegida) {
        return { ...prev, [paso.id]: actual.filter((id) => id !== opcionId) };
      }
      if (paso.maxSeleccion && actual.length >= paso.maxSeleccion) {
        return prev;
      }
      return { ...prev, [paso.id]: [...actual, opcionId] };
    });
  };

  // Mismo criterio que el backend (POST /api/orders) para no desincronizar
  // el precio en vivo del modal con lo que realmente se va a cobrar: si el
  // paso trae disparadoresPrecioAlternativo, basta con marcar ALGUNA de
  // esas opciones (ej. quitar solo la lechuga ya obliga a echar más
  // carne); si no trae ese campo (productos antiguos sin tocar), hace
  // falta marcar TODAS las opciones del paso, como siempre.
  const pasoConPrecioBase = (producto.modificadores || []).find((paso) => {
    if (typeof paso.precioSiTodoQuitado !== "number" || paso.opciones.length === 0) return false;
    const elegidas = seleccion[paso.id] || [];
    return Array.isArray(paso.disparadoresPrecioAlternativo)
      ? paso.disparadoresPrecioAlternativo.some((id) => elegidas.includes(id))
      : paso.opciones.every((o) => elegidas.includes(o.id));
  });
  const precioBase = pasoConPrecioBase ? pasoConPrecioBase.precioSiTodoQuitado : producto.precio;

  const extraPorUnidad = (producto.modificadores || []).reduce((acc, paso) => {
    const elegidas = seleccion[paso.id] || [];
    return (
      acc +
      elegidas.reduce((sub, optId) => {
        const opcion = paso.opciones.find((o) => o.id === optId);
        return sub + (opcion ? opcion.precioExtra : 0);
      }, 0)
    );
  }, 0);

  const precioUnidad = precioBase + extraPorUnidad;
  const precioTotal = precioUnidad * cantidad;

  const confirmar = () => {
    const nombresSeleccionados = (producto.modificadores || []).flatMap((paso) =>
      (seleccion[paso.id] || []).map((optId) => paso.opciones.find((o) => o.id === optId)?.nombre)
    );
    onConfirmar({
      seleccion,
      cantidad,
      precioUnidad: Number(precioUnidad.toFixed(2)),
      modificadoresTexto: nombresSeleccionados.filter(Boolean).join(", "),
    });
  };

  return (
    <div className="personalizar-overlay" onClick={onCancelar}>
      <div className="personalizar-modal" onClick={(e) => e.stopPropagation()}>
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
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      className={`personalizar-opcion ${elegida ? "elegida" : ""}`}
                      onClick={() => toggleOpcion(paso, opcion.id)}
                    >
                      <span>{opcion.nombre}</span>
                      {opcion.precioExtra > 0 && (
                        <span className="personalizar-opcion-nota">+{opcion.precioExtra.toFixed(2)} €</span>
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
