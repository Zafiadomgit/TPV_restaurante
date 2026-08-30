# TPV Restaurante

Sistema de Terminal Punto de Venta (TPV) para restaurantes: el camarero/cliente
completa el pedido en pantalla, ve el total a pagar y la comanda llega en
tiempo real a la pantalla de cocina.

## Estructura

- `server/`: API REST + WebSocket (Express + Socket.io). Guarda menú y
  pedidos en JSON (`server/src/data`).
- `client/`: interfaz web (React + Vite) con tres pantallas:
  - `/` — Toma de pedido: elegir mesa, añadir productos del menú, ver
    carrito y total, enviar comanda.
  - `/pago/:orderId` — Resumen del pedido con el total a cobrar y botones
    para marcarlo como pagado (efectivo/tarjeta). Se actualiza en vivo con
    el estado que reporta cocina.
  - `/cocina` — Pantalla de cocina (KDS): recibe cada comanda al instante
    por WebSocket y permite avanzar su estado (pendiente → en preparación
    → listo → entregado).

## Puesta en marcha

En dos terminales:

```bash
# Backend (puerto 4000)
cd server
npm install
npm run dev

# Frontend (puerto 5173)
cd client
npm install
npm run dev
```

Abre `http://localhost:5173` para tomar pedidos y
`http://localhost:5173/cocina` en la pantalla de cocina.

## Flujo

1. El camarero/cliente elige la mesa y los productos → el carrito calcula
   subtotal, IVA (10%) y total en vivo.
2. Al enviar el pedido, se guarda en el servidor y se emite por WebSocket:
   la pantalla de cocina lo recibe al instante como una comanda nueva.
3. La pantalla de pago muestra el total y permite cobrar; cocina puede ir
   marcando el pedido como "en preparación", "listo" y "entregado", y esos
   cambios se reflejan en tiempo real en la pantalla de pago.
