// Local físico donde está este dispositivo (kiosco/caja/cocina/recogida).
// Es un ajuste por DISPOSITIVO, no por sesión ni por usuario — un cajero
// que entra con su PIN en la tablet de Villarcayo debe quedar en
// Villarcayo sin tener que elegirlo cada vez, y el kiosco público (sin
// login) también necesita saberlo. Por eso vive en localStorage, igual
// que idioma.js, y no en auth.js/la sesión.
export const SEDES = {
  "medina-de-pomar": { nombre: "Medina de Pomar", direccion: "Calle Mayor, 90, 09500 Medina de Pomar, Burgos" },
  villarcayo: { nombre: "Villarcayo", direccion: "Plaza Mayor, 2, 09550 Villarcayo, Burgos" },
};

const STORAGE_KEY = "tpv_sede";

export function getSede() {
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    return SEDES[valor] ? valor : null;
  } catch {
    return null;
  }
}

export function guardarSede(sede) {
  try {
    localStorage.setItem(STORAGE_KEY, sede);
  } catch {
    // localStorage no disponible (modo privado, etc.) — el dispositivo
    // volverá a preguntar la sede en cada carga, sin persistir.
  }
}

export function borrarSede() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada que limpiar si ya no persistía
  }
}
