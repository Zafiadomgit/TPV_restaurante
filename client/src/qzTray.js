// Apertura del cajón de dinero desde caja — a petición del cliente
// ("visual, sin tener que meter un importe"). El cajón está conectado
// por cable a la impresora de tickets (USB), así que abrirlo es mandar
// un comando ESC/POS de "kick" a esa impresora. Un navegador no puede
// hablarle directo a una impresora USB, así que se usa QZ Tray — un
// programa gratuito que hay que instalar una vez en el PC/tablet de
// caja (https://qz.io/download/) y que se queda escuchando en segundo
// plano para recibir estas órdenes desde la web.
import qz from "qz-tray";
import { construirTicketCocina } from "./ticketCocinaTexto.js";

// ESC p 0 25 250 — el comando de "kick" estándar que reconoce prácticamente
// cualquier impresora de tickets con cajón conectado (pin 2, tiempos de
// pulso habituales). No hace falta saber el modelo exacto de impresora.
const COMANDO_ABRIR_CAJON = "\x1B\x70\x00\x19\xFA";

const CLAVE_IMPRESORA_GUARDADA = "tpv_impresora_caja";
// Cocina imprime en un dispositivo aparte de caja (el dueño pidió
// "impresora aparte" para las comandas) — clave de localStorage propia
// para no pisar la impresora del cajón al elegir una en /cocina.
const CLAVE_IMPRESORA_COCINA = "tpv_impresora_cocina";

function crearAlmacenImpresora(clave) {
  return {
    get() {
      try {
        return localStorage.getItem(clave);
      } catch {
        return null;
      }
    },
    guardar(nombre) {
      try {
        localStorage.setItem(clave, nombre);
      } catch {
        // si el navegador bloquea localStorage no pasa nada grave — solo
        // habrá que elegir la impresora de nuevo la próxima vez
      }
    },
  };
}

const almacenImpresoraCaja = crearAlmacenImpresora(CLAVE_IMPRESORA_GUARDADA);
const almacenImpresoraCocina = crearAlmacenImpresora(CLAVE_IMPRESORA_COCINA);

export function getImpresoraGuardada() {
  return almacenImpresoraCaja.get();
}

export function guardarImpresora(nombre) {
  almacenImpresoraCaja.guardar(nombre);
}

export function getImpresoraCocinaGuardada() {
  return almacenImpresoraCocina.get();
}

export function guardarImpresoraCocina(nombre) {
  almacenImpresoraCocina.guardar(nombre);
}

async function asegurarConexion() {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
}

// Falla con un mensaje claro si QZ Tray no está instalado/abierto en
// este dispositivo, en vez de un error técnico críptico.
async function conectarOExplicar() {
  try {
    await asegurarConexion();
  } catch {
    throw new Error(
      "No se pudo conectar con QZ Tray. Comprueba que está instalado y abierto en este dispositivo (https://qz.io/download/)."
    );
  }
}

export async function listarImpresoras() {
  await conectarOExplicar();
  return qz.printers.find();
}

export async function abrirCajon(nombreImpresora) {
  await conectarOExplicar();
  const config = qz.configs.create(nombreImpresora);
  await qz.print(config, [{ type: "raw", format: "plain", data: COMANDO_ABRIR_CAJON }]);
}

export async function imprimirTicketCocina(nombreImpresora, order) {
  await conectarOExplicar();
  const config = qz.configs.create(nombreImpresora);
  await qz.print(config, [{ type: "raw", format: "plain", data: construirTicketCocina(order) }]);
}
