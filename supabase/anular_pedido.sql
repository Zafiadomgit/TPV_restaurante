-- El cliente pidió poder "borrar el pedido desde caja para que no quede
-- registrado el cobro" — eso es ocultar una venta ya cobrada de los
-- registros, así que no se implementa tal cual (ver conversación/SKILL.md).
-- En su lugar: ANULACIÓN con motivo — el pedido se queda para siempre en
-- el historial (nunca se borra), pero deja de contar como venta/efectivo
-- esperado. Solo se puede anular un pedido YA COBRADO, y hace falta un
-- motivo — es una acción de auditoría, no un borrado silencioso.
--
-- IMPORTANTE — orden de despliegue: columnas SQL nuevas, no un campo de
-- modificadores — este script va ANTES que el código que las usa (ver
-- SKILL.md, "Reorganización de carta — orden de despliegue").
--
-- Seguro de re-ejecutar.

alter table orders add column if not exists anulado boolean not null default false;
alter table orders add column if not exists anulado_motivo text;
alter table orders add column if not exists anulado_en timestamptz;
