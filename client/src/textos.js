// Textos fijos de la interfaz del kiosco (pedido + pago), en español e
// inglés. A propósito NO incluye nombres/descripciones de productos —
// esos viven en la base de datos y son los mismos en los dos idiomas
// (ver la skill del proyecto). Las pantallas de personal (cocina, caja,
// carta, historial, panel) no usan este archivo — se quedan en español.
const TEXTOS = {
  es: {
    cargandoMenu: "Cargando menú...",
    tocaParaEmpezar: "Toca para empezar tu pedido",
    comerAqui: "COMER AQUÍ",
    enElLocal: "En el local",
    paraLlevar: "PARA LLEVAR",
    paraLlevarSub: "Para llevar",
    cocinaAbierta: "Cocina abierta",
    tuPedido: "Tu pedido",
    cancelarPedido: "Cancelar pedido",
    queTeApetece: "¿Qué te apetece?",
    productos: "productos",
    verCarrito: "Ver carrito",
    volverCategorias: "◀ Categorías",
    pedido: "Pedido",
    anadeProductos: "Añade productos del menú",
    notasItemPlaceholder: "Notas (ej. sin cebolla)",
    notasGeneralesPlaceholder: "Notas generales del pedido",
    subtotal: "Subtotal",
    iva: "IVA (10%)",
    total: "Total",
    enviando: "Enviando...",
    enviarComanda: "Enviar comanda a cocina",
    anadeAlMenos: "Añade al menos un producto para poder enviar",
    personalizable: "Personalizable",
    personalizar: "Personalizar",
    anadir: "Añadir",
    comandaEnviada: "Comanda enviada a cocina",
    estado: "Estado:",
    totalAPagar: "TOTAL A PAGAR",
    pagadoCon: "Pagado con",
    pasaACajaTitulo: "👉 Pasa a caja para finalizar tu pago y recibir tu pedido",
    dilesElNumero: "Diles el número",
    nuevoPedido: "+ Nuevo pedido",
    nota: "Nota:",
    cargandoPedido: "Cargando pedido...",
    pedidoNoEncontrado: "No se encontró el pedido",
    avisoWhatsappTitulo: "¿Te avisamos por WhatsApp cuando esté listo?",
    avisoWhatsappPlaceholder: "Tu número de WhatsApp",
    avisoWhatsappGuardar: "Avísame",
    avisoWhatsappGuardando: "Guardando...",
    avisoWhatsappGuardado: "Te avisaremos por WhatsApp al",
    avisoWhatsappError: "Ese número no parece válido",
    tiempoEsperaLabel: "Tiempo de espera estimado",
    upsellTitulo: "¿Añadimos algo más a tu pedido?",
    upsellSubtitulo: "Aros de cebolla, samosas, cheese bites, falafel...",
    upsellFinalizar: "Finalizar pedido",
  },
  en: {
    cargandoMenu: "Loading menu...",
    tocaParaEmpezar: "Tap to start your order",
    comerAqui: "EAT HERE",
    enElLocal: "Dine in",
    paraLlevar: "TAKEAWAY",
    paraLlevarSub: "Takeaway",
    cocinaAbierta: "Kitchen open",
    tuPedido: "Your order",
    cancelarPedido: "Cancel order",
    queTeApetece: "What would you like?",
    productos: "items",
    verCarrito: "View cart",
    volverCategorias: "◀ Categories",
    pedido: "Order",
    anadeProductos: "Add items from the menu",
    notasItemPlaceholder: "Notes (e.g. no onion)",
    notasGeneralesPlaceholder: "General order notes",
    subtotal: "Subtotal",
    iva: "Tax (10%)",
    total: "Total",
    enviando: "Sending...",
    enviarComanda: "Send order to kitchen",
    anadeAlMenos: "Add at least one item to send",
    personalizable: "Customizable",
    personalizar: "Customize",
    anadir: "Add",
    comandaEnviada: "Order sent to the kitchen",
    estado: "Status:",
    totalAPagar: "TOTAL DUE",
    pagadoCon: "Paid with",
    pasaACajaTitulo: "👉 Go to the register to pay and collect your order",
    dilesElNumero: "Tell them the number",
    nuevoPedido: "+ New order",
    nota: "Note:",
    cargandoPedido: "Loading order...",
    pedidoNoEncontrado: "Order not found",
    avisoWhatsappTitulo: "Want a WhatsApp message when it's ready?",
    avisoWhatsappPlaceholder: "Your WhatsApp number",
    avisoWhatsappGuardar: "Notify me",
    avisoWhatsappGuardando: "Saving...",
    avisoWhatsappGuardado: "We'll message you on WhatsApp at",
    avisoWhatsappError: "That number doesn't look valid",
    tiempoEsperaLabel: "Estimated wait",
    upsellTitulo: "Want to add anything else?",
    upsellSubtitulo: "Onion rings, samosas, cheese bites, falafel...",
    upsellFinalizar: "Finish order",
  },
};

// order.estado y order.metodoPago se guardan siempre en español (los usa
// también el personal) — esto es solo para MOSTRÁRSELOS al cliente en su
// idioma, nunca para lo que se envía al backend.
export const ESTADOS_LABEL = {
  es: {
    pendiente: "Recibido por cocina",
    en_preparacion: "En preparación",
    listo: "Listo para servir",
    entregado: "Entregado",
    cancelado: "Cancelado",
  },
  en: {
    pendiente: "Received by the kitchen",
    en_preparacion: "In progress",
    listo: "Ready to serve",
    entregado: "Delivered",
    cancelado: "Cancelled",
  },
};

export const METODO_PAGO_LABEL = {
  es: { efectivo: "efectivo", tarjeta: "tarjeta" },
  en: { efectivo: "cash", tarjeta: "card" },
};

// order.mesa (lo que ve cocina/historial/caja) se guarda SIEMPRE en
// español — ver TIPO_SERVICIO_LABEL en Order.jsx — esto es solo la
// etiqueta que se le muestra al cliente en su idioma en pantalla.
export const TIPO_SERVICIO_DISPLAY = {
  es: { aqui: "Comer aquí", llevar: "Para llevar" },
  en: { aqui: "Eat here", llevar: "Takeaway" },
};

export function t(idioma, clave) {
  return TEXTOS[idioma]?.[clave] ?? TEXTOS.es[clave] ?? clave;
}

// Para contenido que viene de la base de datos (nombre/descripción de
// categoría o producto, ej. producto.nombre + producto.nombreEn): si hay
// traducción al inglés y el idioma es "en", se usa; si no, se cae siempre
// al valor en español — así una categoría/producto sin traducir todavía
// nunca se queda en blanco en el kiosco.
export function conIdioma(valorEs, valorEn, idioma) {
  return idioma === "en" && valorEn ? valorEn : valorEs;
}
