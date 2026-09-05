const STORAGE_KEY = "tpv_sesion";
const EVENTO = "tpv:sesion";

// Nombre legible por rol, compartido por Login.jsx (selector de rol) y
// App.jsx (nav + botón de salir) para no tener el mismo mapa duplicado
// en dos sitios y que se desincronicen al añadir un rol nuevo.
export const NOMBRE_ROL = { caja: "Caja", cocina: "Cocina", panel: "Panel" };

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
