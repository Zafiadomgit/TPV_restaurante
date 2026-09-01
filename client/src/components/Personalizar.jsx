import { useState } from "react";
import { t } from "../textos.js";

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

  // Si un paso trae precioSiTodoQuitado y el cliente marcó TODAS sus
  // opciones (ej. las 4 de "Quitar ingredientes"), el precio base pasa a
  // ser ese valor en vez del precio normal del producto — pensado para
  // vender el kebab/dürüm/lahmacum "solo carne" a un precio fijo más bajo.
  const pasoConPrecioBase = (producto.modificadores || []).find((paso) => {
    if (typeof paso.precioSiTodoQuitado !== "number" || paso.opciones.length === 0) return false;
    const elegidas = seleccion[paso.id] || [];
    return paso.opciones.every((o) => elegidas.includes(o.id));
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
            <h3>{producto.nombre.toUpperCase()}</h3>
            <p>{producto.descripcion}</p>
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
