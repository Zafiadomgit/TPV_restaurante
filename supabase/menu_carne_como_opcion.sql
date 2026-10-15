-- Pedido del cliente (15/10/2026): en Kebab, Dürüm, Lahmacum y Platos
-- combinados, la carne y el "solo carne" pasan a ser OPCIONES en vez de
-- productos separados.
--
--  * Productos nuevos: "Kebab", "Dürüm", "Lahmacum" y "Plato combinado"
--    (copias del de ternera: mismo precio, mismos pasos de menú, patatas,
--    salsas, extras con "Doble", bebida...). Foto: la del mixto.
--  * Paso nuevo "Elige la carne": Ternera / Pollo / Mixto. Obligatorio (no
--    deja añadir sin elegir) y sale siempre en la comanda.
--  * Paso nuevo "¿Con verduras o solo carne?": Con verduras (marcado) /
--    Solo carne +1 €. Con "Solo carne" no aparece "Quitar ingredientes" y
--    en la comanda sale "Solo carne".
--  * Los "loco" y el "Plato de arroz con carne" también piden la carne.
--  * Se OCULTAN (activo = false, no se borran) los de ternera, pollo, mixto
--    y solo carne de cada uno, y el "Plato solo carne con queso" (= Plato
--    combinado + Solo carne + Extra queso, mismo precio). Se pueden volver
--    a activar desde la Carta.
--
-- Precios iguales que antes: kebab 4,50 (menú 7,50), solo carne 5,50 (menú
-- 8,50); dürüm 6 / 8,50 y 7 / 9,50; lahmacum 6,50 / 9,50 y 7,50 / 10,50;
-- plato 8 / 9,50 y 9 / 10,50.
--
-- No hace falta desplegar nada antes. Seguro de re-ejecutar.

begin;

create temp table nuevos_productos (
  id text, base text, foto_de text, nombre text, nombre_en text,
  descripcion text, descripcion_en text
) on commit drop;

insert into nuevos_productos values
  ('kebab', 'kebab-ternera', 'kebab-mixto', 'Kebab', 'Kebab',
   'Ternera, pollo o mixto. Lechuga, tomate, cebolla, repollo y zanahoria + salsas',
   'Beef, chicken or mixed. Lettuce, tomato, onion, cabbage and carrot + sauces'),
  ('durum', 'durum-ternera', 'durum-mixto', 'Dürüm', 'Dürüm',
   'Ternera, pollo o mixto. Lechuga, tomate, cebolla, repollo y zanahoria + salsas',
   'Beef, chicken or mixed. Lettuce, tomato, onion, cabbage and carrot + sauces'),
  ('lahmacum', 'lahmacum-ternera', 'lahmacum-mixto', 'Lahmacum', 'Lahmacum',
   'Ternera, pollo o mixto. Lechuga, tomate, cebolla, repollo y zanahoria + salsas',
   'Beef, chicken or mixed. Lettuce, tomato, onion, cabbage and carrot + sauces'),
  ('plato-combinado', 'plato-ternera', 'plato-mixto', 'Plato combinado', 'Combo platter',
   'Ternera, pollo o mixto. Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan',
   'Beef, chicken or mixed. Lettuce, tomato, onion, cabbage and carrot + sauces, fries and bread');

-- 1. Crear los productos nuevos (si no existen ya)
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, imagen_url, activo, orden)
select n.id, b.categoria_id, n.nombre, n.nombre_en, n.descripcion, n.descripcion_en, b.precio, b.modificadores,
       (select imagen_url from menu_productos where id = n.foto_de), true, b.orden
from nuevos_productos n
join menu_productos b on b.id = n.base
where not exists (select 1 from menu_productos where id = n.id);

-- 2. Pasos "Elige la carne" y "¿Con verduras o solo carne?" detrás de
--    "¿Cómo lo quieres?" en los productos nuevos; "Quitar ingredientes"
--    solo con verduras.
update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select case
             when paso->>'id' = 'quitar'
               then paso || '{"mostrarSi": {"paso": "solo-carne", "opcion": "con-verduras"}}'::jsonb
             else paso
           end as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select '{"id": "carne", "tipo": "unica", "titulo": "Elige la carne", "nota": "Elige 1 carne",
             "maxSeleccion": 1, "minSeleccion": 1, "siempreEnTexto": true,
             "opciones": [
               {"id": "ternera", "nombre": "Ternera", "nombreEn": "Beef", "porDefecto": false, "precioExtra": 0},
               {"id": "pollo", "nombre": "Pollo", "nombreEn": "Chicken", "porDefecto": false, "precioExtra": 0},
               {"id": "mixto", "nombre": "Mixto", "nombreEn": "Mixed", "porDefecto": false, "precioExtra": 0}
             ]}'::jsonb, pos, 1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'menu'
    union all
    select '{"id": "solo-carne", "tipo": "unica", "titulo": "¿Con verduras o solo carne?",
             "maxSeleccion": 1,
             "opciones": [
               {"id": "con-verduras", "nombre": "Con verduras", "nombreEn": "With vegetables", "porDefecto": true, "precioExtra": 0},
               {"id": "solo-carne", "nombre": "Solo carne", "nombreEn": "Meat only", "porDefecto": false, "precioExtra": 1}
             ]}'::jsonb, pos, 2
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'menu'
  ) t
)
where p.id in (select id from nuevos_productos)
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'carne');

-- 3. Los "loco" y el plato de arroz con carne: también "Elige la carne"
update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select '{"id": "carne", "tipo": "unica", "titulo": "Elige la carne", "nota": "Elige 1 carne",
             "maxSeleccion": 1, "minSeleccion": 1, "siempreEnTexto": true,
             "opciones": [
               {"id": "ternera", "nombre": "Ternera", "nombreEn": "Beef", "porDefecto": false, "precioExtra": 0},
               {"id": "pollo", "nombre": "Pollo", "nombreEn": "Chicken", "porDefecto": false, "precioExtra": 0},
               {"id": "mixto", "nombre": "Mixto", "nombreEn": "Mixed", "porDefecto": false, "precioExtra": 0}
             ]}'::jsonb, pos, 1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'menu'
  ) t
)
where p.id in ('kebab-loco', 'durum-loco', 'lahmacum-loco', 'plato-arroz-carne')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'carne');

-- 4. Ocultar los productos que ahora son opciones
update menu_productos
set activo = false
where id in (
  'kebab-ternera', 'kebab-pollo', 'kebab-mixto', 'kebab-solo-carne',
  'durum-ternera', 'durum-pollo', 'durum-mixto', 'durum-solo-carne',
  'lahmacum-ternera', 'lahmacum-pollo', 'lahmacum-mixto', 'lahmacum-solo-carne',
  'plato-ternera', 'plato-pollo', 'plato-mixto', 'plato-solo-carne', 'plato-solo-carne-queso'
);

commit;

-- Comprobación (solo lectura): productos que se ven en cada categoría y si
-- piden carne / solo carne.
select c.nombre as categoria, p.nombre, p.precio,
       exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'carne') as elige_carne,
       exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'solo-carne') as opcion_solo_carne
from menu_productos p join menu_categorias c on c.id = p.categoria_id
where p.activo and c.nombre in ('Kebab', 'Dürüm', 'Lahmacum', 'Platos combinados')
order by c.orden, p.orden, p.nombre;
