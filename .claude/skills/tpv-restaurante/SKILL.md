---
name: tpv-restaurante
description: Guía de diseño visual, convenciones de código y checklist de revisión para trabajar en este TPV de restaurante (React + Vite + funciones serverless de Vercel + Supabase). Úsala SIEMPRE que se toque cualquier pantalla o funcionalidad del TPV — toma de pedido, menú, carrito, comanda de cocina (KDS), checkout/cobro, historial, numeración de pedidos, o especialmente apertura/cierre de caja — aunque el usuario no mencione la palabra "skill". Dispara también con peticiones como "añade una pantalla de caja", "quiero editar el menú desde la interfaz", "que la comanda muestre un número de pedido", "arqueo de caja", "nueva pantalla de cocina", o cualquier cambio en client/src o client/api de este repo.
---

# TPV Restaurante — guía del proyecto

Este repo es un TPV real en producción (React + Vite en `client/`, funciones
serverless de Vercel en `client/api/`, Postgres vía Supabase). Antes de tocar
cualquier pantalla o flujo, lee este documento: te da el contexto que ya
existe para que lo nuevo encaje visualmente y funcionalmente, y no repita
huecos conocidos (numeración de pedidos, caja) sin decidirlo a propósito.

## 1. Diseño visual — sigue lo que ya existe

La app tiene un lenguaje visual consistente en `client/src/styles.css`.
Cualquier pantalla nueva (caja, admin de menú, lo que sea) debe sentirse del
mismo sistema, no como un añadido aparte:

- **Marca**: "TPV Kebab House". Paleta: fondo general `#f2f3f5`; barra
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
  `Barlow Condensed` — sigue esa regla para texto nuevo de gran tamaño en
  vez de dejar la fuente por defecto del body.
- **Tarjetas**: fondo blanco, `border-radius: 10px`, sombra suave
  (`0 1px 3px rgba(0,0,0,0.08)`). Es el contenedor por defecto para
  cualquier bloque de contenido (producto, ticket, turno de caja).
- **Indicador de estado por borde izquierdo**: el historial y la caja usan
  un `border-left` de color según el estado (`.estado-pendiente`,
  `.estado-en_preparacion`, `.estado-listo`, `.estado-abierto`, etc. en
  `styles.css`). Sigue este patrón para cualquier entidad nueva con
  estados sobre fondo claro.
- **Excepción — Cocina (KDS)**: `/cocina` es la única pantalla con tema
  oscuro (`#12181d`), pensada para visibilidad en cocina. Usa sus propias
  clases `.kds-*` (columnas por estado con cabecera de color sólido, no
  border-left) definidas aparte de `.ticket-cocina`/`.card-caja` — no
  mezcles ambos sistemas ni reutilices `.ticket-cocina` fuera de
  `HistorialTicket.jsx` (que sigue en tema claro).
- **Badges** redondeados (`.badge-estado` + modificador) para mostrar el
  estado como texto corto dentro de una tarjeta.
- **Botones grandes y táctiles**: esto lo va a usar un camarero de pie,
  tocando una pantalla o tablet, muchas veces con prisa. Botones de acción
  principal ocupan el ancho disponible (`width: 100%`), padding generoso
  (`0.6–0.8rem`), texto en negrita. Evita controles pequeños o menús
  desplegables para acciones frecuentes (avanzar estado, cobrar, abrir
  caja) — un botón grande y directo es siempre mejor que un patrón "más
  elegante" pero más lento de tocar.
- **Jerarquía**: página → grid de tarjetas → lista dentro de la tarjeta →
  badge/detalle. No metas jerarquías nuevas (tabs anidados, modales sobre
  modales) si un flujo lineal de tarjetas resuelve el caso.

## 2. Convenciones funcionales y de código

### Estructura
- `client/src/pages/`: una página por ruta (`Order.jsx`, `Checkout.jsx`,
  `Kitchen.jsx`, `Historial.jsx`). Una pantalla nueva (ej. `Caja.jsx`) va
  aquí y se registra en `client/src/App.jsx`.
- `client/src/components/`: piezas reutilizables entre páginas
  (`MenuItemCard`, `CartSidebar`, `OrderTicket`, `HistorialTicket`).
- `client/api/`: backend serverless (una función = un endpoint). La lógica
  de negocio compartida vive en `client/api/_lib/` (`menu.js`,
  `orders.js`, `supabaseClient.js`), no directamente en los handlers —
  sigue ese mismo patrón para lógica nueva (ej. `_lib/caja.js`).
- Cambios de esquema de datos van en `supabase/migration.sql` (tablas) y
  `supabase/policies.sql` (RLS). Si añades una tabla nueva, añade también
  su política — sin RLS la app no podrá leer/escribir esa tabla.

### El menú
El menú está **hardcodeado** en `client/api/_lib/menu.js` como un array de
categorías con productos (`id`, `nombre`, `precio`, `descripcion`) — ahora
con productos de kebab (Kebabs, Dürüm, Menús, Acompañamientos, Bebidas,
Postres) acorde a la marca. Es la única fuente de verdad del menú: lo usan
tanto `Order.jsx` (toma de pedido) como el panel de venta rápida de
`Caja.jsx` (botones de venta directa en mostrador). No existe ningún panel
para editarlo desde la UI — si el usuario pide "gestión de menú" o "añadir
productos desde la app", es una funcionalidad nueva de verdad
(probablemente moverlo a una tabla de Supabase), no un ajuste menor. Dilo
explícitamente antes de implementarlo, no asumas que ya hay algo a medio
construir.

### Venta rápida en caja
`Caja.jsx` no es solo apertura/cierre de turno: cuando hay un turno abierto
muestra un panel de venta directa (botones grandes por categoría del menú
+ ticket con el carrito) para cobrar en mostrador sin pasar por la pantalla
de toma de pedido. Al cobrar hace `createOrder()` seguido de `pagarOrder()`
en el mismo flujo — reutiliza los mismos endpoints que el resto de la app,
no crees un camino de cobro paralelo. La división de cuenta
(`caja-dividir`) es solo informativa (total ÷ N personas), no reparte el
pago en transacciones separadas — no lo conviertas en algo más complejo sin
que el usuario lo pida explícitamente.

### Pedidos y su numeración
La tabla `orders` usa `id uuid` como clave primaria, pero además tiene
`ticket_numero` (columna `serial`, autoincremental, generada por Postgres —
sin condiciones de carrera). Se muestra como `#A-<numero>` mediante
`formatTicket()`, que existe **duplicado a propósito** en dos sitios porque
no comparten bundle: `client/api/_lib/orders.js` (backend) y
`client/src/format.js` (frontend). Si tocas el formato del ticket, cambia
los dos. Es un contador global (no reinicia por día/turno) — si se pide que
reinicie a diario, es un cambio de diseño real (necesitaría su propia
secuencia o cálculo), no un ajuste trivial.

### Flujo de un pedido
1. `Order.jsx` (`/`): elige mesa, añade productos, `calcularTotales()` en
   `_lib/orders.js` computa subtotal/IVA/total en vivo. IVA fijo al 10%
   (`IVA_RATE`). Al enviar, se crea la fila en `orders` con estado
   `pendiente`.
2. `Kitchen.jsx` (`/cocina`): lista pedidos activos, permite avanzar el
   estado. Estados válidos y su único orden de avance: `pendiente` →
   `en_preparacion` → `listo` → `entregado`; `cancelado` es un estado
   terminal aparte, no una transición desde el flujo normal. Están
   definidos en `ESTADOS_VALIDOS` (`client/api/_lib/orders.js`) —
   cualquier estado nuevo se añade ahí, no como string suelto en un
   componente.
3. `Checkout.jsx` (`/pago/:orderId`): muestra el ticket y permite marcar
   como pagado (efectivo/tarjeta).
4. `Historial.jsx`: pedidos ya cerrados.

### Sincronización: polling, no websockets
Todas las pantallas que necesitan reflejar cambios de otra pantalla
(cocina, checkout) usan **polling cada 3 segundos**, no websockets/realtime.
Es una decisión deliberada de simplicidad para este proyecto — sigue el
mismo patrón para pantallas nuevas que necesiten estado compartido (ej.
caja reflejando pedidos cobrados) en vez de introducir un mecanismo de
sincronización distinto.

### Caja (apertura/cierre) — no existe todavía
No hay ninguna funcionalidad de turno de caja, arqueo, o efectivo
inicial/final en el código actual. Si se pide, es una feature nueva de
cero: necesitará su propia tabla (algo como `turnos_caja` con
`efectivo_inicial`, `efectivo_final_declarado`, `estado` abierto/cerrado,
`abierto_en`/`cerrado_en`), su propia política RLS, y una pantalla nueva
siguiendo el lenguaje visual de la sección 1. No la trates como un ajuste
menor sobre algo existente.

## 3. Checklist antes de dar por terminada una feature

Antes de decir que una función del TPV está lista, verifica manualmente
(o con test si el proyecto llega a tenerlos):

- **Mesa vacía**: el botón de enviar pedido está deshabilitado y/o muestra
  aviso si no hay mesa (ver `.campo-requerido` / `.hint-enviar` — sigue ese
  mismo patrón de validación visual).
- **Doble envío**: hacer doble click rápido en "enviar pedido" o "cobrar"
  no debe crear dos filas/dos comandas — el botón debe deshabilitarse tras
  el primer click hasta tener respuesta del servidor.
- **Propagación entre pantallas**: cambiar el estado en `/cocina` se refleja
  en `/pago/:orderId` como máximo tras el siguiente ciclo de poll (3s) —
  no debe hacer falta refrescar la página a mano.
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
  decimales consistentes con `calcularTotales()`; un producto sin stock o
  desactivado no debe poder añadirse al carrito.
- **Consistencia visual**: la pantalla nueva usa la paleta y los patrones
  de la sección 1, no colores o componentes ad-hoc.
