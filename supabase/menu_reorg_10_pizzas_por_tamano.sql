-- Consolida las pizzas de "una fila por tamaño" (39 productos: 13
-- sabores x 3 tamaños) a "una fila por sabor" (13 productos) con un paso
-- de personalización "Tamaño" que fija el precio absoluto según la opción
-- elegida (pequeña 8€ / mediana 10€ / familiar 14€, iguales para las 13).
-- A petición del dueño: menos fichas que revisar en el kiosco (13 en vez
-- de 39), el tamaño se elige dentro del modal de personalizar.
--
-- Usa el mecanismo nuevo "esSelectorTamano" (paso.opciones[].precioBase
-- absoluto, en vez de precioExtra que se SUMA) — ver comentarios en
-- client/api/orders/index.js. "Pizza a tu gusto" conserva su paso de
-- ingredientes tal cual, con el paso de tamaño añadido delante.
--
-- Los ids nuevos (sin sufijo de tamaño, ej. "pizza-cuatro-quesos") son
-- productos DISTINTOS de los 39 antiguos — los pedidos históricos no se
-- ven afectados (orders.items es una copia congelada, no una referencia
-- viva). Los 39 productos viejos se borran al final de este script.
--
-- Seguro de re-ejecutar.

insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-cuatro-quesos', id, 'Pizza Cuatro quesos', 'Four Cheese Pizza', 'Salsa de tomate, cuatro quesos y orégano', 'Tomato sauce, four cheeses and oregano', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 0
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-pepperoni', id, 'Pizza Pepperoni', 'Pepperoni Pizza', 'Queso, salsa de tomate y pepperoni', 'Cheese, tomato sauce and pepperoni', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 1
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-carbonara', id, 'Pizza Carbonara', 'Carbonara Pizza', 'Queso, salsa creme, bacon y champiñones', 'Cheese, cream sauce, bacon and mushrooms', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 2
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-iberica', id, 'Pizza Ibérica', 'Ibérica Pizza', 'Queso, salsa de tomate y jamón', 'Cheese, tomato sauce and ham', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 3
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-romana', id, 'Pizza Romana', 'Romana Pizza', 'Queso, salsa de tomate, jamón, pollo, aceitunas y champiñón', 'Cheese, tomato sauce, ham, chicken, olives and mushroom', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 4
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-barbacoa', id, 'Pizza Barbacoa', 'BBQ Pizza', 'Queso, salsa barbacoa, carne de ternera, pimiento y orégano', 'Cheese, BBQ sauce, beef, pepper and oregano', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 5
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-merindades', id, 'Pizza Merindades', 'Merindades Pizza', 'Queso, salsa de tomate, ternera, pollo y orégano', 'Cheese, tomato sauce, beef, chicken and oregano', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 6
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-mediterranea', id, 'Pizza Mediterránea', 'Mediterranean Pizza', 'Queso, salsa de tomate, atún, tomate fresco y cebolla', 'Cheese, tomato sauce, tuna, fresh tomato and onion', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 7
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-diavola', id, 'Pizza Diávola', 'Diávola Pizza', 'Queso, salsa de tomate, chorizo, jamón, jalapeños y toque de salsa picante', 'Cheese, tomato sauce, chorizo, ham, jalapeños and a touch of spicy sauce', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 8
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-tono', id, 'Pizza Toño', 'Toño Pizza', 'Queso, salsa de tomate, atún, cebolla y aceitunas', 'Cheese, tomato sauce, tuna, onion and olives', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 9
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-california', id, 'Pizza California', 'California Pizza', 'Queso, salsa de tomate, ternera, cebolla y aceitunas', 'Cheese, tomato sauce, beef, onion and olives', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 10
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-a-tu-gusto', id, 'Pizza A tu gusto', 'Build Your Own Pizza', 'Queso, tomate y tres ingredientes a elegir', 'Cheese, tomato and three toppings of your choice', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]},{"id":"ingredientes","tipo":"multiple","titulo":"Elige tus ingredientes (3 primeros gratis, +1€ el resto)","primerosGratis":3,"opciones":[{"id":"ternera","nombre":"Ternera","porDefecto":false,"precioExtra":1},{"id":"pollo","nombre":"Pollo","porDefecto":false,"precioExtra":1},{"id":"aceitunas-negras","nombre":"Aceitunas negras","porDefecto":false,"precioExtra":1},{"id":"champinones","nombre":"Champiñones","porDefecto":false,"precioExtra":1},{"id":"maiz","nombre":"Maíz","porDefecto":false,"precioExtra":1},{"id":"tomate-natural","nombre":"Tomate natural","porDefecto":false,"precioExtra":1},{"id":"bacon","nombre":"Bacon","porDefecto":false,"precioExtra":1},{"id":"jamon","nombre":"Jamón","porDefecto":false,"precioExtra":1},{"id":"chorizo","nombre":"Chorizo","porDefecto":false,"precioExtra":1},{"id":"cebolla","nombre":"Cebolla","porDefecto":false,"precioExtra":1},{"id":"jalapenos","nombre":"Jalapeños","porDefecto":false,"precioExtra":1},{"id":"pimientos","nombre":"Pimientos","porDefecto":false,"precioExtra":1},{"id":"atun","nombre":"Atún","porDefecto":false,"precioExtra":1}]}]'::jsonb, 11
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;
insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden)
select 'pizza-vegetariana', id, 'Pizza Vegetariana', 'Vegetarian Pizza', 'Queso, salsa de tomate, pimientos, champiñones, cebolla, maíz, aceitunas, tomate natural y orégano', 'Cheese, tomato sauce, peppers, mushrooms, onion, corn, olives, fresh tomato and oregano', 8, '[{"id":"tamano","titulo":"Tamaño","tipo":"unica","maxSeleccion":1,"esSelectorTamano":true,"opciones":[{"id":"pequena","nombre":"Pequeña","nombreEn":"Small","precioBase":8,"precioExtra":0,"porDefecto":true},{"id":"mediana","nombre":"Mediana","nombreEn":"Medium","precioBase":10,"precioExtra":0,"porDefecto":false},{"id":"familiar","nombre":"Familiar","nombreEn":"Family","precioBase":14,"precioExtra":0,"porDefecto":false}]}]'::jsonb, 12
from menu_categorias where nombre = 'Pizzas'
on conflict (id) do update set
  categoria_id = excluded.categoria_id,
  nombre = excluded.nombre,
  nombre_en = excluded.nombre_en,
  descripcion = excluded.descripcion,
  descripcion_en = excluded.descripcion_en,
  precio = excluded.precio,
  modificadores = excluded.modificadores,
  orden = excluded.orden;

-- Borra los 39 productos viejos (uno por sabor x tamaño) ahora que
-- están sustituidos por los 13 consolidados de arriba.
delete from menu_productos where id in (
  'pizza-cuatro-quesos-pequena',
  'pizza-cuatro-quesos-mediana',
  'pizza-cuatro-quesos-familiar',
  'pizza-pepperoni-pequena',
  'pizza-pepperoni-mediana',
  'pizza-pepperoni-familiar',
  'pizza-carbonara-pequena',
  'pizza-carbonara-mediana',
  'pizza-carbonara-familiar',
  'pizza-iberica-pequena',
  'pizza-iberica-mediana',
  'pizza-iberica-familiar',
  'pizza-romana-pequena',
  'pizza-romana-mediana',
  'pizza-romana-familiar',
  'pizza-barbacoa-pequena',
  'pizza-barbacoa-mediana',
  'pizza-barbacoa-familiar',
  'pizza-merindades-pequena',
  'pizza-merindades-mediana',
  'pizza-merindades-familiar',
  'pizza-mediterranea-pequena',
  'pizza-mediterranea-mediana',
  'pizza-mediterranea-familiar',
  'pizza-diavola-pequena',
  'pizza-diavola-mediana',
  'pizza-diavola-familiar',
  'pizza-tono-pequena',
  'pizza-tono-mediana',
  'pizza-tono-familiar',
  'pizza-california-pequena',
  'pizza-california-mediana',
  'pizza-california-familiar',
  'pizza-a-tu-gusto-pequena',
  'pizza-a-tu-gusto-mediana',
  'pizza-a-tu-gusto-familiar',
  'pizza-vegetariana-pequena',
  'pizza-vegetariana-mediana',
  'pizza-vegetariana-familiar'
);
