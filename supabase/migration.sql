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
