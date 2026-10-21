-- Pedido del cliente (21/10/2026): el "Doble" de Extras pasa de 2,50 € a
-- 2 € en todos los productos que lo tenían a 2,50 (kebab, dürüm,
-- lahmacum). Seguro de re-ejecutar.

update menu_productos p
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'extras' then
        jsonb_set(paso, '{opciones}', (
          select jsonb_agg(
            case when opcion->>'id' = 'doble' and (opcion->>'precioExtra')::numeric = 2.5
                 then opcion || '{"precioExtra": 2}'::jsonb else opcion end
            order by ord)
          from jsonb_array_elements(paso->'opciones') with ordinality as o(opcion, ord)))
      else paso
    end
    order by pos)
  from jsonb_array_elements(p.modificadores) with ordinality as s(paso, pos)
)
where exists (
  select 1 from jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
  where s->>'id' = 'extras' and o->>'id' = 'doble' and (o->>'precioExtra')::numeric = 2.5
);

-- Comprobación (solo lectura): precio del Doble en cada categoría.
select c.nombre as categoria, o->>'precioExtra' as precio_doble, count(*) as productos
from menu_productos p
join menu_categorias c on c.id = p.categoria_id,
     jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o
where s->>'id' = 'extras' and o->>'id' = 'doble'
group by 1, 2 order by 1;
