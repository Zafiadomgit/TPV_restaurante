-- Pedido del cliente (21/10/2026):
--  1. Platos combinados: añadir "Salsas" (obligatorio: al menos 1 o "Sin
--     salsa"), igual que en kebab/dürüm/lahmacum, justo antes de Extras.
--  2. Zona crujiente: preguntar las salsas UNA sola vez (va todo junto):
--     se quita "¿Salsa en tus patatas?" y se queda solo "Salsas".
-- Seguro de re-ejecutar.

begin;

-- 1. Salsas en los platos combinados (copia del paso de los kebabs)
update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select (select s from menu_productos p2, jsonb_array_elements(p2.modificadores) s
            where s->>'id' = 'salsas' and p2.id like 'kebab%' limit 1), pos, -1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'extras'
  ) t
)
from menu_categorias c
where c.id = p.categoria_id
  and c.nombre ilike 'plato%'
  and exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'extras')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsas');

-- 2. Zona crujiente: fuera "¿Salsa en tus patatas?"
update menu_productos p
set modificadores = (
  select jsonb_agg(paso order by pos)
  from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
  where paso->>'id' <> 'salsa-patatas'
)
where p.id in ('alitas-pollo', 'nuggets-pollo', 'palomitas-pollo', 'tiras-pollo')
  and exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsa-patatas');

commit;

-- Comprobación (solo lectura): los platos tienen que llevar "salsas" antes
-- de "extras"; los de zona crujiente, "salsas" y ya no "salsa-patatas".
select c.nombre as categoria, p.id,
       (select string_agg(s->>'id', ' > ' order by pos)
        from jsonb_array_elements(p.modificadores) with ordinality x(s, pos)) as pasos
from menu_productos p join menu_categorias c on c.id = p.categoria_id
where p.activo and (c.nombre ilike 'plato%' or p.id in ('alitas-pollo', 'nuggets-pollo', 'palomitas-pollo', 'tiras-pollo'))
order by c.nombre, p.orden;
