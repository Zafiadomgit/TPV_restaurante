-- Pedido del cliente (14/10/2026): en el paso "Tus patatas" de los menús,
-- poner la foto de cada patata — la misma que ya tienen en la carta:
--   Patatas fritas  -> /menu/patatas-fritas.webp
--   Patatas deluxe  -> /menu/patatas-deluxe.webp
-- Solo añade la clave "imagen" a esas dos opciones; no toca precios ni
-- nada más. Las fotos ya están publicadas y el asistente ya sabe
-- enseñarlas: se puede ejecutar ya. Seguro de re-ejecutar.

update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'tipo-patatas' then
        jsonb_set(
          paso,
          '{opciones}',
          (
            select jsonb_agg(
              case opcion->>'id'
                when 'fritas' then opcion || '{"imagen": "/menu/patatas-fritas.webp"}'::jsonb
                when 'deluxe' then opcion || '{"imagen": "/menu/patatas-deluxe.webp"}'::jsonb
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
where exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'tipo-patatas');

-- Comprobación (solo lectura): tienen que salir 2 filas, fritas y deluxe,
-- cada una con su foto (ninguna vacía).
select o->>'id' as opcion, o->>'imagen' as foto, count(*) as productos
from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
where s->>'id' = 'tipo-patatas'
group by 1, 2
order by 1;
