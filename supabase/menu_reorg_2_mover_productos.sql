-- Reorganización de carta: mueve productos existentes de
-- "Especialidades" y "Patatas y snacks" a las categorías nuevas creadas en
-- el script 1. No cambia precio, nombre ni modificadores aquí (eso va en
-- los scripts siguientes) — solo categoria_id y el orden dentro de la
-- categoría nueva.
-- IMPORTANTE: ejecutar después del script 1 (las categorías nuevas deben
-- existir ya).
-- Seguro de re-ejecutar.

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Pollo asado'), orden = 0
where id = 'pollo-asado';

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 0 where id = 'alitas-pollo';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 1 where id = 'nuggets-pollo';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 2 where id = 'palomitas-pollo';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 3 where id = 'tiras-pollo';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 4 where id = 'burrito';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Zona crujiente'), orden = 5 where id = 'tarrina-arroz-falafel';

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Hamburguesas'), orden = 0 where id = 'hamburguesa-clasica';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Hamburguesas'), orden = 1 where id = 'hamburguesa-pollo-crispy';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Hamburguesas'), orden = 2 where id = 'hamburguesa-xxl';

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Pedratas'), orden = 0 where id = 'pedratas-pequena';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Pedratas'), orden = 1 where id = 'pedratas-mediana';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Pedratas'), orden = 2 where id = 'pedratas-grande';

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 0 where id = 'patatas-fritas-pequena';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 1 where id = 'patatas-fritas-mediana';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 2 where id = 'patatas-fritas-grande';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 3 where id = 'patatas-deluxe-pequena';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 4 where id = 'patatas-deluxe-mediana';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Patatas'), orden = 5 where id = 'patatas-deluxe-grande';

update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Perrito caliente'), orden = 0 where id = 'perrito-caliente';

-- Complementos: los 4 que pidió el cliente + "Pan de kebab" (no encajaba
-- en ninguna categoría nueva tras desaparecer "Patatas y snacks"; se deja
-- aquí como el sitio más razonable, a falta de instrucción explícita).
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Complementos'), orden = 0 where id = 'aros-cebolla';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Complementos'), orden = 1 where id = 'samosa';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Complementos'), orden = 2 where id = 'cheese-bites';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Complementos'), orden = 3 where id = 'falafel-porcion';
update menu_productos set categoria_id = (select id from menu_categorias where nombre = 'Complementos'), orden = 4 where id = 'pan-kebab';
