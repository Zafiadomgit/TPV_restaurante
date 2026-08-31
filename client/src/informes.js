// Duplica formatDuracion() de client/api/_lib/informes.js — mismo motivo
// que format.js/totales.js: el frontend no comparte bundle con el backend.
export function formatDuracion(segundos) {
  if (segundos === null || segundos === undefined) return "—";
  const minutos = Math.floor(segundos / 60);
  const resto = Math.round(segundos % 60);
  return `${minutos}:${String(resto).padStart(2, "0")}`;
}
