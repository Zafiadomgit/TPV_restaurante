-- Fotos con IA, segundo lote (las que mandó el dueño en "Imagenes pendientes"):
-- fondo quitado y encuadradas igual que el resto de la carta.
--
--  * Dürüm: pollo, ternera, mixto, falafel, solo carne y vegetal con queso
--    (ternera y falafel sustituyen a las del primer lote, para que los seis
--    vayan con el mismo estilo).
--  * Kebab: mixto, falafel, loco, solo carne y vegetal con queso.
--  * Fotos de combo (con patatas y bebida) en la opción "En menú" del paso
--    "¿Cómo lo quieres?": todos los kebabs, hamburguesa de vacuno y
--    hamburguesa pollo crispy. "Solo" enseña entonces la foto del producto.
--
-- Siguen con la foto genérica: kebab de ternera, de pollo, doble y doble
-- solo carne; dürüm loco, doble y doble solo carne; lahmacun (todos).
--
-- ORDEN: desplegar primero el código (las fotos tienen que existir en
-- client/public/menu/ y el asistente de menú tiene que saber enseñarlas) y
-- después ejecutar esto. No toca el esquema ni los precios.
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/durum-pollo-ia.webp' where id = 'durum-pollo';
update menu_productos set imagen_url = '/menu/durum-ternera-ia.webp' where id = 'durum-ternera';
update menu_productos set imagen_url = '/menu/durum-mixto-ia.webp' where id = 'durum-mixto';
update menu_productos set imagen_url = '/menu/durum-falafel-ia.webp' where id = 'durum-falafel';
update menu_productos set imagen_url = '/menu/durum-solo-carne-ia.webp' where id = 'durum-solo-carne';
update menu_productos set imagen_url = '/menu/durum-vegetal-queso-ia.webp' where id = 'durum-vegetal-queso';

update menu_productos set imagen_url = '/menu/kebab-mixto-ia.webp' where id = 'kebab-mixto';
update menu_productos set imagen_url = '/menu/kebab-falafel-ia.webp' where id = 'kebab-falafel';
update menu_productos set imagen_url = '/menu/kebab-loco-ia.webp' where id = 'kebab-loco';
update menu_productos set imagen_url = '/menu/kebab-solo-carne-ia.webp' where id = 'kebab-solo-carne';
update menu_productos set imagen_url = '/menu/kebab-vegetal-queso-ia.webp' where id = 'kebab-vegetal-queso';

-- Foto de combo en la opción "en-menu" del paso "menu". Solo añade la
-- clave "imagen" a esa opción; el resto de modificadores queda igual.
with fotos(id, foto) as (
  values
    ('kebab-ternera', '/menu/combo-kebab.webp'),
    ('kebab-pollo', '/menu/combo-kebab.webp'),
    ('kebab-mixto', '/menu/combo-kebab.webp'),
    ('kebab-falafel', '/menu/combo-kebab.webp'),
    ('kebab-vegetal-queso', '/menu/combo-kebab.webp'),
    ('kebab-solo-carne', '/menu/combo-kebab.webp'),
    ('kebab-loco', '/menu/combo-kebab.webp'),
    ('kebab-doble', '/menu/combo-kebab.webp'),
    ('kebab-doble-solo-carne', '/menu/combo-kebab.webp'),
    ('hamburguesa-clasica', '/menu/combo-hamburguesa-vacuno.webp'),
    ('hamburguesa-pollo-crispy', '/menu/combo-hamburguesa-pollo.webp')
)
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
                when opcion->>'id' = 'en-menu' then opcion || jsonb_build_object('imagen', f.foto)
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
from fotos f
where p.id = f.id;

-- Comprobación (solo lectura): 11 productos con foto nueva y 11 con foto
-- de combo en "En menú".
select id, imagen_url,
  (select o->>'imagen'
   from jsonb_array_elements(modificadores) s, jsonb_array_elements(s->'opciones') o
   where s->>'id' = 'menu' and o->>'id' = 'en-menu') as foto_en_menu
from menu_productos
where id like 'kebab-%' or id like 'durum-%' or id in ('hamburguesa-clasica', 'hamburguesa-pollo-crispy')
order by id;
