-- Pedido del cliente (14/10/2026): en la personalización, las salsas
-- tienen que elegirse — "al menos 1 o sin salsa" — y no se puede avanzar
-- sin elegir.
--
-- En los pasos "Salsas" y "¿Salsa en tus patatas?" de todos los productos:
--  * minSeleccion = 1: el kiosco y la caja no dejan avanzar ni añadir al
--    pedido hasta marcar algo.
--  * Opción nueva "Sin salsa" (exclusiva: al marcarla se desmarcan las
--    demás y al revés), gratis.
--  * Ninguna salsa marcada de antemano (antes venían blanca y roja
--    marcadas), para que el cliente elija de verdad.
--  * Nota en pantalla: "Elige al menos 1 o «Sin salsa»".
-- El ticket de cocina sigue diciendo siempre qué salsas lleva o "Sin salsa"
-- / "Patatas sin salsa". No cambia ningún precio.
-- "Tarrinas de salsa aparte" sigue siendo opcional (no se toca).
--
-- ORDEN: desplegar primero el código (ya está en producción) y después
-- ejecutar esto. Seguro de re-ejecutar (no duplica "Sin salsa").

update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' in ('salsas', 'salsa-patatas') then
        (paso - 'nota')
        || jsonb_build_object(
             'minSeleccion', 1,
             'nota', 'Elige al menos 1 o «Sin salsa»',
             'opciones',
             (
               select jsonb_agg(opcion || '{"porDefecto": false}'::jsonb order by ord)
               from jsonb_array_elements(paso->'opciones') with ordinality as o(opcion, ord)
               where opcion->>'id' <> 'sin-salsa'
             )
             || jsonb_build_array(
                  jsonb_build_object(
                    'id', 'sin-salsa',
                    'nombre', case when paso->>'id' = 'salsa-patatas' then 'Patatas sin salsa' else 'Sin salsa' end,
                    'nombreEn', case when paso->>'id' = 'salsa-patatas' then 'Fries without sauce' else 'No sauce' end,
                    'exclusiva', true,
                    'porDefecto', false,
                    'precioExtra', 0
                  )
                )
           )
      else paso
    end
    order by pos
  )
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
where exists (
  select 1 from jsonb_array_elements(p.modificadores) s
  where s->>'id' in ('salsas', 'salsa-patatas')
);

-- Comprobación (solo lectura): cada fila tiene que salir con
-- min_seleccion = 1, tiene_sin_salsa = true y marcadas_por_defecto = 0.
select s->>'id' as paso,
       s->>'minSeleccion' as min_seleccion,
       bool_and(exists (select 1 from jsonb_array_elements(s->'opciones') o where o->>'id' = 'sin-salsa')) as tiene_sin_salsa,
       sum((select count(*) from jsonb_array_elements(s->'opciones') o where (o->>'porDefecto')::boolean)) as marcadas_por_defecto,
       count(*) as productos
from menu_productos p, jsonb_array_elements(p.modificadores) s
where s->>'id' in ('salsas', 'salsa-patatas')
group by 1, 2;
