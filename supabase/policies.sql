-- Políticas RLS para que la app (clave anon) pueda operar sobre "orders".
-- No se permite borrar pedidos desde la app.
-- Seguro de volver a ejecutar (usa DROP IF EXISTS antes de crear cada política).

alter table orders enable row level security;

drop policy if exists "orders_anon_select" on orders;
create policy "orders_anon_select" on orders
  for select to anon using (true);

drop policy if exists "orders_anon_insert" on orders;
create policy "orders_anon_insert" on orders
  for insert to anon with check (true);

drop policy if exists "orders_anon_update" on orders;
create policy "orders_anon_update" on orders
  for update to anon using (true) with check (true);
