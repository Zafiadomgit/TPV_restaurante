-- Políticas RLS para que la app (clave anon) pueda operar sobre "orders".
-- No se permite borrar pedidos desde la app.

alter table orders enable row level security;

create policy "orders_anon_select" on orders
  for select to anon using (true);

create policy "orders_anon_insert" on orders
  for insert to anon with check (true);

create policy "orders_anon_update" on orders
  for update to anon using (true) with check (true);
