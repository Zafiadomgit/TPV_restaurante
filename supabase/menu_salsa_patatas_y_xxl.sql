-- Pedido del cliente (14/10/2026):
--  1. Menú de la Hamburguesa XXL a 9,50 € (antes 8,50 €).
--  2. "Poner si quieren salsa o no en las patatas fritas de todos los menús":
--     paso nuevo "¿Salsa en tus patatas?" justo después de "Tus patatas", en
--     todos los productos que tienen ese paso (los menús con patatas). Solo
--     aparece al elegir "En menú" (mismo mostrarSi que "Tus patatas").
--     Mismas salsas que las patatas sueltas (blanca, roja, picante), gratis.
--     Sin ninguna marcada por defecto, para que el ticket de cocina lo diga
--     SIEMPRE: "Salsa blanca en patatas", ... o "Patatas sin salsa".
--     Los platos combinados no tienen paso de patatas (su menú es solo
--     + bebida), así que no cambian.
--
-- No toca el código: se puede ejecutar ya. Seguro de re-ejecutar (no
-- duplica el paso si ya está).

-- 1. Hamburguesa XXL en menú: 9,50 €
update menu_productos
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'menu' then
        jsonb_set(
          paso,
          '{opciones}',
          (
            select jsonb_agg(
              case
                when opcion->>'id' = 'en-menu' then opcion || '{"precioBase": 9.5}'::jsonb
                else opcion
              end
              order by ord
            )
            from jsonb_array_elements(paso->'opciones') with ordinality as o(opcion, ord)
          )
        )
      else paso
    end
    order by pos
  )
  from jsonb_array_elements(modificadores) with ordinality as p(paso, pos)
)
where id = 'hamburguesa-xxl';

-- 2. Paso "¿Salsa en tus patatas?" después de "Tus patatas"
update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select
      jsonb_build_object(
        'id', 'salsa-patatas',
        'tipo', 'multiple',
        'titulo', '¿Salsa en tus patatas?',
        'nota', 'Elige las que quieras, o ninguna',
        'opciones', jsonb_build_array(
          jsonb_build_object('id', 'salsa-blanca', 'nombre', 'Salsa blanca en patatas', 'porDefecto', false, 'precioExtra', 0),
          jsonb_build_object('id', 'salsa-roja', 'nombre', 'Salsa roja en patatas', 'porDefecto', false, 'precioExtra', 0),
          jsonb_build_object('id', 'salsa-picante', 'nombre', 'Salsa picante en patatas', 'porDefecto', false, 'precioExtra', 0)
        ),
        'mostrarSi', jsonb_build_object('paso', 'menu', 'opcion', 'en-menu'),
        'textoSiVacio', 'Patatas sin salsa'
      ),
      pos,
      1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'tipo-patatas'
  ) t
)
where exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'tipo-patatas')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsa-patatas');

-- Comprobaciones (solo lectura):
-- a) XXL: tiene que salir solo = 7 y en-menu = 9.5
select o->>'id' as opcion, o->>'precioBase' as precio
from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
where p.id = 'hamburguesa-xxl' and s->>'id' = 'menu';
-- b) menús con patatas y con el paso nuevo: los dos números tienen que coincidir
select
  count(*) filter (where exists (select 1 from jsonb_array_elements(modificadores) s where s->>'id' = 'tipo-patatas')) as menus_con_patatas,
  count(*) filter (where exists (select 1 from jsonb_array_elements(modificadores) s where s->>'id' = 'salsa-patatas')) as menus_con_salsa_patatas
from menu_productos;
