-- Segunda ronda de fotos de categoría: con el lote de "Platos
-- combinados" (ver menu_imagenes_2.sql) ya se puede cubrir esa
-- categoría, que se había quedado sin foto en menu_categorias_imagenes.sql
-- por falta de fotos disponibles en ese momento.
--
-- Plato de ternera (plato-ternera.webp) como representativa — es el
-- primero de los 9 platos de la categoría (orden 0).
--
-- Siguen sin foto: Haz tu menú, Kebab, Lahmacum, Pizzas, Bebidas — no
-- hay ninguna foto del cliente que encaje todavía.
--
-- No es cambio de esquema (imagen_url ya existía desde
-- menu_categorias_imagenes.sql) — script de datos normal, seguro de
-- ejecutar cuando quieras.
--
-- Seguro de re-ejecutar.

update menu_categorias set imagen_url = '/menu/plato-ternera.webp' where nombre = 'Platos combinados';
