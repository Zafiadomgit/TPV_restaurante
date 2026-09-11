-- Segundo lote de fotos de producto — esta vez el cliente mandó los
-- archivos ya etiquetados por plato, sin ambigüedad. Cubre 8 de los 9
-- productos de "Platos combinados" (falta "Plato doble", sin foto en
-- este lote) y una foto nueva de reemplazo para "alitas-pollo" (Zona
-- crujiente) — mismo archivo `alitas-pollo.webp` de siempre, solo se
-- sustituyó el contenido, así que no hace falta tocar ninguna fila para
-- esa.
--
-- Optimizadas igual que el primer lote (WebP, 600px de ancho,
-- ~30-60KB cada una — los originales pesaban 250-450KB).
--
-- Nota: la foto de "Plato de arroz" (id plato-arroz-carne) muestra arroz
-- de verdad, no ensalada — la descripción guardada en la base de datos
-- ("Lechuga, tomate, cebolla, repollo y zanahoria...") está mal, es un
-- copia-pega del resto de platos. No se corrige aquí (es un cambio de
-- contenido, no de fotos) — confírmalo con el cliente si quieres que se
-- actualice también el texto.
--
-- No es un cambio de esquema (imagen_url ya existe desde
-- menu_imagenes.sql), así que no aplica la regla de "SQL antes que el
-- código" — es un script de datos normal, seguro de ejecutar cuando
-- quieras.
--
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/plato-falafel.webp' where id = 'plato-falafel';
update menu_productos set imagen_url = '/menu/plato-carne-queso.webp' where id = 'plato-carne-queso';
update menu_productos set imagen_url = '/menu/plato-arroz-carne.webp' where id = 'plato-arroz-carne';
update menu_productos set imagen_url = '/menu/plato-solo-carne.webp' where id = 'plato-solo-carne';
update menu_productos set imagen_url = '/menu/plato-mixto.webp' where id = 'plato-mixto';
update menu_productos set imagen_url = '/menu/plato-pollo.webp' where id = 'plato-pollo';
update menu_productos set imagen_url = '/menu/plato-ternera.webp' where id = 'plato-ternera';
update menu_productos set imagen_url = '/menu/plato-solo-carne-queso.webp' where id = 'plato-solo-carne-queso';
