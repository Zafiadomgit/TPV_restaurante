// Ordena los cambios de un producto en secciones para la comanda de
// cocina y el recibo, a petición del cliente: una marca de punto al
// empezar cada parte — cómo es (Solo / En menú), las patatas, los extras
// y la bebida — y debajo, con guion, lo que va dentro de cada una:
//
//   • En menu (patatas + bebida)
//     - Sin cebolla
//     - Salsa picante
//   • Patatas deluxe
//     - Patatas sin salsa
//   • Extras
//     - Tarrina Salsa de yogurt (Blanca)
//   • Coca-Cola
//
// Necesita item.modificadoresGrupos (lo guarda POST /api/orders con el
// paso de cada texto). Los pedidos anteriores no lo tienen: salen como
// siempre, un guion por cambio.

// Paso -> sección. Lo que no está aquí (quitar, salsas, tamaño, carne...)
// va dentro de la sección principal.
const SECCION_DE_PASO = {
  menu: "principal",
  "tipo-patatas": "patatas",
  "salsa-patatas": "patatas",
  "quiere-tarrinas": "patatas",
  extras: "extras",
  "tarrinas-menu": "extras",
  "salsas-aparte": "extras",
  bebida: "bebida",
};
// Pasos cuyo texto ES la cabecera de su sección (con punto).
const PASO_CABECERA = { menu: true, "tipo-patatas": true, bebida: true };
const ORDEN = ["principal", "patatas", "extras", "bebida"];

// Devuelve [{ tipo: "punto" | "guion", texto }].
export function lineasCambios(item) {
  const grupos = Array.isArray(item.modificadoresGrupos) ? item.modificadoresGrupos : null;
  const lineas = [];
  if (!grupos) {
    for (const texto of String(item.modificadoresTexto || "").split(", ").map((t) => t.trim()).filter(Boolean)) {
      lineas.push({ tipo: "guion", texto });
    }
  } else {
    const secciones = Object.fromEntries(ORDEN.map((s) => [s, { cabeceras: [], resto: [] }]));
    for (const grupo of grupos) {
      const seccion = secciones[SECCION_DE_PASO[grupo.paso] || "principal"];
      (PASO_CABECERA[grupo.paso] ? seccion.cabeceras : seccion.resto).push(...grupo.textos);
    }
    for (const nombre of ORDEN) {
      const { cabeceras, resto } = secciones[nombre];
      if (cabeceras.length === 0 && resto.length === 0) continue;
      if (cabeceras.length > 0) {
        for (const texto of cabeceras) lineas.push({ tipo: "punto", texto });
      } else if (nombre === "extras") {
        lineas.push({ tipo: "punto", texto: "Extras" });
      } else if (nombre === "patatas") {
        lineas.push({ tipo: "punto", texto: "Patatas" });
      }
      for (const texto of resto) lineas.push({ tipo: "guion", texto });
    }
  }
  if (item.notas) lineas.push({ tipo: "guion", texto: `NOTA: ${item.notas}` });
  return lineas;
}
