import { formatTicket } from "./format.js";

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
  ñ: "n", Ñ: "N", ü: "u", Ü: "U", "€": "EUR",
};

function paraImpresora(texto) {
  return String(texto ?? "").replace(/[áéíóúÁÉÍÓÚñÑüÜ€]/g, (c) => MAPA_ACENTOS[c] || c);
}

export function construirTicketCocina(order) {
  const lineas = [];
  lineas.push(INIT);
  lineas.push(CENTRO, NEGRITA_ON, GRANDE, "COCINA\n", NORMAL);
  lineas.push(formatTicket(order.ticketNumero), "\n", NEGRITA_OFF);
  lineas.push(paraImpresora(order.mesa), "\n");
  lineas.push(new Date(order.creadoEn).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), "\n");
  lineas.push(IZQUIERDA, SEPARADOR);

  for (const item of order.items || []) {
    lineas.push(NEGRITA_ON, `${item.cantidad}x ${paraImpresora(item.nombre)}\n`, NEGRITA_OFF);
    if (item.modificadoresTexto) lineas.push(`   ${paraImpresora(item.modificadoresTexto)}\n`);
    if (item.notas) lineas.push(`   Nota: ${paraImpresora(item.notas)}\n`);
  }

  if (order.notasGenerales) {
    lineas.push(SEPARADOR, `NOTA PEDIDO: ${paraImpresora(order.notasGenerales)}\n`);
  }

  lineas.push(SEPARADOR, "\n\n\n", CORTE);
  return lineas.join("");
}
