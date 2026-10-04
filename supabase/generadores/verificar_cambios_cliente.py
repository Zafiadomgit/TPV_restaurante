"""Genera supabase/verificar_cambios_cliente_carta.sql: consulta de SOLO
LECTURA que repasa, contra la base de datos real, cada punto de la lista del
cliente que depende de la carta (precios, productos, descripciones, opciones,
fotos). Devuelve una fila por punto con lo esperado, lo que hay y ✅/❌.

Uso:  python3 supabase/generadores/verificar_cambios_cliente.py
"""
from pathlib import Path

SALIDA = Path(__file__).resolve().parents[1] / "verificar_cambios_cliente_carta.sql"

filas = []  # (orden, sección, punto, expresión SQL de "actual" como texto, esperado como texto)


def fila(seccion, punto, actual_sql, esperado):
    filas.append((len(filas) + 1, seccion, punto, actual_sql, esperado))


def precio_menu(pid, opcion="en-menu"):
    return (f"(select round((o->>'precioBase')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, "
            f"jsonb_array_elements(s->'opciones') o where p.id = '{pid}' and s->>'id' = 'menu' and o->>'id' = '{opcion}')")


def campo(pid, col):
    if col == "precio":
        return f"(select round(precio, 2)::text from menu_productos where id = '{pid}')"
    return f"(select {col}::text from menu_productos where id = '{pid}')"


def tiene_paso(pid, paso):
    return (f"(select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s "
            f"where p.id = '{pid}' and s->>'id' = '{paso}')")


def tiene_opcion(pid, paso, opcion):
    return (f"(select case when count(*) > 0 then 'sí' else 'no' end from menu_productos p, jsonb_array_elements(p.modificadores) s, "
            f"jsonb_array_elements(s->'opciones') o where p.id = '{pid}' and s->>'id' = '{paso}' and o->>'id' = '{opcion}')")


def precio_opcion(pid, paso, opcion):
    return (f"(select round((o->>'precioExtra')::numeric, 2)::text from menu_productos p, jsonb_array_elements(p.modificadores) s, "
            f"jsonb_array_elements(s->'opciones') o where p.id = '{pid}' and s->>'id' = '{paso}' and o->>'id' = '{opcion}')")


def recargo_quitar(pid):
    # precioSiTodoQuitado - precio, y que se dispare con lechuga y con repollo y zanahoria
    return (f"(select round((s->>'precioSiTodoQuitado')::numeric - p.precio, 2)::text || case when s->'disparadoresPrecioAlternativo' "
            f"@> '[\"sin-lechuga\",\"sin-repollo-zanahoria\"]' then ' (lechuga y repollo)' else ' (sin disparadores)' end "
            f"from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = '{pid}' and s->>'id' = 'quitar')")


def cat_img(nombre):
    return f"(select imagen_url from menu_categorias where nombre = '{nombre}')"


def n(v):
    return ("%.2f" % v)


FAM = {
    "kebab": ("Kebab", 7.5, 8, 9.5, (7.5, 10.5), "/menu/kebab.webp", "/menu/kebab-falafel.webp", "/menu/kebab.webp"),
    "durum": ("Dürüm", 8.5, 9, 10.5, (9, 11.5), "/menu/durum.webp", "/menu/durum-falafel.webp", "/menu/durum-loco.webp"),
    "lahmacum": ("Lahmacun", 9.5, 10, 11.5, (9.5, 12.5), "/menu/lahmacun.webp", "/menu/lahmacun-falafel.webp", "/menu/lahmacun.webp"),
}
for pre, (sec, menu, menu_fal, menu_doble, dsc, img, img_fal, img_loco) in FAM.items():
    for sabor in ["ternera", "pollo", "mixto", "falafel", "vegetal-queso", "solo-carne", "loco", "doble"]:
        fila(sec, f"Foto {pre}-{sabor}", campo(f"{pre}-{sabor}", "imagen_url"),
             img_fal if sabor == "falafel" else img_loco if sabor == "loco" else img)
    for sabor in ["ternera", "pollo", "mixto", "falafel", "vegetal-queso", "doble"]:
        fila(sec, f"Quitar lechuga / repollo y zanahoria +1 € ({sabor})", recargo_quitar(f"{pre}-{sabor}"), "1.00 (lechuga y repollo)")
    fila(sec, "Solo carne: descripción sin verduras", campo(f"{pre}-solo-carne", "descripcion"), "Carne + salsas")
    fila(sec, "Solo carne: sin quitar ingredientes", tiene_paso(f"{pre}-solo-carne", "quitar"), "no")
    fila(sec, "Loco: descripción sin verduras", campo(f"{pre}-loco", "descripcion"), "Carne y patatas fritas dentro + salsas")
    fila(sec, "Loco: sin quitar ingredientes", tiene_paso(f"{pre}-loco", "quitar"), "no")
    fila(sec, "Vegetal: queso en la descripción", campo(f"{pre}-vegetal-queso", "descripcion"),
         "Lechuga, tomate, cebolla, repollo y zanahoria, queso gouda + salsas")
    fila(sec, "Vegetal: 'Sin queso' en quitar", tiene_opcion(f"{pre}-vegetal-queso", "quitar", "sin-queso"), "sí")
    for sabor in ["ternera", "pollo", "mixto", "vegetal-queso", "loco"]:
        fila(sec, f"Menú {sabor} {n(menu)} €", precio_menu(f"{pre}-{sabor}"), n(menu))
    fila(sec, f"Menú falafel {n(menu_fal)} €", precio_menu(f"{pre}-falafel"), n(menu_fal))
    fila(sec, f"Menú doble {n(menu_doble)} €", precio_menu(f"{pre}-doble"), n(menu_doble))
    fila(sec, f"Doble solo carne: existe y está activo", campo(f"{pre}-doble-solo-carne", "activo"), "true")
    fila(sec, f"Doble solo carne: precio solo {n(dsc[0])} €", campo(f"{pre}-doble-solo-carne", "precio"), n(dsc[0]))
    fila(sec, f"Doble solo carne: precio menú {n(dsc[1])} €", precio_menu(f"{pre}-doble-solo-carne"), n(dsc[1]))

sec = "Platos combinados"
for pid in ["plato-solo-carne", "plato-solo-carne-queso", "plato-arroz-carne"]:
    fila(sec, f"{pid}: sin quitar ingredientes", tiene_paso(pid, "quitar"), "no")
fila(sec, "Descripción solo carne sin verdura", campo("plato-solo-carne", "descripcion"), "Carne + salsas, patatas y pan")
fila(sec, "Descripción solo carne con queso sin verdura", campo("plato-solo-carne-queso", "descripcion"), "Carne con queso + salsas, patatas y pan")
fila(sec, "Descripción arroz sin verdura", campo("plato-arroz-carne", "descripcion"), "Arroz, carne + salsas, patatas y pan")
for pid in ["plato-ternera", "plato-pollo", "plato-mixto", "plato-falafel", "plato-doble"]:
    fila(sec, f"{pid}: arroz basmati +3,50 €", precio_opcion(pid, "extras", "arroz-basmati"), "3.50")
fila(sec, "Foto plato doble", campo("plato-doble", "imagen_url"), "/menu/plato-carne-queso.webp")
fila(sec, "Nombre plato solo carne", campo("plato-solo-carne", "nombre"), "Plato solo carne y patatas")
fila(sec, "Nombre plato solo carne con queso", campo("plato-solo-carne-queso", "nombre"), "Plato solo carne con queso y patatas")
fila(sec, "Nombre plato de arroz", campo("plato-arroz-carne", "nombre"), "Plato de arroz con carne y patatas")
fila(sec, "Plato de carne con queso quitado", campo("plato-carne-queso", "activo"), "false")
fila(sec, "Plato doble solo carne y patatas: activo", campo("plato-doble-solo-carne", "activo"), "true")
fila(sec, "Plato doble solo carne y patatas: solo 14 €", campo("plato-doble-solo-carne", "precio"), "14.00")
fila(sec, "Plato doble solo carne y patatas: menú 15,50 €", precio_menu("plato-doble-solo-carne"), "15.50")
for pid in ["plato-ternera", "plato-pollo", "plato-mixto", "plato-falafel", "plato-solo-carne", "plato-solo-carne-queso",
            "plato-arroz-carne", "plato-doble", "plato-doble-solo-carne"]:
    fila(sec, f"{pid}: menú sin patatas (solo + bebida)", tiene_paso(pid, "tipo-patatas"), "no")

sec = "Pedratas"
for t in ["pequena", "mediana", "grande", "xxl"]:
    fila(sec, f"Foto nueva pedratas-{t}", campo(f"pedratas-{t}", "imagen_url"), f"/menu/pedratas-{t}.webp")

fila("Falafel", "Salsas aparte en falafel", tiene_paso("falafel-porcion", "salsas-aparte"), "sí")

sec = "Zona crujiente"
for pid in ["alitas-pollo", "nuggets-pollo", "palomitas-pollo", "tiras-pollo", "tarrina-arroz-falafel"]:
    fila(sec, f"{pid}: sin menú", tiene_paso(pid, "menu"), "no")
fila(sec, "burrito: mantiene menú", tiene_paso("burrito", "menu"), "sí")
for pid in ["alitas-pollo", "nuggets-pollo", "palomitas-pollo", "tiras-pollo"]:
    fila(sec, f"{pid}: + ensalada 2,50 €", precio_opcion(pid, "ensalada", "con-ensalada"), "2.50")
    fila(sec, f"{pid}: quitar ingredientes de la ensalada (solo si la eligen)",
         f"(select s->'mostrarSi'->>'opcion' from menu_productos p, jsonb_array_elements(p.modificadores) s where p.id = '{pid}' and s->>'id' = 'quitar')",
         "con-ensalada")

for pid in ["ensalada-merindades", "ensalada-california", "ensalada-cocktail"]:
    fila("Ensaladas", f"{pid}: sin menú", tiene_paso(pid, "menu"), "no")
fila("Pollo asado", "Pollo asado: sin menú", tiene_paso("pollo-asado", "menu"), "no")

for s in ["salsa-blanca", "salsa-roja", "salsa-picante"]:
    fila("Salsas", f"Tarrina propia en {s}", campo(s, "imagen_url"), f"/menu/{s}.webp")

fila("Fotos que faltaban", "Foto categoría Kebab", cat_img("Kebab"), "/menu/kebab.webp")
fila("Fotos que faltaban", "Foto categoría Lahmacum", cat_img("Lahmacum"), "/menu/lahmacun.webp")

partes = []
for orden, seccion, punto, actual, esperado in filas:
    e = esperado.replace("'", "''")
    partes.append(f"  select {orden} as n, '{seccion}' as seccion, '{punto.replace(chr(39), chr(39)*2)}' as punto, '{e}' as esperado, {actual} as actual")

sql = """-- SOLO LECTURA — no cambia nada. Ejecútalo DESPUÉS de
-- menu_cambios_cliente_carta.sql para repasar el checklist del cliente
-- contra la base de datos real: una fila por punto, con lo esperado, lo que
-- hay de verdad y ✅/❌. Debería salir todo ✅; si algo sale ❌, pásame la fila.
-- (Los puntos que son solo de pantalla —vídeo, fondo, "Más pedido", pizzas,
-- hamburguesas, efecto al añadir, "+1 €" visible— no viven en la base de
-- datos: se comprueban mirando el kiosco una vez desplegado.)
-- GENERADO por supabase/generadores/verificar_cambios_cliente.py.

with comprobaciones as (
""" + "\n  union all\n".join(partes) + """
)
select
  case when actual is not distinct from esperado then '✅' else '❌' end as ok,
  seccion,
  punto,
  esperado,
  coalesce(actual, '(no existe)') as actual
from comprobaciones
order by (actual is not distinct from esperado), n;
"""
SALIDA.write_text(sql)
print("escrito", SALIDA, len(filas), "comprobaciones")
