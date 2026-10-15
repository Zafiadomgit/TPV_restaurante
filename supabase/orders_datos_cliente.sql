-- Pedido del cliente (15/10/2026): en caja, para los pedidos "Para llevar"
-- y "Recoger en tienda", guardar nombre, teléfono y dirección del cliente
-- con el pedido (columnas propias, no en la nota). El teléfono se guarda
-- solo con cifras, y con él caja rellena sola el nombre y la dirección la
-- próxima vez que ese cliente pida.
--
-- Se puede ejecutar ya (el código funciona con o sin estas columnas: sin
-- ellas el pedido se guarda igual, pero sin los datos del cliente).
-- Seguro de re-ejecutar.

alter table orders add column if not exists cliente_nombre text;
alter table orders add column if not exists cliente_telefono text;
alter table orders add column if not exists cliente_direccion text;

create index if not exists orders_cliente_telefono_idx
  on orders (cliente_telefono, creado_en desc)
  where cliente_telefono is not null;

-- Comprobación (solo lectura): tienen que salir las 3 columnas.
select column_name from information_schema.columns
where table_name = 'orders' and column_name like 'cliente_%'
order by column_name;
