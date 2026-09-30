// Efecto "vuela al pedido" al añadir un producto en el kiosco (a petición
// del cliente: que se note bien cuando algo entra en el pedido, sobre todo
// en el upsell de Complementos al finalizar).
//
// Usa la Web Animations API (element.animate) y no CSS: así funciona
// aunque el sistema del kiosco tenga activado "reducir movimiento" /
// "mostrar animaciones: desactivado" (habitual en PCs de kiosco con
// Windows), que con @media (prefers-reduced-motion) apagaría el efecto
// entero — justo lo contrario de lo que pidió el cliente.

// Destino del vuelo: dentro del upsell de Complementos, su botón
// "Finalizar pedido"; si no, el carrito lateral. Se marcan en JSX con
// data-destino-vuelo.
function buscarDestino() {
  return (
    document.querySelector(".k-upsell [data-destino-vuelo]") ||
    document.querySelector(".k-carrito[data-destino-vuelo]")
  );
}

export function rectDeFoto(elementoTarjeta) {
  const foto = elementoTarjeta?.querySelector(".k-producto-foto");
  return foto ? foto.getBoundingClientRect() : null;
}

export function volarAlPedido(imagen, rectOrigen) {
  const destino = buscarDestino();
  if (!destino || !rectOrigen || typeof document.body.animate !== "function") return;
  const rectDestino = destino.getBoundingClientRect();

  const lado = Math.min(rectOrigen.width, rectOrigen.height, 220);
  const x0 = rectOrigen.left + rectOrigen.width / 2 - lado / 2;
  const y0 = rectOrigen.top + rectOrigen.height / 2 - lado / 2;
  const dx = rectDestino.left + rectDestino.width / 2 - (x0 + lado / 2);
  const dy = rectDestino.top + Math.min(rectDestino.height / 2, 60) - (y0 + lado / 2);

  const bola = document.createElement("div");
  bola.className = "k-vuelo";
  Object.assign(bola.style, { left: `${x0}px`, top: `${y0}px`, width: `${lado}px`, height: `${lado}px` });
  if (imagen) {
    const img = document.createElement("img");
    img.src = imagen;
    img.alt = "";
    bola.appendChild(img);
  } else {
    bola.textContent = "✓";
  }
  document.body.appendChild(bola);

  // Pequeño "salto" hacia arriba antes de caer en el destino (arco), y se
  // encoge por el camino.
  const vuelo = bola.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 140}px) scale(0.85)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.9 },
    ],
    { duration: 850, easing: "cubic-bezier(.45,.05,.55,.95)", fill: "forwards" }
  );
  vuelo.onfinish = () => {
    bola.remove();
    destino.animate(
      [
        { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(87, 201, 138, 0)" },
        { transform: "scale(1.04)", boxShadow: "0 0 0 6px rgba(87, 201, 138, 0.95), 0 0 48px rgba(87, 201, 138, 0.7)" },
        { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(87, 201, 138, 0)" },
      ],
      { duration: 650, easing: "ease-out" }
    );
  };
}

// Lluvia de confeti sobre un elemento (el modal de Complementos) — piezas
// de colores de la marca que caen desde arriba.
const COLORES_CONFETI = ["#e9702f", "#f0ad4e", "#57c98a", "#f5f3f0", "#ff8f8f"];

export function lanzarConfeti(contenedor, piezas = 64) {
  if (!contenedor || typeof document.body.animate !== "function") return;
  const rect = contenedor.getBoundingClientRect();
  const capa = document.createElement("div");
  capa.className = "k-confeti";
  Object.assign(capa.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
  document.body.appendChild(capa);
  let quedan = piezas;
  for (let i = 0; i < piezas; i++) {
    const p = document.createElement("span");
    const ancho = 10 + Math.random() * 10;
    Object.assign(p.style, {
      left: `${Math.random() * 100}%`,
      width: `${ancho}px`,
      height: `${ancho * (0.4 + Math.random() * 0.8)}px`,
      background: COLORES_CONFETI[i % COLORES_CONFETI.length],
    });
    capa.appendChild(p);
    const deriva = (Math.random() - 0.5) * 160;
    const giro = (Math.random() - 0.5) * 900;
    p.animate(
      [
        { transform: "translate(0, -20px) rotate(0deg)", opacity: 1 },
        { transform: `translate(${deriva}px, ${rect.height * (0.55 + Math.random() * 0.45)}px) rotate(${giro}deg)`, opacity: 0 },
      ],
      { duration: 1100 + Math.random() * 700, delay: Math.random() * 180, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" }
    ).onfinish = () => {
      quedan -= 1;
      if (quedan === 0) capa.remove();
    };
  }
}
