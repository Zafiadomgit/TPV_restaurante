-- Bug real reportado por el cliente: el tiempo de espera estimado
-- (ajustes.tiempo_espera_minutos) era una única fila global compartida
-- por las 2 sedes — un cajero cambiándolo en Villarcayo se lo pisaba al
-- de Medina de Pomar sin que ninguno de los dos se diera cuenta ("se
-- siguen cruzando los tiempos puestos por las cajas de diferentes
-- sedes"). Pasa a ser un ajuste POR SEDE, igual que orders/turnos_caja
-- (ver multi_sede.sql).
--
-- Se crea una fila nueva por sede (id 2 y 3), copiando el valor que
-- tuviera la fila global (id=1) para que el tiempo mostrado no cambie de
-- golpe al desplegar. La fila global (id=1, local null) se deja tal
-- cual como fallback de una pantalla vieja en caché justo después del
-- despliegue (ver client/api/ajustes.js) — no hace falta borrarla.
--
-- IMPORTANTE — orden de despliegue: columna SQL nueva (local), no un
-- campo de modificadores — este script va ANTES que el código que lo
-- usa (ver SKILL.md, "Reorganización de carta — orden de despliegue").
--
-- Seguro de re-ejecutar.

alter table ajustes add column if not exists local text;

create unique index if not exists ajustes_unico_por_local_idx
  on ajustes (local)
  where local is not null;

insert into ajustes (id, local, tiempo_espera_minutos)
select 2, 'villarcayo', tiempo_espera_minutos from ajustes where id = 1
on conflict (id) do nothing;

insert into ajustes (id, local, tiempo_espera_minutos)
select 3, 'medina-de-pomar', tiempo_espera_minutos from ajustes where id = 1
on conflict (id) do nothing;
