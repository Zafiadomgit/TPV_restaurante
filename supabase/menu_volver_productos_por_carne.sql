-- Pedido del cliente (21/10/2026): en la carta vuelven a salir los
-- productos por carne, como estaban antes (Kebab de ternera, de pollo,
-- mixto, solo carne; igual en Dürüm, Lahmacum y Platos combinados), en vez
-- del producto único con "Elige la carne".
--
--  * Se vuelven a activar los productos de antes (no se habían borrado):
--    conservan sus precios, el Doble en Extras, las salsas obligatorias,
--    las tarrinas y las fotos.
--  * Se ocultan los productos únicos "Kebab", "Dürüm", "Lahmacum" y "Plato
--    combinado" (no se borran: se pueden reactivar desde la Carta).
--  * Los "loco" y el plato de arroz con carne siguen pidiendo la carne
--    (antes no tenían variantes por carne).
--
-- Seguro de re-ejecutar.

begin;

update menu_productos
set activo = true
where id in (
  'kebab-ternera', 'kebab-pollo', 'kebab-mixto', 'kebab-solo-carne',
  'durum-ternera', 'durum-pollo', 'durum-mixto', 'durum-solo-carne',
  'lahmacum-ternera', 'lahmacum-pollo', 'lahmacum-mixto', 'lahmacum-solo-carne',
  'plato-ternera', 'plato-pollo', 'plato-mixto', 'plato-solo-carne', 'plato-solo-carne-queso'
);

update menu_productos
set activo = false
where id in ('kebab', 'durum', 'lahmacum', 'plato-combinado');

commit;

-- Comprobación (solo lectura): lo que se ve ahora en cada categoría.
select c.nombre as categoria, string_agg(p.nombre || ' ' || p.precio || '€', ' · ' order by p.orden, p.nombre) as productos
from menu_productos p join menu_categorias c on c.id = p.categoria_id
where p.activo and c.nombre in ('Kebab', 'Dürüm', 'Lahmacum', 'Platos combinados')
group by c.nombre, c.orden order by c.orden;
