import { useEffect, useRef } from "react";

// Llama a onInactivo cuando pasan `ms` milisegundos sin que nadie toque la
// pantalla (toque, clic, tecla o rueda). Cualquier interacción reinicia la
// cuenta. Con activo=false no cuenta nada (p. ej. mientras ya se está
// mostrando el salvapantallas).
const EVENTOS = ["pointerdown", "keydown", "wheel", "touchstart"];

export function useInactividad(ms, onInactivo, activo = true) {
  const callback = useRef(onInactivo);
  callback.current = onInactivo;

  useEffect(() => {
    if (!activo) return undefined;
    let id = setTimeout(() => callback.current(), ms);
    const reiniciar = () => {
      clearTimeout(id);
      id = setTimeout(() => callback.current(), ms);
    };
    EVENTOS.forEach((e) => window.addEventListener(e, reiniciar, { passive: true, capture: true }));
    return () => {
      clearTimeout(id);
      EVENTOS.forEach((e) => window.removeEventListener(e, reiniciar, { capture: true }));
    };
  }, [ms, activo]);
}
