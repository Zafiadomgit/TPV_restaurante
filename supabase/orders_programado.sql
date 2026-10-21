-- Pedido del cliente (21/10/2026): pedidos programados desde caja
-- ("Recoger en tienda" / "A domicilio" con hora). Cocina no los ve hasta
-- 15 minutos antes de esa hora.
--
-- Se puede ejecutar ya (el código funciona con o sin esta columna: sin ella
-- el pedido se guarda igual pero sin hora, y va a cocina al momento).
-- Seguro de re-ejecutar.

alter table orders add column if not exists programado_para timestamptz;

-- Comprobación (solo lectura): tiene que salir la columna.
select column_name, data_type from information_schema.columns
where table_name = 'orders' and column_name = 'programado_para';
