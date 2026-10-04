-- Kebab doble solo carne en menú: 10 € -> 10,50 €.
-- El cliente pidió igualarlo con "Kebab doble en menú quitando la lechuga"
-- (9,50 + 1 € = 10,50 €), igual que ya cuadran dürüm y lahmacun.
-- Solo cambia el precioBase de la opción "en-menu" del paso "menu"; el resto
-- de modificadores del producto se queda tal cual.
-- Seguro de re-ejecutar.

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
                when opcion->>'id' = 'en-menu' then opcion || '{"precioBase": 10.5}'::jsonb
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
where id = 'kebab-doble-solo-carne';

-- Comprobación (solo lectura): tiene que salir solo = 7.5 y en-menu = 10.5.
select o->>'id' as opcion, o->>'precioBase' as precio
from menu_productos p,
  jsonb_array_elements(p.modificadores) s,
  jsonb_array_elements(s->'opciones') o
where p.id = 'kebab-doble-solo-carne' and s->>'id' = 'menu';
