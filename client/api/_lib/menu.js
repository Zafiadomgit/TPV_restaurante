import { supabase } from "./supabaseClient.js";

function mapProducto(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: Number(row.precio),
    descripcion: row.descripcion || "",
    ...(row.modificadores ? { modificadores: row.modificadores } : {}),
  };
}

// Menú agrupado por categoría en el formato que ya consumían las
// pantallas: [{ categoria, productos: [...] }]. Solo incluye productos
// activos, y omite categorías que se queden sin ninguno (no tiene sentido
// mostrarle al cliente una categoría vacía en el kiosco).
export async function getMenu() {
  const { data: categorias, error: errorCat } = await supabase
    .from("menu_categorias")
    .select("*")
    .order("orden", { ascending: true });
  if (errorCat) throw new Error(errorCat.message);

  const { data: productos, error: errorProd } = await supabase
    .from("menu_productos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });
  if (errorProd) throw new Error(errorProd.message);

  return categorias
    .map((cat) => ({
      categoria: cat.nombre,
      productos: productos.filter((p) => p.categoria_id === cat.id).map(mapProducto),
    }))
    .filter((cat) => cat.productos.length > 0);
}

// Busca varios productos de golpe por id (para no hacer una consulta por
// línea de pedido). Solo devuelve productos activos — uno desactivado o
// borrado no se puede seguir pidiendo aunque el cliente lo tuviera ya en
// el carrito abierto en el navegador.
export async function findProducts(ids) {
  const idsUnicos = [...new Set(ids)];
  if (idsUnicos.length === 0) return new Map();

  const { data, error } = await supabase
    .from("menu_productos")
    .select("*")
    .eq("activo", true)
    .in("id", idsUnicos);
  if (error) throw new Error(error.message);

  return new Map(data.map((row) => [row.id, mapProducto(row)]));
}
