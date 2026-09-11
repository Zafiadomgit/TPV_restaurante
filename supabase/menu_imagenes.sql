-- Fotos de producto que mandó el cliente (2 lotes de imágenes, 23
-- archivos). Cubren Zona crujiente, Complementos, Hamburguesas, Perrito
-- caliente, Pollo asado, Patatas, Pedratas, Salsas y 2 de las 3
-- ensaladas — más "Dürüm loco", la única foto suelta de la familia
-- kebab/dürüm/lahmacum en este lote. El resto de productos se queda sin
-- imagen (imagen_url en null) hasta que el cliente mande más fotos.
--
-- Las imágenes ya están optimizadas (WebP, 600px de ancho, ~40-100KB
-- cada una — los originales pesaban 1,5-3MB cada uno) y viven en
-- client/public/menu/ — se sirven como estáticos de Vercel, no hace
-- falta Supabase Storage para esto.
--
-- Varios productos comparten una misma imagen porque el cliente mandó
-- una sola foto por variante de tamaño/sabor (ej. una foto de "patatas
-- fritas" para pequeña/mediana/grande, una de "pedrata" para los 4
-- tamaños, una de "salsas" para las 3 tarrinas).
--
-- Nota sobre las 2 fotos de ensalada: el cliente las mandó como
-- "derecha"/"izquierda" sin decir a qué ensalada corresponde cada una.
-- Se identificaron por los ingredientes visibles en la foto: la que
-- lleva pollo crujiente + maíz + aceitunas es literalmente la
-- descripción de "Ensalada Cocktail"; la otra (lechuga, tomate, cebolla)
-- se asignó a "Ensalada Merindades" por ser la que más ingredientes
-- comparte de las dos que quedaban. "Ensalada California" se queda sin
-- foto en este lote — confírmalo con el cliente si hace falta.
--
-- IMPORTANTE — orden de despliegue: esta es una columna SQL nueva
-- (imagen_url), no un campo dentro de modificadores — igual que
-- multi_sede.sql, este script va ANTES que el código que la usa (ver
-- SKILL.md, "Reorganización de carta — orden de despliegue").
--
-- Seguro de re-ejecutar.

alter table menu_productos add column if not exists imagen_url text;

update menu_productos set imagen_url = '/menu/alitas-pollo.webp' where id = 'alitas-pollo';
update menu_productos set imagen_url = '/menu/aros-cebolla.webp' where id = 'aros-cebolla';
update menu_productos set imagen_url = '/menu/burrito.webp' where id = 'burrito';
update menu_productos set imagen_url = '/menu/cheese-bites.webp' where id = 'cheese-bites';
update menu_productos set imagen_url = '/menu/durum-loco.webp' where id = 'durum-loco';
update menu_productos set imagen_url = '/menu/ensalada-merindades.webp' where id = 'ensalada-merindades';
update menu_productos set imagen_url = '/menu/ensalada-cocktail.webp' where id = 'ensalada-cocktail';
update menu_productos set imagen_url = '/menu/falafel-porcion.webp' where id = 'falafel-porcion';
update menu_productos set imagen_url = '/menu/hamburguesa-xxl.webp' where id = 'hamburguesa-xxl';
update menu_productos set imagen_url = '/menu/hamburguesa-pollo-crispy.webp' where id = 'hamburguesa-pollo-crispy';
update menu_productos set imagen_url = '/menu/hamburguesa-clasica.webp' where id = 'hamburguesa-clasica';
update menu_productos set imagen_url = '/menu/nuggets-pollo.webp' where id = 'nuggets-pollo';
update menu_productos set imagen_url = '/menu/palomitas-pollo.webp' where id = 'palomitas-pollo';
update menu_productos set imagen_url = '/menu/pan-kebab.webp' where id = 'pan-kebab';
update menu_productos set imagen_url = '/menu/perrito-caliente.webp' where id = 'perrito-caliente';
update menu_productos set imagen_url = '/menu/pollo-asado.webp' where id = 'pollo-asado';
update menu_productos set imagen_url = '/menu/samosa.webp' where id = 'samosa';
update menu_productos set imagen_url = '/menu/tarrina-arroz-falafel.webp' where id = 'tarrina-arroz-falafel';
update menu_productos set imagen_url = '/menu/tiras-pollo.webp' where id = 'tiras-pollo';

update menu_productos set imagen_url = '/menu/patatas-deluxe.webp'
where id in ('patatas-deluxe-pequena', 'patatas-deluxe-mediana', 'patatas-deluxe-grande');

update menu_productos set imagen_url = '/menu/patatas-fritas.webp'
where id in ('patatas-fritas-pequena', 'patatas-fritas-mediana', 'patatas-fritas-grande');

update menu_productos set imagen_url = '/menu/pedratas.webp'
where id in ('pedratas-pequena', 'pedratas-mediana', 'pedratas-grande', 'pedratas-xxl');

update menu_productos set imagen_url = '/menu/salsas.webp'
where id in ('salsa-blanca', 'salsa-roja', 'salsa-picante');
