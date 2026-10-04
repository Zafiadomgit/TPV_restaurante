-- SOLO LECTURA — no cambia nada. Ejecútalo DESPUÉS de
-- menu_cambios_cliente_carta.sql para repasar el checklist del cliente
-- contra la base de datos real: una fila por punto, con lo esperado, lo que
-- hay de verdad y ✅/❌. Debería salir todo ✅; si algo sale ❌, pásame la fila.
-- (Los puntos que son solo de pantalla —vídeo, fondo, "Más pedido", pizzas,
-- hamburguesas, efecto al añadir, "+1 €" visible— no viven en la base de
-- datos: se comprueban mirando el kiosco una vez desplegado.)
-- GENERADO por supabase/generadores/verificar_cambios_cliente.py.

with comprobaciones as (
  select 1 as n, 'Kebab' as seccion, 'Foto kebab-ternera' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-ternera') as actual
  union all
  select 2 as n, 'Kebab' as seccion, 'Foto kebab-pollo' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-pollo') as actual
  union all
  select 3 as n, 'Kebab' as seccion, 'Foto kebab-mixto' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-mixto') as actual
  union all
  select 4 as n, 'Kebab' as seccion, 'Foto kebab-falafel' as punto, '/menu/kebab-falafel.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-falafel') as actual
  union all
  select 5 as n, 'Kebab' as seccion, 'Foto kebab-vegetal-queso' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-vegetal-queso') as actual
  union all
  select 6 as n, 'Kebab' as seccion, 'Foto kebab-solo-carne' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-solo-carne') as actual
  union all
  select 7 as n, 'Kebab' as seccion, 'Foto kebab-loco' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-loco') as actual
  union all
  select 8 as n, 'Kebab' as seccion, 'Foto kebab-doble' as punto, '/menu/kebab.webp' as esperado, (select imagen_url::text from menu_productos where id = 'kebab-doble') as actual
  union all
  select 9 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (ternera)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-ternera' and s->>'id' = 'quitar') as actual
  union all
  select 10 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (pollo)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 11 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (mixto)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-mixto' and s->>'id' = 'quitar') as actual
  union all
  select 12 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (falafel)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-falafel' and s->>'id' = 'quitar') as actual
  union all
  select 13 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (vegetal-queso)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-vegetal-queso' and s->>'id' = 'quitar') as actual
  union all
  select 14 as n, 'Kebab' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (doble)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-doble' and s->>'id' = 'quitar') as actual
  union all
  select 15 as n, 'Kebab' as seccion, 'Solo carne: descripción sin verduras' as punto, 'Carne + salsas' as esperado, (select descripcion::text from menu_productos where id = 'kebab-solo-carne') as actual
  union all
  select 16 as n, 'Kebab' as seccion, 'Solo carne: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-solo-carne' and s->>'id' = 'quitar') as actual
  union all
  select 17 as n, 'Kebab' as seccion, 'Loco: descripción sin verduras' as punto, 'Carne y patatas fritas dentro + salsas' as esperado, (select descripcion::text from menu_productos where id = 'kebab-loco') as actual
  union all
  select 18 as n, 'Kebab' as seccion, 'Loco: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'kebab-loco' and s->>'id' = 'quitar') as actual
  union all
  select 19 as n, 'Kebab' as seccion, 'Vegetal: queso en la descripción' as punto, 'Lechuga, tomate, cebolla, repollo y zanahoria, queso gouda + salsas' as esperado, (select descripcion::text from menu_productos where id = 'kebab-vegetal-queso') as actual
  union all
  select 20 as n, 'Kebab' as seccion, 'Vegetal: ''Sin queso'' en quitar' as punto, 'sí' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-vegetal-queso' and s->>'id' = 'quitar' and o->>'id' = 'sin-queso') as actual
  union all
  select 21 as n, 'Kebab' as seccion, 'Menú ternera 7.50 €' as punto, '7.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-ternera' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 22 as n, 'Kebab' as seccion, 'Menú pollo 7.50 €' as punto, '7.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-pollo' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 23 as n, 'Kebab' as seccion, 'Menú mixto 7.50 €' as punto, '7.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-mixto' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 24 as n, 'Kebab' as seccion, 'Menú vegetal-queso 7.50 €' as punto, '7.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-vegetal-queso' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 25 as n, 'Kebab' as seccion, 'Menú loco 7.50 €' as punto, '7.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-loco' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 26 as n, 'Kebab' as seccion, 'Menú falafel 8.00 €' as punto, '8.00' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-falafel' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 27 as n, 'Kebab' as seccion, 'Menú doble 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-doble' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 28 as n, 'Kebab' as seccion, 'Doble solo carne: existe y está activo' as punto, 'true' as esperado, (select activo::text from menu_productos where id = 'kebab-doble-solo-carne') as actual
  union all
  select 29 as n, 'Kebab' as seccion, 'Doble solo carne: precio solo 7.50 €' as punto, '7.50' as esperado, (select round(precio, 2)::text from menu_productos where id = 'kebab-doble-solo-carne') as actual
  union all
  select 30 as n, 'Kebab' as seccion, 'Doble solo carne: precio menú 10.50 €' as punto, '10.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'kebab-doble-solo-carne' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 31 as n, 'Dürüm' as seccion, 'Foto durum-ternera' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-ternera') as actual
  union all
  select 32 as n, 'Dürüm' as seccion, 'Foto durum-pollo' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-pollo') as actual
  union all
  select 33 as n, 'Dürüm' as seccion, 'Foto durum-mixto' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-mixto') as actual
  union all
  select 34 as n, 'Dürüm' as seccion, 'Foto durum-falafel' as punto, '/menu/durum-falafel.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-falafel') as actual
  union all
  select 35 as n, 'Dürüm' as seccion, 'Foto durum-vegetal-queso' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-vegetal-queso') as actual
  union all
  select 36 as n, 'Dürüm' as seccion, 'Foto durum-solo-carne' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-solo-carne') as actual
  union all
  select 37 as n, 'Dürüm' as seccion, 'Foto durum-loco' as punto, '/menu/durum-loco.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-loco') as actual
  union all
  select 38 as n, 'Dürüm' as seccion, 'Foto durum-doble' as punto, '/menu/durum.webp' as esperado, (select imagen_url::text from menu_productos where id = 'durum-doble') as actual
  union all
  select 39 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (ternera)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-ternera' and s->>'id' = 'quitar') as actual
  union all
  select 40 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (pollo)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 41 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (mixto)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-mixto' and s->>'id' = 'quitar') as actual
  union all
  select 42 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (falafel)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-falafel' and s->>'id' = 'quitar') as actual
  union all
  select 43 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (vegetal-queso)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-vegetal-queso' and s->>'id' = 'quitar') as actual
  union all
  select 44 as n, 'Dürüm' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (doble)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-doble' and s->>'id' = 'quitar') as actual
  union all
  select 45 as n, 'Dürüm' as seccion, 'Solo carne: descripción sin verduras' as punto, 'Carne + salsas' as esperado, (select descripcion::text from menu_productos where id = 'durum-solo-carne') as actual
  union all
  select 46 as n, 'Dürüm' as seccion, 'Solo carne: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-solo-carne' and s->>'id' = 'quitar') as actual
  union all
  select 47 as n, 'Dürüm' as seccion, 'Loco: descripción sin verduras' as punto, 'Carne y patatas fritas dentro + salsas' as esperado, (select descripcion::text from menu_productos where id = 'durum-loco') as actual
  union all
  select 48 as n, 'Dürüm' as seccion, 'Loco: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'durum-loco' and s->>'id' = 'quitar') as actual
  union all
  select 49 as n, 'Dürüm' as seccion, 'Vegetal: queso en la descripción' as punto, 'Lechuga, tomate, cebolla, repollo y zanahoria, queso gouda + salsas' as esperado, (select descripcion::text from menu_productos where id = 'durum-vegetal-queso') as actual
  union all
  select 50 as n, 'Dürüm' as seccion, 'Vegetal: ''Sin queso'' en quitar' as punto, 'sí' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-vegetal-queso' and s->>'id' = 'quitar' and o->>'id' = 'sin-queso') as actual
  union all
  select 51 as n, 'Dürüm' as seccion, 'Menú ternera 8.50 €' as punto, '8.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-ternera' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 52 as n, 'Dürüm' as seccion, 'Menú pollo 8.50 €' as punto, '8.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-pollo' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 53 as n, 'Dürüm' as seccion, 'Menú mixto 8.50 €' as punto, '8.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-mixto' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 54 as n, 'Dürüm' as seccion, 'Menú vegetal-queso 8.50 €' as punto, '8.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-vegetal-queso' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 55 as n, 'Dürüm' as seccion, 'Menú loco 8.50 €' as punto, '8.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-loco' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 56 as n, 'Dürüm' as seccion, 'Menú falafel 9.00 €' as punto, '9.00' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-falafel' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 57 as n, 'Dürüm' as seccion, 'Menú doble 10.50 €' as punto, '10.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-doble' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 58 as n, 'Dürüm' as seccion, 'Doble solo carne: existe y está activo' as punto, 'true' as esperado, (select activo::text from menu_productos where id = 'durum-doble-solo-carne') as actual
  union all
  select 59 as n, 'Dürüm' as seccion, 'Doble solo carne: precio solo 9.00 €' as punto, '9.00' as esperado, (select round(precio, 2)::text from menu_productos where id = 'durum-doble-solo-carne') as actual
  union all
  select 60 as n, 'Dürüm' as seccion, 'Doble solo carne: precio menú 11.50 €' as punto, '11.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'durum-doble-solo-carne' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 61 as n, 'Lahmacun' as seccion, 'Foto lahmacum-ternera' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-ternera') as actual
  union all
  select 62 as n, 'Lahmacun' as seccion, 'Foto lahmacum-pollo' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-pollo') as actual
  union all
  select 63 as n, 'Lahmacun' as seccion, 'Foto lahmacum-mixto' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-mixto') as actual
  union all
  select 64 as n, 'Lahmacun' as seccion, 'Foto lahmacum-falafel' as punto, '/menu/lahmacun-falafel.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-falafel') as actual
  union all
  select 65 as n, 'Lahmacun' as seccion, 'Foto lahmacum-vegetal-queso' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-vegetal-queso') as actual
  union all
  select 66 as n, 'Lahmacun' as seccion, 'Foto lahmacum-solo-carne' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-solo-carne') as actual
  union all
  select 67 as n, 'Lahmacun' as seccion, 'Foto lahmacum-loco' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-loco') as actual
  union all
  select 68 as n, 'Lahmacun' as seccion, 'Foto lahmacum-doble' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url::text from menu_productos where id = 'lahmacum-doble') as actual
  union all
  select 69 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (ternera)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-ternera' and s->>'id' = 'quitar') as actual
  union all
  select 70 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (pollo)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 71 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (mixto)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-mixto' and s->>'id' = 'quitar') as actual
  union all
  select 72 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (falafel)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-falafel' and s->>'id' = 'quitar') as actual
  union all
  select 73 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (vegetal-queso)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-vegetal-queso' and s->>'id' = 'quitar') as actual
  union all
  select 74 as n, 'Lahmacun' as seccion, 'Quitar lechuga / repollo y zanahoria +1 € (doble)' as punto, '1.00 (lechuga y repollo)' as esperado, (select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' @> '["sin-lechuga","sin-repollo-zanahoria"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-doble' and s->>'id' = 'quitar') as actual
  union all
  select 75 as n, 'Lahmacun' as seccion, 'Solo carne: descripción sin verduras' as punto, 'Carne + salsas' as esperado, (select descripcion::text from menu_productos where id = 'lahmacum-solo-carne') as actual
  union all
  select 76 as n, 'Lahmacun' as seccion, 'Solo carne: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-solo-carne' and s->>'id' = 'quitar') as actual
  union all
  select 77 as n, 'Lahmacun' as seccion, 'Loco: descripción sin verduras' as punto, 'Carne y patatas fritas dentro + salsas' as esperado, (select descripcion::text from menu_productos where id = 'lahmacum-loco') as actual
  union all
  select 78 as n, 'Lahmacun' as seccion, 'Loco: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'lahmacum-loco' and s->>'id' = 'quitar') as actual
  union all
  select 79 as n, 'Lahmacun' as seccion, 'Vegetal: queso en la descripción' as punto, 'Lechuga, tomate, cebolla, repollo y zanahoria, queso gouda + salsas' as esperado, (select descripcion::text from menu_productos where id = 'lahmacum-vegetal-queso') as actual
  union all
  select 80 as n, 'Lahmacun' as seccion, 'Vegetal: ''Sin queso'' en quitar' as punto, 'sí' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-vegetal-queso' and s->>'id' = 'quitar' and o->>'id' = 'sin-queso') as actual
  union all
  select 81 as n, 'Lahmacun' as seccion, 'Menú ternera 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-ternera' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 82 as n, 'Lahmacun' as seccion, 'Menú pollo 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-pollo' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 83 as n, 'Lahmacun' as seccion, 'Menú mixto 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-mixto' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 84 as n, 'Lahmacun' as seccion, 'Menú vegetal-queso 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-vegetal-queso' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 85 as n, 'Lahmacun' as seccion, 'Menú loco 9.50 €' as punto, '9.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-loco' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 86 as n, 'Lahmacun' as seccion, 'Menú falafel 10.00 €' as punto, '10.00' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-falafel' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 87 as n, 'Lahmacun' as seccion, 'Menú doble 11.50 €' as punto, '11.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-doble' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 88 as n, 'Lahmacun' as seccion, 'Doble solo carne: existe y está activo' as punto, 'true' as esperado, (select activo::text from menu_productos where id = 'lahmacum-doble-solo-carne') as actual
  union all
  select 89 as n, 'Lahmacun' as seccion, 'Doble solo carne: precio solo 9.50 €' as punto, '9.50' as esperado, (select round(precio, 2)::text from menu_productos where id = 'lahmacum-doble-solo-carne') as actual
  union all
  select 90 as n, 'Lahmacun' as seccion, 'Doble solo carne: precio menú 12.50 €' as punto, '12.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'lahmacum-doble-solo-carne' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 91 as n, 'Platos combinados' as seccion, 'plato-solo-carne: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-solo-carne' and s->>'id' = 'quitar') as actual
  union all
  select 92 as n, 'Platos combinados' as seccion, 'plato-solo-carne-queso: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-solo-carne-queso' and s->>'id' = 'quitar') as actual
  union all
  select 93 as n, 'Platos combinados' as seccion, 'plato-arroz-carne: sin quitar ingredientes' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-arroz-carne' and s->>'id' = 'quitar') as actual
  union all
  select 94 as n, 'Platos combinados' as seccion, 'Descripción solo carne sin verdura' as punto, 'Carne + salsas, patatas y pan' as esperado, (select descripcion::text from menu_productos where id = 'plato-solo-carne') as actual
  union all
  select 95 as n, 'Platos combinados' as seccion, 'Descripción solo carne con queso sin verdura' as punto, 'Carne con queso + salsas, patatas y pan' as esperado, (select descripcion::text from menu_productos where id = 'plato-solo-carne-queso') as actual
  union all
  select 96 as n, 'Platos combinados' as seccion, 'Descripción arroz sin verdura' as punto, 'Arroz, carne + salsas, patatas y pan' as esperado, (select descripcion::text from menu_productos where id = 'plato-arroz-carne') as actual
  union all
  select 97 as n, 'Platos combinados' as seccion, 'plato-ternera: arroz basmati +3,50 €' as punto, '3.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-ternera' and s->>'id' = 'extras' and o->>'id' = 'arroz-basmati') as actual
  union all
  select 98 as n, 'Platos combinados' as seccion, 'plato-pollo: arroz basmati +3,50 €' as punto, '3.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-pollo' and s->>'id' = 'extras' and o->>'id' = 'arroz-basmati') as actual
  union all
  select 99 as n, 'Platos combinados' as seccion, 'plato-mixto: arroz basmati +3,50 €' as punto, '3.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-mixto' and s->>'id' = 'extras' and o->>'id' = 'arroz-basmati') as actual
  union all
  select 100 as n, 'Platos combinados' as seccion, 'plato-falafel: arroz basmati +3,50 €' as punto, '3.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-falafel' and s->>'id' = 'extras' and o->>'id' = 'arroz-basmati') as actual
  union all
  select 101 as n, 'Platos combinados' as seccion, 'plato-doble: arroz basmati +3,50 €' as punto, '3.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-doble' and s->>'id' = 'extras' and o->>'id' = 'arroz-basmati') as actual
  union all
  select 102 as n, 'Platos combinados' as seccion, 'Foto plato doble' as punto, '/menu/plato-carne-queso.webp' as esperado, (select imagen_url::text from menu_productos where id = 'plato-doble') as actual
  union all
  select 103 as n, 'Platos combinados' as seccion, 'Nombre plato solo carne' as punto, 'Plato solo carne y patatas' as esperado, (select nombre::text from menu_productos where id = 'plato-solo-carne') as actual
  union all
  select 104 as n, 'Platos combinados' as seccion, 'Nombre plato solo carne con queso' as punto, 'Plato solo carne con queso y patatas' as esperado, (select nombre::text from menu_productos where id = 'plato-solo-carne-queso') as actual
  union all
  select 105 as n, 'Platos combinados' as seccion, 'Nombre plato de arroz' as punto, 'Plato de arroz con carne y patatas' as esperado, (select nombre::text from menu_productos where id = 'plato-arroz-carne') as actual
  union all
  select 106 as n, 'Platos combinados' as seccion, 'Plato de carne con queso quitado' as punto, 'false' as esperado, (select activo::text from menu_productos where id = 'plato-carne-queso') as actual
  union all
  select 107 as n, 'Platos combinados' as seccion, 'Plato doble solo carne y patatas: activo' as punto, 'true' as esperado, (select activo::text from menu_productos where id = 'plato-doble-solo-carne') as actual
  union all
  select 108 as n, 'Platos combinados' as seccion, 'Plato doble solo carne y patatas: solo 14 €' as punto, '14.00' as esperado, (select round(precio, 2)::text from menu_productos where id = 'plato-doble-solo-carne') as actual
  union all
  select 109 as n, 'Platos combinados' as seccion, 'Plato doble solo carne y patatas: menú 15,50 €' as punto, '15.50' as esperado, (select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'plato-doble-solo-carne' and s->>'id' = 'menu' and o->>'id' = 'en-menu') as actual
  union all
  select 110 as n, 'Platos combinados' as seccion, 'plato-ternera: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-ternera' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 111 as n, 'Platos combinados' as seccion, 'plato-pollo: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-pollo' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 112 as n, 'Platos combinados' as seccion, 'plato-mixto: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-mixto' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 113 as n, 'Platos combinados' as seccion, 'plato-falafel: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-falafel' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 114 as n, 'Platos combinados' as seccion, 'plato-solo-carne: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-solo-carne' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 115 as n, 'Platos combinados' as seccion, 'plato-solo-carne-queso: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-solo-carne-queso' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 116 as n, 'Platos combinados' as seccion, 'plato-arroz-carne: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-arroz-carne' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 117 as n, 'Platos combinados' as seccion, 'plato-doble: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-doble' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 118 as n, 'Platos combinados' as seccion, 'plato-doble-solo-carne: menú sin patatas (solo + bebida)' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'plato-doble-solo-carne' and s->>'id' = 'tipo-patatas') as actual
  union all
  select 119 as n, 'Pedratas' as seccion, 'Foto nueva pedratas-pequena' as punto, '/menu/pedratas-pequena.webp' as esperado, (select imagen_url::text from menu_productos where id = 'pedratas-pequena') as actual
  union all
  select 120 as n, 'Pedratas' as seccion, 'Foto nueva pedratas-mediana' as punto, '/menu/pedratas-mediana.webp' as esperado, (select imagen_url::text from menu_productos where id = 'pedratas-mediana') as actual
  union all
  select 121 as n, 'Pedratas' as seccion, 'Foto nueva pedratas-grande' as punto, '/menu/pedratas-grande.webp' as esperado, (select imagen_url::text from menu_productos where id = 'pedratas-grande') as actual
  union all
  select 122 as n, 'Pedratas' as seccion, 'Foto nueva pedratas-xxl' as punto, '/menu/pedratas-xxl.webp' as esperado, (select imagen_url::text from menu_productos where id = 'pedratas-xxl') as actual
  union all
  select 123 as n, 'Falafel' as seccion, 'Salsas aparte en falafel' as punto, 'sí' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'falafel-porcion' and s->>'id' = 'salsas-aparte') as actual
  union all
  select 124 as n, 'Zona crujiente' as seccion, 'alitas-pollo: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'alitas-pollo' and s->>'id' = 'menu') as actual
  union all
  select 125 as n, 'Zona crujiente' as seccion, 'nuggets-pollo: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'nuggets-pollo' and s->>'id' = 'menu') as actual
  union all
  select 126 as n, 'Zona crujiente' as seccion, 'palomitas-pollo: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'palomitas-pollo' and s->>'id' = 'menu') as actual
  union all
  select 127 as n, 'Zona crujiente' as seccion, 'tiras-pollo: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'tiras-pollo' and s->>'id' = 'menu') as actual
  union all
  select 128 as n, 'Zona crujiente' as seccion, 'tarrina-arroz-falafel: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'tarrina-arroz-falafel' and s->>'id' = 'menu') as actual
  union all
  select 129 as n, 'Zona crujiente' as seccion, 'burrito: mantiene menú' as punto, 'sí' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'burrito' and s->>'id' = 'menu') as actual
  union all
  select 130 as n, 'Zona crujiente' as seccion, 'alitas-pollo: + ensalada 2,50 €' as punto, '2.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'alitas-pollo' and s->>'id' = 'ensalada' and o->>'id' = 'con-ensalada') as actual
  union all
  select 131 as n, 'Zona crujiente' as seccion, 'alitas-pollo: quitar ingredientes de la ensalada (solo si la eligen)' as punto, 'con-ensalada' as esperado, (select s->'mostrarSi'->>'opcion' from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'alitas-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 132 as n, 'Zona crujiente' as seccion, 'nuggets-pollo: + ensalada 2,50 €' as punto, '2.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'nuggets-pollo' and s->>'id' = 'ensalada' and o->>'id' = 'con-ensalada') as actual
  union all
  select 133 as n, 'Zona crujiente' as seccion, 'nuggets-pollo: quitar ingredientes de la ensalada (solo si la eligen)' as punto, 'con-ensalada' as esperado, (select s->'mostrarSi'->>'opcion' from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'nuggets-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 134 as n, 'Zona crujiente' as seccion, 'palomitas-pollo: + ensalada 2,50 €' as punto, '2.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'palomitas-pollo' and s->>'id' = 'ensalada' and o->>'id' = 'con-ensalada') as actual
  union all
  select 135 as n, 'Zona crujiente' as seccion, 'palomitas-pollo: quitar ingredientes de la ensalada (solo si la eligen)' as punto, 'con-ensalada' as esperado, (select s->'mostrarSi'->>'opcion' from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'palomitas-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 136 as n, 'Zona crujiente' as seccion, 'tiras-pollo: + ensalada 2,50 €' as punto, '2.50' as esperado, (select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, jsonb_array_elements(s->'opciones') o where p.id = 'tiras-pollo' and s->>'id' = 'ensalada' and o->>'id' = 'con-ensalada') as actual
  union all
  select 137 as n, 'Zona crujiente' as seccion, 'tiras-pollo: quitar ingredientes de la ensalada (solo si la eligen)' as punto, 'con-ensalada' as esperado, (select s->'mostrarSi'->>'opcion' from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'tiras-pollo' and s->>'id' = 'quitar') as actual
  union all
  select 138 as n, 'Ensaladas' as seccion, 'ensalada-merindades: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'ensalada-merindades' and s->>'id' = 'menu') as actual
  union all
  select 139 as n, 'Ensaladas' as seccion, 'ensalada-california: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'ensalada-california' and s->>'id' = 'menu') as actual
  union all
  select 140 as n, 'Ensaladas' as seccion, 'ensalada-cocktail: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'ensalada-cocktail' and s->>'id' = 'menu') as actual
  union all
  select 141 as n, 'Pollo asado' as seccion, 'Pollo asado: sin menú' as punto, 'no' as esperado, (select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = 'pollo-asado' and s->>'id' = 'menu') as actual
  union all
  select 142 as n, 'Salsas' as seccion, 'Tarrina propia en salsa-blanca' as punto, '/menu/salsa-blanca.webp' as esperado, (select imagen_url::text from menu_productos where id = 'salsa-blanca') as actual
  union all
  select 143 as n, 'Salsas' as seccion, 'Tarrina propia en salsa-roja' as punto, '/menu/salsa-roja.webp' as esperado, (select imagen_url::text from menu_productos where id = 'salsa-roja') as actual
  union all
  select 144 as n, 'Salsas' as seccion, 'Tarrina propia en salsa-picante' as punto, '/menu/salsa-picante.webp' as esperado, (select imagen_url::text from menu_productos where id = 'salsa-picante') as actual
  union all
  select 145 as n, 'Fotos que faltaban' as seccion, 'Foto categoría Kebab' as punto, '/menu/kebab.webp' as esperado, (select imagen_url from menu_categorias where nombre = 'Kebab') as actual
  union all
  select 146 as n, 'Fotos que faltaban' as seccion, 'Foto categoría Lahmacum' as punto, '/menu/lahmacun.webp' as esperado, (select imagen_url from menu_categorias where nombre = 'Lahmacum') as actual
)
select
  case when actual is not distinct from esperado then '✅' else '❌' end as ok,
  seccion,
  punto,
  esperado,
  coalesce(actual, '(no existe)') as actual
from comprobaciones
order by (actual is not distinct from esperado), n;
