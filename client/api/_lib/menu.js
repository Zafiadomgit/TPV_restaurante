// Paso de personalización compartido por los kebabs y dürüm: el cliente
// elige hasta 2 salsas incluidas, o salsas extra con recargo. maxSeleccion
// se valida también en el backend (client/api/orders/index.js) — nunca se
// confía en el precio que mande el cliente.
const SALSAS = {
  id: "salsas",
  titulo: "Salsas",
  tipo: "multiple",
  maxSeleccion: 2,
  nota: "máx. 2 incluidas",
  opciones: [
    { id: "yogur-ajo", nombre: "Yogur y ajo", precioExtra: 0, porDefecto: true },
    { id: "picante-harissa", nombre: "Picante harissa", precioExtra: 0, porDefecto: true },
    { id: "barbacoa", nombre: "Barbacoa", precioExtra: 0, porDefecto: false },
    { id: "coctel", nombre: "Cóctel", precioExtra: 0, porDefecto: false },
    { id: "tahina", nombre: "Tahina", precioExtra: 0.5, porDefecto: false },
    { id: "sin-salsa", nombre: "Sin salsa", precioExtra: 0, porDefecto: false },
  ],
};

export const menu = [
  {
    categoria: "Kebabs",
    productos: [
      { id: "kebab-ternera", nombre: "Kebab de ternera", precio: 6.5, descripcion: "Pan de pita, ternera, ensalada y salsa a elegir", modificadores: [SALSAS], ingredienteClave: "ternera-kebab" },
      { id: "kebab-pollo", nombre: "Kebab de pollo", precio: 6.2, descripcion: "Pollo marinado, cebolla morada, yogur", modificadores: [SALSAS], ingredienteClave: "pollo-kebab" },
      { id: "kebab-picante", nombre: "Kebab picante", precio: 6.8, descripcion: "Con salsa harissa de la casa", modificadores: [SALSAS] },
      { id: "plato-kebab", nombre: "Plato kebab", precio: 9.5, descripcion: "Con arroz, ensalada y pan" },
    ],
  },
  {
    categoria: "Dürüm",
    productos: [
      { id: "durum-mixto", nombre: "Dürüm mixto", precio: 7.0, descripcion: "Tortilla de trigo, ternera y pollo", modificadores: [SALSAS], ingredienteClave: "tortilla-durum" },
      { id: "durum-falafel", nombre: "Dürüm falafel", precio: 6.8, descripcion: "Falafel casero, hummus, tahina", modificadores: [SALSAS], ingredienteClave: "falafel" },
    ],
  },
  {
    categoria: "Menús",
    productos: [
      { id: "menu-kebab", nombre: "Menú kebab", precio: 9.9, descripcion: "Kebab de ternera o pollo + patatas + bebida" },
      { id: "menu-durum", nombre: "Menú dürüm", precio: 10.4, descripcion: "Dürüm a elegir + patatas + bebida" },
      { id: "menu-infantil", nombre: "Menú infantil", precio: 6.9, descripcion: "Mini kebab + patatas + bebida pequeña" },
    ],
  },
  {
    categoria: "Acompañamientos",
    productos: [
      { id: "patatas", nombre: "Patatas", precio: 2.5, descripcion: "", ingredienteClave: "patatas-congeladas" },
      { id: "patatas-queso", nombre: "Patatas con queso", precio: 3.5, descripcion: "" },
      { id: "ensalada", nombre: "Ensalada", precio: 4.0, descripcion: "" },
      { id: "hummus", nombre: "Hummus", precio: 3.2, descripcion: "Con pan de pita" },
    ],
  },
  {
    categoria: "Bebidas",
    productos: [
      { id: "coca-cola", nombre: "Coca-Cola", precio: 1.8, descripcion: "Lata 330ml", ingredienteClave: "coca-cola-lata" },
      { id: "ayran", nombre: "Ayran", precio: 1.5, descripcion: "Bebida de yogur turca", ingredienteClave: "ayran" },
      { id: "agua", nombre: "Agua", precio: 1.2, descripcion: "500ml" },
    ],
  },
  {
    categoria: "Postres",
    productos: [
      { id: "baklava", nombre: "Baklava", precio: 2.5, descripcion: "", ingredienteClave: "baklava" },
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
