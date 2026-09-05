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
| `/login` | `Login.jsx` | Selección de rol (Caja/Cocina/Panel) + teclado numérico de PIN | Público (es la puerta de entrada) |
| `/cocina` | `Kitchen.jsx` | KDS, 3 columnas por estado | Caja o Cocina |
| `/historial` | `Historial.jsx` | Pedidos cerrados, filtrable por estado | Solo Caja |
| `/caja` | `Caja.jsx` | Turno de caja (apertura/cierre/arqueo) + venta rápida en mostrador | Solo Caja |
| `/carta` | `GestionMenu.jsx` | Editar el menú: categorías y productos (crear/editar/borrar) | Solo Caja |
| `/panel` | `Panel.jsx` | KPIs del día, ventas por hora, más vendidos | Solo Panel (no Caja — ver "Roles y acceso por PIN") |
| `/recogida` | `Recogida.jsx` | Tablero de pedidos preparando/listo (pantalla pública) | Público (sin login) |

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
  Las tres (`.kds-page`, `.recogida-page`, `.kiosk-inicio`) se estiran
  hasta el borde con `margin: -1.5rem` (cancela el padding de
  `.content`) + `flex: 1` — `.content` es `display: flex;
  flex-direction: column` justo para esto. **No le pongas un
  `min-height: calc(100vh - <N>px)` a una pantalla nueva de estas**: un
  número de píxeles adivinado para el alto de la barra superior nunca
  coincide exactamente (fue justo el bug real: `120px` en `.kds-page`
  frente a los ~58px reales de `.topbar`, dejaba una franja clara abajo
  en pantallas con poco contenido) — usa `flex: 1` en la pantalla como
  hacen estas tres.
  **Efecto secundario de que `.content` sea flex**: cualquier pantalla
  que se centra con `max-width: Npx; margin: 0 auto;` (`.login-page`,
  `.kiosk-categorias-page`, `.checkout-page`, `.gestion-menu-page`)
  necesita también `width: 100%` explícito — sin él, los márgenes
  horizontales en `auto` anulan el `align-items: stretch` por defecto
  de flex (regla real de la spec, no un bug de navegador) y la pantalla
  se encoge a su contenido en vez de ocupar el ancho completo. No se
  nota en una tarjeta simple, pero si dentro hay un grid con `auto-fill`
  (como la rejilla de categorías del kiosco) se ve como una sola
  columna estrecha en vez de varias — fue un bug real que se coló al
  arreglar la franja clara de arriba. Si añades una pantalla nueva con
  este patrón de centrado, incluye `width: 100%` desde el principio.
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
  `turnos_caja` no permiten borrar **desde la app** (ni la UI ni la API
  exponen un DELETE, son histórico) — eso no cambia. `supabase/
  reset_datos_prueba.sql` es la excepción a propósito: un script de un
  solo uso para que el dueño vacíe `orders`/`turnos_caja` a mano desde
  el SQL Editor de Supabase (bypaseando la app por completo) cuando
  quiere dejar el sistema "de cero" antes de empezar a usarlo de
  verdad, tras un periodo de pruebas. No lo conviertas en un botón de
  la UI ni en un endpoint — sigue siendo intencionadamente una acción
  manual e irreversible fuera de la app, no una función del producto.
  `menu_categorias` y `menu_productos` sí permiten borrar desde la app
  (son un catálogo vivo) — sigue esa misma distinción para tablas
  nuevas en vez de copiar una política sin pensar si aplica.
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
  descuento por su cuenta. No existe una opción "Solo carne" como extra
  de pago — se quitó porque duplicaba, de forma confusa y de pago, lo
  que ya se consigue gratis marcando las 4 opciones de "Quitar
  ingredientes". No la reintroduzcas como extra sin que el dueño lo
  pida explícitamente.
- **Precio alternativo al quitar ingredientes** (`precioSiTodoQuitado`,
  número opcional en el propio paso, junto a `titulo`/`opciones`): si se
  dispara, el precio base del producto pasa a ser ese valor fijo en vez
  de `producto.precio` — los `precioExtra` de cualquier paso (incluidos
  otros "Extras") se siguen sumando encima con normalidad. Pensado para
  vender el kebab/dürüm/lahmacum "solo carne" a un precio fijo más alto
  (+1€) cuando hay que echarle más carne para compensar. Recalculado
  siempre en el backend a partir de la selección ya validada
  (`orders/index.js`), igual que `precioExtra` — nunca a partir de lo
  que afirme el cliente. `Personalizar.jsx` (el modal de personalizar,
  tanto en el kiosco como en la venta rápida de caja) usa exactamente la
  misma condición para el precio en vivo — si tocas una, toca la otra.
  - **Cuándo se dispara** (`disparadoresPrecioAlternativo`, array
    opcional de ids de opción, junto a `precioSiTodoQuitado`): si está
    presente, basta con que el cliente marque **CUALQUIERA** de esas
    opciones — no hace falta que marque todas. Ej. en los 15 sabores
    base de Kebab/Dürüm/Lahmacum (ternera, pollo, mixto, falafel,
    vegetal con queso gouda), el dueño explicó que lo que abulta el
    kebab/dürüm/lahmacum es la carne + la lechuga + el repollo y
    zanahoria — el tomate y la cebolla no abultan — así que
    `disparadoresPrecioAlternativo: ["sin-lechuga",
    "sin-repollo-zanahoria"]`: quitar solo la lechuga (sin tocar nada
    más) ya dispara el precio de "solo carne", igual que quitar solo el
    repollo y zanahoria, o quitar los dos, o quitar los cuatro — pero
    quitar solo tomate y/o cebolla (sin tocar lechuga ni repollo y
    zanahoria) NO lo dispara. **Si el paso NO trae este campo**
    (productos antiguos que no se han tocado, ej. Platos combinados),
    se mantiene el comportamiento original: hace falta marcar **TODAS**
    las opciones del paso para disparar el precio alternativo — no lo
    cambies a "cualquiera" para un producto sin confirmarlo antes, es un
    comportamiento de precio real, no un detalle visual.
  - **A propósito sin este mecanismo en absoluto**: las variantes
    premium (doble, loco, solo carne) no tienen `precioSiTodoQuitado` —
    se quedan con su precio normal quiten lo que quiten.
  - Editable por paso desde `/carta` (`EditarProducto.jsx`): el checkbox
    "Precio alternativo si se marca alguna opción 'activa' de este paso"
    activa el campo (empieza sin ningún disparador marcado — el cajero
    elige abajo cuáles, con un checkbox "Activa precio alt." por
    opción); si se desactiva, se borran `precioSiTodoQuitado` y
    `disparadoresPrecioAlternativo` juntos.
  - `supabase/precio_alternativo_quitar_bulky.sql`: script de datos de
    un solo uso (mismo patrón que `traducciones_menu_en.sql`) que añadió
    `disparadoresPrecioAlternativo` a los 15 productos ya existentes de
    Kebab/Dürüm/Lahmacum que tenían `precioSiTodoQuitado` — no se
    ejecuta solo, ni se repite para productos nuevos creados después
    desde `/carta` (esos se configuran a mano con el checkbox de arriba).
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

Un producto con `modificadores` (kebab/dürüm/lahmacum/plato) tampoco se
añade directo desde caja: abre el mismo modal `Personalizar.jsx` que usa
el kiosco (sección "El menú" más arriba), con el mismo `precioUnidad`
recalculado y el mismo `precioSiTodoQuitado`. Igual que en `Order.jsx`,
el carrito de caja opera por `lineId` (no `productId`) por el mismo
motivo: el mismo producto puede tener varias líneas con personalizaciones
distintas. Un punto naranja junto al nombre del botón
(`.caja-personalizable-punto`) marca qué productos abren el modal — no es
un badge de texto como en el kiosco porque el botón de caja es un cuadro
de 84px de alto pensado para toque rápido, no tiene sitio para una
segunda línea.

**"Últimos cierres" (el historial de turnos cerrados, con efectivo
esperado/declarado/diferencia) ya NO vive en `/caja` — vive en
`/panel`.** El dueño no quiere que el cajero vea esas cifras (mismo
motivo que separar el PIN de `panel` del de `caja`, ver "Roles y acceso
por PIN"). `/caja` solo muestra si HAY un turno abierto ahora mismo
(para poder abrir/cerrar el suyo); la lista de cierres pasados es cosa
de `Panel.jsx`, que llama a `GET /api/caja?estado=cerrado` — el mismo
endpoint que ya usaba `/caja`, ahora también accesible en modo
solo-lectura (GET) con rol `panel`, mientras que abrir/cerrar turno
(POST/PATCH) sigue siendo exclusivo de `caja`. Si se pide mostrar en
`/caja` cualquier cifra de dinero histórico o acumulado (no solo "hay
turno abierto sí/no"), confírmalo con el dueño antes de añadirlo — es
justo lo que se acaba de sacar de ahí a propósito.

Tras cobrar, aparece un botón "Imprimir recibo" que llama a
`window.print()` sobre `ReciboImprimible.jsx` (`client/src/components/`)
— un ticket de 80mm oculto en pantalla (`.recibo-imprimible { display:
none }`) que solo se muestra mediante `@media print` en `styles.css` (con
la técnica estándar `visibility: hidden` en `body *` + `visibility:
visible` en el recibo, no `display`, para no romper el layout del resto
de la página al volver de imprimir). No hay integración con una
impresora térmica concreta a propósito — es impresión de navegador, así
que funciona con cualquier impresora que tenga controlador de sistema.
Si se pide en el futuro imprimir sin diálogo (ESC/POS directo por USB/
red), es una pieza nueva, no una extensión de esto. Los datos fiscales
del negocio (CIF, dirección, teléfono, email) que aparecen bajo el logo
del recibo están en la constante `DATOS_NEGOCIO` al principio de
`ReciboImprimible.jsx` — si cambian, se edita ese objeto, no el JSX.

**Cola de "Pedidos del kiosco sin cobrar"**: como el kiosco no tiene
datáfono integrado (ver "Flujo de un pedido" más abajo), el cobro real
de un pedido creado desde `/` lo hace un cajero desde esta cola, no el
cliente. Se ve siempre en `/caja` (fuera del `if (turnoAbierto)`, no
hace falta turno abierto para cobrar) cuando hay algún pedido con
`pagado: false` — polling de 3s vía `GET /api/orders?pagado=false`
(filtra también `estado === "cancelado"` en el cliente: un pedido
cancelado antes de cobrarse no tiene nada que cobrar). El cajero toca
Efectivo/Tarjeta sobre la tarjeta del pedido, que llama al mismo
`pagarOrder()` de siempre — la confirmación "Cobrado ... · Imprimir
recibo" (`.caja-venta-ok`) vive fuera del `if (turnoAbierto)` por el
mismo motivo que la cola: si no, cobrar sin turno abierto no mostraba
ninguna confirmación ni daba opción de imprimir. `PATCH
/api/orders/[id]/pagar` exige rol `caja` (`exigirRol`) — es el cambio
que hace que esto sea un cobro real: antes era público porque el
propio cliente lo llamaba desde `Checkout.jsx`, y si se dejara público
ahora cualquiera podría marcar su pedido como pagado sin pasar por
caja, llamando al endpoint directamente sin usar la UI.

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
   cocina). Cada origen (`order.mesa`) tiene su propio color de tarjeta
   en `OrderTicket.jsx` para distinguirlos de un vistazo sin leer el
   texto: "Comer aquí" es el gris oscuro normal (sin clase extra),
   "Para llevar" usa `.kds-ticket-llevar` (azul) y "Mostrador" usa
   `.kds-ticket-mostrador` (morado) — tres colores distintos entre sí y
   fuera de la paleta roja/naranja/verde de urgencia y estado de las
   columnas, para no confundir origen con urgencia. Si se añade un
   origen nuevo, dale también su propio color en vez de reutilizar uno
   de estos dos. Es solo `/cocina` (`Recogida.jsx` tiene su propio
   marcado de ticket, no reutiliza `OrderTicket.jsx`) — si se pide lo
   mismo en recogida, hay que replicarlo ahí aparte.
   **Modificadores/notas de línea** (`item.modificadoresTexto`/
   `item.notas`, ej. "Sin cebolla") se muestran en `.kds-nota` como un
   chip con fondo propio, negrita y un icono ⚠ — a propósito más
   llamativos que el nombre del producto (`.kds-item-nombre`), no al
   revés: es justo lo que un cocinero con prisa tiene que ver primero.
   Si se añade otro sitio que muestre modificadores en cocina, sigue
   este mismo patrón de chip, no un simple color de texto como había
   antes. **Pantallas grandes**: `/cocina` tiene un `@media (min-width:
   1600px)` que sube explícitamente el tamaño de cada pieza de texto del
   ticket (título, contador, cabecera de columna, ticket id, tiempo,
   origen, nombre, nota, botón) — todos los valores de `.kds-*` están en
   `rem` (se miden contra la raíz del documento), así que **no sirve**
   con subir un solo `font-size` en `.kds-page` y esperar que se
   propague; si se añade una pieza de texto nueva al ticket, añade
   también su override ahí dentro del media query, o se quedará
   pequeña en un monitor grande mientras todo lo demás escala.
6. `Checkout.jsx` (`/pago/:orderId`): muestra el ticket y el estado en
   vivo, pero **ya no deja pagar desde ahí** — no hay datáfono
   integrado en el kiosco, así que el cliente no puede cobrarse a sí
   mismo. Si `!order.pagado` se muestra un aviso amistoso ("Pasa a caja
   para finalizar tu pago y recibir tu pedido" + el número de ticket
   bien grande); solo un cajero cobra de verdad, desde la cola de
   "Pedidos del kiosco sin cobrar" en `/caja` (ver sección "Venta
   rápida en caja"). No reintroduzcas botones de pago aquí sin que el
   dueño lo pida explícitamente — sería volver a un cobro que nadie
   cobra de verdad.
7. `Historial.jsx`: pedidos cerrados, filtrables por estado.

### Idioma del kiosco (ES/EN)
Solo las pantallas del cliente (`Order.jsx` en sus 3 pasos y
`Checkout.jsx`) tienen selector de idioma (`SelectorIdioma.jsx`, botones
"ES"/"EN"); **las pantallas de personal (cocina, caja, historial, panel,
carta, login) se quedan en español siempre** — no les añadas el selector.
Piezas:
- `client/src/idioma.js`: `getIdioma()`/`guardarIdioma()`, persistido en
  `localStorage` (clave `tpv_idioma`), default `"es"`. Cada página lo lee
  una vez al montar (`useState(() => getIdioma())`) y gestiona su propio
  estado local para que el toggle sea instantáneo — no hay evento global
  como el de `auth.js`, no hace falta (cada pantalla del kiosco es de
  cliente único, no hay dos pestañas que sincronizar).
- `client/src/textos.js`: diccionario `TEXTOS.es`/`TEXTOS.en` + helper
  `t(idioma, clave)`, más `ESTADOS_LABEL`, `METODO_PAGO_LABEL` y
  `TIPO_SERVICIO_DISPLAY` (todos indexados por idioma), para los textos
  fijos de interfaz (botones, títulos, placeholders).
- **Nombres/descripciones de categoría y producto SÍ se pueden
  traducir**, pero no viven en `textos.js` — vienen de la base de datos
  (`menu_categorias.nombre_en`, `menu_productos.nombre_en`/
  `descripcion_en`, columnas de texto nullable). El cajero las rellena
  desde `/carta` (`GestionMenu.jsx`/`EditarProducto.jsx`, campos "...(en
  inglés, opcional)"; para renombrar una categoría existente hay un
  botón "Editar" en su cabecera). `GET /api/menu` (`_lib/menu.js`)
  devuelve `categoriaEn`/`nombreEn`/`descripcionEn` junto a las
  versiones en español. El frontend usa `conIdioma(valorEs, valorEn,
  idioma)` (`textos.js`) para elegir cuál mostrar — **si `valorEn` es
  `null`/vacío (categoría o producto aún sin traducir) cae siempre al
  español**, nunca se queda en blanco. Si añades una pantalla nueva que
  muestre nombre/descripción de categoría o producto, pasa por
  `conIdioma()` en vez de leer `cat.categoria`/`producto.nombre`
  directo. Los pasos/opciones de personalización (`paso.titulo`,
  `opcion.nombre` en `producto.modificadores`) siguen sin traducir a
  propósito — no se pidió, y son un esquema más anidado.
- **Regla que no se puede romper**: `order.mesa` (lo que ven
  cocina/historial/caja, y de lo que depende el color por origen en
  `/cocina` — ver punto 5 más arriba, `.kds-ticket-llevar` compara
  exactamente contra `"Para llevar"`) se manda al backend **siempre en
  español**, sin importar el idioma elegido por el cliente. Por eso
  `Order.jsx` mantiene `TIPO_SERVICIO_LABEL` (español, fijo, usado solo
  para el `mesa` que se envía a `createOrder()`) totalmente separado de
  `TIPO_SERVICIO_DISPLAY[idioma]` (traducido, solo para lo que ve el
  cliente en pantalla). Lo mismo aplica a `order.estado` y
  `order.metodoPago`: se guardan en español en la BD, y
  `ESTADOS_LABEL[idioma]`/`METODO_PAGO_LABEL[idioma]` en `textos.js` son
  solo para mostrárselos al cliente traducidos — nunca cambies lo que se
  envía al backend según el idioma. Por la misma razón, `item.nombre`
  dentro de `orders.items` se congela en español al crear el pedido
  (`POST /api/orders` siempre usa `producto.nombre`, nunca `nombreEn` —
  ver `_lib/orders.js`) y así se queda: es el mismo objeto que lee
  `/cocina`, así que el ticket de `Checkout.jsx` muestra los nombres de
  producto en español aunque el cliente haya pedido en inglés — solo la
  navegación por el menú (antes de enviar la comanda) está traducida.
- Si añades una pantalla o texto nuevo al kiosco, añade la clave en
  `TEXTOS.es` y `TEXTOS.en` (ambas a la vez, no dejes una sin traducir)
  y usa `t(idioma, "claveNueva")` — no hardcodees español directo en
  JSX de `Order.jsx`/`Checkout.jsx` ni en los componentes que renderizan
  (`MenuItemCard.jsx`, `CartSidebar.jsx`, `Personalizar.jsx`, todos
  reciben `idioma` como prop para esto).
- **La traducción de categoría/producto NUNCA es automática** —
  `nombre_en`/`descripcion_en` empiezan en `NULL` para todo lo que ya
  existía en la BD antes de añadir esas columnas, así que sin rellenarlas
  el kiosco en inglés cae a español en todo el menú (esperado, no un
  bug: ver `conIdioma()` más arriba). `supabase/traducciones_menu_en.sql`
  es un script de datos de un solo uso que rellena esas columnas para
  los ~119 productos/11 categorías que ya existían en `migration.sql` en
  el momento de añadir el idioma — el dueño lo ejecuta una vez en el SQL
  Editor de Supabase. Cualquier producto/categoría creado después (desde
  `/carta`) necesita su traducción a mano en el formulario, ese script no
  se vuelve a ejecutar solo.

### Aviso de WhatsApp cuando el pedido está listo
En `Checkout.jsx`, si el pedido no está aún en un estado terminal
(`listo`/`entregado`/`cancelado` — ver `ESTADOS_SIN_AVISO`), se muestra
un formulario para que el cliente deje su número; en cuanto lo guarda se
sustituye por una confirmación ("Te avisaremos por WhatsApp al +34...").
Piezas:
- `orders.telefono_whatsapp` (nullable) — `PATCH /api/orders/[id]`
  (`client/api/orders/[id]/index.js`) es **público a propósito**, igual
  que el `GET` que ya vivía en ese archivo (el cliente lo llama sin
  sesión desde `/pago/:orderId`), pero solo acepta tocar este campo —
  nunca `estado`/`pagado`/importes, que siguen exigiendo rol en sus
  propios endpoints. Se añadió a este archivo en vez de crear uno nuevo
  porque el proyecto ya iba al límite de 12 funciones del plan Hobby de
  Vercel (ver más abajo) — sigue este patrón (ampliar un `index.js`
  existente por método/query) antes de añadir un archivo nuevo bajo
  `client/api/`.
- `normalizarTelefonoWhatsapp()` (`_lib/orders.js`) asume prefijo +34
  cuando el cliente teclea un móvil de 9 dígitos sin prefijo (caso
  normal para el negocio) y devuelve `null` si no parece un número
  válido — el endpoint responde 400 en ese caso.
- `_lib/whatsapp.js` → `enviarAvisoPedidoListo()` llama a la Meta Cloud
  API (WhatsApp Business Platform) directamente, sin Twilio ni ningún
  otro intermediario — decisión tomada por coste (Meta da ~1000
  conversaciones/mes gratis). Se dispara desde
  `orders/[id]/estado.js`, **solo la primera vez** que un pedido llega a
  `listo` (mismo criterio que `listo_en`, para no reavisar si se
  revierte y se vuelve a marcar desde el historial) y solo si el pedido
  tiene `telefono_whatsapp`. **Nunca lanza** — si Meta responde error, o
  si las variables de entorno no están puestas, se traga el fallo (con
  `console.error`) y la respuesta al cocinero sigue siendo 200: marcar
  "listo" en cocina tiene que funcionar siempre, pase lo que pase con
  WhatsApp.
- Variables de entorno que hacen falta en Vercel para que esto envíe de
  verdad (sin ellas, `enviarAvisoPedidoListo` no hace nada, no rompe
  nada): `WHATSAPP_TOKEN` (token de acceso permanente de la app de Meta
  for Developers), `WHATSAPP_PHONE_NUMBER_ID` (el Phone Number ID del
  número de WhatsApp Business del negocio) y `WHATSAPP_TEMPLATE_NAME`
  (nombre de la plantilla aprobada por Meta, con un único parámetro de
  texto para el ticket, ej. *"Tu pedido {{1}} ya está listo para
  recoger"*). Dar de alta esto (cuenta de Meta Business, número
  verificado, plantilla aprobada) es cosa del dueño — no algo que se
  pueda automatizar desde aquí. Mientras no estén puestas, el kiosco
  sigue funcionando normal, simplemente no se manda ningún WhatsApp.

### Tiempo de espera del kiosco
En la pantalla de inicio del kiosco (`.kiosk-footer`, junto a "Cocina
abierta") se muestra un tiempo de espera estimado ("Tiempo de espera
estimado: ~15 min"). Es un ajuste global editable **siempre**, no algo
que se fija una sola vez — desde `/caja` (arriba del todo, visible con o
sin turno abierto) hay un campo numérico + botón "Guardar" que lo
actualiza en cualquier momento.

- `ajustes` (tabla de una sola fila, `id` siempre `1`) guarda
  `tiempo_espera_minutos`. **No la conviertas en un almacén de
  clave/valor genérico** aunque parezca "más preparado para el futuro"
  — de momento solo hay un ajuste; si se pide otro, se añade como
  columna nueva a esta misma fila, no se rediseña el esquema sin que
  haga falta.
- `GET/PATCH /api/ajustes` (`client/api/ajustes.js`): GET es público a
  propósito (el kiosco lo lee sin sesión, igual que `GET /api/menu`);
  PATCH exige rol `caja` (se edita desde `/caja`, como pidió el dueño —
  no `panel`, que es para ver informes, no para configurar el kiosco).
- **Límite de funciones de Vercel ya alcanzado**: este endpoint dejó el
  proyecto en 12 funciones serverless — el máximo del plan Hobby. Si se
  pide un endpoint nuevo, la única forma de añadirlo sin subir de plan
  es ampliar un `index.js`/archivo existente por método o por query
  param (como ya se hizo con `orders/[id]/index.js` para el teléfono de
  WhatsApp, o con `menu-categorias/index.js` para categoría/id) — no
  crear un archivo nuevo bajo `client/api/` sin comprobar antes cuántas
  funciones hay (`find client/api -name "*.js" -not -path "*/_lib/*" |
  wc -l`).

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

`Panel.jsx` también muestra **"Últimos cierres"** (los últimos 5 turnos
de caja cerrados, con efectivo esperado/declarado/diferencia) — esto NO
sale de `GET /api/informes`, sale de `GET /api/caja?estado=cerrado` (el
mismo endpoint de siempre de `/caja`, ver "Venta rápida en caja" más
arriba). Se movió aquí desde `/caja` a propósito: el dueño no quiere que
el cajero vea el histórico de cierres. Reutiliza tal cual las clases CSS
que ya existían para esto (`.caja-historial-titulo`, `.tickets-grid`,
`.card-caja.historial-turno`, `.caja-cierre-resumen`, etc.) — no son
específicas de `/caja`, así que no hizo falta CSS nuevo.

### Pantalla de recogida
`/recogida` (`Recogida.jsx`) es un tablero pensado para un monitor público
de cara al cliente (no un formulario de trabajo del personal), tema
oscuro, tipografía enorme. Solo lee `en_preparacion`/`listo` vía
`GET /api/orders` con el mismo polling de 3s que cocina — no le añadas
acciones (botones, formularios): es de solo lectura por diseño.

**La ruta es pública a propósito, sin `RutaProtegida`** — es una
pantalla sin nadie delante que la atienda (un monitor montado en la
pared), así que no puede depender de una sesión que caduca a las 12h o
que alguien cierre desde otro dispositivo. `GET /api/orders`
(`client/api/orders/index.js`) refleja esto: sin token válido no
devuelve 401, sirve una vista pública reducida (solo
`id`/`ticketNumero`/`estado` de los pedidos `en_preparacion`/`listo`,
nada de items ni el resto de campos); con token de `caja`/`cocina`
sirve el pedido completo de siempre para `/cocina` y `/historial`. Si
tocas este endpoint, mantén esa rama pública — quitarla rompe
`/recogida` en cualquier pantalla donde la sesión no esté activa (fue
justo el bug que se coló al añadir el login por PIN: se protegió esta
ruta entera por error y dejó el tablero sin datos).

### Roles y acceso por PIN
El TPV tiene tres roles con PIN numérico de 4 dígitos: **`caja`** (venta
rápida, turno, edita el menú, ve historial — pero NO el panel de
ventas), **`cocina`** (solo `/cocina` y `/recogida`) y **`panel`** (solo
`/panel`, los informes/KPIs del dueño). El kiosco público (`/`,
`/pago/:orderId`) **no es un cuarto rol**: es el estado "sin sesión" por
diseño — el cliente nunca necesita PIN para pedir y pagar. Si algo
parece pedir un "rol usuario", probablemente ya es esto.

- **`panel` es un PIN aparte del de `caja` a propósito**: el dueño no
  quiere que el personal de caja (que sabe el PIN del día a día) vea
  cuánto se factura. Antes `/panel` aceptaba rol `caja`; ya no — si se
  pide "que caja también vea el panel", es una decisión de negocio real
  que hay que confirmar explícitamente con el dueño, no revertirlo por
  comodidad o por parecer más simple.
- **Backend** (`client/api/_lib/auth.js`): token firmado con HMAC-SHA256
  (`crypto.createHmac`, sin librería nueva), sin tabla de sesiones —
  stateless. `crearToken(rol)` genera `rol.expira.firma` (12h de validez);
  `verificarToken(token, rolesPermitidos)` valida firma (con
  `timingSafeEqual`), expiración y rol permitido; `verificarPin(rol, pin)`
  compara contra `PIN_CAJA`/`PIN_COCINA`/`PIN_PANEL`. `exigirRol(req, res,
  roles)` es el guard que usan los handlers: lee `Authorization: Bearer
  <token>`, y si no es válido responde `401` él mismo y devuelve `null` —
  el handler debe cortar con `if (!exigirRol(req, res, [...])) return;`
  como primera línea (o dentro del bloque del método que corresponda, ver
  más abajo).
- **Variables de entorno** (Vercel): `AUTH_SECRET`, `PIN_CAJA`,
  `PIN_COCINA`, `PIN_PANEL`. El código tiene valores por defecto para
  poder probar en local, pero **`AUTH_SECRET` no es seguro dejarlo así en
  producción** (a diferencia de la clave anon de Supabase, que sí es
  pública por diseño) — cualquiera que lea el código fuente podría firmar
  tokens válidos. Configura las cuatro antes de depender de esto en
  producción real.
- **Qué está protegido y qué no, y por qué**: `/carta`, `/caja`,
  `/historial` exigen rol `caja` con `exigirRol` (401 sin token válido);
  `GET /api/informes` exige exclusivamente rol `panel`. `GET
  /api/caja` (turnos) es la excepción con dos roles: acepta `caja` o
  `panel`, porque `/panel` también lo usa para "Últimos cierres" — pero
  el `POST` (abrir turno) y `PATCH /api/caja/[id]/cerrar` (cerrar turno)
  siguen exigiendo exclusivamente `caja`, nunca `panel`. `PATCH
  /api/orders/[id]/estado` exige `caja` o `cocina` igual (lo usa cocina
  y el "revertir" de historial).
  `GET /api/orders` es distinto — no usa `exigirRol`: sin token responde
  igualmente `200` con una vista pública reducida (solo lo que necesita
  `/recogida`, ver la sección "Pantalla de recogida"), y con token de
  `caja`/`cocina` responde el detalle completo que usan `/cocina` y
  `/historial`. `PATCH /api/orders/[id]/pagar` exige rol `caja` — el
  cliente ya no se cobra a sí mismo (ver "Cola de pedidos del kiosco
  sin cobrar" en "Venta rápida en caja"), así que este es el único de
  los endpoints de pedidos que SÍ pasó de público a protegido; no lo
  reviertas a público sin que el dueño lo pida. `PATCH /api/ajustes`
  exige rol `caja` (ver "Tiempo de espera del kiosco" más abajo).
  Deliberadamente **sin proteger en absoluto**: `GET /api/menu` (el
  kiosco lo necesita sin login), `GET /api/orders/[id]` (el cliente
  consulta su propio ticket) y `GET /api/ajustes` (el kiosco necesita
  leer el tiempo de espera sin login) — no le añadas `exigirRol` a estos
  tres sin que el dueño lo pida explícitamente, porque rompería el flujo
  público de pedir que es el corazón del kiosco.
- **Frontend**: sesión en `localStorage` vía `client/src/auth.js`
  (`getSesion`/`guardarSesion`/`cerrarSesion`, más un evento
  `window` (`tpv:sesion`) para que `App.jsx` reaccione al login/logout sin
  recargar; también exporta `NOMBRE_ROL` — el nombre legible por rol,
  compartido por `Login.jsx` y `App.jsx` para no duplicarlo y que se
  desincronice al añadir un rol). `client/src/api.js` adjunta
  `Authorization: Bearer <token>` automáticamente si hay sesión, y si el
  backend responde `401` limpia la sesión local (token caducado o
  revocado). `RutaProtegida.jsx` (`client/src/components/
  RutaProtegida.jsx`) envuelve cada `<Route>` que necesita rol y redirige
  a `/login` si no hay sesión o el rol no coincide. `App.jsx` muestra el
  nav condicional según `sesion?.rol` — un cliente sin sesión solo ve
  "Pedidos"; si añades una pantalla nueva protegida, añade también su
  `NavLink` condicional ahí, no solo la ruta.
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
emoji. El color de marca del kit (`#2c2e35`, el fondo embebido en el SVG
del logo horizontal) se normalizó a `#1f2933` en `manifest.json` para no
crear un segundo tono oscuro que no case con el resto de la app; la
excepción deliberada es `.kiosk-inicio`, que sí usa `#2c2e35` — es donde
vive ese mismo logo a tamaño grande, y el dueño prefirió que el fondo
hiciera juego exacto con la caja de color del SVG en vez de con el resto
de pantallas oscuras (`#1f2933` en `.kds-page`/`.recogida-page`). No
uses `#2c2e35` en otra pantalla oscura sin que se pida lo mismo.

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
