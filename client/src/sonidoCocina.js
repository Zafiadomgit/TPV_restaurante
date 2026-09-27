// Aviso sonoro de "pedido nuevo" en cocina — a petición del cliente,
// tipo "pip" o "tin tin". Sintetizado con Web Audio API (dos tonos
// cortos tipo timbre) en vez de un archivo de audio: no hay que alojar
// ni cargar ningún .mp3/.wav, y suena igual en cualquier dispositivo.
let contexto = null;

function getContexto() {
  if (!contexto) {
    const AudioContextClase = window.AudioContext || window.webkitAudioContext;
    contexto = new AudioContextClase();
  }
  return contexto;
}

// Los navegadores bloquean el audio hasta que hay una interacción real
// del usuario en la página — se llama una vez al montar la pantalla de
// cocina, en el primer toque/clic que haga el cocinero.
export function desbloquearSonido() {
  const ctx = getContexto();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

function tono(ctx, frecuencia, inicio, duracion) {
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  oscilador.type = "sine";
  oscilador.frequency.value = frecuencia;
  ganancia.gain.setValueAtTime(0, ctx.currentTime + inicio);
  ganancia.gain.linearRampToValueAtTime(0.35, ctx.currentTime + inicio + 0.02);
  ganancia.gain.linearRampToValueAtTime(0, ctx.currentTime + inicio + duracion);
  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);
  oscilador.start(ctx.currentTime + inicio);
  oscilador.stop(ctx.currentTime + inicio + duracion);
}

export function reproducirSonidoNuevoPedido() {
  try {
    const ctx = getContexto();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    // "Tin, tin" — dos tonos cortos ascendentes.
    tono(ctx, 880, 0, 0.15);
    tono(ctx, 1318.5, 0.18, 0.18);
  } catch {
    // Si el navegador bloquea el audio (sin interacción todavía), no
    // rompe el resto de la pantalla — la comanda nueva igual aparece.
  }
}
