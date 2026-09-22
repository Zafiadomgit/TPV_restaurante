-- Solo lectura — para que Claude pueda ver el estado REAL actual de estas
-- categorías antes de escribir el SQL que añade "¿En menú o no?". No
-- modifica nada.
select c.nombre as categoria, p.id, p.nombre as producto, p.precio, p.orden
from menu_productos p
join menu_categorias c on c.id = p.categoria_id
where c.nombre in (
  'Kebab', 'Dürüm', 'Lahmacum', 'Hamburguesas', 'Perrito caliente',
  'Pollo asado', 'Ensaladas', 'Platos combinados', 'Zona crujiente'
)
order by c.orden, p.orden;
