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

-- Políticas RLS para "turnos_caja". Tampoco se permite borrar turnos desde
-- la app (el histórico de caja se conserva siempre).
alter table turnos_caja enable row level security;

drop policy if exists "turnos_caja_anon_select" on turnos_caja;
create policy "turnos_caja_anon_select" on turnos_caja
  for select to anon using (true);

drop policy if exists "turnos_caja_anon_insert" on turnos_caja;
create policy "turnos_caja_anon_insert" on turnos_caja
  for insert to anon with check (true);

drop policy if exists "turnos_caja_anon_update" on turnos_caja;
create policy "turnos_caja_anon_update" on turnos_caja
  for update to anon using (true) with check (true);

-- Políticas RLS para "inventario". A diferencia de orders/turnos_caja, aquí
-- sí se permite borrar (es un catálogo vivo, no un histórico).
alter table inventario enable row level security;

drop policy if exists "inventario_anon_select" on inventario;
create policy "inventario_anon_select" on inventario
  for select to anon using (true);

drop policy if exists "inventario_anon_insert" on inventario;
create policy "inventario_anon_insert" on inventario
  for insert to anon with check (true);

drop policy if exists "inventario_anon_update" on inventario;
create policy "inventario_anon_update" on inventario
  for update to anon using (true) with check (true);

drop policy if exists "inventario_anon_delete" on inventario;
create policy "inventario_anon_delete" on inventario
  for delete to anon using (true);
