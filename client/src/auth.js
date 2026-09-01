const STORAGE_KEY = "tpv_sesion";
const EVENTO = "tpv:sesion";

export function getSesion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const sesion = JSON.parse(raw);
    if (!sesion?.rol || !sesion?.token) return null;
    return sesion;
  } catch {
    return null;
  }
}

export function guardarSesion(rol, token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ rol, token }));
  window.dispatchEvent(new Event(EVENTO));
}

export function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENTO));
}

export function onSesionCambio(callback) {
  window.addEventListener(EVENTO, callback);
  return () => window.removeEventListener(EVENTO, callback);
}
