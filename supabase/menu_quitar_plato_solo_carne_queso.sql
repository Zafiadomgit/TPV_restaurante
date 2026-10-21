-- Pedido del cliente (21/10/2026): quitar "Plato solo carne con queso y
-- patatas" (10 €): es lo mismo que "Plato solo carne y patatas" (9 €) +
-- "Extra queso" (+1 €). Se oculta (no se borra): se puede reactivar desde
-- la Carta. Seguro de re-ejecutar.

update menu_productos set activo = false where id = 'plato-solo-carne-queso';

-- Comprobación (solo lectura): tiene que salir activo = false.
select id, nombre, activo from menu_productos where id = 'plato-solo-carne-queso';
