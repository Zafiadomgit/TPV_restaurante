const STORAGE_KEY = "tpv_idioma";

export function getIdioma() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "es";
  } catch {
    return "es";
  }
}

export function guardarIdioma(idioma) {
  try {
    localStorage.setItem(STORAGE_KEY, idioma);
  } catch {
    // localStorage no disponible (modo privado, etc.) — el idioma solo
    // dura mientras esté abierta la pestaña, sin persistir.
  }
}
