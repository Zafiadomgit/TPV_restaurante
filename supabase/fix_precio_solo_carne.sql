-- Corrige precioSiTodoQuitado: estaba en 1 (un valor sin sentido, de
-- origen anterior a esta sesion) para los 15 sabores base de
-- Kebab/Durum/Lahmacum, en vez del precio real de "solo carne" de cada
-- categoria (kebab-solo-carne=5.5, durum-solo-carne=7,
-- lahmacum-solo-carne=7.5). Con el antiguo disparador ("hay que quitar
-- las 4 opciones") este error casi nunca se notaba; con el nuevo
-- disparador ("basta con quitar lechuga O repollo/zanahoria") se
-- dispara mucho mas facil y el precio se veia caer a 1 EUR en vez de
-- subir al precio de solo carne.
--
-- De paso, deja el paso "quitar" en un estado limpio y consistente
-- para los 15 productos (precioExtra=0 y porDefecto=false en las 4
-- opciones, disparadoresPrecioAlternativo=[sin-lechuga,
-- sin-repollo-zanahoria]) por si alguno se edito a mano desde /carta
-- mientras se probaba la funcion nueva.
--
-- Seguro de re-ejecutar.

-- Kebab
update menu_productos
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'quitar' then
        jsonb_set(
          paso || jsonb_build_object(
            'precioSiTodoQuitado', 5.5,
            'disparadoresPrecioAlternativo', '["sin-lechuga", "sin-repollo-zanahoria"]'::jsonb
          ),
          '{opciones}',
          (
            select jsonb_agg(opcion || jsonb_build_object('precioExtra', 0, 'porDefecto', false))
            from jsonb_array_elements(paso->'opciones') as opcion
          )
        )
      else paso
    end
    order by ord
  )
  from jsonb_array_elements(modificadores) with ordinality as t(paso, ord)
)
where id in ('kebab-ternera', 'kebab-pollo', 'kebab-mixto', 'kebab-falafel', 'kebab-vegetal-queso');

-- Durum
update menu_productos
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'quitar' then
        jsonb_set(
          paso || jsonb_build_object(
            'precioSiTodoQuitado', 7,
            'disparadoresPrecioAlternativo', '["sin-lechuga", "sin-repollo-zanahoria"]'::jsonb
          ),
          '{opciones}',
          (
            select jsonb_agg(opcion || jsonb_build_object('precioExtra', 0, 'porDefecto', false))
            from jsonb_array_elements(paso->'opciones') as opcion
          )
        )
      else paso
    end
    order by ord
  )
  from jsonb_array_elements(modificadores) with ordinality as t(paso, ord)
)
where id in ('durum-ternera', 'durum-pollo', 'durum-mixto', 'durum-falafel', 'durum-vegetal-queso');

-- Lahmacum
update menu_productos
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'quitar' then
        jsonb_set(
          paso || jsonb_build_object(
            'precioSiTodoQuitado', 7.5,
            'disparadoresPrecioAlternativo', '["sin-lechuga", "sin-repollo-zanahoria"]'::jsonb
          ),
          '{opciones}',
          (
            select jsonb_agg(opcion || jsonb_build_object('precioExtra', 0, 'porDefecto', false))
            from jsonb_array_elements(paso->'opciones') as opcion
          )
        )
      else paso
    end
    order by ord
  )
  from jsonb_array_elements(modificadores) with ordinality as t(paso, ord)
)
where id in ('lahmacum-ternera', 'lahmacum-pollo', 'lahmacum-mixto', 'lahmacum-falafel', 'lahmacum-vegetal-queso');

