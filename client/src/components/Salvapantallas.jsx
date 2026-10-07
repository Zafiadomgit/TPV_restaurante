// Salvapantallas del kiosco: el vídeo de bienvenida (montado con
// HyperFrames, fuente en docs/video-bienvenida/) a pantalla completa. Sale
// al abrir el kiosco y tras un rato sin que nadie toque la pantalla; se
// quita con el primer toque, que solo lo cierra (no "atraviesa" hasta el
// botón que haya debajo). WebM (VP9) primero y MP4 (H.264) de respaldo; el
// póster es un fotograma, para que no haya un hueco negro mientras carga.
const VIDEO_WEBM = "/video/bienvenida.webm";
const VIDEO_MP4 = "/video/bienvenida.mp4";
const POSTER = "/video/bienvenida-poster.webp";

export default function Salvapantallas({ onCerrar, textoToca }) {
  return (
    <div
      className="k-salvapantallas"
      role="button"
      tabIndex={0}
      aria-label={textoToca}
      onClick={onCerrar}
      onKeyDown={onCerrar}
    >
      <video className="k-salvapantallas-video" poster={POSTER} autoPlay muted loop playsInline aria-hidden="true">
        <source src={VIDEO_WEBM} type="video/webm" />
        <source src={VIDEO_MP4} type="video/mp4" />
      </video>
      <p className="k-salvapantallas-toca">{textoToca}</p>
    </div>
  );
}
