# Vídeo del salvapantallas del kiosco (HyperFrames)

Composición de HyperFrames (https://github.com/heygen-com/hyperframes) del vídeo que sale
como salvapantallas (`client/src/components/Salvapantallas.jsx`), 38 s en bucle, 1920×1080:

1. Cortando el döner (clip vertical a la derecha sobre su copia desenfocada) — "Recién cortado · KEBAB".
2. Montando un dürüm — "Hecho al momento · DÜRÜM · Delante de ti".
3. Enrollándolo — "Enrollado a mano · Listo para ti".
4. Hamburguesa con patatas (clip vertical recortado por abajo, a la derecha) — "Recién hechas · HAMBURGUESAS".
5. Pizza margarita, sacando una porción (clip vertical a la izquierda) — "Recién horneadas · PIZZAS · Pequeña · Mediana · Familiar".
6. Logo (sin caja de fondo) — "Kebab · Hamburguesería · Pizzería".

Los clips los aportó el dueño (vídeos de Pexels: `15318714_1080_1920_60fps.mp4`,
`5780183-hd_1280_720_24fps.mp4`, `5528069-hd_1280_720_50fps.mp4`,
`12570659_1080_1920_30fps.mp4` (hamburguesa) y `13111090_2160_3840_25fps.mp4` (pizza)).
Ojo: en la hamburguesa NO se dice "a la plancha" (el dueño no las hace a la plancha).

## Volver a renderizar

1. `npm i hyperframes gsap @fontsource/barlow-condensed` en una carpeta de trabajo.
2. Copiar `index.html`, `gsap.min.js` (de `gsap/dist/`) y crear `assets/` con:
   - `logo.svg` ← `client/public/brand/svg/logo-horizontal-transparente.svg`
   - `barlow-condensed-latin-{600,800}-normal.woff2` ← `@fontsource/barlow-condensed/files/`
   - los clips ya preparados (1920×1080, 30 fps, sin audio):
     - `corte.mp4` ← 15318714 (vertical), de 0,2 s a 7,9 s:
       `ffmpeg -ss 0.2 -t 7.7 -i 15318714_1080_1920_60fps.mp4 -an -filter_complex "[0:v]fps=30,split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=40:2,eq=brightness=-0.18:saturation=0.9[bg];[b]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=x=1150:y=0,format=yuv420p" -c:v libx264 -crf 16 corte.mp4`
     - `montaje.mp4` ← 5780183, de 1,5 s a 9,5 s:
       `ffmpeg -ss 1.5 -t 8 -i 5780183-hd_1280_720_24fps.mp4 -an -vf "scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -crf 16 -pix_fmt yuv420p montaje.mp4`
     - `hamburguesa.mp4` ← 12570659, de 9,5 s a 15,1 s (el tramo de en medio tiene la tabla vacía):
       `ffmpeg -ss 9.5 -t 5.6 -i 12570659_1080_1920_30fps.mp4 -an -filter_complex "[0:v]fps=30,split[a][b];[a]crop=1080:1100:0:820,scale=1920:-2,crop=1920:1080,boxblur=40:2,eq=brightness=-0.2:saturation=0.9[bg];[b]crop=1080:1100:0:820,scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=x=820:y=0,format=yuv420p" -c:v libx264 -crf 16 hamburguesa.mp4`
     - `pizza.mp4` ← 13111090, de 1,5 s a 8,5 s:
       `ffmpeg -ss 1.5 -t 7 -i 13111090_2160_3840_25fps.mp4 -an -filter_complex "[0:v]fps=30,split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=40:2,eq=brightness=-0.22:saturation=0.9[bg];[b]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=x=162:y=0,format=yuv420p" -c:v libx264 -crf 16 pizza.mp4`
     - `enrollado.mp4` ← 5528069, de 2,8 s a 8,8 s, quitando el tono morado:
       `ffmpeg -ss 2.8 -t 6 -i 5528069-hd_1280_720_50fps.mp4 -an -vf "colorbalance=rm=-0.02:gm=0.08:bm=-0.04:rh=0.0:gh=0.07:bh=-0.07,eq=saturation=0.92:contrast=1.04,scale=1920:1080:flags=lanczos,fps=30" -c:v libx264 -crf 16 -pix_fmt yuv420p enrollado.mp4`
3. Necesita ffmpeg/ffprobe y Chrome headless (`HYPERFRAMES_BROWSER_PATH` si no lo encuentra).
4. `npx hyperframes render -o borrador.mp4`, y comprimir para el kiosco:
   - `ffmpeg -i borrador.mp4 -an -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart client/public/video/bienvenida.mp4`
   - `ffmpeg -i borrador.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 client/public/video/bienvenida.webm`
   - póster: `ffmpeg -ss 2.5 -i borrador.mp4 -frames:v 1 -c:v libwebp -quality 80 client/public/video/bienvenida-poster.webp`
