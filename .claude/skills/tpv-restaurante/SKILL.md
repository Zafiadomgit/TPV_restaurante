---
name: tpv-restaurante
description: Guía de diseño visual, convenciones de código y checklist de revisión para trabajar en este TPV de restaurante (React + Vite + funciones serverless de Vercel + Supabase). Úsala SIEMPRE que se toque cualquier pantalla o funcionalidad del TPV — toma de pedido, menú, gestión de carta/productos, carrito, comanda de cocina (KDS), checkout/cobro, historial, numeración de pedidos, panel del dueño, pantalla de recogida, o especialmente apertura/cierre de caja — aunque el usuario no mencione la palabra "skill". Dispara también con peticiones como "añade una pantalla de caja", "quiero editar el menú desde la interfaz", "añadir/quitar un producto de la carta", "que la comanda muestre un número de pedido", "arqueo de caja", "nueva pantalla de cocina", "panel de ventas", o cualquier cambio en client/src o client/api de este repo. NO tiene inventario/gestión de stock (se retiró a propósito) — no lo reintroduzcas sin que el dueño lo pida explícitamente.
---

# TPV Restaurante — guía del proyecto

Este repo es un TPV real en producción (React + Vite en `client/`, funciones
serverless de Vercel en `client/api/`, Postgres vía Supabase). Antes de tocar
cualquier pantalla o flujo, lee este documento: te da el contexto que ya
existe para que lo nuevo encaje visualmente y funcionalmente, y no repita
trabajo que ya está hecho (caja, gestión de menú, numeración de pedidos,
panel).

## 0. Mapa de pantallas

| Ruta | Página | Qué hace | Acceso |
| --- | --- | --- | --- |
| `/` | `Order.jsx` | Kiosco de autoservicio: inicio (aquí/para llevar) → menú + carrito, con personalización de producto | Público (sin login) |
| `/pago/:orderId` | `Checkout.jsx` | Ticket del pedido y cobro | Público (sin login) |
| `/login` | `Login.jsx` | Selección de rol (Caja/Cocina) + teclado numérico de PIN | Público (es la puerta de entrada) |
| `/cocina` | `Kitchen.jsx` | KDS, 3 columnas por estado | Caja o Cocina |
| `/historial` | `Historial.jsx` | Pedidos cerrados, filtrable por estado | Solo Caja |
| `/caja` | `Caja.jsx` | Turno de caja (apertura/cierre/arqueo) + venta rápida en mostrador | Solo Caja |
| `/carta` | `GestionMenu.jsx` | Editar el menú: categorías y productos (crear/editar/borrar) | Solo Caja |
| `/panel` | `Panel.jsx` | KPIs del día, ventas por hora, más vendidos | Solo Caja |
| `/recogida` | `Recogida.jsx` | Tablero de pedidos preparando/listo (pantalla pública) | Caja o Cocina |

Ver sección "Roles y acceso por PIN" más abajo para el porqué de esta
columna y cómo está implementada.

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
- **Badges** redondeados (`.badge-estado` + modificador) para mostrar el
  estado como texto corto dentro de una tarjeta o fila.
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
  `caja.js`, `informes.js`, `supabaseClient.js`), no directamente en los
  handlers — sigue ese mismo patrón para lógica nueva.
- Cambios de esquema de datos van en `supabase/migration.sql` (tablas) y
  `supabase/policies.sql` (RLS). Si añades una tabla nueva, añade también
  su política — sin RLS la app no podrá leer/escribir esa tabla. `orders` y
  `turnos_caja` no permiten borrar (son histórico); `menu_categorias` y
  `menu_productos` sí (son un catálogo vivo) — sigue esa misma distinción
  para tablas nuevas en vez de copiar una política sin pensar si aplica.
- **No hay inventario/gestión de stock en este proyecto, a propósito.**
  Existió (tabla `inventario`, pantalla `/inventario`, vínculo
  `ingredienteClave` en el menú) pero se retiró por completo: el negocio
  gestiona el stock en otra plataforma. Si algo parece pedir "disponible
  según stock", no lo confundas con lo que ahora es simplemente
  `activo`/inactivo en `menu_productos` (visible u oculto en el kiosco,
  sin relación con cantidades) — y no reintroduzcas inventario salvo que
  el dueño lo pida explícitamente otra vez.

### El menú — editable desde `/carta`
El menú **ya no es estático**: vive en Supabase (`menu_categorias`,
`menu_productos`) y se edita desde `/carta` (`GestionMenu.jsx`). Es la
carta real del negocio (~119 productos de partida, 11 categorías: Kebab,
Dürüm, Lahmacum, Platos combinados, Especialidades, Patatas y snacks,
Salsas, Bebidas, Ensaladas, Pizzas, Haz tu menú).

- `client/api/_lib/menu.js` expone dos funciones **async** (consultan
  Supabase, ya no hay un array estático que importar):
  `getMenu()` — el menú agrupado por categoría para el kiosco/caja, solo
  productos `activo = true`, omite categorías que se queden vacías; y
  `findProducts(ids)` — busca varios productos de golpe por id (usado por
  `POST /api/orders` para no hacer una consulta por línea de pedido). Si
  necesitas el menú en un sitio nuevo, usa una de estas dos — no vuelvas a
  escribir una consulta a `menu_productos` desde cero.
- `menu_productos.id` es texto (mismo slug que ya usaban los productos,
  ej. `kebab-ternera`), no un uuid — así no se rompe la relación con los
  `productId` ya guardados en pedidos históricos. Un producto nuevo genera
  su id haciendo slug del nombre (ver `slugify()` en
  `client/api/menu-productos/index.js`, duplicado en
  `EditarProducto.jsx` por el mismo motivo de siempre).
- Borrar o editar un producto **nunca** altera pedidos ya hechos:
  `orders.items` guarda una copia congelada (nombre/precio/modificadores)
  en el momento del pedido, no una referencia viva al producto.
- **Kebab/Dürüm/Lahmacum y Pizzas son "matrices de precio"**: la misma
  proteína o sabor tiene un precio distinto por formato/tamaño (ej. Ternera
  4,50€ en kebab / 6€ en dürüm / 6,50€ en lahmacum; cada pizza en
  pequeña/mediana/familiar). Son **filas independientes** en
  `menu_productos` (una por combinación) — el modelo sigue siendo "un
  producto = un precio". Si se añade un sabor o proteína nueva, créalo así
  desde `/carta` (una fila por variante), no le añadas un selector de
  tamaño a un único producto sin cambiar el modelo primero.
- **Modificadores de personalización** (`modificadores` jsonb por fila de
  `menu_productos`, mismo shape de siempre: pasos con `titulo`/`tipo`/
  `opciones`, cada opción con `nombre`/`precioExtra`/`porDefecto`). Ya no
  hay una constante compartida en código (`QUITAR_INGREDIENTES`/
  `EXTRAS_KEBAB` como existían antes) — cada producto tiene su propia
  copia editable independientemente desde `/carta`. Para no reescribir a
  mano los mismos pasos en 20 productos de la familia kebab, el editor
  (`EditarProducto.jsx`) tiene un desplegable "Copiar de otro producto..."
  que clona (no enlaza) los modificadores de otro producto — si tocas ese
  editor, mantén esa distinción: es una copia puntual, no una plantilla
  viva que se sincroniza sola.
- Los datos de partida (Kebab/Dürüm/Lahmacum/Platos combinados/"Haz tu
  menú" de kebab y plato) siguen incluyendo los pasos "Quitar ingredientes"
  (Sin tomate/cebolla/repollo y zanahoria/lechuga, sin coste — repollo y
  zanahoria van combinados en una sola opción porque en cocina es un único
  ingrediente premezclado) y "Extras" (Extra salsa/Extra queso, +1€ cada
  una), sin límite de selección (`maxSeleccion` omitido a propósito).
  **`precioExtra` nunca puede ser negativo** (validado en
  POST/PATCH de `menu-productos` y clampado en `EditarProducto.jsx`):
  "quitar un ingrediente" es y debe seguir siendo gratis, nunca un
  descuento — si algún día se pide una rebaja por quitar algo, es una
  regla de precio nueva, no un `precioExtra` negativo en un paso de
  "Quitar ingredientes". No existe una opción "Solo carne" como extra
  de pago — se quitó porque duplicaba, de forma confusa y de pago, lo
  que ya se consigue gratis marcando las 4 opciones de "Quitar
  ingredientes". No la reintroduzcas como extra sin que el dueño lo
  pida explícitamente.
- **No hay** un constructor visual de menús tipo arrastrar-y-soltar (armar
  combos desde ingredientes sueltos en una UI de slots) — se decidió no
  construirlo; `/carta` es un CRUD de categorías/productos, no un editor de
  combos con reglas de slots. Si se pide explícitamente, es una pieza
  nueva.

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
0. **No hay número de mesa.** Se decidió deliberadamente: el pedido se
   identifica solo por su `ticket_numero` (`#A-<n>`, ver más abajo). La
   columna `orders.mesa` sigue existiendo en la base de datos (para no
   forzar una migración), pero ya no es un campo que rellene el cliente —
   la rellena la propia app con una etiqueta de origen fija según el
   contexto: `"Comer aquí"` / `"Para llevar"` desde el kiosco
   (`TIPO_SERVICIO_LABEL[tipoServicio]` en `Order.jsx`), o `"Mostrador"`
   desde la venta rápida de caja. Si tocas cualquier pantalla que muestre
   `order.mesa` (`OrderTicket.jsx`, `HistorialTicket.jsx`,
   `Checkout.jsx` — clase CSS `.ticket-origen`), no le antepongas la
   palabra "Mesa": ya no es un número de mesa, es solo una etiqueta de
   contexto. No añadas de vuelta un input de mesa a `CartSidebar.jsx` ni a
   `Caja.jsx` salvo que el dueño lo pida explícitamente.
1. `Order.jsx` (`/`) tiene tres pasos: `inicio` (bienvenida a pantalla
   completa, tema oscuro, elegir "Comer aquí" o "Para llevar" →
   `tipoServicio`) → `categorias` (grid de tarjetas grandes, una por
   categoría del menú, con el nº de productos; tocar una lleva a `menu`
   con esa categoría activa) → `menu` (grid de productos + carrito
   lateral, con las píldoras de categoría de siempre para cambiar rápido
   sin volver a la pantalla de categorías, más un enlace "◀ Categorías"
   que sí vuelve a ella sin vaciar el carrito). "Cancelar pedido" es lo
   único que resetea todo y vuelve a `inicio`. Si añades un paso nuevo al
   flujo, sigue este mismo patrón de máquina de estados por `paso`, no
   metas la lógica de otro paso dentro de un mismo `return`.
2. `calcularTotales()` (en `client/src/totales.js`, misma fórmula que el
   backend) computa subtotal/IVA/total en vivo. IVA fijo al 10%.
3. Un producto con `modificadores` (kebab/dürüm/lahmacum/plato, ver sección
   "El menú") NO se añade directo: abre el modal `Personalizar.jsx`. Los
   ítems del carrito usan
   `lineId` (no `productId`) como clave de operación porque el mismo
   producto puede aparecer en varias líneas con personalizaciones
   distintas — no vuelvas a usar `productId` como key en
   `CartSidebar.jsx`/`Order.jsx`.
4. **El precio de los modificadores se recalcula siempre en el backend**
   (`client/api/orders/index.js`, POST) a partir de lo que devuelve
   `findProducts()` — el cliente solo manda qué opciones eligió
   (`item.modificadores: {pasoId:
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

### Roles y acceso por PIN
El TPV tiene dos roles con PIN numérico de 4 dígitos: **`caja`** (acceso
total, sin restricciones — abre/cierra turno, venta rápida, edita el menú,
ve informes) y **`cocina`** (solo `/cocina` y `/recogida`). El kiosco
público (`/`, `/pago/:orderId`) **no es un tercer rol**: es el estado
"sin sesión" por diseño — el cliente nunca necesita PIN para pedir y
pagar. Si algo parece pedir un "rol usuario", probablemente ya es esto.

- **Backend** (`client/api/_lib/auth.js`): token firmado con HMAC-SHA256
  (`crypto.createHmac`, sin librería nueva), sin tabla de sesiones —
  stateless. `crearToken(rol)` genera `rol.expira.firma` (12h de validez);
  `verificarToken(token, rolesPermitidos)` valida firma (con
  `timingSafeEqual`), expiración y rol permitido; `verificarPin(rol, pin)`
  compara contra `PIN_CAJA`/`PIN_COCINA`. `exigirRol(req, res, roles)` es
  el guard que usan los handlers: lee `Authorization: Bearer <token>`, y si
  no es válido responde `401` él mismo y devuelve `null` — el handler debe
  cortar con `if (!exigirRol(req, res, [...])) return;` como primera línea
  (o dentro del bloque del método que corresponda, ver más abajo).
- **Variables de entorno** (Vercel): `AUTH_SECRET`, `PIN_CAJA`,
  `PIN_COCINA`. El código tiene valores por defecto para poder probar en
  local, pero **`AUTH_SECRET` no es seguro dejarlo así en producción** (a
  diferencia de la clave anon de Supabase, que sí es pública por diseño) —
  cualquiera que lea el código fuente podría firmar tokens válidos.
  Configura las tres antes de depender de esto en producción real.
- **Qué está protegido y qué no, y por qué**: todo lo de `/carta`,
  `/caja`, `/historial`, `/panel` exige rol `caja`. `GET /api/orders` y
  `PATCH /api/orders/[id]/estado` exigen `caja` o `cocina` (los usa
  cocina, checkout-historial y recogida). Deliberadamente **sin
  proteger**: `GET /api/menu` (el kiosco lo necesita sin login),
  `GET /api/orders/[id]` (el cliente consulta su propio ticket) y
  `PATCH /api/orders/[id]/pagar` (el autocobro del kiosco es público a
  propósito) — no le añadas `exigirRol` a estos tres sin que el dueño lo
  pida explícitamente, porque rompería el flujo público de pedir y pagar
  que es el corazón del kiosco.
- **Frontend**: sesión en `localStorage` vía `client/src/auth.js`
  (`getSesion`/`guardarSesion`/`cerrarSesion`, más un evento
  `window` (`tpv:sesion`) para que `App.jsx` reaccione al login/logout sin
  recargar). `client/src/api.js` adjunta `Authorization: Bearer <token>`
  automáticamente si hay sesión, y si el backend responde `401` limpia la
  sesión local (token caducado o revocado). `RutaProtegida.jsx`
  (`client/src/components/RutaProtegida.jsx`) envuelve cada `<Route>` que
  necesita rol y redirige a `/login` si no hay sesión o el rol no
  coincide. `App.jsx` muestra el nav condicional según `sesion?.rol` — un
  cliente sin sesión solo ve "Pedidos"; si añades una pantalla nueva
  protegida, añade también su `NavLink` condicional ahí, no solo la ruta.
- Si se pide login "por empleado" (usuario/contraseña individual, no PIN
  compartido por rol), es un cambio de diseño real — este sistema es
  intencionalmente de PIN compartido por rol, no por persona.

### Marca — logos y assets
Los assets de marca reales viven en `client/public/brand/` (favicons,
manifest PWA, PNGs en varios tamaños, SVGs). Variantes disponibles:
`logo-horizontal-color.svg` (lockup completo con palmeras y la franja roja
"KEBAB, HAMBURGUESERIA, PIZZERIA" — se usa en la bienvenida del kiosco,
`.kiosk-logo-img`), `logo-monocromo-blanco.svg` (wordmark blanco sin
fondo — se usa en la barra superior oscura, `.brand-logo`),
`logo-monocromo-oscuro.svg`/`icono-marca-*` (variantes para fondo claro o
solo el icono) y `logo-ticket-*` (pensados para el ticket impreso —
**aún no usados en ningún sitio**, disponibles si se añade impresión de
ticket con logo). Si necesitas el logo en una pantalla nueva, usa uno de
estos archivos — no reintroduzcas el placeholder "CA" en círculo ni texto
emoji. El color de marca del kit (`#2c2e35`) se normalizó a `#1f2933` en
`manifest.json` para no crear un segundo tono oscuro que no case con el
resto de la app.

### Sincronización: polling, no websockets
Todas las pantallas que necesitan reflejar cambios de otra pantalla
(cocina, checkout, recogida, caja) usan **polling cada 3 segundos** (el
panel del dueño usa 15s, al ser menos urgente), no websockets/realtime. Es
una decisión deliberada de simplicidad — sigue el mismo patrón para
pantallas nuevas con estado compartido.

## 3. Checklist antes de dar por terminada una feature

Antes de decir que una función del TPV está lista, verifica manualmente
(o con test si el proyecto llega a tenerlos):

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
  decimales consistentes con `calcularTotales()`; un producto marcado
  inactivo desde `/carta` desaparece del kiosco (`getMenu()` ya lo filtra)
  y — esto es lo que de verdad importa, no solo la UI — el POST a
  `/api/orders` lo rechaza igual aunque se le mande el `productId`
  directamente (`findProducts()` también filtra por `activo`; pruébalo con
  una petición cruda, no solo clicando). Borrar/editar un producto no debe
  tocar pedidos ya existentes (son una copia congelada, no una referencia).
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
- **Si la feature toca roles/acceso**: el endpoint nuevo rechaza con `401`
  una petición cruda sin `Authorization` o con un token de rol equivocado
  (pruébalo con una petición directa, no solo navegando con sesión
  iniciada) — no confíes en que la ruta esté oculta en el nav; eso es solo
  UI. Si la pantalla debe ser accesible sin login (como `/` o
  `/pago/:orderId`), no le añadas `exigirRol` "por si acaso": rompe el
  flujo público del kiosco.
