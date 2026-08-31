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
  getInventario: () => request("/inventario"),
  actualizarInventario: (id, cambios) =>
    request(`/inventario/${id}`, { method: "PATCH", body: JSON.stringify(cambios) }),
  getResumen: () => request("/informes"),
};
