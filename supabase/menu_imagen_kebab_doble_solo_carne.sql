-- Kebab doble solo carne: a petición del cliente, misma foto que el kebab
-- solo carne (la foto ya está desplegada en client/public/menu/).
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/kebab-solo-carne-ia.webp' where id = 'kebab-doble-solo-carne';

-- Comprobación (solo lectura): tiene que salir /menu/kebab-solo-carne-ia.webp.
select id, imagen_url from menu_productos where id = 'kebab-doble-solo-carne';
