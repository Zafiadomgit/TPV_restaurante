# Checklist — cambios pedidos por el cliente (septiembre 2026)

✅ hecho y verificado · ⚠️ hecho con una nota que conviene confirmar con el cliente · ❌ pendiente de material del cliente

**Para que se vea en producción:** 1) desplegar este commit (código + fotos + vídeo), 2) **después** ejecutar
`supabase/menu_cambios_cliente_carta.sql` en el SQL Editor de Supabase, 3) ejecutar
`supabase/verificar_cambios_cliente_carta.sql` (solo lectura): repasa cada punto de carta de esta lista
contra la base de datos real y tiene que salir todo ✅ (146 comprobaciones). Sin el paso 2 no cambian ni
los precios, ni los productos, ni las fotos por producto (sí el vídeo, el fondo, pizzas, hamburguesas y el efecto al añadir).

## General (kiosco)
- ✅ ~~Cambiar fondo de pantalla por vídeo animado de productos del kebab~~ — vídeo generado con nuestras fotos (kebab, dürüm, lahmacun, pedrata, dürüm loco, kebab de falafel), WebM + MP4
- ✅ ~~Pantalla "¿Dónde vas a comer?": poner fondo~~ — collage de productos del kebab con un velo oscuro
- ✅ ~~Quitar lo de "Más pedido"~~ — la etiqueta estaba en "Para llevar", no en "Comer aquí"; se quitó (era la única que había en esa pantalla)
- ✅ ~~Al añadir producto poner algún efecto, sobre todo al finalizar pedido en complementos~~ — brillo + ráfaga en la tarjeta, botón "✓ Añadido", aviso "✓ X añadido a tu pedido", contador "✓ N añadidos" y brillo en "Finalizar pedido" dentro de Complementos

## Kebab
- ✅ ~~Poner fotos de cada kebab~~ — una foto de kebab para todos; el de falafel lleva además la ración de falafel
- ✅ ~~Quitar repollo y zanahoria / lechuga: +1 €~~ — ahora se muestra "+1,00 €" en esas dos opciones (se cobra +1 € una vez, aunque se quiten las dos, como hasta ahora). Corregido también en falafel, que sumaba solo +0,50 €
- ✅ ~~Kebab solo carne: sin verduras en la descripción~~ → "Carne + salsas"
- ✅ ~~Kebab loco: sin verduras en la descripción~~ → "Carne y patatas fritas dentro + salsas"
- ✅ ~~Kebab vegetal: queso en la descripción y "Sin queso" en quitar ingredientes~~
- ✅ ~~Menú ternera, pollo, mixto, vegetal y loco: 7,50 €~~
- ✅ ~~Menú falafel: 8 €~~
- ✅ ~~Menú doble normal: 9,50 €~~
- ✅ ~~Nuevo kebab doble solo carne: 7,50 € / menú 10 €~~
- ⚠️ Menú **kebab solo carne** no venía en la lista: se puso a 8,50 € (antes 9,50 €, que habría quedado más caro que el doble en menú)

## Dürüm
- ✅ ~~Fotos de cada dürüm~~ — dürüm normal para todos; el loco mantiene la suya; el de falafel lleva la ración de falafel
- ✅ ~~Quitar repollo y zanahoria / lechuga: +1 €~~
- ✅ ~~Dürüm solo carne: sin verduras en descripción y en quitar ingredientes~~
- ✅ ~~Dürüm loco: sin verduras en descripción y en quitar ingredientes~~
- ✅ ~~Dürüm vegetal: queso en la descripción y "Sin queso" en quitar~~
- ✅ ~~Menú ternera, pollo, mixto, vegetal y loco: 8,50 €~~
- ✅ ~~Menú falafel: 9 €~~
- ✅ ~~Menú doble normal: 10,50 €~~
- ✅ ~~Nuevo dürüm doble solo carne: 9 € / menú 11,50 €~~
- ⚠️ Menú **dürüm solo carne**: se puso a 9,50 € (no venía en la lista)

## Lahmacun
- ✅ ~~Fotos de cada lahmacun~~ — lahmacun para todos; el de falafel lleva la ración de falafel
- ✅ ~~Quitar repollo y zanahoria / lechuga: +1 €~~
- ✅ ~~Lahmacun solo carne: sin verduras en descripción y en quitar~~
- ✅ ~~Lahmacun loco: sin verduras en descripción y en quitar~~
- ✅ ~~Lahmacun vegetal: queso en la descripción y "Sin queso" en quitar~~
- ✅ ~~Menú ternera, pollo, mixto, vegetal y loco: 9,50 €~~
- ✅ ~~Menú falafel: 10 €~~
- ✅ ~~Menú doble normal: 11,50 €~~
- ✅ ~~Nuevo lahmacun doble solo carne: 9,50 € / menú 12,50 €~~
- ⚠️ Menú **lahmacun solo carne**: se puso a 10,50 € (no venía en la lista)

## Platos combinados
- ✅ ~~Plato solo carne, solo carne con queso y plato de arroz: sin verdura en descripción ni en quitar ingredientes~~
- ✅ ~~Ternera, pollo, mixto, falafel y doble: extra arroz basmati +3,50 €~~
- ✅ ~~Foto en plato doble~~
- ✅ ~~"Plato solo carne" → "Plato solo carne y patatas"~~
- ✅ ~~"Plato solo carne con queso" → "Plato solo carne con queso y patatas"~~
- ✅ ~~"Plato arroz con carne" → "Plato de arroz con carne y patatas"~~
- ✅ ~~Quitar plato de carne con queso~~ — desactivado (desaparece del kiosco y de caja; se puede reactivar desde /carta)
- ✅ ~~Nuevo plato doble solo carne y patatas: 14 € / menú 15,50 €~~
- ✅ ~~Opción de menú: quitar patatas, dejar solo + bebida~~ — "En menú (+ bebida)", precios sin cambio

## Pedratas
- ✅ ~~Cambiar fotos~~ — sin el fondo negro y el envase más grande según el tamaño (pequeña → XXL). Es la misma foto de pedrata retocada: si quieren otra foto distinta, que la manden

## Falafel
- ✅ ~~Añadir las salsas aparte~~ — tarrinas aparte +1 € cada una, como en patatas

## Zona crujiente
- ✅ ~~Quitar menú en todos menos en burrito~~
- ✅ ~~Alitas, nuggets, palomitas y tiras: "+ensalada" +2,50 € y, si se elige, quitar ingredientes~~

## Pizzas
- ✅ ~~En vez de 8 € poner los precios de los 3 tamaños~~ — Pequeña 8 € · Mediana 10 € · Familiar 14 €

## Ensaladas
- ✅ ~~Quitar opciones de menú~~

## Pollo asado
- ✅ ~~Quitar opciones de menú~~

## Salsas
- ✅ ~~Poner una tarrina en cada opción~~ — cada salsa con su tarrina sola. La roja es una composición: en la foto original sale tapada por las otras dos

## Hamburguesas
- ✅ ~~Que se vean las hamburguesas enteras~~

## Fotos que faltaban
- ✅ ~~Categorías Kebab y Lahmacun~~ (no tenían foto)
- ✅ ~~Kebab, Lahmacun y Dürüm (todos), Plato doble, Plato doble solo carne~~
- ❌ **Ensalada California** y **Bebidas**: no se pueden sacar de las fotos que hay sin inventar (latas de marca, otra ensalada). Hay que pedirle las fotos al cliente
