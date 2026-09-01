export default function SelectorIdioma({ idioma, onCambiar, className = "" }) {
  return (
    <div className={`selector-idioma ${className}`}>
      <button
        type="button"
        className={idioma === "es" ? "activo" : ""}
        onClick={() => onCambiar("es")}
      >
        ES
      </button>
      <button
        type="button"
        className={idioma === "en" ? "activo" : ""}
        onClick={() => onCambiar("en")}
      >
        EN
      </button>
    </div>
  );
}
