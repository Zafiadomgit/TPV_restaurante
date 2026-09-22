import { t, TIPO_SERVICIO_DISPLAY } from "../textos.js";

// Barra superior de las pantallas de pedido del kiosco (categorías y
// menú): logo, tipo de servicio y tiempo de espera a la izquierda; las
// acciones de cada pantalla (idioma, volver, cancelar) llegan como hijos.
export default function KioskCabecera({ idioma, tipoServicio, tiempoEsperaMinutos, children }) {
  return (
    <header className="k-cabecera">
      <div className="k-cabecera-izq">
        <img src="/brand/svg/logo-monocromo-blanco.svg" alt="California" className="k-cabecera-logo" />
        <span className="k-chip-servicio">{TIPO_SERVICIO_DISPLAY[idioma]?.[tipoServicio]}</span>
        {tiempoEsperaMinutos != null && (
          <span className="k-cabecera-espera">
            {t(idioma, "espera")} ~{tiempoEsperaMinutos} min
          </span>
        )}
      </div>
      <div className="k-cabecera-acciones">{children}</div>
    </header>
  );
}
