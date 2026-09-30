-- Fotos de bebidas (lote que mandó el dueño: fotos de Pexels, con el fondo
-- quitado y encuadradas igual que el resto de la carta). Solo hay foto de
-- 4 de las 8 bebidas; Aquarius limón, Fuze Tea, Zumo tropical y Fanta
-- naranja se quedan sin foto hasta que lleguen.
--
-- Ojo: la de Coca-Cola es una botella (no lata) y la de agua es de la marca
-- Ciel — son las fotos que había; si el cliente quiere la lata de 33 cl o
-- su marca de agua exacta, se cambian cuando mande la foto.
--
-- ORDEN: desplegar primero el código (las imágenes tienen que existir en
-- client/public/menu/) y después ejecutar esto. No toca el esquema.
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/coca-cola.webp' where id = 'coca-cola';
update menu_productos set imagen_url = '/menu/coca-cola-cero.webp' where id = 'coca-cola-cero';
update menu_productos set imagen_url = '/menu/monster.webp' where id = 'monster';
update menu_productos set imagen_url = '/menu/agua.webp' where id = 'agua-33cl';
update menu_categorias set imagen_url = '/menu/bebidas.webp' where nombre = 'Bebidas';

-- Comprobación (solo lectura): tiene que salir la ruta en las 4 bebidas y
-- en la categoría.
select 'producto' as tipo, id as que, imagen_url from menu_productos
where id in ('coca-cola', 'coca-cola-cero', 'monster', 'agua-33cl')
union all
select 'categoria', nombre, imagen_url from menu_categorias where nombre = 'Bebidas';
