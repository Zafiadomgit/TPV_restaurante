// Lógica de precio y texto de cocina para un producto personalizable —
// compartida entre Personalizar.jsx (modal con todos los pasos juntos,
// usado por el resto de la carta) y MenuWizard.jsx (flujo de "Haz tu
// menú" a pantalla completa, un paso por pantalla), para que los dos
// calculen exactamente lo mismo sin duplicar la lógica dos veces en el
// frontend. Mismo criterio que el backend (POST /api/orders, ver
// client/api/orders/index.js) — cualquier cambio aquí debe reflejarse
// también ahí.

export function seleccionInicial(producto) {
  const inicial = {};
  for (const paso of producto.modificadores || []) {
    inicial[paso.id] = paso.opciones.filter((o) => o.porDefecto).map((o) => o.id);
  }
  return inicial;
}

// "¿En menú o no?" (Kebab, Dürüm, Lahmacum...): un paso puede depender
// de la opción elegida en OTRO paso anterior — ej. "Tus patatas" y
// "Elige tu bebida" solo existen si en el paso "menu" se eligió
// "en-menu". Sin mostrarSi, el paso siempre está visible (compatible
// con todos los productos que no usan esta opción).
export function pasoVisible(paso, seleccion) {
  if (!paso.mostrarSi) return true;
  const elegidasDelPasoDelQueDepende = seleccion[paso.mostrarSi.paso] || [];
  return elegidasDelPasoDelQueDepende.includes(paso.mostrarSi.opcion);
}

// Selección única tipo radio (ej. tamaño de pizza, carne de pedrata):
// tocar otra opción sustituye la elegida en vez de rechazar el toque por
// haber llegado al límite — un paso de "elige uno" no debe poder
// quedarse sin ninguna marcada, así que tocar la ya elegida no hace nada.
export function toggleOpcionEnSeleccion(seleccion, paso, opcionId) {
  const actual = seleccion[paso.id] || [];
  const yaElegida = actual.includes(opcionId);
  if (paso.maxSeleccion === 1) {
    return yaElegida ? seleccion : { ...seleccion, [paso.id]: [opcionId] };
  }
  if (yaElegida) {
    return { ...seleccion, [paso.id]: actual.filter((id) => id !== opcionId) };
  }
  if (paso.maxSeleccion && actual.length >= paso.maxSeleccion) {
    return seleccion;
  }
  return { ...seleccion, [paso.id]: [...actual, opcionId] };
}

// Gana el primer paso (en orden de array) que consiga sustituir el
// precio base:
//  - precioSiTodoQuitado: si el paso trae disparadoresPrecioAlternativo,
//    basta con marcar ALGUNA de esas opciones (ej. quitar solo la
//    lechuga ya obliga a echar más carne); si no trae ese campo
//    (productos antiguos sin tocar), hace falta marcar TODAS las
//    opciones del paso, como siempre.
//  - esSelectorTamano (ej. pizzas): la opción de tamaño elegida trae su
//    propio precioBase absoluto, no un precioExtra que se suma. Si no
//    hay ninguna válida marcada todavía, cae a la porDefecto — nunca se
//    queda sin tamaño resuelto.
//
// Texto para cocina — cuatro modos, en este orden: esSelectorTamano o
// siempreEnTexto (la opción elegida SIEMPRE se muestra, incluso si es la
// de por defecto — para "elige uno obligatorio" tipo tamaño/carne/
// bebida/sabor, cocina necesita saber qué preparar pase lo que pase),
// resumenQuitarMuchos (a partir de `umbral` quitados, resume en vez de
// listar cada "Sin X"), textoSiVacio (si no queda nada seleccionado), o
// por defecto solo los CAMBIOS respecto a lo marcado por defecto.
export function calcularPersonalizacion(producto, seleccion) {
  // precioBase lo decide como mucho UN paso esSelectorTamano (ej. tamaño
  // de pizza, o "menu" en Kebab/Dürüm/Lahmacum: Solo/En menú) — precio
  // ABSOLUTO, sustituye el del producto. precioSiTodoQuitadoDelta es la
  // diferencia (no un valor absoluto) que añade "quitar todo" (ej.
  // "Kebab solo carne" sube +1€ al quitar pan y verduras) — se SUMA al
  // precioBase que haya, en vez de competir con esSelectorTamano por
  // ganar el precio: da igual si el cliente pidió "Solo" o "En menú",
  // pedir "solo carne" añade su recargo igual en los dos casos.
  let precioBase = producto.precio;
  let precioSiTodoQuitadoDelta = 0;
  for (const paso of producto.modificadores || []) {
    if (!pasoVisible(paso, seleccion)) continue;
    const elegidas = seleccion[paso.id] || [];
    if (typeof paso.precioSiTodoQuitado === "number" && paso.opciones.length > 0) {
      const disparadores = paso.disparadoresPrecioAlternativo;
      const activa = Array.isArray(disparadores)
        ? disparadores.some((id) => elegidas.includes(id))
        : paso.opciones.every((o) => elegidas.includes(o.id));
      if (activa) {
        precioSiTodoQuitadoDelta = paso.precioSiTodoQuitado - producto.precio;
      }
    }
    if (paso.esSelectorTamano) {
      const opcionTamano = paso.opciones.find((o) => elegidas.includes(o.id)) || paso.opciones.find((o) => o.porDefecto);
      if (opcionTamano && typeof opcionTamano.precioBase === "number") {
        precioBase = opcionTamano.precioBase;
      }
    }
  }
  precioBase += precioSiTodoQuitadoDelta;

  const detallePasos = (producto.modificadores || []).map((paso) => {
    // Un paso oculto (ej. "Tus patatas" cuando se eligió "Solo" en vez de
    // "En menú") no debe sumar precio ni aparecer en el ticket de cocina,
    // aunque tenga una opción por defecto marcada en la selección.
    if (!pasoVisible(paso, seleccion)) return { extra: 0, textos: [] };

    const elegidas = seleccion[paso.id] || [];
    const seleccionadas = elegidas.map((optId) => paso.opciones.find((o) => o.id === optId)).filter(Boolean);

    // primerosGratis: las primeras N opciones elegidas (por precio
    // ascendente) no suman precioExtra, el resto sí. No aplica al paso de
    // tamaño — su coste ya está en precioBase, no en precioExtra.
    let extra = 0;
    if (!paso.esSelectorTamano) {
      const gratis = typeof paso.primerosGratis === "number" ? paso.primerosGratis : 0;
      const idsGratis = new Set(
        [...seleccionadas]
          .sort((a, b) => a.precioExtra - b.precioExtra)
          .slice(0, gratis)
          .map((o) => o.id)
      );
      for (const opcion of seleccionadas) {
        if (!idsGratis.has(opcion.id)) extra += opcion.precioExtra;
      }
    }

    const textos = [];
    const umbral = paso.resumenQuitarMuchos?.umbral;
    if (paso.esSelectorTamano || paso.siempreEnTexto) {
      const opcionElegida = paso.opciones.find((o) => elegidas.includes(o.id)) || paso.opciones.find((o) => o.porDefecto);
      if (opcionElegida) textos.push(opcionElegida.nombre);
    } else if (typeof umbral === "number" && seleccionadas.length >= umbral) {
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

  return { precioUnidad, detallePasos };
}
