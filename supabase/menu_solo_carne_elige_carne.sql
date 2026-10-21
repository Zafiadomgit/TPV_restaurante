-- Pedido del cliente (21/10/2026): los productos "solo carne" también piden
-- la carne (Ternera / Pollo / Mixto), obligatoria, justo después de "¿Cómo
-- lo quieres?". Sale siempre en la comanda. Seguro de re-ejecutar.

update menu_productos p
set modificadores = (
  select jsonb_agg(elem order by pos, sub)
  from (
    select paso as elem, pos, 0 as sub
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    union all
    select '{"id": "carne", "tipo": "unica", "titulo": "Elige la carne", "nota": "Elige 1 carne",
             "maxSeleccion": 1, "minSeleccion": 1, "siempreEnTexto": true,
             "opciones": [
               {"id": "ternera", "nombre": "Ternera", "nombreEn": "Beef", "porDefecto": false, "precioExtra": 0},
               {"id": "pollo", "nombre": "Pollo", "nombreEn": "Chicken", "porDefecto": false, "precioExtra": 0},
               {"id": "mixto", "nombre": "Mixto", "nombreEn": "Mixed", "porDefecto": false, "precioExtra": 0}
             ]}'::jsonb, pos, 1
    from jsonb_array_elements(p.modificadores) with ordinality as x(paso, pos)
    where paso->>'id' = 'menu'
  ) t
)
where p.id in ('kebab-solo-carne', 'durum-solo-carne', 'lahmacum-solo-carne', 'plato-solo-carne', 'plato-solo-carne-queso')
  and exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'menu')
  and not exists (select 1 from jsonb_array_elements(p.modificadores) s where s->>'id' = 'carne');

-- Comprobación (solo lectura): los 5 tienen que salir con "menu > carne > ...".
select id,
       (select string_agg(s->>'id', ' > ' order by pos)
        from jsonb_array_elements(modificadores) with ordinality x(s, pos)) as pasos
from menu_productos
where id in ('kebab-solo-carne', 'durum-solo-carne', 'lahmacum-solo-carne', 'plato-solo-carne', 'plato-solo-carne-queso')
order by id;
