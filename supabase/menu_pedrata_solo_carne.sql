-- Pedido del cliente (28/10/2026): en Pedratas añadir
--   Pedrata solo carne (sin patatas) pequeña  7 €
--   Pedrata solo carne (sin patatas) mediana 12 €
--   Pedrata solo carne (sin patatas) grande  16 €
-- Mismos pasos que la pedrata de su tamaño (carne, salsas, extras); foto
-- del plato solo carne. Van detrás de la Pedrata XXL. Seguro de re-ejecutar.

begin;

insert into menu_productos
  (id, categoria_id, nombre, descripcion, nombre_en, descripcion_en, precio, modificadores, imagen_url, activo, orden)
select
  n.id, base.categoria_id, n.nombre, 'Carne de ternera, pollo o mixto y salsa, sin patatas',
  n.nombre_en, 'Beef, chicken or mixed meat and sauce, no fries',
  n.precio, base.modificadores, '/menu/plato-solo-carne.webp', true, n.orden
from (values
  ('pedrata-solo-carne-pequena', 'pedratas-pequena', 'Pedrata solo carne (sin patatas) pequeña', 'Pedrata meat only (no fries) small', 7, 4),
  ('pedrata-solo-carne-mediana', 'pedratas-mediana', 'Pedrata solo carne (sin patatas) mediana', 'Pedrata meat only (no fries) medium', 12, 5),
  ('pedrata-solo-carne-grande', 'pedratas-grande', 'Pedrata solo carne (sin patatas) grande', 'Pedrata meat only (no fries) large', 16, 6)
) as n(id, base_id, nombre, nombre_en, precio, orden)
join menu_productos base on base.id = n.base_id
on conflict (id) do update set
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  nombre_en = excluded.nombre_en,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  imagen_url = excluded.imagen_url,
  activo = true,
  orden = excluded.orden,
  actualizado_en = now();

commit;

-- Comprobación: deben salir las 3 nuevas con 7 / 12 / 16
select id, nombre, precio, activo, orden
from menu_productos
where id like 'pedrata%'
order by orden;
