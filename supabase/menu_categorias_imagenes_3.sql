-- Foto de categoría para "Pizzas" — la única foto que mandó el cliente
-- de pizza es genérica ("pizza grande de la carta"), no de un sabor
-- concreto, así que se usa solo como portada de la categoría entera, no
-- por producto (los 13 sabores de "Pizzas" se quedan sin foto propia
-- hasta que llegue una foto por sabor).
--
-- No es cambio de esquema (imagen_url ya existía) — script de datos
-- normal, seguro de ejecutar cuando quieras.
--
-- Siguen sin foto de categoría: Haz tu menú, Kebab, Lahmacum, Bebidas.
--
-- Seguro de re-ejecutar.

update menu_categorias set imagen_url = '/menu/pizza-carta.webp' where nombre = 'Pizzas';
