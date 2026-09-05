-- Reorganización de carta: categorías nuevas + orden del kiosco
-- (de izquierda a derecha, arriba): Menús, Doner Kebab, Dürüm, Lahmacun,
-- Pedratas, Patatas, Platos combinados, Complementos, Zona crujiente,
-- Pizzas caseras, Hamburguesas, Perrito caliente, Pollo asado, Ensaladas,
-- Bebidas, Salsas.
-- No se renombra ninguna categoría existente (los nombres entre paréntesis
-- del pedido del cliente son solo aclaraciones, no nombres nuevos) — solo
-- se reordenan y se crean las categorías nuevas. "Especialidades" y
-- "Patatas y snacks" desaparecen: sus productos se reparten en las
-- categorías nuevas (ver script 2).
-- Seguro de re-ejecutar.

insert into menu_categorias (nombre, orden) values
  ('Pedratas', 4),
  ('Patatas', 5),
  ('Complementos', 7),
  ('Zona crujiente', 8),
  ('Hamburguesas', 10),
  ('Perrito caliente', 11),
  ('Pollo asado', 12)
on conflict (nombre) do nothing;

update menu_categorias set orden = 0 where nombre = 'Haz tu menú';
update menu_categorias set orden = 1 where nombre = 'Kebab';
update menu_categorias set orden = 2 where nombre = 'Dürüm';
update menu_categorias set orden = 3 where nombre = 'Lahmacum';
update menu_categorias set orden = 4 where nombre = 'Pedratas';
update menu_categorias set orden = 5 where nombre = 'Patatas';
update menu_categorias set orden = 6 where nombre = 'Platos combinados';
update menu_categorias set orden = 7 where nombre = 'Complementos';
update menu_categorias set orden = 8 where nombre = 'Zona crujiente';
update menu_categorias set orden = 9 where nombre = 'Pizzas';
update menu_categorias set orden = 10 where nombre = 'Hamburguesas';
update menu_categorias set orden = 11 where nombre = 'Perrito caliente';
update menu_categorias set orden = 12 where nombre = 'Pollo asado';
update menu_categorias set orden = 13 where nombre = 'Ensaladas';
update menu_categorias set orden = 14 where nombre = 'Bebidas';
update menu_categorias set orden = 15 where nombre = 'Salsas';
