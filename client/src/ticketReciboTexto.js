import { formatTicket } from "./format.js";
import { paraImpresora, MARCA_SECCION } from "./ticketCocinaTexto.js";
import { lineasCambios } from "./seccionesTicket.js";

// Recibo del cliente en ESC/POS para mandarlo por QZ Tray directo a la
// impresora de caja, sin la ventana de imprimir del navegador (a petición
// del cliente: "al darle imprimir que solo imprima"). Mismo contenido que
// ReciboImprimible.jsx, que se queda como respaldo con window.print() si
// QZ Tray falla. 42 columnas: caben tanto en las térmicas de 80 mm (48)
// como en las de impacto tipo Bixolon SRP-275 (40-42).
const ANCHO = 42;
const INIT = "\x1B\x40";
const CENTRO = "\x1B\x61\x01";
const IZQUIERDA = "\x1B\x61\x00";
const NEGRITA_ON = "\x1B\x45\x01";
const NEGRITA_OFF = "\x1B\x45\x00";
const GRANDE = "\x1D\x21\x11";
const ALTO = "\x1D\x21\x01";
const NORMAL = "\x1D\x21\x00";
const CORTE = "\x1D\x56\x01";
const SEPARADOR = "-".repeat(ANCHO) + "\n";

// Mismos datos que DATOS_NEGOCIO en ReciboImprimible.jsx.
const DATOS_NEGOCIO = {
  cif: "X6995146H",
  telefono: "605 665 040",
  direccion: "Calle Mayor, 90, 09500 Medina de Pomar",
  email: "Kebabcali21@gmail.com",
};

const NOMBRE_METODO_PAGO = { efectivo: "Efectivo", tarjeta: "Tarjeta" };

function euros(n) {
  return `${Number(n || 0).toFixed(2)} EUR`;
}

// Texto a la izquierda e importe a la derecha en la misma línea; si el
// texto no cabe, se parte en varias líneas y el importe va en la última.
function filaConImporte(texto, importe, ancho = ANCHO) {
  const derecha = ` ${importe}`;
  const lineas = partir(texto, ancho);
  const ultima = lineas.pop() || "";
  if (ultima.length + derecha.length <= ancho) {
    lineas.push(ultima.padEnd(ancho - derecha.length) + derecha);
  } else {
    lineas.push(ultima, derecha.trim().padStart(ancho));
  }
  return lineas.join("\n") + "\n";
}

function partir(texto, ancho) {
  const palabras = String(texto).split(/\s+/).filter(Boolean);
  const lineas = [];
  let actual = "";
  for (const palabra of palabras) {
    if (!actual) actual = palabra.slice(0, ancho);
    else if (actual.length + 1 + palabra.length <= ancho) actual += ` ${palabra}`;
    else {
      lineas.push(actual);
      actual = palabra.slice(0, ancho);
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

function fechaHora(iso) {
  if (!iso) return "";
  const f = new Date(iso);
  return `${f.toLocaleDateString("es-ES")} ${f.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

export function construirRecibo(venta) {
  const l = [];
  l.push(INIT, CENTRO);
  l.push(NEGRITA_ON, GRANDE, "CALIFORNIA\n", NORMAL, NEGRITA_OFF);
  l.push("Kebab - Hamburgueseria - Pizzeria\n");
  l.push(`CIF ${DATOS_NEGOCIO.cif}\n`);
  l.push(`${paraImpresora(DATOS_NEGOCIO.direccion)}\n`);
  l.push(`Tel. ${DATOS_NEGOCIO.telefono}\n`);
  l.push(`${DATOS_NEGOCIO.email}\n\n`);
  l.push(NEGRITA_ON, GRANDE, `${formatTicket(venta.ticketNumero)}\n`, NORMAL, NEGRITA_OFF);
  l.push(`${fechaHora(venta.pagadoEn || venta.creadoEn)}\n`);
  if (venta.mesa) l.push(`${paraImpresora(venta.mesa)}\n`);
  // Dirección del pedido para llevar (nota del pedido desde caja).
  if (venta.notasGenerales) {
    for (const linea of partir(paraImpresora(venta.notasGenerales), ANCHO)) l.push(`${linea}\n`);
  }
  l.push(IZQUIERDA, SEPARADOR);

  // Como la comanda de cocina (a petición del cliente): cada cambio en su
  // propia línea con "- " y una línea de guiones entre producto y producto.
  (venta.items || []).forEach((item, i) => {
    if (i > 0) l.push(SEPARADOR);
    l.push(NEGRITA_ON, filaConImporte(`${item.cantidad}x ${paraImpresora(item.nombre)}`, euros(item.precio * item.cantidad)), NEGRITA_OFF);
    for (const { tipo, texto } of lineasCambios(item)) {
      const prefijo = tipo === "punto" ? ` ${MARCA_SECCION} ` : "    - ";
      partir(paraImpresora(texto), ANCHO - prefijo.length).forEach((linea, j) =>
        l.push(`${j === 0 ? prefijo : " ".repeat(prefijo.length)}${linea}\n`)
      );
    }
  });

  l.push(SEPARADOR);
  l.push(filaConImporte("Subtotal", euros(venta.subtotal)));
  l.push(filaConImporte("IVA (10%)", euros(venta.iva)));
  // Total a doble alto (mismo ancho) para que se vea bien sin descuadrar
  // las columnas.
  l.push(NEGRITA_ON, ALTO, filaConImporte("TOTAL", euros(venta.total)), NORMAL, NEGRITA_OFF);

  l.push(CENTRO);
  if (venta.metodoPago) {
    l.push(`\nPagado con ${NOMBRE_METODO_PAGO[venta.metodoPago] || paraImpresora(venta.metodoPago)}\n`);
  }
  l.push("\nGracias por tu visita!\n");
  l.push("\n\n\n", CORTE);
  return l.join("");
}
