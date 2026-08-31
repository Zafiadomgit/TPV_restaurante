import { menu } from "./_lib/menu.js";
import { supabase } from "./_lib/supabaseClient.js";
import { mapRow, estadoStock } from "./_lib/inventario.js";

// Anota cada producto con disponibilidad real según el inventario: si su
// ingredienteClave está agotado, se marca disponible:false (el kiosco lo
// oculta); si está bajo de stock, se añade avisoStock ("Quedan N") sin
// bloquear la venta.
async function anotarDisponibilidad() {
  const { data, error } = await supabase.from("inventario").select("*");
  if (error) return menu;

  const inventarioPorClave = new Map(data.map(mapRow).map((item) => [item.clave, item]));

  return menu.map((cat) => ({
    ...cat,
    productos: cat.productos.map((producto) => {
      if (!producto.ingredienteClave) return producto;
      const item = inventarioPorClave.get(producto.ingredienteClave);
      if (!item) return producto;

      const estado = estadoStock(item);
      return {
        ...producto,
        disponible: item.visibleEnKiosco && estado !== "agotado",
        avisoStock: estado === "bajo" ? `Quedan ${item.stock} ${item.unidad}` : undefined,
      };
    }),
  }));
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const menuConDisponibilidad = await anotarDisponibilidad();
  res.status(200).json(menuConDisponibilidad);
}
