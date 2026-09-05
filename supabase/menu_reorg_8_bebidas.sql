-- Reorganización de carta: reemplazo completo de Bebidas. Se
-- quita el Ayran (a petición del cliente), el "Refresco (lata)" genérico
-- y la "Bebida energética" genérica, y se sustituyen por la lista nueva
-- con nombres concretos.
-- Seguro de re-ejecutar.

delete from menu_productos where id in ('refresco-lata', 'agua', 'bebida-energetica', 'ayran');

insert into menu_productos (id, categoria_id, nombre, descripcion, precio, modificadores, orden)
select v.id, c.id, v.nombre, v.descripcion, v.precio, null, v.orden
from (values
  ('coca-cola', 'Coca-Cola', '33cl', 1.8, 0),
  ('coca-cola-cero', 'Coca-Cola 0', '33cl', 1.8, 1),
  ('aquarius-limon', 'Aquarius limón', '33cl', 1.8, 2),
  ('fuze-tea', 'Fuze Tea', '33cl', 1.8, 3),
  ('zumo-tropical', 'Zumo tropical', '33cl', 1.8, 4),
  ('fanta-naranja', 'Fanta naranja', '33cl', 1.8, 5),
  ('monster', 'Monster', '33cl', 3, 6),
  ('agua-33cl', 'Agua', '33cl', 1, 7)
) as v(id, nombre, descripcion, precio, orden)
join menu_categorias c on c.nombre = 'Bebidas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
