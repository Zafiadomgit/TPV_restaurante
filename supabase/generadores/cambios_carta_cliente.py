"""Genera supabase/menu_cambios_cliente_carta.sql a partir del estado de
modificadores que dejó supabase/menu_en_menu_o_no.sql (el último script que
reescribió por completo los 47 productos de Kebab, Dürüm, Lahmacum, Platos
combinados, Zona crujiente, Hamburguesas, Perrito caliente, Pollo asado y
Ensaladas) + supabase/menu_reorg_5 (falafel de Complementos).

Se genera en vez de escribirse a mano para no equivocar ni un precio en los
~40 productos que cambian. Uso:  python3 supabase/generadores/cambios_carta_cliente.py
"""
import copy
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SALIDA = RAIZ / "menu_cambios_cliente_carta.sql"


def cargar_base():
    sql = (RAIZ / "menu_en_menu_o_no.sql").read_text()
    base = {}
    for m in re.finditer(r"update menu_productos set modificadores = '(.*?)'::jsonb where id = '([^']*)'", sql, re.S):
        base[m.group(2)] = json.loads(m.group(1).replace("''", "'"))
    sql5 = (RAIZ / "menu_reorg_5_patatas_zona_crujiente_complementos.sql").read_text()

    def mods_de_linea(pid):
        linea = next(l for l in sql5.splitlines() if l.endswith(f"where id = '{pid}';") and "modificadores = '" in l)
        return json.loads(linea.split("modificadores = '", 1)[1].split("'::jsonb", 1)[0].replace("''", "'"))

    base["falafel-porcion"] = mods_de_linea("falafel-porcion")
    patatas = mods_de_linea("patatas-fritas-pequena")
    base["_salsas_aparte"] = next(p for p in patatas if p["id"] == "salsas-aparte")
    return base


BASE = cargar_base()


def paso(mods, pid):
    return next((p for p in mods if p["id"] == pid), None)


def sin_pasos(mods, *ids):
    return [p for p in mods if p["id"] not in ids]


def precio_menu(mods, solo=None, en_menu=None):
    menu = paso(mods, "menu")
    for o in menu["opciones"]:
        if o["id"] == "solo" and solo is not None:
            o["precioBase"] = solo
        if o["id"] == "en-menu" and en_menu is not None:
            o["precioBase"] = en_menu


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(",", ":")).replace("'", "''")


def txt(v):
    return "null" if v is None else "'" + v.replace("'", "''") + "'"


def num(v):
    return ("%.2f" % v).rstrip("0").rstrip(".")


sentencias = []  # (comentario, sql)


def update_mods(pid, mods, **campos):
    sets = [f"modificadores = '{js(mods)}'::jsonb"]
    for k, v in campos.items():
        sets.append(f"{k} = {num(v) if isinstance(v, (int, float)) else txt(v)}")
    sentencias.append(f"update menu_productos set {', '.join(sets)} where id = '{pid}';")


def update_campos(pid, **campos):
    sets = [f"{k} = {num(v) if isinstance(v, (int, float)) else txt(v)}" for k, v in campos.items()]
    sentencias.append(f"update menu_productos set {', '.join(sets)} where id = '{pid}';")


def insert_producto(pid, categoria, nombre, nombre_en, descripcion, descripcion_en, precio, mods, orden, imagen):
    sentencias.append(
        "insert into menu_productos (id, categoria_id, nombre, nombre_en, descripcion, descripcion_en, precio, modificadores, orden, imagen_url, activo)\n"
        f"select '{pid}', id, {txt(nombre)}, {txt(nombre_en)}, {txt(descripcion)}, {txt(descripcion_en)}, {num(precio)}, '{js(mods)}'::jsonb, {orden}, {txt(imagen)}, true\n"
        f"from menu_categorias where nombre = {txt(categoria)}\n"
        "on conflict (id) do update set\n"
        "  categoria_id = excluded.categoria_id,\n  nombre = excluded.nombre,\n  nombre_en = excluded.nombre_en,\n"
        "  descripcion = excluded.descripcion,\n  descripcion_en = excluded.descripcion_en,\n  precio = excluded.precio,\n"
        "  modificadores = excluded.modificadores,\n  orden = excluded.orden,\n  imagen_url = excluded.imagen_url,\n  activo = true;"
    )


def comentario(t):
    sentencias.append("\n" + "\n".join("-- " + l if l else "--" for l in t.strip().split("\n")))


# ---------------------------------------------------------------------------
# KEBAB / DÜRÜM / LAHMACUM
# ---------------------------------------------------------------------------
FAMILIAS = {
    # prefijo id: (categoría, nombre, nombre_en, imagen normal, imagen falafel, imagen loco,
    #              menú normal, menú falafel, menú doble, doble solo carne (solo, menú), menú solo carne)
    "kebab": dict(cat="Kebab", nombre="Kebab", en="kebab", img="/menu/kebab.webp", img_falafel="/menu/kebab-falafel.webp",
                  img_loco="/menu/kebab.webp", menu=7.5, menu_falafel=8, menu_doble=9.5, dsc=(7.5, 10), menu_solo_carne=8.5),
    "durum": dict(cat="Dürüm", nombre="Dürüm", en="dürüm", img="/menu/durum.webp", img_falafel="/menu/durum-falafel.webp",
                  img_loco="/menu/durum-loco.webp", menu=8.5, menu_falafel=9, menu_doble=10.5, dsc=(9, 11.5), menu_solo_carne=9.5),
    "lahmacum": dict(cat="Lahmacum", nombre="Lahmacum", en="lahmacum", img="/menu/lahmacun.webp", img_falafel="/menu/lahmacun-falafel.webp",
                     img_loco="/menu/lahmacun.webp", menu=9.5, menu_falafel=10, menu_doble=11.5, dsc=(9.5, 12.5), menu_solo_carne=10.5),
}

DESC_SOLO_CARNE = ("Carne + salsas", "Meat + sauces")
DESC_LOCO = ("Carne y patatas fritas dentro + salsas", "Meat and fries inside + sauces")
DESC_VEGETAL = ("Lechuga, tomate, cebolla, repollo y zanahoria, queso gouda + salsas",
                "Lettuce, tomato, onion, cabbage and carrot, gouda cheese + sauces")
DESC_DOBLE_SOLO_CARNE = ("Doble de carne + salsas", "Double meat + sauces")

SIN_QUESO = {"id": "sin-queso", "nombre": "Sin queso", "porDefecto": False, "ingrediente": "queso", "precioExtra": 0}

for pre, f in FAMILIAS.items():
    comentario(f"""{f['cat']}
Precios "En menú": ternera/pollo/mixto/vegetal/loco {num(f['menu'])} €, falafel {num(f['menu_falafel'])} €, doble {num(f['menu_doble'])} €.
Nuevo "{f['nombre']} doble solo carne": solo {num(f['dsc'][0])} €, menú {num(f['dsc'][1])} €.
"{f['nombre']} solo carne" en menú -> {num(f['menu_solo_carne'])} € (el cliente no lo mencionó; ver nota arriba).""")
    for sabor in ["ternera", "pollo", "mixto", "vegetal-queso", "loco"]:
        pid = f"{pre}-{sabor}"
        mods = copy.deepcopy(BASE[pid])
        precio_menu(mods, en_menu=f["menu"])
        campos = {"imagen_url": f["img_loco"] if sabor == "loco" else f["img"]}
        if sabor == "vegetal-queso":
            quitar = paso(mods, "quitar")
            if not any(o["id"] == "sin-queso" for o in quitar["opciones"]):
                quitar["opciones"].append(copy.deepcopy(SIN_QUESO))
            campos["descripcion"], campos["descripcion_en"] = DESC_VEGETAL
        if sabor == "loco":
            campos["descripcion"], campos["descripcion_en"] = DESC_LOCO
        update_mods(pid, mods, **campos)

    mods = copy.deepcopy(BASE[f"{pre}-falafel"])
    precio_menu(mods, en_menu=f["menu_falafel"])
    update_mods(f"{pre}-falafel", mods, imagen_url=f["img_falafel"])

    mods = copy.deepcopy(BASE[f"{pre}-solo-carne"])
    precio_menu(mods, en_menu=f["menu_solo_carne"])
    update_mods(f"{pre}-solo-carne", mods, descripcion=DESC_SOLO_CARNE[0], descripcion_en=DESC_SOLO_CARNE[1], imagen_url=f["img"])

    # Doble: quitar lechuga o repollo y zanahoria pasa a costar +1 € (precio
    # del doble solo carne), igual que en el resto de sabores.
    mods = copy.deepcopy(BASE[f"{pre}-doble"])
    precio_menu(mods, en_menu=f["menu_doble"])
    quitar = paso(mods, "quitar")
    quitar["precioSiTodoQuitado"] = f["dsc"][0]
    quitar["disparadoresPrecioAlternativo"] = ["sin-lechuga", "sin-repollo-zanahoria"]
    update_mods(f"{pre}-doble", mods, imagen_url=f["img"])

    # Doble solo carne (nuevo): mismos pasos que "solo carne" (sin quitar
    # ingredientes), con sus precios propios.
    mods = copy.deepcopy(BASE[f"{pre}-solo-carne"])
    precio_menu(mods, solo=f["dsc"][0], en_menu=f["dsc"][1])
    insert_producto(f"{pre}-doble-solo-carne", f["cat"], f"{f['nombre']} doble solo carne",
                    f"Double meat-only {f['en']}", DESC_DOBLE_SOLO_CARNE[0], DESC_DOBLE_SOLO_CARNE[1],
                    f["dsc"][0], mods, 8, f["img"])

# ---------------------------------------------------------------------------
# PLATOS COMBINADOS
# ---------------------------------------------------------------------------
comentario("""Platos combinados
- "En menú" pasa a ser solo + bebida (sin patatas): se quita el paso "Tus patatas" y se renombra la opción. Precios sin cambio.
- Solo carne / solo carne con queso / arroz con carne: sin verduras (descripción y quitar ingredientes) y nombre "... y patatas".
- Ternera, pollo, mixto, falafel y doble: extra "Arroz basmati" +3,50 €.
- Plato doble: foto. Plato de carne con queso: se desactiva (desaparece del kiosco y de caja; reactivable desde /carta).
- Nuevo "Plato doble solo carne y patatas": 14 € / menú 15,50 €.""")

ARROZ = {"id": "arroz-basmati", "nombre": "Arroz basmati", "porDefecto": False, "precioExtra": 3.5}


def plato_menu_solo_bebida(mods):
    mods = sin_pasos(mods, "tipo-patatas")
    for o in paso(mods, "menu")["opciones"]:
        if o["id"] == "en-menu":
            o["nombre"] = "En menú (+ bebida)"
    return mods


for pid in ["plato-ternera", "plato-pollo", "plato-mixto", "plato-falafel", "plato-doble"]:
    mods = plato_menu_solo_bebida(copy.deepcopy(BASE[pid]))
    extras = paso(mods, "extras")
    if not any(o["id"] == "arroz-basmati" for o in extras["opciones"]):
        extras["opciones"].append(copy.deepcopy(ARROZ))
    campos = {"imagen_url": "/menu/plato-carne-queso.webp"} if pid == "plato-doble" else {}
    update_mods(pid, mods, **campos)

PLATOS_SIN_VERDURA = {
    "plato-solo-carne": ("Plato solo carne y patatas", "Meat-only platter with fries",
                         "Carne + salsas, patatas y pan", "Meat + sauces, fries and bread"),
    "plato-solo-carne-queso": ("Plato solo carne con queso y patatas", "Meat-only platter with cheese and fries",
                               "Carne con queso + salsas, patatas y pan", "Meat with cheese + sauces, fries and bread"),
    "plato-arroz-carne": ("Plato de arroz con carne y patatas", "Rice platter with meat and fries",
                          "Arroz, carne + salsas, patatas y pan", "Rice, meat + sauces, fries and bread"),
}
for pid, (nombre, nombre_en, desc, desc_en) in PLATOS_SIN_VERDURA.items():
    mods = plato_menu_solo_bebida(sin_pasos(copy.deepcopy(BASE[pid]), "quitar"))
    update_mods(pid, mods, nombre=nombre, nombre_en=nombre_en, descripcion=desc, descripcion_en=desc_en)

sentencias.append("update menu_productos set activo = false where id = 'plato-carne-queso';")

mods = plato_menu_solo_bebida(sin_pasos(copy.deepcopy(BASE["plato-doble"]), "quitar"))
precio_menu(mods, solo=14, en_menu=15.5)
insert_producto("plato-doble-solo-carne", "Platos combinados", "Plato doble solo carne y patatas",
                "Double meat-only platter with fries", "Doble de carne + salsas, patatas y pan",
                "Double meat + sauces, fries and bread", 14, mods, 9, "/menu/plato-solo-carne.webp")

# ---------------------------------------------------------------------------
# ZONA CRUJIENTE / ENSALADAS / POLLO ASADO: sin "En menú"
# ---------------------------------------------------------------------------
comentario("""Zona crujiente: sin opción de menú salvo el burrito.
Alitas, nuggets, palomitas y tiras: opción "Con ensalada" +2,50 € y, solo si se elige, "Quitar ingredientes de la ensalada".""")

ENSALADA = {"id": "ensalada", "titulo": "¿Con ensalada?", "tipo": "multiple",
            "opciones": [{"id": "con-ensalada", "nombre": "Con ensalada", "porDefecto": False, "precioExtra": 2.5}]}
QUITAR_ENSALADA = {"id": "quitar", "titulo": "Quitar ingredientes de la ensalada", "tipo": "multiple",
                   "mostrarSi": {"paso": "ensalada", "opcion": "con-ensalada"},
                   "opciones": [
                       {"id": "sin-lechuga", "nombre": "Sin lechuga", "porDefecto": False, "ingrediente": "lechuga", "precioExtra": 0},
                       {"id": "sin-tomate", "nombre": "Sin tomate", "porDefecto": False, "ingrediente": "tomate", "precioExtra": 0},
                       {"id": "sin-cebolla", "nombre": "Sin cebolla", "porDefecto": False, "ingrediente": "cebolla", "precioExtra": 0},
                       {"id": "sin-repollo-zanahoria", "nombre": "Sin repollo y zanahoria", "porDefecto": False,
                        "ingrediente": "repollo y zanahoria", "precioExtra": 0}]}

SIN_MENU = ("menu", "tipo-patatas", "bebida")
for pid in ["alitas-pollo", "nuggets-pollo", "palomitas-pollo", "tiras-pollo"]:
    # La ensalada va primero: al marcarla, "Quitar ingredientes de la
    # ensalada" aparece justo debajo, a la vista, sin tener que bajar hasta
    # el final del modal.
    mods = [copy.deepcopy(ENSALADA), copy.deepcopy(QUITAR_ENSALADA)] + sin_pasos(copy.deepcopy(BASE[pid]), *SIN_MENU)
    update_mods(pid, mods)
update_mods("tarrina-arroz-falafel", sin_pasos(copy.deepcopy(BASE["tarrina-arroz-falafel"]), *SIN_MENU))

comentario("Ensaladas y Pollo asado: sin opción de menú.")
for pid in ["ensalada-merindades", "ensalada-california", "ensalada-cocktail", "pollo-asado"]:
    update_mods(pid, sin_pasos(copy.deepcopy(BASE[pid]), *SIN_MENU))

# ---------------------------------------------------------------------------
# COMPLEMENTOS / PEDRATAS / SALSAS / FOTOS DE CATEGORÍA
# ---------------------------------------------------------------------------
comentario("Falafel (Complementos): tarrinas de salsa aparte (+1 € cada una), como en patatas.")
mods = copy.deepcopy(BASE["falafel-porcion"])
if not paso(mods, "salsas-aparte"):
    mods.append(copy.deepcopy(BASE["_salsas_aparte"]))
update_mods("falafel-porcion", mods)

comentario("Pedratas: fotos nuevas (sin el fondo negro; el envase se ve más grande cuanto mayor es el tamaño).")
for t in ["pequena", "mediana", "grande", "xxl"]:
    update_campos(f"pedratas-{t}", imagen_url=f"/menu/pedratas-{t}.webp")

comentario("Salsas: una tarrina en cada producto (antes las 3 compartían la foto de las 3 tarrinas juntas).")
for s in ["salsa-blanca", "salsa-roja", "salsa-picante"]:
    update_campos(s, imagen_url=f"/menu/{s}.webp")

comentario("Fotos de categoría que faltaban.")
sentencias.append("update menu_categorias set imagen_url = '/menu/kebab.webp' where nombre = 'Kebab';")
sentencias.append("update menu_categorias set imagen_url = '/menu/lahmacun.webp' where nombre = 'Lahmacum';")

CABECERA = """-- Cambios de carta pedidos por el cliente (lista de septiembre 2026).
-- GENERADO por supabase/generadores/cambios_carta_cliente.py — no editar a
-- mano; cambia el generador y vuelve a ejecutarlo.
--
-- ORDEN DE DESPLIEGUE: desplegar PRIMERO el código (las fotos nuevas de
-- client/public/menu/ tienen que existir antes de que la carta apunte a
-- ellas) y DESPUÉS ejecutar este script en el SQL Editor de Supabase. No
-- añade columnas ni campos de modificadores nuevos (mostrarSi,
-- precioSiTodoQuitado, disparadoresPrecioAlternativo ya existían).
--
-- NOTA para confirmar con el cliente: pidió precios de "En menú" para
-- ternera/pollo/mixto/vegetal/loco, falafel, doble y doble solo carne, pero
-- no para "solo carne". Se le pone el mismo recargo que al resto de su
-- categoría (kebab +3 € -> 8,50 €, dürüm +2,50 € -> 9,50 €, lahmacum +3 € ->
-- 10,50 €) para que no quede más caro que el doble en menú. Así, además,
-- "ternera sin lechuga en menú" (menú + 1 €) cuesta lo mismo que "solo carne
-- en menú". Única excepción que no cuadra al céntimo: kebab doble en menú
-- sin lechuga = 9,50 + 1 = 10,50 € frente a 10 € del "kebab doble solo
-- carne" en menú (precio dado por el cliente).
--
-- Seguro de re-ejecutar (updates + insert ... on conflict).

begin;
"""

SALIDA.write_text(CABECERA + "\n".join(sentencias) + "\n\ncommit;\n")
print("escrito", SALIDA, len(sentencias), "sentencias")
