-- Lote 3 de fotos (las que mandó el dueño en "Fotos restantes") + Monster
-- a +2 € en todos los menús.
--
-- Fotos nuevas (fondo quitado, encuadre de la carta): dürüm loco y los
-- lahmacun de ternera, pollo, mixto, falafel, solo carne, loco y vegetal.
--
-- "Doble" con la foto de su versión normal (el dueño mandó así el dürüm
-- doble = mixto, el dürüm doble solo carne = solo carne y el kebab doble
-- solo carne = solo carne; se sigue la misma regla en kebab doble y en los
-- dos lahmacun doble, que no traían foto).
--
-- ORDEN: desplegar primero el código (las fotos tienen que existir en
-- client/public/menu/) y después ejecutar esto. Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/durum-loco-ia.webp' where id = 'durum-loco';
update menu_productos set imagen_url = '/menu/durum-mixto-ia.webp' where id = 'durum-doble';
update menu_productos set imagen_url = '/menu/durum-solo-carne-ia.webp' where id = 'durum-doble-solo-carne';

update menu_productos set imagen_url = '/menu/kebab-mixto-ia.webp' where id = 'kebab-doble';
update menu_productos set imagen_url = '/menu/kebab-solo-carne-ia.webp' where id = 'kebab-doble-solo-carne';

update menu_productos set imagen_url = '/menu/lahmacun-ternera-ia.webp' where id = 'lahmacum-ternera';
update menu_productos set imagen_url = '/menu/lahmacun-pollo-ia.webp' where id = 'lahmacum-pollo';
update menu_productos set imagen_url = '/menu/lahmacun-mixto-ia.webp' where id = 'lahmacum-mixto';
update menu_productos set imagen_url = '/menu/lahmacun-falafel-ia.webp' where id = 'lahmacum-falafel';
update menu_productos set imagen_url = '/menu/lahmacun-solo-carne-ia.webp' where id = 'lahmacum-solo-carne';
update menu_productos set imagen_url = '/menu/lahmacun-loco-ia.webp' where id = 'lahmacum-loco';
update menu_productos set imagen_url = '/menu/lahmacun-vegetal-queso-ia.webp' where id = 'lahmacum-vegetal-queso';
update menu_productos set imagen_url = '/menu/lahmacun-mixto-ia.webp' where id = 'lahmacum-doble';
update menu_productos set imagen_url = '/menu/lahmacun-solo-carne-ia.webp' where id = 'lahmacum-doble-solo-carne';

-- Monster: +2 € en el paso "Elige tu bebida" de todos los menús. Solo cambia
-- el precioExtra de esa opción; el resto de modificadores queda igual.
update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'bebida' then
        jsonb_set(
          paso,
          '{opciones}',
          (
            select jsonb_agg(
              case
                when opcion->>'id' = 'monster' then opcion || '{"precioExtra": 2}'::jsonb
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
  select 1
  from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
  where s->>'id' = 'bebida' and o->>'id' = 'monster'
);

-- Comprobaciones (solo lectura):
-- 1) fotos: los 14 productos con su foto nueva.
select id, imagen_url from menu_productos
where id in ('durum-loco', 'durum-doble', 'durum-doble-solo-carne', 'kebab-doble', 'kebab-doble-solo-carne')
   or id like 'lahmacum-%'
order by id;
-- 2) Monster: tiene que salir una sola fila con precio 2 (y el número de menús).
select o->>'precioExtra' as precio_monster, count(*) as menus
from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
where s->>'id' = 'bebida' and o->>'id' = 'monster'
group by 1;
