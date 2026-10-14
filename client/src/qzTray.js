// Apertura del cajón de dinero desde caja — a petición del cliente
// ("visual, sin tener que meter un importe"). El cajón está conectado
// por cable a la impresora de tickets (USB), así que abrirlo es mandar
// un comando ESC/POS de "kick" a esa impresora. Un navegador no puede
// hablarle directo a una impresora USB, así que se usa QZ Tray — un
// programa gratuito que hay que instalar una vez en el PC/tablet de
// caja (https://qz.io/download/) y que se queda escuchando en segundo
// plano para recibir estas órdenes desde la web.
import qz from "qz-tray";
import { api } from "./api.js";
import { construirTicketCocina } from "./ticketCocinaTexto.js";

// ESC p m 25 250 — el comando de "kick" estándar de las impresoras de
// tickets con cajón conectado. Según el modelo, el cajón va al conector
// del pin 2 (m=0) o al del pin 5 (m=1); se mandan los dos seguidos para
// que abra sea cual sea (al que no tiene cajón no le pasa nada). Antes
// solo se mandaba el del pin 2 y en algunos cajones no abría.
const COMANDO_ABRIR_CAJON = "\x1B\x70\x00\x19\xFA" + "\x1B\x70\x01\x19\xFA";

// Impresoras "virtuales" de Windows/Mac que nunca son la de tickets: al
// elegir impresora se ponen al final y no se preseleccionan (antes se
// preseleccionaba la primera de la lista, que suele ser "Fax" o
// "Microsoft Print to PDF", y el cajón no abría sin dar ningún error).
const IMPRESORAS_VIRTUALES = /pdf|xps|fax|onenote|anydesk|send to|enviar a|document writer|microsoft print/i;
const PISTAS_TICKETS = /pos|tm-|tm |epson|star|xprinter|bixolon|citizen|sunmi|thermal|t[ée]rmica|receipt|ticket|recibo|80mm|58mm|xp-|rongta|hprt|munbyn/i;

// Ordena la lista para el desplegable: primero las que parecen de
// tickets, después el resto y al final las virtuales.
export function ordenarImpresoras(nombres) {
  const peso = (n) => (PISTAS_TICKETS.test(n) ? 0 : IMPRESORAS_VIRTUALES.test(n) ? 2 : 1);
  return [...nombres].sort((a, b) => peso(a) - peso(b));
}

export function esImpresoraVirtual(nombre) {
  return IMPRESORAS_VIRTUALES.test(nombre || "");
}

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

// Conexión firmada: sin esto QZ Tray trata la web como "anónima" y
// pregunta "Allow/Block" cada vez (y en cocina cada comanda se quedaría
// esperando a que alguien pulse "Allow"). El certificado público está en
// /qz/override.crt — el mismo archivo que hay que copiar una vez en la
// carpeta de QZ Tray de cada PC — y la firma la hace el servidor con la
// clave privada (POST /api/login?accion=firmar-qz, ver api/login.js).
let seguridadConfigurada = false;
// Último error al pedir la firma al servidor (o "" si la última fue bien):
// Caja.jsx lo enseña, porque si la firma falla QZ Tray no da error, solo
// vuelve a preguntar "Allow/Block" como si no hubiera certificado.
let ultimoErrorFirma = "";
export function getUltimoErrorFirma() {
  return ultimoErrorFirma;
}
function configurarSeguridad() {
  if (seguridadConfigurada) return;
  seguridadConfigurada = true;
  qz.security.setCertificatePromise((resolve, reject) => {
    fetch("/qz/override.crt", { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("No se pudo cargar el certificado de QZ Tray"))))
      .then(resolve, reject);
  });
  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise((textoAFirmar) => (resolve, reject) => {
    api.firmarQz(textoAFirmar).then(
      (r) => {
        ultimoErrorFirma = "";
        resolve(r.firma);
      },
      (e) => {
        ultimoErrorFirma = e.message;
        reject(e);
      }
    );
  });
}

async function asegurarConexion() {
  configurarSeguridad();
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
