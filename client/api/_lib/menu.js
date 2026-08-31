// Carta real de California — Kebab, Hamburguesería, Pizzería (Medina de
// Pomar / Villarcayo). Reemplaza el menú de ejemplo anterior.

// ---- Modificadores compartidos: kebab / dürüm / lahmacum / plato ----
// Se aplican tanto a los productos sueltos como a sus versiones "menú" (ver
// categoría "Haz tu menú" más abajo) — es lo que pidió el dueño
// explícitamente. El repollo y la zanahoria se combinan en una sola opción
// porque en cocina van mezclados como un único ingrediente.
const QUITAR_INGREDIENTES = {
  id: "quitar",
  titulo: "Quitar ingredientes",
  tipo: "multiple",
  opciones: [
    { id: "sin-tomate", nombre: "Sin tomate", precioExtra: 0, porDefecto: false },
    { id: "sin-cebolla", nombre: "Sin cebolla", precioExtra: 0, porDefecto: false },
    { id: "sin-repollo-zanahoria", nombre: "Sin repollo y zanahoria", precioExtra: 0, porDefecto: false },
    { id: "sin-lechuga", nombre: "Sin lechuga", precioExtra: 0, porDefecto: false },
  ],
};

const EXTRAS_KEBAB = {
  id: "extras",
  titulo: "Extras",
  tipo: "multiple",
  opciones: [
    { id: "solo-carne", nombre: "Solo carne", precioExtra: 1, porDefecto: false },
    { id: "extra-salsa", nombre: "Extra salsa", precioExtra: 1, porDefecto: false },
    { id: "extra-queso", nombre: "Extra queso", precioExtra: 1, porDefecto: false },
  ],
};

const MODIFICADORES_KEBAB = [QUITAR_INGREDIENTES, EXTRAS_KEBAB];

const DESCR_KEBAB = "Lechuga, tomate, cebolla, repollo y zanahoria + salsas";
const DESCR_PLATO = "Lechuga, tomate, cebolla, repollo y zanahoria + salsas, patatas y pan";

export const menu = [
  {
    categoria: "Kebab",
    productos: [
      { id: "kebab-ternera", nombre: "Kebab de ternera", precio: 4.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "ternera-kebab" },
      { id: "kebab-pollo", nombre: "Kebab de pollo", precio: 4.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "pollo-kebab" },
      { id: "kebab-mixto", nombre: "Kebab mixto", precio: 4.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "kebab-falafel", nombre: "Kebab de falafel", precio: 5.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "falafel" },
      { id: "kebab-vegetal-queso", nombre: "Kebab vegetal con queso gouda", precio: 4.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "kebab-solo-carne", nombre: "Kebab solo carne", precio: 5.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "kebab-loco", nombre: "Kebab loco (con patatas dentro)", precio: 4.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "kebab-doble", nombre: "Kebab doble", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
    ],
  },
  {
    categoria: "Dürüm",
    productos: [
      { id: "durum-ternera", nombre: "Dürüm de ternera", precio: 6.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "ternera-kebab" },
      { id: "durum-pollo", nombre: "Dürüm de pollo", precio: 6.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "pollo-kebab" },
      { id: "durum-mixto", nombre: "Dürüm mixto", precio: 6.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "tortilla-durum" },
      { id: "durum-falafel", nombre: "Dürüm de falafel", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "falafel" },
      { id: "durum-vegetal-queso", nombre: "Dürüm vegetal con queso gouda", precio: 6.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "durum-solo-carne", nombre: "Dürüm solo carne", precio: 7.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "durum-loco", nombre: "Dürüm loco (con patatas dentro)", precio: 6.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "durum-doble", nombre: "Dürüm doble", precio: 8.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
    ],
  },
  {
    categoria: "Lahmacum",
    productos: [
      { id: "lahmacum-ternera", nombre: "Lahmacum de ternera", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "ternera-kebab" },
      { id: "lahmacum-pollo", nombre: "Lahmacum de pollo", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "pollo-kebab" },
      { id: "lahmacum-mixto", nombre: "Lahmacum mixto", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "lahmacum-falafel", nombre: "Lahmacum de falafel", precio: 7.0, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "falafel" },
      { id: "lahmacum-vegetal-queso", nombre: "Lahmacum vegetal con queso gouda", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "lahmacum-solo-carne", nombre: "Lahmacum solo carne", precio: 7.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "lahmacum-loco", nombre: "Lahmacum loco (con patatas dentro)", precio: 6.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
      { id: "lahmacum-doble", nombre: "Lahmacum doble", precio: 8.5, descripcion: DESCR_KEBAB, modificadores: MODIFICADORES_KEBAB },
    ],
  },
  {
    categoria: "Platos combinados",
    productos: [
      { id: "plato-ternera", nombre: "Plato de ternera", precio: 8.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "ternera-kebab" },
      { id: "plato-pollo", nombre: "Plato de pollo", precio: 8.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "pollo-kebab" },
      { id: "plato-mixto", nombre: "Plato mixto", precio: 8.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
      { id: "plato-falafel", nombre: "Plato de falafel", precio: 8.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB, ingredienteClave: "falafel" },
      { id: "plato-carne-queso", nombre: "Plato de carne con queso", precio: 9.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
      { id: "plato-solo-carne", nombre: "Plato solo carne", precio: 9.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
      { id: "plato-solo-carne-queso", nombre: "Plato solo carne con queso", precio: 10.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
      { id: "plato-arroz-carne", nombre: "Plato arroz con carne", precio: 8.5, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
      { id: "plato-doble", nombre: "Plato doble", precio: 12.0, descripcion: DESCR_PLATO, modificadores: MODIFICADORES_KEBAB },
    ],
  },
  {
    categoria: "Especialidades",
    productos: [
      { id: "pollo-asado", nombre: "Pollo asado", precio: 13.0, descripcion: "Con patatas fritas" },
      { id: "alitas-pollo", nombre: "Alitas de pollo (6 uds)", precio: 7.0, descripcion: "Con patatas fritas" },
      { id: "nuggets-pollo", nombre: "Nuggets de pollo (8 uds)", precio: 7.0, descripcion: "Con patatas fritas" },
      { id: "palomitas-pollo", nombre: "Palomitas de pollo (15 uds)", precio: 7.0, descripcion: "Con patatas fritas" },
      { id: "tiras-pollo", nombre: "Tiras de pollo crujiente (4 uds)", precio: 7.0, descripcion: "Con patatas fritas" },
      { id: "hamburguesa-pollo-crispy", nombre: "Hamburguesa pollo crispy", precio: 5.5, descripcion: "Pollo crispy, lechuga, tomate, queso, cebolla, ketchup y mayonesa" },
      { id: "hamburguesa-clasica", nombre: "Hamburguesa", precio: 4.5, descripcion: "Carne, lechuga, tomate, queso, cebolla, ketchup y mayonesa. +huevo o bacon +1€" },
      { id: "hamburguesa-xxl", nombre: "Hamburguesa XXL", precio: 7.0, descripcion: "Doble de carne, huevo frito, bacon crispy y doble de queso" },
      { id: "pedratas-pequena", nombre: "Pedratas pequeña", precio: 4.5, descripcion: "Patatas, carne de ternera o pollo y salsa" },
      { id: "pedratas-mediana", nombre: "Pedratas mediana", precio: 6.0, descripcion: "Patatas, carne de ternera o pollo y salsa" },
      { id: "pedratas-grande", nombre: "Pedratas grande", precio: 7.0, descripcion: "Patatas, carne de ternera o pollo y salsa" },
    ],
  },
  {
    categoria: "Patatas y snacks",
    productos: [
      { id: "patatas-fritas-pequena", nombre: "Patatas fritas pequeña", precio: 4.0, descripcion: "", ingredienteClave: "patatas-congeladas" },
      { id: "patatas-fritas-mediana", nombre: "Patatas fritas mediana", precio: 5.0, descripcion: "", ingredienteClave: "patatas-congeladas" },
      { id: "patatas-fritas-grande", nombre: "Patatas fritas grande", precio: 6.0, descripcion: "", ingredienteClave: "patatas-congeladas" },
      { id: "patatas-deluxe-pequena", nombre: "Patatas deluxe gajo pequeña", precio: 4.0, descripcion: "" },
      { id: "patatas-deluxe-mediana", nombre: "Patatas deluxe gajo mediana", precio: 5.0, descripcion: "" },
      { id: "patatas-deluxe-grande", nombre: "Patatas deluxe gajo grande", precio: 6.0, descripcion: "" },
      { id: "burrito", nombre: "Burrito (chicken wrap)", precio: 6.5, descripcion: "Ensalada, pollo crujiente, patatas y salsa" },
      { id: "perrito-caliente", nombre: "Perrito caliente", precio: 4.0, descripcion: "Hot dog, ketchup y mayonesa" },
      { id: "aros-cebolla", nombre: "Aros de cebolla (8 uds)", precio: 3.5, descripcion: "" },
      { id: "samosa", nombre: "Samosa (3 uds)", precio: 3.5, descripcion: "" },
      { id: "cheese-bites", nombre: "Cheese bites (10 uds)", precio: 4.0, descripcion: "" },
      { id: "tarrina-arroz-falafel", nombre: "Tarrina de arroz basmati con falafel", precio: 4.5, descripcion: "", ingredienteClave: "falafel" },
      { id: "falafel-porcion", nombre: "Falafel (6 uds)", precio: 3.5, descripcion: "", ingredienteClave: "falafel" },
      { id: "pan-kebab", nombre: "Pan de kebab", precio: 1.0, descripcion: "", ingredienteClave: "pan-pita" },
    ],
  },
  {
    categoria: "Salsas",
    productos: [
      { id: "salsa-blanca", nombre: "Salsa blanca", precio: 1.0, descripcion: "" },
      { id: "salsa-roja", nombre: "Salsa roja", precio: 1.0, descripcion: "" },
      { id: "salsa-picante", nombre: "Salsa picante", precio: 1.0, descripcion: "" },
    ],
  },
  {
    categoria: "Bebidas",
    productos: [
      { id: "refresco-lata", nombre: "Refresco (lata 33cl)", precio: 1.8, descripcion: "Coca-Cola, Fanta, Sprite...", ingredienteClave: "coca-cola-lata" },
      { id: "agua", nombre: "Agua", precio: 1.0, descripcion: "" },
      { id: "bebida-energetica", nombre: "Bebida energética", precio: 3.0, descripcion: "" },
      { id: "ayran", nombre: "Ayran", precio: 1.5, descripcion: "Bebida de yogur turca", ingredienteClave: "ayran" },
    ],
  },
  {
    categoria: "Ensaladas",
    productos: [
      { id: "ensalada-merindades", nombre: "Ensalada Merindades", precio: 5.0, descripcion: "Lechuga, tomate fresco, atún, cebolla, repollo, zanahoria y maíz" },
      { id: "ensalada-california", nombre: "Ensalada California", precio: 5.0, descripcion: "Lechuga, maíz, zanahoria, aceitunas, repollo y un toque de salsa de yogur" },
      { id: "ensalada-cocktail", nombre: "Ensalada Cocktail", precio: 5.0, descripcion: "Pollo crujiente, lechuga, tomate, cebolla, aceituna y maíz" },
    ],
  },
  {
    categoria: "Pizzas",
    productos: (() => {
      const SABORES = [
        ["cuatro-quesos", "Cuatro quesos", "Salsa de tomate, cuatro quesos y orégano"],
        ["pepperoni", "Pepperoni", "Queso, salsa de tomate y pepperoni"],
        ["carbonara", "Carbonara", "Queso, salsa creme, bacon y champiñones"],
        ["iberica", "Ibérica", "Queso, salsa de tomate y jamón"],
        ["romana", "Romana", "Queso, salsa de tomate, jamón, pollo, aceitunas y champiñón"],
        ["barbacoa", "Barbacoa", "Queso, salsa barbacoa, carne de ternera, pimiento y orégano"],
        ["merindades", "Merindades", "Queso, salsa de tomate, ternera, pollo y orégano"],
        ["mediterranea", "Mediterránea", "Queso, salsa de tomate, atún, tomate fresco y cebolla"],
        ["diavola", "Diávola", "Queso, salsa de tomate, chorizo, jamón, jalapeños y toque de salsa picante"],
        ["tono", "Toño", "Queso, salsa de tomate, atún, cebolla y aceitunas"],
        ["california", "California", "Queso, salsa de tomate, ternera, cebolla y aceitunas"],
        ["a-tu-gusto", "A tu gusto", "Queso, tomate y tres ingredientes a elegir"],
        ["vegetariana", "Vegetariana", "Queso, salsa de tomate, pimientos, champiñones, cebolla, maíz, aceitunas, tomate natural y orégano"],
      ];
      const TAMANOS = [
        ["pequena", "pequeña", 8.0],
        ["mediana", "mediana", 10.0],
        ["familiar", "familiar", 14.0],
      ];
      const productos = [];
      for (const [slug, nombre, descripcion] of SABORES) {
        for (const [tamanoSlug, tamanoNombre, precio] of TAMANOS) {
          productos.push({
            id: `pizza-${slug}-${tamanoSlug}`,
            nombre: `Pizza ${nombre} (${tamanoNombre})`,
            precio,
            descripcion,
          });
        }
      }
      return productos;
    })(),
  },
  {
    categoria: "Haz tu menú",
    productos: [
      { id: "menu-doner-kebab", nombre: "Menú Doner Kebab", precio: 7.5, descripcion: "Patatas + refresco. Solo carne o queso +1€", modificadores: MODIFICADORES_KEBAB },
      { id: "menu-durum", nombre: "Menú Dürüm", precio: 8.5, descripcion: "Patatas + refresco. Solo carne o queso +1€", modificadores: MODIFICADORES_KEBAB },
      { id: "menu-lahmacum", nombre: "Menú Lahmacum", precio: 9.5, descripcion: "Patatas + refresco. Solo carne o queso +1€", modificadores: MODIFICADORES_KEBAB },
      { id: "menu-plato-ternera-pollo", nombre: "Menú Plato ternera/pollo", precio: 9.5, descripcion: "Ensalada + patatas + refresco + pan. Solo carne o queso +1€", modificadores: MODIFICADORES_KEBAB },
      { id: "menu-plato-arroz", nombre: "Menú Plato arroz con ternera/pollo", precio: 10.0, descripcion: "Patatas + refresco + salsa + pan" },
      { id: "menu-hamburguesa", nombre: "Menú Hamburguesa (vacuno o pollo crispy +1€)", precio: 6.5, descripcion: "Patatas + refresco. +huevo o bacon +1€" },
      { id: "menu-perrito", nombre: "Menú Perrito caliente", precio: 6.0, descripcion: "Patatas + refresco" },
      { id: "menu-alitas", nombre: "Menú Alitas de pollo", precio: 9.5, descripcion: "Ensalada + patatas + refresco" },
      { id: "menu-tiras-pollo", nombre: "Menú Tiras de pollo crujiente", precio: 9.5, descripcion: "Ensalada + patatas + refresco + salsa" },
      { id: "menu-burrito", nombre: "Menú Burrito (chicken wrap)", precio: 9.0, descripcion: "Ensalada + patatas + refresco + salsa" },
      { id: "menu-pizza-variada-pequena", nombre: "Menú Pizza variada (pequeña)", precio: 10.5, descripcion: "Patatas + refresco" },
      { id: "menu-pizza-variada-mediana", nombre: "Menú Pizza variada (mediana)", precio: 12.5, descripcion: "Patatas + refresco" },
    ],
  },
];

export function findProduct(productId) {
  for (const cat of menu) {
    const found = cat.productos.find((p) => p.id === productId);
    if (found) return found;
  }
  return null;
}
