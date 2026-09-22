-- Solo lectura. Devuelve el JSON de modificadores actual de cada
-- producto de estas 9 categorías, para añadir el paso "¿En menú o no?"
-- sin duplicar ni pisar lo que ya tienen (quitar ingredientes, salsas,
-- extras...).
select c.nombre as categoria, p.id, p.modificadores
from menu_productos p
join menu_categorias c on c.id = p.categoria_id
where c.nombre in (
  'Kebab', 'Dürüm', 'Lahmacum', 'Hamburguesas', 'Perrito caliente',
  'Pollo asado', 'Ensaladas', 'Platos combinados', 'Zona crujiente'
)
order by c.orden, p.orden;
