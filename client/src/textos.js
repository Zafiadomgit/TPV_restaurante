// Textos fijos de la interfaz del kiosco (pedido + pago), en español e
// inglés. A propósito NO incluye nombres/descripciones de productos —
// esos viven en la base de datos y son los mismos en los dos idiomas
// (ver la skill del proyecto). Las pantallas de personal (cocina, caja,
// carta, historial, panel) no usan este archivo — se quedan en español.
const TEXTOS = {
  es: {
    cargandoMenu: "Cargando menú...",
        comerAqui: "COMER AQUÍ",
    enElLocal: "En el local",
    paraLlevar: "PARA LLEVAR",
    paraLlevarSub: "Te avisamos cuando esté",
    dondeTeLoComes: "¿Dónde te lo comes?",
    masPedido: "Más pedido",
    cocinaAbierta: "Cocina abierta",
    tuPedido: "Tu pedido",
    cancelarPedido: "Cancelar pedido",
    queTeApetece: "¿Qué te apetece?",
    productos: "productos",
    verMiPedido: "Ver mi pedido",
    volverCategorias: "◀ Categorías",
    linea: "línea",
    lineas: "líneas",
    quitar: "Quitar",
    anadeProductos: "Añade productos del menú",
    notasItemPlaceholder: "Notas (ej. sin cebolla)",
    notasGeneralesPlaceholder: "Notas generales del pedido",
    subtotal: "Subtotal",
    iva: "IVA (10%)",
    total: "Total",
    enviando: "Enviando...",
    enviarComanda: "Enviar a cocina",
    anadeAlMenos: "Añade al menos un producto para poder enviar",
    personalizable: "A tu gusto",
    anadirAlPedido: "Añadir al pedido",
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
    esperaEstimada: "Espera estimada",
    espera: "Espera",
    upsellTitulo: "¿Añadimos algo más a tu pedido?",
    upsellSubtitulo: "Aros de cebolla, samosas, cheese bites, falafel...",
    upsellFinalizar: "Finalizar pedido",
    confirmarCancelarTitulo: "¿Seguro que quieres cancelar?",
    confirmarCancelarTexto: "Se borrará todo lo que llevas añadido al pedido.",
    confirmarCancelarSi: "Sí, cancelar",
    confirmarCancelarNo: "No, seguir con mi pedido",
  },
  en: {
    cargandoMenu: "Loading menu...",
        comerAqui: "EAT HERE",
    enElLocal: "Dine in",
    paraLlevar: "TAKEAWAY",
    paraLlevarSub: "We'll let you know when it's ready",
    dondeTeLoComes: "Where are you eating?",
    masPedido: "Most popular",
    cocinaAbierta: "Kitchen open",
    tuPedido: "Your order",
    cancelarPedido: "Cancel order",
    queTeApetece: "What would you like?",
    productos: "items",
    verMiPedido: "View my order",
    volverCategorias: "◀ Categories",
    linea: "line",
    lineas: "lines",
    quitar: "Remove",
    anadeProductos: "Add items from the menu",
    notasItemPlaceholder: "Notes (e.g. no onion)",
    notasGeneralesPlaceholder: "General order notes",
    subtotal: "Subtotal",
    iva: "Tax (10%)",
    total: "Total",
    enviando: "Sending...",
    enviarComanda: "Send to kitchen",
    anadeAlMenos: "Add at least one item to send",
    personalizable: "Your way",
    anadirAlPedido: "Add to order",
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
    esperaEstimada: "Estimated wait",
    espera: "Wait",
    upsellTitulo: "Want to add anything else?",
    upsellSubtitulo: "Onion rings, samosas, cheese bites, falafel...",
    upsellFinalizar: "Finish order",
    confirmarCancelarTitulo: "Are you sure you want to cancel?",
    confirmarCancelarTexto: "Everything you've added to your order will be lost.",
    confirmarCancelarSi: "Yes, cancel",
    confirmarCancelarNo: "No, keep my order",
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
