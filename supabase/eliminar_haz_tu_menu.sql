-- Elimina la categoría "Haz tu menú" y sus 13 productos — a petición del
-- cliente, se sustituye por "¿En menú o no?" directamente en cada
-- categoría normal (ver menu_en_menu_o_no.sql). Seguro de ejecutar en
-- cualquier momento: los pedidos ya hechos guardan su propio detalle en
-- orders.items (jsonb), no dependen de que el producto siga existiendo
-- en menu_productos.
delete from menu_productos
where categoria_id = (select id from menu_categorias where nombre = 'Haz tu menú');

delete from menu_categorias where nombre = 'Haz tu menú';
