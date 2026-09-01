create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  mesa text not null,
  items jsonb not null,
  notas_generales text default '',
  estado text not null default 'pendiente',
  pagado boolean not null default false,
  metodo_pago text,
  subtotal numeric not null,
  iva numeric not null,
  total numeric not null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists orders_estado_idx on orders (estado);

-- Turnos de caja (apertura/cierre, arqueo de efectivo).
create table if not exists turnos_caja (
  id uuid primary key default gen_random_uuid(),
  estado text not null default 'abierto',
  efectivo_inicial numeric not null,
  efectivo_final_declarado numeric,
  total_efectivo_esperado numeric,
  diferencia numeric,
  notas text default '',
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz
);

create index if not exists turnos_caja_estado_idx on turnos_caja (estado);

-- Solo puede haber un turno abierto a la vez (además de la validación en el
-- backend, esto evita una doble apertura por condición de carrera).
create unique index if not exists turnos_caja_unico_abierto_idx
  on turnos_caja (estado)
  where estado = 'abierto';

-- Vincula cada pedido cobrado con el turno de caja que estaba abierto en ese
-- momento, para poder calcular el efectivo esperado al cerrar turno.
alter table orders add column if not exists turno_caja_id uuid references turnos_caja (id);
alter table orders add column if not exists pagado_en timestamptz;

create index if not exists orders_turno_caja_idx on orders (turno_caja_id);

-- Número de ticket legible y secuencial para mostrar en comanda/cocina/caja
-- en vez del uuid (ej. "#A-118"). serial asigna un entero autoincremental
-- también a las filas ya existentes.
alter table orders add column if not exists ticket_numero serial unique;

-- Inventario. "clave" es una clave de texto estable (no el uuid) que
-- client/api/_lib/menu.js usa para vincular un producto del menú con su
-- ingrediente limitante (ver ingredienteClave en menu.js) — así el menú
-- puede referenciarla sin depender de un uuid generado en runtime.
create table if not exists inventario (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  categoria text not null default '',
  stock numeric not null default 0,
  unidad text not null default 'uds',
  umbral_bajo numeric not null default 0,
  visible_en_kiosco boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Distinto de "orders"/"turnos_caja": el inventario es un catálogo vivo,
-- no un histórico, así que sí se permite borrar filas (ver policies.sql).

-- Datos de partida con el mismo estado que el mockup de referencia
-- (Coca-Cola y patatas en aviso de stock bajo, baklava agotada) para que
-- la pantalla de inventario no arranque vacía.
insert into inventario (clave, nombre, categoria, stock, unidad, umbral_bajo)
values
  ('pan-pita', 'Pan de pita', 'Base', 48, 'uds', 20),
  ('tortilla-durum', 'Tortilla dürüm', 'Base', 62, 'uds', 25),
  ('ternera-kebab', 'Ternera kebab', 'Carne', 3.2, 'kg', 2),
  ('pollo-kebab', 'Pollo kebab', 'Carne', 5.8, 'kg', 2),
  ('falafel', 'Falafel', 'Carne', 40, 'uds', 15),
  ('patatas-congeladas', 'Patatas congeladas', 'Acompañamiento', 12, 'kg', 10),
  ('coca-cola-lata', 'Coca-Cola lata', 'Bebida', 9, 'uds', 12),
  ('ayran', 'Ayran', 'Bebida', 24, 'uds', 10),
  ('baklava', 'Baklava', 'Postre', 0, 'uds', 6)
on conflict (clave) do nothing;

-- Momento en que un pedido llegó a estado "listo" por primera vez (para
-- calcular el tiempo medio de cocina en el panel del dueño). No se
-- sobreescribe en reentradas a "listo" tras un "revertir" desde el
-- historial — ver client/api/orders/[id]/estado.js.
alter table orders add column if not exists listo_en timestamptz;

-- Menú editable: categorías y productos (antes vivían hardcodeados en
-- client/api/_lib/menu.js). "menu_productos.id" reutiliza el mismo slug de
-- texto que ya usaba menu.js (ej. "kebab-ternera") en vez de un uuid nuevo,
-- para no romper los productId ya guardados en pedidos históricos
-- (orders.items es una copia congelada en el momento del pedido, así que
-- borrar o editar un producto del menú nunca altera pedidos ya hechos).
create table if not exists menu_categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists menu_productos (
  id text primary key,
  categoria_id uuid not null references menu_categorias (id) on delete cascade,
  nombre text not null,
  descripcion text not null default '',
  precio numeric not null,
  modificadores jsonb,
  activo boolean not null default true,
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists menu_productos_categoria_idx on menu_productos (categoria_id);

-- Se retira el inventario: el cliente gestiona el stock en otra
-- plataforma y no lo va a usar aquí. Esto borra también sus políticas RLS
-- (se eliminan junto con la tabla) y deja sin efecto el bloque de arriba
-- que la creaba — se deja tal cual como registro histórico de lo que se
-- llegó a aplicar, en vez de reescribirlo.
drop table if exists inventario cascade;

-- Categorías (orden = orden de aparición en el menú actual)
insert into menu_categorias (nombre, orden) values
  ('Kebab', 0),
  ('Dürüm', 1),
  ('Lahmacum', 2),
  ('Platos combinados', 3),
  ('Especialidades', 4),
  ('Patatas y snacks', 5),
  ('Salsas', 6),
  ('Bebidas', 7),
  ('Ensaladas', 8),
  ('Pizzas', 9),
  ('Haz tu menú', 10)
on conflict (nombre) do nothing;

-- Productos (id = mismo slug que usaba menu.js, para no romper continuidad
-- con pedidos históricos)
insert into menu_productos (id, categoria_id, nombre, descripcion, precio, modificadores, orden)
select v.id, c.id, v.nombre, v.descripcion, v.precio, v.modificadores::jsonb, v.orden
from (values
  ('kebab-ternera', 'Kebab', 'Kebab de ternera', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 4.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 0),
  ('kebab-pollo', 'Kebab', 'Kebab de pollo', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 4.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 1),
  ('kebab-mixto', 'Kebab', 'Kebab mixto', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 4.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 2),
  ('kebab-falafel', 'Kebab', 'Kebab de falafel', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 3),
  ('kebab-vegetal-queso', 'Kebab', 'Kebab vegetal con queso gouda', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 4.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 4),
  ('kebab-solo-carne', 'Kebab', 'Kebab solo carne', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 5.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 5),
  ('kebab-loco', 'Kebab', 'Kebab loco (con patatas dentro)', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 4.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 6),
  ('kebab-doble', 'Kebab', 'Kebab doble', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 7),
  ('durum-ternera', 'Dürüm', 'Dürüm de ternera', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 0),
  ('durum-pollo', 'Dürüm', 'Dürüm de pollo', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 1),
  ('durum-mixto', 'Dürüm', 'Dürüm mixto', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 2),
  ('durum-falafel', 'Dürüm', 'Dürüm de falafel', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 3),
  ('durum-vegetal-queso', 'Dürüm', 'Dürüm vegetal con queso gouda', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 4),
  ('durum-solo-carne', 'Dürüm', 'Dürüm solo carne', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 7, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 5),
  ('durum-loco', 'Dürüm', 'Dürüm loco (con patatas dentro)', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 6),
  ('durum-doble', 'Dürüm', 'Dürüm doble', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 8, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 7),
  ('lahmacum-ternera', 'Lahmacum', 'Lahmacum de ternera', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 0),
  ('lahmacum-pollo', 'Lahmacum', 'Lahmacum de pollo', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 1),
  ('lahmacum-mixto', 'Lahmacum', 'Lahmacum mixto', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 2),
  ('lahmacum-falafel', 'Lahmacum', 'Lahmacum de falafel', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 7, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 3),
  ('lahmacum-vegetal-queso', 'Lahmacum', 'Lahmacum vegetal con queso gouda', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","precioSiTodoQuitado":1,"opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 4),
  ('lahmacum-solo-carne', 'Lahmacum', 'Lahmacum solo carne', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 7.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 5),
  ('lahmacum-loco', 'Lahmacum', 'Lahmacum loco (con patatas dentro)', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 6.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 6),
  ('lahmacum-doble', 'Lahmacum', 'Lahmacum doble', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas', 8.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 7),
  ('plato-ternera', 'Platos combinados', 'Plato de ternera', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 8, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 0),
  ('plato-pollo', 'Platos combinados', 'Plato de pollo', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 8, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 1),
  ('plato-mixto', 'Platos combinados', 'Plato mixto', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 8, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 2),
  ('plato-falafel', 'Platos combinados', 'Plato de falafel', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 8, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 3),
  ('plato-carne-queso', 'Platos combinados', 'Plato de carne con queso', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 9, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 4),
  ('plato-solo-carne', 'Platos combinados', 'Plato solo carne', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 9, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 5),
  ('plato-solo-carne-queso', 'Platos combinados', 'Plato solo carne con queso', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 10, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 6),
  ('plato-arroz-carne', 'Platos combinados', 'Plato arroz con carne', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 8.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 7),
  ('plato-doble', 'Platos combinados', 'Plato doble', 'Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan', 12, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 8),
  ('pollo-asado', 'Especialidades', 'Pollo asado', 'Con patatas fritas', 13, null, 0),
  ('alitas-pollo', 'Especialidades', 'Alitas de pollo (6 uds)', 'Con patatas fritas', 7, null, 1),
  ('nuggets-pollo', 'Especialidades', 'Nuggets de pollo (8 uds)', 'Con patatas fritas', 7, null, 2),
  ('palomitas-pollo', 'Especialidades', 'Palomitas de pollo (15 uds)', 'Con patatas fritas', 7, null, 3),
  ('tiras-pollo', 'Especialidades', 'Tiras de pollo crujiente (4 uds)', 'Con patatas fritas', 7, null, 4),
  ('hamburguesa-pollo-crispy', 'Especialidades', 'Hamburguesa pollo crispy', 'Pollo crispy, lechuga, tomate, queso, cebolla, ketchup y mayonesa', 5.5, null, 5),
  ('hamburguesa-clasica', 'Especialidades', 'Hamburguesa', 'Carne, lechuga, tomate, queso, cebolla, ketchup y mayonesa. +huevo o bacon +1€', 4.5, null, 6),
  ('hamburguesa-xxl', 'Especialidades', 'Hamburguesa XXL', 'Doble de carne, huevo frito, bacon crispy y doble de queso', 7, null, 7),
  ('pedratas-pequena', 'Especialidades', 'Pedratas pequeña', 'Patatas, carne de ternera o pollo y salsa', 4.5, null, 8),
  ('pedratas-mediana', 'Especialidades', 'Pedratas mediana', 'Patatas, carne de ternera o pollo y salsa', 6, null, 9),
  ('pedratas-grande', 'Especialidades', 'Pedratas grande', 'Patatas, carne de ternera o pollo y salsa', 7, null, 10),
  ('patatas-fritas-pequena', 'Patatas y snacks', 'Patatas fritas pequeña', '', 4, null, 0),
  ('patatas-fritas-mediana', 'Patatas y snacks', 'Patatas fritas mediana', '', 5, null, 1),
  ('patatas-fritas-grande', 'Patatas y snacks', 'Patatas fritas grande', '', 6, null, 2),
  ('patatas-deluxe-pequena', 'Patatas y snacks', 'Patatas deluxe gajo pequeña', '', 4, null, 3),
  ('patatas-deluxe-mediana', 'Patatas y snacks', 'Patatas deluxe gajo mediana', '', 5, null, 4),
  ('patatas-deluxe-grande', 'Patatas y snacks', 'Patatas deluxe gajo grande', '', 6, null, 5),
  ('burrito', 'Patatas y snacks', 'Burrito (chicken wrap)', 'Ensalada, pollo crujiente, patatas y salsa', 6.5, null, 6),
  ('perrito-caliente', 'Patatas y snacks', 'Perrito caliente', 'Hot dog, ketchup y mayonesa', 4, null, 7),
  ('aros-cebolla', 'Patatas y snacks', 'Aros de cebolla (8 uds)', '', 3.5, null, 8),
  ('samosa', 'Patatas y snacks', 'Samosa (3 uds)', '', 3.5, null, 9),
  ('cheese-bites', 'Patatas y snacks', 'Cheese bites (10 uds)', '', 4, null, 10),
  ('tarrina-arroz-falafel', 'Patatas y snacks', 'Tarrina de arroz basmati con falafel', '', 4.5, null, 11),
  ('falafel-porcion', 'Patatas y snacks', 'Falafel (6 uds)', '', 3.5, null, 12),
  ('pan-kebab', 'Patatas y snacks', 'Pan de kebab', '', 1, null, 13),
  ('salsa-blanca', 'Salsas', 'Salsa blanca', '', 1, null, 0),
  ('salsa-roja', 'Salsas', 'Salsa roja', '', 1, null, 1),
  ('salsa-picante', 'Salsas', 'Salsa picante', '', 1, null, 2),
  ('refresco-lata', 'Bebidas', 'Refresco (lata 33cl)', 'Coca-Cola, Fanta, Sprite...', 1.8, null, 0),
  ('agua', 'Bebidas', 'Agua', '', 1, null, 1),
  ('bebida-energetica', 'Bebidas', 'Bebida energética', '', 3, null, 2),
  ('ayran', 'Bebidas', 'Ayran', 'Bebida de yogur turca', 1.5, null, 3),
  ('ensalada-merindades', 'Ensaladas', 'Ensalada Merindades', 'Lechuga, tomate fresco, atún, cebolla, repollo, zanahoria y maíz', 5, null, 0),
  ('ensalada-california', 'Ensaladas', 'Ensalada California', 'Lechuga, maíz, zanahoria, aceitunas, repollo y un toque de salsa de yogur', 5, null, 1),
  ('ensalada-cocktail', 'Ensaladas', 'Ensalada Cocktail', 'Pollo crujiente, lechuga, tomate, cebolla, aceituna y maíz', 5, null, 2),
  ('pizza-cuatro-quesos-pequena', 'Pizzas', 'Pizza Cuatro quesos (pequeña)', 'Salsa de tomate, cuatro quesos y orégano', 8, null, 0),
  ('pizza-cuatro-quesos-mediana', 'Pizzas', 'Pizza Cuatro quesos (mediana)', 'Salsa de tomate, cuatro quesos y orégano', 10, null, 1),
  ('pizza-cuatro-quesos-familiar', 'Pizzas', 'Pizza Cuatro quesos (familiar)', 'Salsa de tomate, cuatro quesos y orégano', 14, null, 2),
  ('pizza-pepperoni-pequena', 'Pizzas', 'Pizza Pepperoni (pequeña)', 'Queso, salsa de tomate y pepperoni', 8, null, 3),
  ('pizza-pepperoni-mediana', 'Pizzas', 'Pizza Pepperoni (mediana)', 'Queso, salsa de tomate y pepperoni', 10, null, 4),
  ('pizza-pepperoni-familiar', 'Pizzas', 'Pizza Pepperoni (familiar)', 'Queso, salsa de tomate y pepperoni', 14, null, 5),
  ('pizza-carbonara-pequena', 'Pizzas', 'Pizza Carbonara (pequeña)', 'Queso, salsa creme, bacon y champiñones', 8, null, 6),
  ('pizza-carbonara-mediana', 'Pizzas', 'Pizza Carbonara (mediana)', 'Queso, salsa creme, bacon y champiñones', 10, null, 7),
  ('pizza-carbonara-familiar', 'Pizzas', 'Pizza Carbonara (familiar)', 'Queso, salsa creme, bacon y champiñones', 14, null, 8),
  ('pizza-iberica-pequena', 'Pizzas', 'Pizza Ibérica (pequeña)', 'Queso, salsa de tomate y jamón', 8, null, 9),
  ('pizza-iberica-mediana', 'Pizzas', 'Pizza Ibérica (mediana)', 'Queso, salsa de tomate y jamón', 10, null, 10),
  ('pizza-iberica-familiar', 'Pizzas', 'Pizza Ibérica (familiar)', 'Queso, salsa de tomate y jamón', 14, null, 11),
  ('pizza-romana-pequena', 'Pizzas', 'Pizza Romana (pequeña)', 'Queso, salsa de tomate, jamón, pollo, aceitunas y champiñón', 8, null, 12),
  ('pizza-romana-mediana', 'Pizzas', 'Pizza Romana (mediana)', 'Queso, salsa de tomate, jamón, pollo, aceitunas y champiñón', 10, null, 13),
  ('pizza-romana-familiar', 'Pizzas', 'Pizza Romana (familiar)', 'Queso, salsa de tomate, jamón, pollo, aceitunas y champiñón', 14, null, 14),
  ('pizza-barbacoa-pequena', 'Pizzas', 'Pizza Barbacoa (pequeña)', 'Queso, salsa barbacoa, carne de ternera, pimiento y orégano', 8, null, 15),
  ('pizza-barbacoa-mediana', 'Pizzas', 'Pizza Barbacoa (mediana)', 'Queso, salsa barbacoa, carne de ternera, pimiento y orégano', 10, null, 16),
  ('pizza-barbacoa-familiar', 'Pizzas', 'Pizza Barbacoa (familiar)', 'Queso, salsa barbacoa, carne de ternera, pimiento y orégano', 14, null, 17),
  ('pizza-merindades-pequena', 'Pizzas', 'Pizza Merindades (pequeña)', 'Queso, salsa de tomate, ternera, pollo y orégano', 8, null, 18),
  ('pizza-merindades-mediana', 'Pizzas', 'Pizza Merindades (mediana)', 'Queso, salsa de tomate, ternera, pollo y orégano', 10, null, 19),
  ('pizza-merindades-familiar', 'Pizzas', 'Pizza Merindades (familiar)', 'Queso, salsa de tomate, ternera, pollo y orégano', 14, null, 20),
  ('pizza-mediterranea-pequena', 'Pizzas', 'Pizza Mediterránea (pequeña)', 'Queso, salsa de tomate, atún, tomate fresco y cebolla', 8, null, 21),
  ('pizza-mediterranea-mediana', 'Pizzas', 'Pizza Mediterránea (mediana)', 'Queso, salsa de tomate, atún, tomate fresco y cebolla', 10, null, 22),
  ('pizza-mediterranea-familiar', 'Pizzas', 'Pizza Mediterránea (familiar)', 'Queso, salsa de tomate, atún, tomate fresco y cebolla', 14, null, 23),
  ('pizza-diavola-pequena', 'Pizzas', 'Pizza Diávola (pequeña)', 'Queso, salsa de tomate, chorizo, jamón, jalapeños y toque de salsa picante', 8, null, 24),
  ('pizza-diavola-mediana', 'Pizzas', 'Pizza Diávola (mediana)', 'Queso, salsa de tomate, chorizo, jamón, jalapeños y toque de salsa picante', 10, null, 25),
  ('pizza-diavola-familiar', 'Pizzas', 'Pizza Diávola (familiar)', 'Queso, salsa de tomate, chorizo, jamón, jalapeños y toque de salsa picante', 14, null, 26),
  ('pizza-tono-pequena', 'Pizzas', 'Pizza Toño (pequeña)', 'Queso, salsa de tomate, atún, cebolla y aceitunas', 8, null, 27),
  ('pizza-tono-mediana', 'Pizzas', 'Pizza Toño (mediana)', 'Queso, salsa de tomate, atún, cebolla y aceitunas', 10, null, 28),
  ('pizza-tono-familiar', 'Pizzas', 'Pizza Toño (familiar)', 'Queso, salsa de tomate, atún, cebolla y aceitunas', 14, null, 29),
  ('pizza-california-pequena', 'Pizzas', 'Pizza California (pequeña)', 'Queso, salsa de tomate, ternera, cebolla y aceitunas', 8, null, 30),
  ('pizza-california-mediana', 'Pizzas', 'Pizza California (mediana)', 'Queso, salsa de tomate, ternera, cebolla y aceitunas', 10, null, 31),
  ('pizza-california-familiar', 'Pizzas', 'Pizza California (familiar)', 'Queso, salsa de tomate, ternera, cebolla y aceitunas', 14, null, 32),
  ('pizza-a-tu-gusto-pequena', 'Pizzas', 'Pizza A tu gusto (pequeña)', 'Queso, tomate y tres ingredientes a elegir', 8, null, 33),
  ('pizza-a-tu-gusto-mediana', 'Pizzas', 'Pizza A tu gusto (mediana)', 'Queso, tomate y tres ingredientes a elegir', 10, null, 34),
  ('pizza-a-tu-gusto-familiar', 'Pizzas', 'Pizza A tu gusto (familiar)', 'Queso, tomate y tres ingredientes a elegir', 14, null, 35),
  ('pizza-vegetariana-pequena', 'Pizzas', 'Pizza Vegetariana (pequeña)', 'Queso, salsa de tomate, pimientos, champiñones, cebolla, maíz, aceitunas, tomate natural y orégano', 8, null, 36),
  ('pizza-vegetariana-mediana', 'Pizzas', 'Pizza Vegetariana (mediana)', 'Queso, salsa de tomate, pimientos, champiñones, cebolla, maíz, aceitunas, tomate natural y orégano', 10, null, 37),
  ('pizza-vegetariana-familiar', 'Pizzas', 'Pizza Vegetariana (familiar)', 'Queso, salsa de tomate, pimientos, champiñones, cebolla, maíz, aceitunas, tomate natural y orégano', 14, null, 38),
  ('menu-doner-kebab', 'Haz tu menú', 'Menú Doner Kebab', 'Patatas + refresco. Solo carne o queso +1€', 7.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 0),
  ('menu-durum', 'Haz tu menú', 'Menú Dürüm', 'Patatas + refresco. Solo carne o queso +1€', 8.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 1),
  ('menu-lahmacum', 'Haz tu menú', 'Menú Lahmacum', 'Patatas + refresco. Solo carne o queso +1€', 9.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 2),
  ('menu-plato-ternera-pollo', 'Haz tu menú', 'Menú Plato ternera/pollo', 'Ensalada + patatas + refresco + pan. Solo carne o queso +1€', 9.5, '[{"id":"quitar","titulo":"Quitar ingredientes","tipo":"multiple","opciones":[{"id":"sin-tomate","nombre":"Sin tomate","precioExtra":0,"porDefecto":false},{"id":"sin-cebolla","nombre":"Sin cebolla","precioExtra":0,"porDefecto":false},{"id":"sin-repollo-zanahoria","nombre":"Sin repollo y zanahoria","precioExtra":0,"porDefecto":false},{"id":"sin-lechuga","nombre":"Sin lechuga","precioExtra":0,"porDefecto":false}]},{"id":"extras","titulo":"Extras","tipo":"multiple","opciones":[{"id":"extra-salsa","nombre":"Extra salsa","precioExtra":1,"porDefecto":false},{"id":"extra-queso","nombre":"Extra queso","precioExtra":1,"porDefecto":false}]}]', 3),
  ('menu-plato-arroz', 'Haz tu menú', 'Menú Plato arroz con ternera/pollo', 'Patatas + refresco + salsa + pan', 10, null, 4),
  ('menu-hamburguesa', 'Haz tu menú', 'Menú Hamburguesa (vacuno o pollo crispy +1€)', 'Patatas + refresco. +huevo o bacon +1€', 6.5, null, 5),
  ('menu-perrito', 'Haz tu menú', 'Menú Perrito caliente', 'Patatas + refresco', 6, null, 6),
  ('menu-alitas', 'Haz tu menú', 'Menú Alitas de pollo', 'Ensalada + patatas + refresco', 9.5, null, 7),
  ('menu-tiras-pollo', 'Haz tu menú', 'Menú Tiras de pollo crujiente', 'Ensalada + patatas + refresco + salsa', 9.5, null, 8),
  ('menu-burrito', 'Haz tu menú', 'Menú Burrito (chicken wrap)', 'Ensalada + patatas + refresco + salsa', 9, null, 9),
  ('menu-pizza-variada-pequena', 'Haz tu menú', 'Menú Pizza variada (pequeña)', 'Patatas + refresco', 10.5, null, 10),
  ('menu-pizza-variada-mediana', 'Haz tu menú', 'Menú Pizza variada (mediana)', 'Patatas + refresco', 12.5, null, 11)
) as v(id, categoria_nombre, nombre, descripcion, precio, modificadores, orden)
join menu_categorias c on c.nombre = v.categoria_nombre
on conflict (id) do nothing;

-- Nombre/descripción en inglés, opcionales, para el selector de idioma del
-- kiosco (ver textos.js / SelectorIdioma.jsx). NULL = todavía sin traducir:
-- el kiosco en inglés cae de vuelta al texto en español (ver conIdioma() en
-- client/src/textos.js), así que dejar estas columnas vacías nunca rompe
-- nada, solo deja ese producto/categoría sin traducir hasta que alguien lo
-- rellene desde /carta.
alter table menu_categorias add column if not exists nombre_en text;
alter table menu_productos add column if not exists nombre_en text;
alter table menu_productos add column if not exists descripcion_en text;

