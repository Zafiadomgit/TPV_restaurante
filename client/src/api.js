import { getSesion, cerrarSesion } from "./auth.js";

const BASE_URL = "/api";

async function request(path, options = {}) {
  const sesion = getSesion();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);
  if (res.status === 401 && sesion) cerrarSesion();
  if (!res.ok) {
    throw new Error(data?.error || "Error en la petición");
  }
  return data;
}

export const api = {
  login: (rol, pin) => request("/login", { method: "POST", body: JSON.stringify({ rol, pin }) }),
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
    request(`/menu-categorias?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(cambios) }),
  eliminarCategoria: (id) => request(`/menu-categorias?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
  getProductosAdmin: () => request("/menu-productos"),
  crearProducto: (producto) =>
    request("/menu-productos", { method: "POST", body: JSON.stringify(producto) }),
  actualizarProducto: (id, cambios) =>
    request(`/menu-productos?id=${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(cambios) }),
  eliminarProducto: (id) => request(`/menu-productos?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
};
