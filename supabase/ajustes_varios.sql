-- Pedido del cliente (21/10/2026): sección "Varios" en caja para añadir
-- conceptos escritos a mano con su precio (ej. "Extra de arroz" 6 €). Los
-- que se apuntan quedan guardados (por sede) como botones para reutilizar.
--
-- Se puede ejecutar ya. Sin esta columna "Varios" funciona igual, pero los
-- conceptos guardados solo se recuerdan en ese equipo. Seguro de re-ejecutar.

alter table ajustes add column if not exists varios jsonb not null default '[]'::jsonb;

-- Comprobación (solo lectura): tiene que salir la columna.
select column_name, data_type from information_schema.columns
where table_name = 'ajustes' and column_name = 'varios';
