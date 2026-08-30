# TPV Restaurante

Sistema de Terminal Punto de Venta (TPV) para restaurantes: el camarero/cliente
completa el pedido en pantalla, ve el total a pagar y la comanda llega a la
pantalla de cocina.

Desplegado en **Vercel** (frontend + funciones serverless) con **Supabase**
(Postgres) como base de datos de pedidos.

## Estructura

- `client/`: interfaz web (React + Vite).
  - `/` — Toma de pedido: elegir mesa, añadir productos del menú, ver
    carrito y total, enviar comanda.
  - `/pago/:orderId` — Resumen del pedido con el total a cobrar y botones
    para marcarlo como pagado (efectivo/tarjeta). Consulta el estado cada
    3s para reflejar lo que hace cocina.
  - `/cocina` — Pantalla de cocina (KDS): consulta los pedidos activos cada
    3s y permite avanzar su estado (pendiente → en preparación → listo →
    entregado).
  - `client/api/`: funciones serverless de Vercel (Node) que hacen de
    backend — menú y CRUD de pedidos contra Supabase.
- `supabase/migration.sql`: crea la tabla `orders`.
- `supabase/policies.sql`: políticas RLS para que la app pueda leer, crear
  y actualizar pedidos (no borrar).

## Puesta en marcha local

Requiere [Vercel CLI](https://vercel.com/docs/cli) para ejecutar frontend +
funciones serverless juntos:

```bash
cd client
npm install
npx vercel dev
```

## Despliegue

El proyecto está pensado para desplegarse en Vercel con **Root Directory =
`client`** (ahí viven tanto el frontend como `api/`). La conexión a
Supabase usa la URL y la clave `anon` del proyecto (protegidas por las
políticas RLS de `supabase/policies.sql`); opcionalmente se pueden mover a
variables de entorno de Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

## Flujo

1. El camarero/cliente elige la mesa y los productos → el carrito calcula
   subtotal, IVA (10%) y total en vivo.
2. Al enviar el pedido, se guarda en Supabase con estado `pendiente`.
3. La pantalla de cocina lo recoge en el siguiente ciclo de refresco (cada
   3s) como una comanda nueva, y puede ir marcándolo como "en preparación",
   "listo" y "entregado".
4. La pantalla de pago muestra el total y permite cobrar; el estado que
   reporta cocina se refleja ahí también en cada refresco.
