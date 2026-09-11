-- Cuarto lote de fotos de producto: 6 de los 13 productos de "Haz tu
-- menú" (perrito, dürüm, burrito, döner kebab, lahmacum, hamburguesa).
-- El cliente mandó 2 fotos de la hamburguesa (vacuno y pollo crispy),
-- pero "menu-hamburguesa" es un solo producto con un paso "Elige tu
-- hamburguesa" para elegir entre las dos por dentro — se usa la foto de
-- vacuno porque es la opción por defecto (porDefecto:true).
--
-- También se usa la foto de "Menu doner kebab" como portada de la
-- categoría "Haz tu menú" en el kiosco, que se había quedado pendiente
-- por falta de foto.
--
-- Siguen sin foto de producto en "Haz tu menú": menu-alitas,
-- menu-nuggets, menu-pizza-variada-{pequena,mediana}, menu-plato-arroz,
-- menu-plato-ternera-pollo, menu-tiras-pollo.
-- Siguen sin foto de categoría: Kebab, Lahmacum, Bebidas.
--
-- No es cambio de esquema (imagen_url ya existía en menu_productos y
-- menu_categorias) — script de datos normal, seguro de ejecutar cuando
-- quieras.
--
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/menu-perrito.webp' where id = 'menu-perrito';
update menu_productos set imagen_url = '/menu/menu-durum.webp' where id = 'menu-durum';
update menu_productos set imagen_url = '/menu/menu-burrito.webp' where id = 'menu-burrito';
update menu_productos set imagen_url = '/menu/menu-doner-kebab.webp' where id = 'menu-doner-kebab';
update menu_productos set imagen_url = '/menu/menu-lahmacum.webp' where id = 'menu-lahmacum';
update menu_productos set imagen_url = '/menu/menu-hamburguesa.webp' where id = 'menu-hamburguesa';

update menu_categorias set imagen_url = '/menu/menu-doner-kebab.webp' where nombre = 'Haz tu menú';
