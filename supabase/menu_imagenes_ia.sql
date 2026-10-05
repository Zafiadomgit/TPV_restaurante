-- Fotos de producto generadas con IA (ChatGPT) a partir de los ingredientes
-- de cada producto en la carta, con el fondo quitado y encuadradas como el
-- resto (instrucciones usadas: docs/prompts-fotos-ia.md). Se van añadiendo
-- según llegan.
--
-- ORDEN: desplegar primero el código (las imágenes tienen que existir en
-- client/public/menu/) y después ejecutar esto. Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/ensalada-california.webp' where id = 'ensalada-california';

-- Comprobación (solo lectura).
select id, imagen_url from menu_productos
where id in ('ensalada-california')
order by id;
