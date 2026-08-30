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
