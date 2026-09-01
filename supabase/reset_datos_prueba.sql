-- Borra todos los pedidos y cierres/arqueos de caja de PRUEBA para dejar
-- el sistema "de cero" antes de que el cliente empiece a usarlo de verdad.
--
-- NO toca el menú (menu_categorias / menu_productos) — esa es la carta
-- real del negocio, no datos de muestra, y no se borra aquí.
--
-- ⚠️ IRREVERSIBLE: borra para siempre todo el historial de pedidos
-- (cocina, historial, checkout) y todos los turnos de caja (apertura/
-- cierre/arqueo). Ejecuta esto solo cuando ya no necesites conservar
-- ese historial de pruebas.

-- Los pedidos van primero: cada uno puede apuntar a un turno de caja
-- (orders.turno_caja_id) sin borrado en cascada, así que hay que
-- borrar los pedidos antes de poder borrar los turnos.
delete from orders;
delete from turnos_caja;

-- Reinicia la numeración de tickets para que el primer pedido real
-- vuelva a ser #A-1 en vez de seguir donde se quedaron las pruebas.
alter sequence orders_ticket_numero_seq restart with 1;
