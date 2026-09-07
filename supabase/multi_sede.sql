-- Soporte para 2 locales físicos (Villarcayo y Medina de Pomar) operando
-- el mismo TPV sin mezclar pedidos ni turnos de caja entre sí. La carta
-- sigue siendo una sola, compartida — solo se separan pedidos y turnos.
--
-- Columna nueva "local" en orders/turnos_caja: NULLABLE a propósito — los
-- pedidos/turnos de antes de esta función se quedan sin sede conocida (no
-- se puede inventar cuál era), y cualquier cliente que todavía no mande
-- el parámetro (durante el despliegue) sigue funcionando.
--
-- IMPORTANTE — corrige un bug real: "solo puede haber un turno de caja
-- abierto a la vez" era una regla GLOBAL (turnos_caja_unico_abierto_idx),
-- pensada para un único local. Con 2 locales operando en paralelo, esa
-- regla bloquearía al segundo en abrir turno mientras el primero ya tiene
-- uno abierto. Se sustituye por "un turno abierto por CADA sede" (los
-- valores NULL no cuentan como iguales entre sí en un índice único de
-- Postgres, así que turnos sin sede conocida tampoco quedan bloqueados).
--
-- Seguro de re-ejecutar.

alter table orders add column if not exists local text;
alter table turnos_caja add column if not exists local text;

drop index if exists turnos_caja_unico_abierto_idx;
create unique index if not exists turnos_caja_unico_abierto_por_local_idx
  on turnos_caja (local)
  where estado = 'abierto';
