-- Fotos a nivel de CATEGORÍA (en vez de por producto): no hay fotos
-- suficientes para cubrir 1x1 todos los productos, así que se reutilizan
-- las mismas 23 fotos ya subidas (ver menu_imagenes.sql) como foto
-- representativa de la categoría entera, en la rejilla de categorías del
-- kiosco. Las fotos por producto (menu_productos.imagen_url) se quedan
-- tal cual — esto es aditivo, no las sustituye.
--
-- Categorías sin foto disponible en este lote (se quedan solo con texto,
-- igual que hoy): Haz tu menú, Kebab, Lahmacum, Platos combinados,
-- Pizzas, Bebidas.
--
-- Elección de foto por categoría (1 foto representativa, criterio
-- editorial — corrígelo si el cliente prefiere otra):
--   Pedratas         -> pedratas.webp
--   Patatas          -> patatas-fritas.webp
--   Dürüm            -> durum-loco.webp (única foto de la familia kebab/dürüm/lahmacum)
--   Complementos     -> aros-cebolla.webp (de los 5 productos de la categoría: falafel, aros, samosa, cheese bites, pan kebab)
--   Zona crujiente   -> alitas-pollo.webp
--   Hamburguesas     -> hamburguesa-xxl.webp
--   Perrito caliente -> perrito-caliente.webp
--   Pollo asado      -> pollo-asado.webp
--   Ensaladas        -> ensalada-cocktail.webp
--   Salsas           -> salsas.webp
--
-- IMPORTANTE — orden de despliegue: columna SQL nueva (imagen_url), no un
-- campo de modificadores — igual que multi_sede.sql y menu_imagenes.sql,
-- este script va ANTES que el código que la usa (ver SKILL.md,
-- "Reorganización de carta — orden de despliegue").
--
-- Seguro de re-ejecutar.

alter table menu_categorias add column if not exists imagen_url text;

update menu_categorias set imagen_url = '/menu/pedratas.webp' where nombre = 'Pedratas';
update menu_categorias set imagen_url = '/menu/patatas-fritas.webp' where nombre = 'Patatas';
update menu_categorias set imagen_url = '/menu/durum-loco.webp' where nombre = 'Dürüm';
update menu_categorias set imagen_url = '/menu/aros-cebolla.webp' where nombre = 'Complementos';
update menu_categorias set imagen_url = '/menu/alitas-pollo.webp' where nombre = 'Zona crujiente';
update menu_categorias set imagen_url = '/menu/hamburguesa-xxl.webp' where nombre = 'Hamburguesas';
update menu_categorias set imagen_url = '/menu/perrito-caliente.webp' where nombre = 'Perrito caliente';
update menu_categorias set imagen_url = '/menu/pollo-asado.webp' where nombre = 'Pollo asado';
update menu_categorias set imagen_url = '/menu/ensalada-cocktail.webp' where nombre = 'Ensaladas';
update menu_categorias set imagen_url = '/menu/salsas.webp' where nombre = 'Salsas';
