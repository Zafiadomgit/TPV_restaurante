# Vídeo de bienvenida del kiosco (HyperFrames)

Composición de HyperFrames (https://github.com/heygen-com/hyperframes) del vídeo de
fondo de la pantalla de bienvenida: asador + KEBAB → hamburguesa → pizza → dürüm,
kebab y pedrata → asador + logo, 24 s en bucle, 1920×1080. Los textos y productos van
en la mitad derecha porque a la izquierda está la tarjeta de elegir idioma.

## Volver a renderizar

1. `npm i hyperframes gsap @fontsource/barlow-condensed` en una carpeta de trabajo.
2. Copiar `index.html` y crear `assets/` con:
   - `asador.mp4` ← `client/public/video/kebab-asador.mp4`
   - `hamburguesa-xxl.webp`, `pizza-carta.webp`, `durum-ternera-ia.webp`, `kebab.webp`,
     `pedratas-xxl.webp` ← `client/public/menu/`
   - `logo.svg` ← `client/public/brand/svg/logo-horizontal-color.svg`
   - `barlow-condensed-latin-{600,800}-normal.woff2` ← `@fontsource/barlow-condensed/files/`
   - `gsap.min.js` ← `gsap/dist/` (junto a `index.html`, no en assets/)
3. Necesita ffmpeg/ffprobe y Chrome headless (`HYPERFRAMES_BROWSER_PATH` si no lo encuentra).
4. `npx hyperframes render -o borrador.mp4`, y comprimir para el kiosco:
   - `ffmpeg -i borrador.mp4 -an -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart client/public/video/bienvenida.mp4`
   - `ffmpeg -i borrador.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 34 client/public/video/bienvenida.webm` (y el póster `bienvenida-poster.webp`, un fotograma)

Estado: en el kiosco desde octubre 2026 (versión borrador con fotos);
cuando lleguen los clips de Dreamina se sustituye el material de cada escena.
