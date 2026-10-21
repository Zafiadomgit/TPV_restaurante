-- Pedido del cliente (21/10/2026): que el número de pedido se reinicie con
-- cada turno. Empieza en 40, llega hasta 999 y vuelve a 40; y cada vez que
-- se ABRE un turno de caja en una sede, esa sede vuelve a empezar en 40.
--
--  * Un contador por sede (Villarcayo y Medina llevan su propia numeración).
--  * El número lo pone la base de datos al crear el pedido (a la vez que
--    lo guarda), así dos pedidos simultáneos nunca reciben el mismo.
--  * Se quita la restricción de "número único para siempre" (ya no puede
--    serlo, porque los números se repiten de un turno a otro). Los pedidos
--    se siguen identificando por su id interno, no por el número.
--  * Los pedidos ya hechos conservan su número.
--
-- No hace falta desplegar nada: el código ya usa el número que devuelve la
-- base de datos. Seguro de re-ejecutar.

begin;

-- Contador por sede: último número dado.
create table if not exists contador_tickets (
  local text primary key,
  ultimo integer not null
);

-- Siguiente número de una sede: 40, 41, ... 999 y vuelta a 40.
create or replace function siguiente_ticket(p_local text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v integer;
begin
  insert into contador_tickets (local, ultimo) values (p_local, 39)
  on conflict (local) do nothing;
  update contador_tickets
     set ultimo = case when ultimo >= 999 or ultimo < 40 then 40 else ultimo + 1 end
   where local = p_local
  returning ultimo into v;
  return v;
end;
$$;

-- Al crear un pedido, su número sale del contador de su sede.
create or replace function asignar_ticket_numero() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.ticket_numero := siguiente_ticket(coalesce(new.local, 'sin-sede'));
  return new;
end;
$$;

drop trigger if exists orders_asignar_ticket_numero on orders;
create trigger orders_asignar_ticket_numero
  before insert on orders
  for each row execute function asignar_ticket_numero();

-- Al abrir un turno en una sede, su numeración vuelve a empezar en 40.
create or replace function reiniciar_ticket_al_abrir_turno() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into contador_tickets (local, ultimo) values (coalesce(new.local, 'sin-sede'), 39)
  on conflict (local) do update set ultimo = 39;
  return new;
end;
$$;

drop trigger if exists turnos_caja_reiniciar_ticket on turnos_caja;
create trigger turnos_caja_reiniciar_ticket
  after insert on turnos_caja
  for each row execute function reiniciar_ticket_al_abrir_turno();

-- Los números ya no son únicos para siempre.
alter table orders drop constraint if exists orders_ticket_numero_key;

commit;

-- Comprobación (solo lectura): tienen que salir los dos disparadores.
select tgname from pg_trigger
where tgname in ('orders_asignar_ticket_numero', 'turnos_caja_reiniciar_ticket');
