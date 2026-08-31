---
name: tpv-restaurante
description: Guía de diseño visual, convenciones de código y checklist de revisión para trabajar en este TPV de restaurante (React + Vite + funciones serverless de Vercel + Supabase). Úsala SIEMPRE que se toque cualquier pantalla o funcionalidad del TPV — toma de pedido, menú, carrito, comanda de cocina (KDS), checkout/cobro, historial, numeración de pedidos, inventario, panel del dueño, pantalla de recogida, o especialmente apertura/cierre de caja — aunque el usuario no mencione la palabra "skill". Dispara también con peticiones como "añade una pantalla de caja", "quiero editar el menú desde la interfaz", "que la comanda muestre un número de pedido", "arqueo de caja", "nueva pantalla de cocina", "panel de ventas", o cualquier cambio en client/src o client/api de este repo.
---

# TPV Restaurante — guía del proyecto

Este repo es un TPV real en producción (React + Vite en `client/`, funciones
serverless de Vercel en `client/api/`, Postgres vía Supabase). Antes de tocar
cualquier pantalla o flujo, lee este documento: te da el contexto que ya
existe para que lo nuevo encaje visualmente y funcionalmente, y no repita
trabajo que ya está hecho (caja, inventario, numeración de pedidos, panel).

## 0. Mapa de pantallas

| Ruta | Página | Qué hace |
| --- | --- | --- |
| `/` | `Order.jsx` | Kiosco de autoservicio: inicio (aquí/para llevar) → menú + carrito, con personalización de producto |
| `/pago/:orderId` | `Checkout.jsx` | Ticket del pedido y cobro |
| `/cocina` | `Kitchen.jsx` | KDS, 3 columnas por estado |
| `/historial` | `Historial.jsx` | Pedidos cerrados, filtrable por estado |
| `/caja` | `Caja.jsx` | Turno de caja (apertura/cierre/arqueo) + venta rápida en mostrador |
| `/inventario` | `Inventario.jsx` | Stock por ingrediente, vinculado al menú |
| `/panel` | `Panel.jsx` | KPIs del día, ventas por hora, más vendidos |
| `/recogida` | `Recogida.jsx` | Tablero de pedidos preparando/listo (pantalla pública) |

## 1. Diseño visual — sigue lo que ya existe

La app tiene un lenguaje visual consistente en `client/src/styles.css`.
Cualquier pantalla nueva debe sentirse del mismo sistema, no como un añadido
aparte:

- **Marca**: "TPV California" (negocio real: California — Kebab,
  Hamburguesería, Pizzería, Medina de Pomar / Villarcayo). Paleta: fondo
  general `#f2f3f5`; barra
  superior oscura `#1f2933`; **naranja de marca/acción `#d1622f`** (botones
  primarios, categoría activa, "Añadir"); verde de éxito/confirmación
  `#1f9d55`; rojo de alerta o estado pendiente `#c0392b` / `#e74c3c`;
  naranja de "en proceso" `#f0ad4e` / `#b9770e`; azul de "entregado/cerrado"
  `#2b6cb0`. No inventes colores nuevos para estados — reutiliza estos según
  el significado (rojo = requiere atención, naranja = en curso, verde =
  completado con éxito, azul = completado/histórico). El acento de marca
  (`#d1622f`) es distinto del naranja de estado "en proceso" — no los
  confundas aunque ambos sean naranjas.
- **Tipografía**: `Barlow` (cuerpo de texto) y `Barlow Condensed` 700
  (títulos, precios grandes, nombre del ticket) cargadas desde Google Fonts
  en `client/index.html`. Los títulos (`h1–h4`), `.brand` y los totales usan
  `Barlow Condensed` — sigue esa regla para texto nuevo de gran tamaño.
- **Tarjetas**: fondo blanco, `border-radius: 10px`, sombra suave
  (`0 1px 3px rgba(0,0,0,0.08)`). Es el contenedor por defecto para
  cualquier bloque de contenido (producto, ticket, KPI, fila de tabla).
- **Indicador de estado por borde izquierdo**: el historial y la caja usan
  un `border-left` de color según el estado (`.estado-pendiente`,
  `.estado-en_preparacion`, `.estado-listo`, `.estado-abierto`, etc. en
  `styles.css`). Sigue este patrón para cualquier entidad nueva con
  estados sobre fondo claro.
- **Excepción — pantallas de tema oscuro**: `/cocina` (`#12181d`) y
  `/recogida` (`#12181d`) son las únicas pantallas oscuras, pensadas para
  visibilidad en cocina y en un monitor de recogida para clientes. Usan sus
  propias clases (`.kds-*`, `.recogida-*`) en vez de `.ticket-cocina`/
  `.card-caja` — no mezcles ambos sistemas. La pantalla de inicio del
  kiosco (`.kiosk-inicio`) también es oscura, pero es un caso aparte
  (bienvenida a pantalla completa), no un tablero de datos.
- **Badges** redondeados (`.badge-estado`/`.badge-inventario` + modificador)
  para mostrar el estado como texto corto dentro de una tarjeta o fila.
- **Botones grandes y táctiles**: esto lo va a usar un camarero de pie,
  tocando una pantalla o tablet, muchas veces con prisa. Botones de acción
  principal ocupan el ancho disponible (`width: 100%`), padding generoso
  (`0.6–0.8rem`), texto en negrita. Evita controles pequeños o menús
  desplegables para acciones frecuentes.
- **Jerarquía**: página → grid de tarjetas → lista dentro de la tarjeta →
  badge/detalle. No metas jerarquías nuevas (tabs anidados, modales sobre
  modales) si un flujo lineal de tarjetas resuelve el caso.

## 2. Convenciones funcionales y de código

### Estructura
- `client/src/pages/`: una página por ruta. Una pantalla nueva va aquí y se
  registra en `client/src/App.jsx` (ruta + enlace de nav).
- `client/src/components/`: piezas reutilizables entre páginas
  (`MenuItemCard`, `CartSidebar`, `Personalizar`, `OrderTicket`,
  `HistorialTicket`).
- `client/src/`: helpers compartidos por el frontend que **duplican**
  (a propósito, por no compartir bundle con el backend) su equivalente en
  `client/api/_lib/`: `format.js`/`totales.js`/`informes.js`. Si cambias la
  fórmula en un lado, cámbiala en el otro.
- `client/api/`: backend serverless (una función = un endpoint). La lógica
  de negocio compartida vive en `client/api/_lib/` (`menu.js`, `orders.js`,
  `caja.js`, `inventario.js`, `informes.js`, `supabaseClient.js`), no
  directamente en los handlers — sigue ese mismo patrón para lógica nueva.
- Cambios de esquema de datos van en `supabase/migration.sql` (tablas) y
  `supabase/policies.sql` (RLS). Si añades una tabla nueva, añade también
  su política — sin RLS la app no podrá leer/escribir esa tabla. `orders` y
  `turnos_caja` no permiten borrar (son histórico); `inventario` sí (es un
  catálogo vivo) — sigue esa misma distinción para tablas nuevas en vez de
  copiar una política sin pensar si aplica.

### El menú
El menú sigue **hardcodeado** en `client/api/_lib/menu.js` (categoría →
productos) — no existe panel para editar nombres/precios/categorías desde
la UI. Si se pide eso, es una funcionalidad nueva de verdad (mover a una
tabla de Supabase), dilo explícitamente antes de implementarlo. Lo que SÍ
existe es el vínculo con inventario: un producto puede referenciar un
ingrediente y su disponibilidad ya no es estática (ver abajo).

Es la carta real del negocio (~119 productos, 11 categorías: Kebab, Dürüm,
Lahmacum, Platos combinados, Especialidades, Patatas y snacks, Salsas,
Bebidas, Ensaladas, Pizzas, Haz tu menú). Dos patrones a mantener si se
edita:
- **Kebab/Dürüm/Lahmacum y Pizzas son "matrices de precio"**: la misma
  proteína o sabor tiene un precio distinto por formato/tamaño (ej. Ternera
  4,50€ en kebab / 6€ en dürüm / 6,50€ en lahmacum; cada pizza en
  pequeña/mediana/familiar). Se resuelven como **productos independientes**
  (uno por combinación), no como un único producto con selector de tamaño
  — el modelo de datos actual es "un producto = un precio". Si se añade un
  sabor o proteína nueva, créalo así (una entrada por variante), no intentes
  meter tamaños dentro de un mismo producto sin cambiar el modelo primero.
- **Modificadores de personalización** (`QUITAR_INGREDIENTES` +
  `EXTRAS_KEBAB` en `menu.js`): se aplican a Kebab, Dürüm, Lahmacum, Platos
  combinados, y a sus versiones "menú" en la categoría "Haz tu menú" — no a
  Especialidades, Patatas, Pizzas, etc. (el dueño solo pidió esto para la
  familia kebab). "Quitar ingredientes" (Sin tomate/cebolla/repollo y
  zanahoria/lechuga) son opciones sin coste; "Extras" (Solo carne/Extra
  salsa/Extra queso) cuestan +1€ cada una. Repollo y zanahoria van
  **combinados en una sola opción** a propósito — en cocina es un único
  ingrediente premezclado, no dos. Ambos pasos son de selección múltiple
  sin límite (`maxSeleccion` omitido a propósito) — no le pongas un tope
  salvo que el dueño lo pida.

### Inventario y disponibilidad real
Tabla `inventario` (`clave` texto estable, no el uuid — ver comentario en
`migration.sql`). Un producto de `menu.js` puede tener `ingredienteClave`
apuntando a esa `clave` (ej. `kebab-ternera` → `ternera-kebab`); no todos
los productos la tienen — solo tiene sentido para lo que de verdad depende
de un stock concreto.

- `GET /api/menu` (`client/api/menu.js`) cruza `menu.js` con `inventario`
  en cada petición y anota `disponible` (false si agotado o si el admin
  apagó "en kiosco") y `avisoStock` ("Quedan N uds") si está por debajo del
  umbral pero no agotado. El kiosco (`Order.jsx`) **oculta** los productos
  con `disponible === false`; la venta rápida de caja (`Caja.jsx`) los
  **muestra deshabilitados** con un badge "Agotado" (el cajero necesita
  verlos para explicarle al cliente qué falta).
- `POST /api/orders` vuelve a comprobar el inventario al crear el pedido
  (no solo confía en lo que el kiosco mostraba) y rechaza con 409 un
  producto agotado — igual que con el precio de los modificadores, nunca
  te fíes de lo que ya decidió el cliente en pantalla.
- `/inventario` (`Inventario.jsx`): KPIs (activos/bajo/agotados), tabla con
  stock editable (input que guarda al perder el foco) y un toggle "en
  kiosco" por fila. `estadoStock()` en `_lib/inventario.js` calcula
  `ok`/`bajo`/`agotado` — compártelo en vez de reimplementar el umbral en
  otro sitio (el frontend también lo duplica en `Inventario.jsx` por el
  mismo motivo que `format.js`).
- **No existe** un constructor visual de menús tipo arrastrar-y-soltar
  (armar combos desde inventario en una UI de slots, como en el mockup de
  referencia) — decisión deliberada: el valor real (que el menú reaccione
  al stock) ya lo cubre `ingredienteClave`, sin la complejidad de un editor
  de combos. Si se pide explícitamente, es una pieza nueva.

### Venta rápida en caja
`Caja.jsx` no es solo apertura/cierre de turno: con un turno abierto
muestra un panel de venta directa (botones grandes por categoría del menú
+ ticket con el carrito) para cobrar en mostrador sin pasar por `/`. Al
cobrar hace `createOrder()` seguido de `pagarOrder()` — reutiliza los
mismos endpoints que el resto de la app, no crees un camino de cobro
paralelo. La división de cuenta (`caja-dividir`) es solo informativa
(total ÷ N personas), no reparte el pago en transacciones separadas.

### Pedidos y su numeración
La tabla `orders` usa `id uuid` como clave primaria, pero además tiene
`ticket_numero` (columna `serial`, autoincremental, sin condiciones de
carrera). Se muestra como `#A-<numero>` mediante `formatTicket()`
(duplicado en `_lib/orders.js` y `client/src/format.js`). Es un contador
global (no reinicia por día/turno) — si se pide que reinicie a diario, es
un cambio de diseño real, no un ajuste trivial.

### Flujo de un pedido (kiosco de autoservicio)
1. `Order.jsx` (`/`) empieza en un paso `inicio` (pantalla de bienvenida a
   pantalla completa, tema oscuro) donde se elige "Comer aquí" o "Para
   llevar" (`tipoServicio`). "Para llevar" fija `mesa = "Para llevar"` y
   oculta el input de mesa (`mostrarMesa` en `CartSidebar`); "Comer aquí"
   sigue pidiendo número de mesa.
2. Paso `menu`: categorías + grid + carrito lateral, con una cabecera que
   muestra el tipo de servicio y "Cancelar pedido" (resetea todo y vuelve a
   `inicio`). `calcularTotales()` (en `client/src/totales.js`, misma
   fórmula que el backend) computa subtotal/IVA/total en vivo. IVA fijo
   al 10%.
3. Un producto con `modificadores` (kebab/dürüm/lahmacum/plato, ver sección
   "El menú") NO se añade directo: abre el modal `Personalizar.jsx`. Los
   ítems del carrito usan
   `lineId` (no `productId`) como clave de operación porque el mismo
   producto puede aparecer en varias líneas con personalizaciones
   distintas — no vuelvas a usar `productId` como key en
   `CartSidebar.jsx`/`Order.jsx`.
4. **El precio de los modificadores se recalcula siempre en el backend**
   (`client/api/orders/index.js`, POST) a partir de `menu.js` — el cliente
   solo manda qué opciones eligió (`item.modificadores: {pasoId:
   [opcionId, ...]}`), nunca un precio. El texto de las opciones elegidas
   se guarda en `item.modificadoresTexto` y se muestra junto a
   `item.notas` en cocina/checkout/historial/recogida.
5. `Kitchen.jsx` (`/cocina`): 3 columnas por estado (nuevo/preparando/
   listo). Estados válidos y su único orden de avance: `pendiente` →
   `en_preparacion` → `listo` → `entregado`; `cancelado` es terminal
   aparte. Definidos en `ESTADOS_VALIDOS` (`_lib/orders.js`). Al llegar a
   `listo` por primera vez se graba `listo_en` (una sola vez, no se pisa en
   un revertir — lo usa el panel del dueño para el tiempo medio de
   cocina).
6. `Checkout.jsx` (`/pago/:orderId`): ticket y cobro (efectivo/tarjeta).
7. `Historial.jsx`: pedidos cerrados, filtrables por estado.

### Panel del dueño e informes
`GET /api/informes` (`client/api/informes.js` + `_lib/informes.js`)
agrega los pedidos **de hoy** (desde las 00:00 UTC — simplificación
deliberada, no ajusta por zona horaria del local) y calcula ventas,
tickets, ticket medio, tiempo medio de cocina (a partir de `listo_en`) y
top 5 productos. `calcularResumen()` está separado del handler HTTP
justamente para poder testearlo con datos de ejemplo sin depender de
Supabase — sigue ese patrón si añades más métricas. El gráfico de ventas
por hora usa una franja fija de 8h–23h (no calculada dinámicamente) para
que el eje no salte de tamaño según haya o no ventas — no fabriques datos
si no hay pedidos, `Panel.jsx` ya muestra "Sin ventas todavía hoy".

### Pantalla de recogida
`/recogida` (`Recogida.jsx`) es un tablero pensado para un monitor público
de cara al cliente (no un formulario de trabajo del personal), tema
oscuro, tipografía enorme. Solo lee `en_preparacion`/`listo` vía
`GET /api/orders` con el mismo polling de 3s que cocina — no le añadas
acciones (botones, formularios): es de solo lectura por diseño.

### Sincronización: polling, no websockets
Todas las pantallas que necesitan reflejar cambios de otra pantalla
(cocina, checkout, recogida, caja) usan **polling cada 3 segundos** (el
panel del dueño usa 15s, al ser menos urgente), no websockets/realtime. Es
una decisión deliberada de simplicidad — sigue el mismo patrón para
pantallas nuevas con estado compartido.

## 3. Checklist antes de dar por terminada una feature

Antes de decir que una función del TPV está lista, verifica manualmente
(o con test si el proyecto llega a tenerlos):

- **Mesa vacía**: el botón de enviar pedido está deshabilitado y/o muestra
  aviso si no hay mesa (ver `.campo-requerido` / `.hint-enviar`).
- **Doble envío**: hacer doble click rápido en "enviar pedido" o "cobrar"
  no debe crear dos filas/dos comandas — el botón debe deshabilitarse tras
  el primer click hasta tener respuesta del servidor.
- **Propagación entre pantallas**: cambiar el estado en `/cocina` se refleja
  en `/pago/:orderId`, `/recogida` y `/caja` como máximo tras el siguiente
  ciclo de poll — no debe hacer falta refrescar la página a mano.
- **Totales**: subtotal + IVA (10%) + total cuadran para pedidos con
  varias líneas y cantidades distintas, con redondeo a 2 decimales
  consistente con `calcularTotales()`.
- **Estados**: solo se puede transicionar entre estados válidos y en el
  orden esperado; `cancelado` no debe poder "avanzar" a otro estado.
- **Si la feature toca caja**:
  - No se puede cerrar un turno que no está abierto.
  - No se puede abrir un turno nuevo si ya hay uno abierto (evita doble
    apertura accidental).
  - El arqueo (efectivo declarado al cerrar) se compara contra la suma de
    pedidos cobrados en efectivo durante ese turno, y la diferencia se
    muestra claramente, no se oculta ni se redondea en silencio.
- **Si la feature toca el menú**: los precios siguen siendo números con 2
  decimales consistentes con `calcularTotales()`.
- **Si la feature toca inventario/disponibilidad**: un producto agotado
  (o con "en kiosco" apagado) desaparece del kiosco, aparece deshabilitado
  en caja, y — esto es lo que de verdad importa, no solo la UI — el POST a
  `/api/orders` lo rechaza aunque se le mande igualmente el `productId`
  directamente (prueba esto con una petición cruda, no solo clicando).
- **Si la feature toca modificadores/personalización**: el precio final se
  verifica en el backend, no solo en el modal — prueba mandando
  directamente al POST `/api/orders` una opción inventada o un precio
  manipulado y confirma que se ignora. El tope `maxSeleccion` de un paso no
  se puede superar aunque el cliente mande más opciones.
- **Si la feature toca el panel/informes**: no fabriques datos cuando no
  hay pedidos (día vacío → 0, no un número inventado); confirma que
  `calcularResumen()` sigue siendo una función pura testeable sin Supabase.
- **Consistencia visual**: la pantalla nueva usa la paleta y los patrones
  de la sección 1, no colores o componentes ad-hoc.
