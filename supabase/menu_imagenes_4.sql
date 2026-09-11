-- El cliente volvió a mandar las mismas 2 fotos de pizza genéricas
-- ("pizza grande/pequeña de la carta") reportando que "siguen sin
-- aparecer" — el motivo: solo se habían usado como portada de la
-- categoría "Pizzas" (menu_categorias_imagenes_3.sql), no en cada pizza
-- suelta dentro de la categoría. Este script las aplica también a los
-- 13 productos de pizza (mismo archivo para las 13, es la única foto
-- disponible — no es de un sabor concreto).
--
-- Incluye de nuevo la actualización de la categoría (idempotente) por
-- si menu_categorias_imagenes_3.sql tampoco llegó a ejecutarse.
--
-- No es cambio de esquema — script de datos normal, seguro de ejecutar
-- cuando quieras.
--
-- Seguro de re-ejecutar.

update menu_productos set imagen_url = '/menu/pizza-carta.webp'
where id in (
  'pizza-a-tu-gusto', 'pizza-barbacoa', 'pizza-california', 'pizza-carbonara',
  'pizza-cuatro-quesos', 'pizza-diavola', 'pizza-iberica', 'pizza-mediterranea',
  'pizza-merindades', 'pizza-pepperoni', 'pizza-romana', 'pizza-tono', 'pizza-vegetariana'
);

update menu_categorias set imagen_url = '/menu/pizza-carta.webp' where nombre = 'Pizzas';
