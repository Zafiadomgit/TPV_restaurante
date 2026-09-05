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

  // Mismo cálculo de extra y texto que el backend (POST /api/orders) para
  // cada paso — ver comentarios ahí. Se calcula una vez por render y se
  // reutiliza tanto para el precio en vivo como para el texto al confirmar,
  // para que el modal nunca muestre un precio o un texto que luego no
  // coincida con lo que realmente cobra/guarda el backend.
  const detallePasos = (producto.modificadores || []).map((paso) => {
    const elegidas = seleccion[paso.id] || [];
    const seleccionadas = elegidas.map((optId) => paso.opciones.find((o) => o.id === optId)).filter(Boolean);

    // primerosGratis: las primeras N opciones elegidas (por precio
    // ascendente) no suman precioExtra, el resto sí.
    const gratis = typeof paso.primerosGratis === "number" ? paso.primerosGratis : 0;
    const idsGratis = new Set(
      [...seleccionadas]
        .sort((a, b) => a.precioExtra - b.precioExtra)
        .slice(0, gratis)
        .map((o) => o.id)
    );
    let extra = 0;
    for (const opcion of seleccionadas) {
      if (!idsGratis.has(opcion.id)) extra += opcion.precioExtra;
    }

    // Texto para cocina — mismos tres modos que el backend, en el mismo
    // orden: resumenQuitarMuchos (a partir de `umbral` quitados, resume en
    // vez de listar cada "Sin X"), textoSiVacio (si no queda nada
    // seleccionado), o por defecto solo los CAMBIOS respecto a lo marcado
    // por defecto.
    const textos = [];
    const umbral = paso.resumenQuitarMuchos?.umbral;
    if (typeof umbral === "number" && seleccionadas.length >= umbral) {
      const restantes = paso.opciones.filter((o) => !elegidas.includes(o.id));
      if (restantes.length > 0) {
        textos.push(`Solo con ${restantes.map((o) => o.ingrediente || o.nombre).join(" y ")}`);
      } else if (paso.resumenQuitarMuchos.siTodoVacio) {
        textos.push(paso.resumenQuitarMuchos.siTodoVacio);
      }
    } else if (seleccionadas.length === 0 && paso.textoSiVacio) {
      textos.push(paso.textoSiVacio);
    } else {
      const porDefectoIds = new Set(paso.opciones.filter((o) => o.porDefecto).map((o) => o.id));
      for (const opcion of seleccionadas) {
        if (!porDefectoIds.has(opcion.id)) textos.push(opcion.nombre);
      }
      for (const opcion of paso.opciones) {
        if (porDefectoIds.has(opcion.id) && !elegidas.includes(opcion.id)) {
          textos.push(`Sin ${opcion.ingrediente || opcion.nombre}`);
        }
      }
    }

    return { extra, textos };
  });

  const extraPorUnidad = detallePasos.reduce((acc, d) => acc + d.extra, 0);

  const precioUnidad = precioBase + extraPorUnidad;
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
