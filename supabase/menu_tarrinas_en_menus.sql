-- Pedido del cliente (14/10/2026): en los menús con patatas, después de
-- "¿Salsa en tus patatas?", preguntar "¿Agregar tarrinas de salsa?" y, si
-- dice que sí, desplegar las tarrinas: blanca, roja y picante, +1 € cada
-- una (las mismas que ya se venden con las patatas sueltas).
--
--  * "¿Agregar tarrinas de salsa?": No, gracias (marcado) / Sí. Solo
--    aparece con "En menú". No sale en el ticket (ocultarEnTexto): lo que
--    sale son las tarrinas elegidas.
--  * "Tarrinas de salsa aparte": solo aparece si se eligió "Sí". Cada
--    tarrina suma +1 € y sale en el ticket ("Tarrina Salsa picante").
--
-- ORDEN: desplegar primero el código (que ya sabe ocultar el paso
-- "¿Agregar tarrinas?" del ticket y encadenar los pasos) y después
-- ejecutar esto. Seguro de re-ejecutar (no duplica los pasos).

update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select
      jsonb_build_object(
        'id', 'quiere-tarrinas',
        'tipo', 'unica',
        'titulo', '¿Agregar tarrinas de salsa?',
        'nota', 'Tarrinas aparte, +1 € cada una',
        'maxSeleccion', 1,
        'ocultarEnTexto', true,
        'opciones', jsonb_build_array(
          jsonb_build_object('id', 'no', 'nombre', 'No, gracias', 'nombreEn', 'No, thanks', 'porDefecto', true, 'precioExtra', 0),
          jsonb_build_object('id', 'si', 'nombre', 'Sí, agregar tarrinas', 'nombreEn', 'Yes, add sauce pots', 'porDefecto', false, 'precioExtra', 0)
        ),
        'mostrarSi', jsonb_build_object('paso', 'menu', 'opcion', 'en-menu')
      ),
      pos,
      1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'salsa-patatas'
    union all
    select
      jsonb_build_object(
        'id', 'tarrinas-menu',
        'tipo', 'multiple',
        'titulo', 'Tarrinas de salsa aparte',
        'nota', '+1 € cada una',
        'opciones', jsonb_build_array(
          jsonb_build_object('id', 'tarrina-blanca', 'nombre', 'Tarrina Salsa de yogurt (Blanca)', 'porDefecto', false, 'precioExtra', 1),
          jsonb_build_object('id', 'tarrina-roja', 'nombre', 'Tarrina Salsa de tomate (Roja)', 'porDefecto', false, 'precioExtra', 1),
          jsonb_build_object('id', 'tarrina-picante', 'nombre', 'Tarrina Salsa picante', 'porDefecto', false, 'precioExtra', 1)
        ),
        'mostrarSi', jsonb_build_object('paso', 'quiere-tarrinas', 'opcion', 'si')
      ),
      pos,
      2
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'salsa-patatas'
  ) t
)
where exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsa-patatas')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'quiere-tarrinas');

-- Comprobación (solo lectura): los tres números tienen que coincidir.
select
  count(*) filter (where exists (select 1 from jsonb_array_elements(modificadores) s where s->>'id' = 'salsa-patatas')) as menus_con_salsa_patatas,
  count(*) filter (where exists (select 1 from jsonb_array_elements(modificadores) s where s->>'id' = 'quiere-tarrinas')) as con_pregunta_tarrinas,
  count(*) filter (where exists (select 1 from jsonb_array_elements(modificadores) s where s->>'id' = 'tarrinas-menu')) as con_tarrinas
from menu_productos;
