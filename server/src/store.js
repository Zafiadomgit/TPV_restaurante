import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_PATH = path.join(__dirname, "data", "menu.json");
const ORDERS_PATH = path.join(__dirname, "data", "orders.json");

export const IVA_RATE = 0.10; // 10% IVA hostelería

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function getMenu() {
  return readJson(MENU_PATH, []);
}

export function findProduct(productId) {
  const menu = getMenu();
  for (const cat of menu) {
    const found = cat.productos.find((p) => p.id === productId);
    if (found) return found;
  }
  return null;
}

export function getOrders() {
  return readJson(ORDERS_PATH, []);
}

export function saveOrders(orders) {
  writeJson(ORDERS_PATH, orders);
}

export function getOrder(orderId) {
  return getOrders().find((o) => o.id === orderId) || null;
}

export function addOrder(order) {
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function updateOrder(orderId, updater) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return null;
  orders[idx] = updater(orders[idx]);
  saveOrders(orders);
  return orders[idx];
}

if (!fs.existsSync(ORDERS_PATH)) {
  writeJson(ORDERS_PATH, []);
}
