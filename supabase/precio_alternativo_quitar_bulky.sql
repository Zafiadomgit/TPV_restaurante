-- Ajusta cuándo se activa el precio "solo carne" en Kebab, Dürüm y
-- Lahmacum (los normales, no los que ya son solo-carne/loco/doble).
--
-- Antes: el precio alternativo (precioSiTodoQuitado) solo se activaba
-- si el cliente quitaba las 4 opciones del paso "Quitar ingredientes"
-- (tomate, cebolla, repollo y zanahoria, lechuga).
--
-- Ahora, según explicó el dueño: lo que realmente abulta el
-- kebab/dürüm/lahmacum es la carne + la lechuga + el repollo y
-- zanahoria — el tomate y la cebolla no abultan. Así que basta con que
-- el cliente quite la lechuga O el repollo y zanahoria (uno de los
-- dos, no hace falta los dos ni que además quite tomate/cebolla) para
-- que haya que echar más carne y el precio pase a ser el de "solo
-- carne" (+1€ sobre el normal). Quitar solo tomate y/o cebolla, sin
-- tocar lechuga ni repollo/zanahoria, no cambia el precio.
--
-- Esto se implementa añadiendo "disparadoresPrecioAlternativo" al paso
-- "quitar" de cada producto: si está presente, se dispara con marcar
-- CUALQUIERA de esos ids (no hace falta marcarlos todos) — ver
-- client/api/orders/index.js y client/src/components/Personalizar.jsx.
--
-- Seguro de re-ejecutar: solo añade/actualiza esa clave en el paso
-- "quitar" de los productos listados, sin tocar nada más de su
-- modificadores.

update menu_productos
set modificadores = (
  select jsonb_agg(
    case
      when paso->>'id' = 'quitar'
        then paso || '{"disparadoresPrecioAlternativo": ["sin-lechuga", "sin-repollo-zanahoria"]}'::jsonb
      else paso
    end
    order by ord
  )
  from jsonb_array_elements(modificadores) with ordinality as t(paso, ord)
)
where id in (
  'kebab-ternera', 'kebab-pollo', 'kebab-mixto', 'kebab-falafel', 'kebab-vegetal-queso',
  'durum-ternera', 'durum-pollo', 'durum-mixto', 'durum-falafel', 'durum-vegetal-queso',
  'lahmacum-ternera', 'lahmacum-pollo', 'lahmacum-mixto', 'lahmacum-falafel', 'lahmacum-vegetal-queso'
);
