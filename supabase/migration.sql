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
