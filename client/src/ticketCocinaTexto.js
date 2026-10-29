import { formatTicket } from "./format.js";
import { lineasCambios, nombreCocina, lineasCliente } from "./seccionesTicket.js";

// Marca de inicio de sección (Solo/En menú, patatas, extras, bebida). Es
// "*" y no "•" a propósito: el punto no existe en la página de códigos por
// defecto de las impresoras de tickets (ver paraImpresora).
export const MARCA_SECCION = "*";

// Construye el texto ESC/POS del ticket de cocina — pedido por el dueño
// para tener comandas en papel "claras y separadas" en una impresora
// aparte de la de caja (ver qzTray.js e Kitchen.jsx). Comandos crudos,
// igual que COMANDO_ABRIR_CAJON en qzTray.js: qz.print() los manda tal
// cual a la impresora.
const INIT = "\x1B\x40"; // ESC @ — inicializa la impresora
const CENTRO = "\x1B\x61\x01"; // ESC a 1
const IZQUIERDA = "\x1B\x61\x00"; // ESC a 0
const NEGRITA_ON = "\x1B\x45\x01"; // ESC E 1
const NEGRITA_OFF = "\x1B\x45\x00"; // ESC E 0
const GRANDE = "\x1D\x21\x11"; // GS ! 0x11 — doble alto y ancho
const ALTO = "\x1D\x21\x01"; // GS ! 0x01 — doble alto (mismo ancho: caben 48 letras en 80 mm)
const NORMAL = "\x1D\x21\x00"; // GS ! 0x00
const CORTE = "\x1D\x56\x01"; // GS V 1 — corte parcial
const SEPARADOR = "--------------------------------\n";

// Las impresoras térmicas baratas (el hardware típico de un negocio
// pequeño) casi siempre arrancan en la página de códigos PC437/USA, que
// no tiene tildes ni "ñ" — en vez de arriesgar un comando de página de
// códigos que dependa del modelo exacto, se pasan los acentos a su
// versión sin tilde. Un ticket de cocina legible sin tilde es mucho
// mejor que uno con símbolos rotos.
const MAPA_ACENTOS = {
  á: "a", é: "e", í: "i", ó: "o", ú: "u",
  Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U",
  ñ: "n", Ñ: "N", ü: "u", Ü: "U", "€": "EUR", "º": "o", "ª": "a",
};

export function paraImpresora(texto) {
  return String(texto ?? "").replace(/[áéíóúÁÉÍÓÚñÑüÜ€ºª]/g, (c) => MAPA_ACENTOS[c] || c);
}

// Letra grande a petición del cliente ("habría que aumentar las letras de
// los pedidos de cocina"): número de pedido y nombre de cada producto a
// doble alto y ancho, y cada cambio (sin cebolla, patatas, bebida...) en
// su propia línea a doble alto, en vez de todos seguidos en letra normal.
export function construirTicketCocina(order) {
  const lineas = [];
  lineas.push(INIT);
  // Cabecera en UNA sola línea, a petición del cliente: "#A-81 Mostrador
  // 14:32" (antes eran 4 líneas: COCINA, número, origen y hora). En letra
  // grande si cabe (24 caracteres a doble ancho en 80 mm); si no, a doble
  // alto con el ancho normal, para que nunca se parta en dos.
  const hora = new Date(order.creadoEn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const cabecera = [formatTicket(order.ticketNumero), paraImpresora(order.mesa), hora].filter(Boolean).join(" ");
  lineas.push(CENTRO, NEGRITA_ON, cabecera.length <= 24 ? GRANDE : ALTO, cabecera, "\n", NEGRITA_OFF, NORMAL);
  // Importe del pedido (a petición del cliente). "P.C" = pendiente de
  // cobro: sale en los pedidos aún sin cobrar (corto, como pidió el cliente).
  if (typeof order.total === "number") {
    const pc = order.pagado ? "" : " P.C";
    lineas.push(CENTRO, NEGRITA_ON, ALTO, `TOTAL ${order.total.toFixed(2).replace(".", ",")} EUR${pc}`, "\n", NORMAL, NEGRITA_OFF);
  }
  // Datos del cliente (para llevar / recoger), a doble alto y en negrita.
  for (const linea of lineasCliente(order)) lineas.push(IZQUIERDA, NEGRITA_ON, ALTO, `${paraImpresora(linea)}\n`, NORMAL, NEGRITA_OFF);
  lineas.push(IZQUIERDA, SEPARADOR);

  for (const item of order.items || []) {
    lineas.push(GRANDE, NEGRITA_ON, `${item.cantidad}x ${paraImpresora(nombreCocina(item.nombre))}\n`, NEGRITA_OFF);
    lineas.push(ALTO);
    // Secciones con marca (ver seccionesTicket.js): la cabecera en negrita
    // y lo de dentro con guion, un poco metido.
    for (const { tipo, texto } of lineasCambios({ ...item, notas: "" })) {
      if (tipo === "punto") lineas.push(NEGRITA_ON, `${MARCA_SECCION} ${paraImpresora(texto)}\n`, NEGRITA_OFF);
      else lineas.push(`   - ${paraImpresora(texto)}\n`);
    }
    if (item.notas) lineas.push(NEGRITA_ON, ` NOTA: ${paraImpresora(item.notas)}\n`, NEGRITA_OFF);
    lineas.push(NORMAL, SEPARADOR);
  }

  if (order.notasGenerales) {
    lineas.push(ALTO, NEGRITA_ON, `NOTA PEDIDO: ${paraImpresora(order.notasGenerales)}\n`, NEGRITA_OFF, NORMAL, SEPARADOR);
  }

  lineas.push("\n\n\n", CORTE);
  return lineas.join("");
}
