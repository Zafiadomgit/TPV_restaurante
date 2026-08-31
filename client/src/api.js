const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Error en la petición");
  }
  return data;
}

export const api = {
  getMenu: () => request("/menu"),
  getOrders: (estado) => request(`/orders${estado ? `?estado=${estado}` : ""}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (payload) =>
    request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  updateEstado: (id, estado) =>
    request(`/orders/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    }),
  pagarOrder: (id, metodoPago) =>
    request(`/orders/${id}/pagar`, {
      method: "PATCH",
      body: JSON.stringify({ metodoPago }),
    }),
  getTurnos: (estado) => request(`/caja${estado ? `?estado=${estado}` : ""}`),
  abrirTurno: (efectivoInicial) =>
    request("/caja", { method: "POST", body: JSON.stringify({ efectivoInicial }) }),
  cerrarTurno: (id, efectivoFinalDeclarado) =>
    request(`/caja/${id}/cerrar`, {
      method: "PATCH",
      body: JSON.stringify({ efectivoFinalDeclarado }),
    }),
  getResumen: () => request("/informes"),
  getCategorias: () => request("/menu-categorias"),
  crearCategoria: (nombre) =>
    request("/menu-categorias", { method: "POST", body: JSON.stringify({ nombre }) }),
  actualizarCategoria: (id, cambios) =>
    request(`/menu-categorias/${id}`, { method: "PATCH", body: JSON.stringify(cambios) }),
  eliminarCategoria: (id) => request(`/menu-categorias/${id}`, { method: "DELETE" }),
  getProductosAdmin: () => request("/menu-productos"),
  crearProducto: (producto) =>
    request("/menu-productos", { method: "POST", body: JSON.stringify(producto) }),
  actualizarProducto: (id, cambios) =>
    request(`/menu-productos/${id}`, { method: "PATCH", body: JSON.stringify(cambios) }),
  eliminarProducto: (id) => request(`/menu-productos/${id}`, { method: "DELETE" }),
};
