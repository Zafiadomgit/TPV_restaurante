-- Reorganización de carta: traducciones al inglés que faltaban porque son
-- categorías/productos NUEVOS de esta reorganización — no existían cuando
-- corrió `traducciones_menu_en.sql` (el script original de traducción).
-- Sin esto, el kiosco en inglés caía a español en las 7 categorías
-- nuevas, en "Pedrata XXL" y en las 8 bebidas nuevas (ver conIdioma() en
-- client/src/textos.js — es el comportamiento esperado cuando falta
-- nombre_en, no un bug).
-- Seguro de re-ejecutar.

update menu_categorias set nombre_en = 'Pedratas' where nombre = 'Pedratas';
update menu_categorias set nombre_en = 'Fries' where nombre = 'Patatas';
update menu_categorias set nombre_en = 'Sides' where nombre = 'Complementos';
update menu_categorias set nombre_en = 'Crispy Zone' where nombre = 'Zona crujiente';
update menu_categorias set nombre_en = 'Burgers' where nombre = 'Hamburguesas';
update menu_categorias set nombre_en = 'Hot Dog' where nombre = 'Perrito caliente';
update menu_categorias set nombre_en = 'Roast Chicken' where nombre = 'Pollo asado';

update menu_productos set nombre_en = 'Pedrata XXL', descripcion_en = 'Fries, meat and sauce'
where id = 'pedratas-xxl';

update menu_productos set nombre_en = 'Coca-Cola', descripcion_en = '33cl' where id = 'coca-cola';
update menu_productos set nombre_en = 'Coca-Cola Zero', descripcion_en = '33cl' where id = 'coca-cola-cero';
update menu_productos set nombre_en = 'Aquarius lemon', descripcion_en = '33cl' where id = 'aquarius-limon';
update menu_productos set nombre_en = 'Fuze Tea', descripcion_en = '33cl' where id = 'fuze-tea';
update menu_productos set nombre_en = 'Tropical juice', descripcion_en = '33cl' where id = 'zumo-tropical';
update menu_productos set nombre_en = 'Fanta orange', descripcion_en = '33cl' where id = 'fanta-naranja';
update menu_productos set nombre_en = 'Monster', descripcion_en = '33cl' where id = 'monster';
update menu_productos set nombre_en = 'Water', descripcion_en = '33cl' where id = 'agua-33cl';

-- "Hamburguesa" se renombró a "Hamburguesa de vacuno" en el script 7 (para
-- distinguirla de la de pollo crispy) pero su nombre_en se quedó en el
-- genérico "Burger" de antes — se actualiza a "Beef burger" para que
-- combine con "Crispy chicken burger"/"XXL burger".
update menu_productos set nombre_en = 'Beef burger' where id = 'hamburguesa-clasica';
