-- Pedido del cliente (19/10/2026):
--  1. Lahmacum: fotos nuevas de menú (lahmacum + patatas + bebida) en la
--     opción "Menú" de cada lahmacum.
--  2. Tiras de pollo y Nuggets: opción de MENÚ a 9 € con ensalada incluida
--     y bebida (la ensalada se puede quitar: "Sin ensalada"). Solos siguen
--     a 7 € con la ensalada opcional a +2,50 €, como hasta ahora.
--  3. Zona crujiente (alitas, nuggets, palomitas, tiras): "¿Salsa en tus
--     patatas?" obligatorio (blanca / roja / picante / sin salsa), como en
--     los menús. Y "Salsas" si algún producto no lo tuviera.
--
-- ORDEN: desplegar primero el código (las fotos tienen que estar
-- publicadas) y después ejecutar esto. Seguro de re-ejecutar.

begin;

-- 1. Fotos de menú del lahmacum
with fotos(id, foto) as (
  values
    ('lahmacum', '/menu/combo-lahmacum-mixto.webp'),
    ('lahmacum-mixto', '/menu/combo-lahmacum-mixto.webp'),
    ('lahmacum-ternera', '/menu/combo-lahmacum-ternera.webp'),
    ('lahmacum-pollo', '/menu/combo-lahmacum-pollo.webp'),
    ('lahmacum-falafel', '/menu/combo-lahmacum-falafel.webp'),
    ('lahmacum-vegetal-queso', '/menu/combo-lahmacum-vegetal-queso.webp'),
    ('lahmacum-loco', '/menu/combo-lahmacum-loco.webp'),
    ('lahmacum-solo-carne', '/menu/combo-lahmacum-solo-carne.webp')
)
update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'menu' then
        jsonb_set(paso, '{opciones}', (
          select jsonb_agg(
            case when opcion->>'id' = 'en-menu' then opcion || jsonb_build_object('imagen', f.foto) else opcion end
            order by ord)
          from jsonb_array_elements(paso->'opciones') with ordinality as o(opcion, ord)))
      else paso
    end
    order by pos)
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
from fotos f
where p.id = f.id
  and exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'menu');

-- 2. Menú de tiras y nuggets (9 €: ensalada incluida + bebida)
update menu_productos p
set modificadores =
  -- ¿Cómo lo quieres?
  jsonb_build_array(jsonb_build_object(
    'id', 'menu', 'tipo', 'unica', 'titulo', '¿Cómo lo quieres?',
    'maxSeleccion', 1, 'esSelectorTamano', true,
    'opciones', jsonb_build_array(
      jsonb_build_object('id', 'solo', 'nombre', 'Solo', 'porDefecto', true, 'precioBase', p.precio),
      jsonb_build_object('id', 'en-menu', 'nombre', 'Menú (ensalada + bebida)', 'nombreEn', 'Meal (salad + drink)', 'porDefecto', false, 'precioBase', 9)
    )))
  -- Solo: ensalada opcional +2,50 y sus "quitar" (como antes)
  || coalesce((select jsonb_agg(s || '{"mostrarSi": {"paso": "menu", "opcion": "solo"}}'::jsonb)
               from jsonb_array_elements(p.modificadores) s where s->>'id' = 'ensalada'), '[]'::jsonb)
  || coalesce((select jsonb_agg(s) from jsonb_array_elements(p.modificadores) s where s->>'id' = 'quitar'), '[]'::jsonb)
  -- Menú: ensalada incluida, se puede quitar
  || jsonb_build_array(jsonb_build_object(
       'id', 'ensalada-menu', 'tipo', 'unica', 'titulo', 'Ensalada incluida',
       'maxSeleccion', 1, 'siempreEnTexto', true,
       'mostrarSi', jsonb_build_object('paso', 'menu', 'opcion', 'en-menu'),
       'opciones', jsonb_build_array(
         jsonb_build_object('id', 'con-ensalada', 'nombre', 'Con ensalada', 'nombreEn', 'With salad', 'porDefecto', true, 'precioExtra', 0),
         jsonb_build_object('id', 'sin-ensalada', 'nombre', 'Sin ensalada', 'nombreEn', 'No salad', 'porDefecto', false, 'precioExtra', 0)
       )))
  || coalesce((select jsonb_agg(s || '{"id": "quitar-menu", "mostrarSi": {"paso": "ensalada-menu", "opcion": "con-ensalada"}}'::jsonb)
               from jsonb_array_elements(p.modificadores) s where s->>'id' = 'quitar'), '[]'::jsonb)
  -- El resto de pasos (salsas, tarrinas...) igual
  || coalesce((select jsonb_agg(s order by pos) from jsonb_array_elements(p.modificadores) with ordinality x(s, pos)
               where s->>'id' not in ('ensalada', 'quitar')), '[]'::jsonb)
  -- Bebida del menú (la misma lista que en los kebabs, Monster +2 €)
  || coalesce((select jsonb_agg(b.s) from (
                 select s from menu_productos p2, jsonb_array_elements(p2.modificadores) s
                 where s->>'id' = 'bebida' and p2.id like 'kebab%' limit 1) b), '[]'::jsonb)
where p.id in ('tiras-pollo', 'nuggets-pollo')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'menu');

-- 3a. Zona crujiente: "Salsas" si faltara (copia del de los kebabs)
update menu_productos p
set modificadores = p.modificadores || coalesce((
  select jsonb_agg(b.s) from (
    select s from menu_productos p2, jsonb_array_elements(p2.modificadores) s
    where s->>'id' = 'salsas' and p2.id like 'kebab%' limit 1) b), '[]'::jsonb)
where p.id in ('alitas-pollo', 'nuggets-pollo', 'palomitas-pollo', 'tiras-pollo')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsas');

-- 3b. Zona crujiente: "¿Salsa en tus patatas?" justo detrás de "Salsas"
update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select jsonb_build_object(
             'id', 'salsa-patatas', 'tipo', 'multiple', 'titulo', '¿Salsa en tus patatas?',
             'nota', 'Elige al menos 1 o «Sin salsa»', 'minSeleccion', 1, 'textoSiVacio', 'Patatas sin salsa',
             'opciones', jsonb_build_array(
               jsonb_build_object('id', 'salsa-blanca', 'nombre', 'Salsa blanca en patatas', 'porDefecto', false, 'precioExtra', 0),
               jsonb_build_object('id', 'salsa-roja', 'nombre', 'Salsa roja en patatas', 'porDefecto', false, 'precioExtra', 0),
               jsonb_build_object('id', 'salsa-picante', 'nombre', 'Salsa picante en patatas', 'porDefecto', false, 'precioExtra', 0),
               jsonb_build_object('id', 'sin-salsa', 'nombre', 'Patatas sin salsa', 'nombreEn', 'Fries without sauce', 'exclusiva', true, 'porDefecto', false, 'precioExtra', 0)
             )), pos, 1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'salsas'
  ) t
)
where p.id in ('alitas-pollo', 'nuggets-pollo', 'palomitas-pollo', 'tiras-pollo')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'salsa-patatas');

commit;

-- Comprobación (solo lectura): pasos de cada producto de zona crujiente.
-- Tiras y nuggets tienen que empezar por "menu" y acabar en "bebida"; los
-- cuatro tienen que llevar "salsas" y "salsa-patatas".
select p.id, p.precio,
       (select string_agg(s->>'id', ' > ' order by pos)
        from jsonb_array_elements(p.modificadores) with ordinality x(s, pos)) as pasos
from menu_productos p
where p.id in ('alitas-pollo', 'nuggets-pollo', 'palomitas-pollo', 'tiras-pollo')
order by p.id;
