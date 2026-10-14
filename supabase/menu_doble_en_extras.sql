-- Pedido del cliente (14/10/2026):
--  1. Kebab, Dürüm y Lahmacum: quitar de la carta los "doble" y "doble
--     solo carne"; en su lugar, en Extras de cada uno, "Doble" +2,50 €.
--  2. Platos combinados: quitar los "doble"; en Extras de cada plato,
--     "Doble" +4 €.
--  3. Kebab de ternera y Kebab de pollo: la foto del Kebab mixto.
--  4. En "¿Cómo lo quieres?": "Menú (patatas + bebida)" en vez de "En menú
--     (patatas + bebida)" (y "Menú (+ bebida)" en los platos), en todos.
--  5. Pedratas: "Elige la carne" obligatorio — sin elegir carne no se puede
--     añadir al pedido y se marca en rojo (como las salsas). Ninguna carne
--     marcada de antemano.
--
-- Los doble NO se borran: se desactivan (activo = false), así los pedidos
-- antiguos siguen intactos y se pueden volver a activar desde la Carta.
-- No hace falta desplegar nada antes. Seguro de re-ejecutar.

-- 1 y 2. Quitar los doble de la carta
update menu_productos
set activo = false
where id in (
  'kebab-doble', 'kebab-doble-solo-carne',
  'durum-doble', 'durum-doble-solo-carne',
  'lahmacum-doble', 'lahmacum-doble-solo-carne',
  'plato-doble', 'plato-doble-solo-carne'
);

-- 1 y 2. "Doble" en Extras (+2,50 € kebab/dürüm/lahmacum, +4 € platos)
update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'extras' then
        jsonb_set(
          paso,
          '{opciones}',
          (paso->'opciones') || jsonb_build_array(jsonb_build_object(
            'id', 'doble',
            'nombre', 'Doble',
            'nombreEn', 'Double',
            'porDefecto', false,
            'precioExtra', case when c.nombre ilike 'plato%' then 4 else 2.5 end
          ))
        )
      else paso
    end
    order by pos
  )
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
from menu_categorias c
where c.id = p.categoria_id
  and (c.nombre in ('Kebab', 'Dürüm', 'Lahmacum') or c.nombre ilike 'plato%')
  and p.activo
  and exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'extras')
  and not exists (
    select 1 from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
    where s->>'id' = 'extras' and o->>'id' = 'doble'
  );

-- 3. Foto del kebab mixto en ternera y pollo
update menu_productos
set imagen_url = (select imagen_url from menu_productos where id = 'kebab-mixto')
where id in ('kebab-ternera', 'kebab-pollo');

-- 4. "Menú" en vez de "En menú"
update menu_productos p
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
                when opcion->>'nombre' like 'En menú%'
                  then jsonb_set(opcion, '{nombre}', to_jsonb('Menú' || substr(opcion->>'nombre', 8)))
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
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
where exists (
  select 1 from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
  where s->>'id' = 'menu' and o->>'nombre' like 'En menú%'
);

-- 5. Pedratas: carne obligatoria, sin ninguna marcada de antemano
update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'carne' then
        paso
        || jsonb_build_object(
             'minSeleccion', 1,
             'siempreEnTexto', true,
             'nota', 'Elige 1 carne',
             'opciones',
             (
               select jsonb_agg(opcion || '{"porDefecto": false}'::jsonb order by ord)
               from jsonb_array_elements(paso->'opciones') with ordinality as o(opcion, ord)
             )
           )
      else paso
    end
    order by pos
  )
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
where exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'carne');

-- Comprobaciones (solo lectura)
-- a) "Doble" en extras: kebab/dürüm/lahmacum a 2.5 y platos a 4; y los doble desactivados
select c.nombre as categoria,
       count(*) filter (where p.activo) as productos_activos,
       count(*) filter (where p.activo and exists (
         select 1 from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
         where s->>'id' = 'extras' and o->>'id' = 'doble')) as con_doble,
       min((select o->>'precioExtra' from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
            where s->>'id' = 'extras' and o->>'id' = 'doble')) as precio_doble,
       count(*) filter (where not p.activo and p.id like '%doble%') as doble_desactivados
from menu_productos p join menu_categorias c on c.id = p.categoria_id
where c.nombre in ('Kebab', 'Dürüm', 'Lahmacum') or c.nombre ilike 'plato%'
group by c.nombre, c.orden order by c.orden;
-- b) Nombres de "¿Cómo lo quieres?": ya no tiene que salir ninguno "En menú"
select distinct o->>'nombre' as opcion
from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
where s->>'id' = 'menu';
