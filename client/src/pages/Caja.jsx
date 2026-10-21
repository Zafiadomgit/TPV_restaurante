import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import { formatTicket } from "../format.js";
import { getSede, guardarSede, borrarSede, SEDES } from "../sede.js";
import ReciboImprimible, { imprimirRecibo } from "../components/ReciboImprimible.jsx";
import Personalizar from "../components/Personalizar.jsx";
import SelectorSede from "../components/SelectorSede.jsx";
import {
  abrirCajon,
  esImpresoraVirtual,
  getImpresoraGuardada,
  getUltimoErrorFirma,
  guardarImpresora,
  imprimirReciboQz,
  listarImpresoras,
  ordenarImpresoras,
  getImpresoraCocinaGuardada,
  imprimirTicketCocina,
} from "../qzTray.js";

const POLL_MS = 3000;

// Tipos de pedido de caja que piden datos del cliente (y permiten "Enviar a
// cocina sin cobrar"): se cobran cuando el cliente recoge o al entregar.
const CON_CLIENTE = ["recoger", "domicilio"];

// Datos del cliente que pide caja según el tipo de pedido, en el orden en
// que salen en pantalla (a petición del cliente). En "Comer aquí" y "Para
// llevar" son opcionales (para llamarle por su nombre).
const CAMPOS_CLIENTE = {
  aqui: ["nombre", "telefono"],
  llevar: ["nombre", "telefono"],
  recoger: ["nombre", "telefono"],
  domicilio: ["direccion", "telefono", "nombre"],
};
const CAMPO_CLIENTE = {
  nombre: { type: "text", placeholder: "Nombre del cliente", maxLength: 120 },
  telefono: { type: "tel", placeholder: "Teléfono", maxLength: 20 },
  direccion: { type: "text", placeholder: "Dirección", maxLength: 250 },
};

// Impresión automática al cobrar (a petición del cliente), con interruptor
// por dispositivo: ticket del cliente y comanda de cocina.
const CLAVE_AUTO_TICKET = "tpv_auto_ticket_cliente";
const CLAVE_AUTO_COMANDA = "tpv_auto_comanda";
function leerInterruptor(clave) {
  try {
    return localStorage.getItem(clave) !== "0";
  } catch {
    return true;
  }
}
function guardarInterruptor(clave, valor) {
  try {
    localStorage.setItem(clave, valor ? "1" : "0");
  } catch {
    // sin localStorage: vale solo mientras esté abierta la pantalla
  }
}

function nuevoLineId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

export default function Caja() {
  const [turnos, setTurnos] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState("");
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoFinal, setEfectivoFinal] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enVuelo = useRef(false);

  // Apertura del cajón (ver client/src/qzTray.js) — la primera vez que
  // se usa en cada dispositivo hace falta elegir a qué impresora
  // mandarle el comando; luego queda guardada en este dispositivo
  // (localStorage) y las siguientes veces se abre directo.
  const [abriendoCajon, setAbriendoCajon] = useState(false);
  const [errorCajon, setErrorCajon] = useState("");
  const [impresorasParaElegir, setImpresorasParaElegir] = useState(null);
  const [impresoraElegida, setImpresoraElegida] = useState("");
  // Tras mandar la orden se enseña a qué impresora fue, para que si el
  // cajón no abre se vea enseguida si era la impresora equivocada.
  const [avisoCajon, setAvisoCajon] = useState("");
  const [motivoElegirImpresora, setMotivoElegirImpresora] = useState("");
  // Impresora guardada para el cajón, siempre a la vista con "Cambiar"
  // (antes, una vez elegida, no había forma de cambiarla).
  const [impresoraCajon, setImpresoraCajon] = useState(() => getImpresoraGuardada());
  // Si la firma para QZ Tray falla (p. ej. falta la variable de Vercel),
  // QZ Tray vuelve a preguntar "Allow/Block": se enseña el motivo.
  const [errorFirmaQz, setErrorFirmaQz] = useState("");
  // Qué hacer tras elegir impresora: abrir el cajón (por defecto) o
  // imprimir el recibo que estaba pendiente.
  const [accionTrasElegir, setAccionTrasElegir] = useState("cajon");
  const [avisoRecibo, setAvisoRecibo] = useState("");
  const [imprimiendoRecibo, setImprimiendoRecibo] = useState(false);

  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [items, setItems] = useState([]);
  const [cobrando, setCobrando] = useState(false);
  const [dividirEntre, setDividirEntre] = useState("");
  // Venta en mostrador (a petición del cliente): Comer aquí / Para llevar /
  // Recoger en tienda (nombre y teléfono) / A domicilio (nombre, teléfono y
  // dirección). Los datos del cliente se guardan con el pedido
  // (columnas cliente_* de orders) y salen en cocina, comanda y recibo.
  // Con el teléfono de un cliente que ya pidió se rellenan solos su nombre
  // y dirección.
  const [tipoServicio, setTipoServicio] = useState("aqui");
  const [cliente, setCliente] = useState({ nombre: "", telefono: "", direccion: "" });
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const cambiarCliente = (campo, valor) => setCliente((prev) => ({ ...prev, [campo]: valor }));

  useEffect(() => {
    const cifras = cliente.telefono.replace(/\D/g, "");
    if (cifras.length < 9) {
      setClienteEncontrado(false);
      return undefined;
    }
    let cancelado = false;
    const id = setTimeout(() => {
      api
        .buscarClientePorTelefono(cliente.telefono)
        .then((datos) => {
          if (cancelado || !datos) return;
          setClienteEncontrado(true);
          // Solo rellena lo que esté vacío: nunca pisa lo ya escrito.
          setCliente((prev) => ({
            ...prev,
            nombre: prev.nombre || datos.nombre || "",
            direccion: prev.direccion || datos.direccion || "",
          }));
        })
        .catch(() => {});
    }, 400);
    return () => {
      cancelado = true;
      clearTimeout(id);
    };
  }, [cliente.telefono, tipoServicio]);
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [autoTicket, setAutoTicket] = useState(() => leerInterruptor(CLAVE_AUTO_TICKET));
  const [autoComanda, setAutoComanda] = useState(() => leerInterruptor(CLAVE_AUTO_COMANDA));
  useEffect(() => setAvisoRecibo(""), [ultimaVenta?.id]);
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [pedidosSinCobrar, setPedidosSinCobrar] = useState([]);
  const [cobrandoPedidoId, setCobrandoPedidoId] = useState(null);
  const enVueloSinCobrar = useRef(false);
  const [tiempoEsperaInput, setTiempoEsperaInput] = useState("");
  const [guardandoTiempoEspera, setGuardandoTiempoEspera] = useState(false);
  const [tiempoEsperaGuardadoOk, setTiempoEsperaGuardadoOk] = useState(false);
  const [sede, setSede] = useState(() => getSede());

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setMenu(data);
        if (data.length > 0) setCategoriaActiva(data[0].categoria);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sede) return;
    api
      .getAjustes(sede)
      .then((data) => setTiempoEsperaInput(String(data.tiempoEsperaMinutos)))
      .catch(() => {});
  }, [sede]);

  const guardarTiempoEspera = async (e) => {
    e.preventDefault();
    setError("");
    setTiempoEsperaGuardadoOk(false);
    setGuardandoTiempoEspera(true);
    try {
      const actualizado = await api.actualizarAjustes({ tiempoEsperaMinutos: tiempoEsperaInput, local: sede });
      setTiempoEsperaInput(String(actualizado.tiempoEsperaMinutos));
      setTiempoEsperaGuardadoOk(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardandoTiempoEspera(false);
    }
  };

  const mandarAbrirCajon = async (impresora) => {
    setAbriendoCajon(true);
    setErrorCajon("");
    setAvisoCajon("");
    try {
      await abrirCajon(impresora);
      setAvisoCajon(`Orden de abrir enviada a «${impresora}».`);
    } catch (e) {
      setErrorCajon(e.message);
    } finally {
      setAbriendoCajon(false);
      setErrorFirmaQz(getUltimoErrorFirma());
    }
  };

  // Lista de impresoras para elegir (primera vez, con "Cambiar", o cuando
  // la guardada ya no está conectada): las de tickets primero y
  // preseleccionadas; PDF, XPS, Fax... al final.
  const pedirElegirImpresora = async (motivo = "", accion = "cajon") => {
    setAccionTrasElegir(accion);
    setErrorCajon("");
    setAvisoCajon("");
    setAbriendoCajon(true);
    try {
      const impresoras = await listarImpresoras();
      if (!impresoras || impresoras.length === 0) {
        setErrorCajon("QZ Tray no encontró ninguna impresora instalada en este dispositivo.");
        return;
      }
      const ordenadas = ordenarImpresoras(impresoras);
      const guardada = getImpresoraGuardada();
      setMotivoElegirImpresora(motivo);
      setImpresorasParaElegir(ordenadas);
      setImpresoraElegida(guardada && ordenadas.includes(guardada) && !esImpresoraVirtual(guardada) ? guardada : ordenadas[0]);
    } catch (e) {
      setErrorCajon(e.message);
    } finally {
      setAbriendoCajon(false);
      setErrorFirmaQz(getUltimoErrorFirma());
    }
  };

  const clicAbrirCajon = async () => {
    const impresoraGuardada = getImpresoraGuardada();
    // Una impresora virtual (PDF, Fax...) guardada de antes nunca abre el
    // cajón: se vuelve a pedir que se elija la buena.
    if (!impresoraGuardada || esImpresoraVirtual(impresoraGuardada)) {
      await pedirElegirImpresora();
      return;
    }
    // Si la impresora guardada ya no está (se desconectó y se puso otra),
    // en vez de mandarle la orden a una que no existe se pide elegir.
    setAbriendoCajon(true);
    let conectadas;
    try {
      conectadas = await listarImpresoras();
    } catch (e) {
      setErrorCajon(e.message);
      setAbriendoCajon(false);
      setErrorFirmaQz(getUltimoErrorFirma());
      return;
    }
    if (!conectadas.includes(impresoraGuardada)) {
      setAbriendoCajon(false);
      await pedirElegirImpresora(`La impresora «${impresoraGuardada}» ya no está conectada en este ordenador. Elige la nueva:`);
      return;
    }
    await mandarAbrirCajon(impresoraGuardada);
  };

  const confirmarImpresoraYAbrir = async () => {
    if (!impresoraElegida) return;
    guardarImpresora(impresoraElegida);
    setImpresoraCajon(impresoraElegida);
    setImpresorasParaElegir(null);
    if (accionTrasElegir === "recibo") await mandarImprimirRecibo(impresoraElegida);
    else await mandarAbrirCajon(impresoraElegida);
  };

  // Recibo directo a la impresora de caja por QZ Tray, sin la ventana de
  // imprimir del navegador (pedido del cliente). Si QZ Tray falla, se usa
  // la impresión del navegador como respaldo para no quedarse sin recibo.
  const mandarImprimirRecibo = async (impresora, venta = ultimaVenta) => {
    if (!venta) return;
    setImprimiendoRecibo(true);
    setErrorCajon("");
    setAvisoRecibo("");
    try {
      await imprimirReciboQz(impresora, venta);
      setAvisoRecibo(`Recibo enviado a «${impresora}».`);
    } catch (e) {
      setErrorCajon(`No se pudo imprimir directo (${e.message}). Se abre la impresión del navegador.`);
      imprimirRecibo();
    } finally {
      setImprimiendoRecibo(false);
      setErrorFirmaQz(getUltimoErrorFirma());
    }
  };

  // `venta`: por defecto la última; "Enviar sin cobrar" pasa el pedido recién
  // creado porque el estado todavía no se ha actualizado en ese momento.
  const clicImprimirRecibo = async (venta = ultimaVenta) => {
    const impresora = getImpresoraGuardada();
    if (!impresora || esImpresoraVirtual(impresora)) {
      await pedirElegirImpresora("Elige la impresora de tickets para imprimir el recibo:", "recibo");
      return;
    }
    // Si la guardada ya no está conectada, se pide la nueva (como con el
    // cajón). Si QZ Tray no responde, respaldo con el navegador.
    setImprimiendoRecibo(true);
    let conectadas;
    try {
      conectadas = await listarImpresoras();
    } catch (e) {
      setImprimiendoRecibo(false);
      setErrorFirmaQz(getUltimoErrorFirma());
      setErrorCajon(`No se pudo imprimir directo (${e.message}). Se abre la impresión del navegador.`);
      imprimirRecibo();
      return;
    }
    setImprimiendoRecibo(false);
    if (!conectadas.includes(impresora)) {
      await pedirElegirImpresora(`La impresora «${impresora}» ya no está conectada en este ordenador. Elige la nueva:`, "recibo");
      return;
    }
    await mandarImprimirRecibo(impresora, venta);
  };

  // Comanda de cocina desde caja: a la impresora de cocina de este equipo si
  // tiene una elegida; si no, a la de caja.
  const imprimirComandaDesdeCaja = async (pedido) => {
    const impresora = getImpresoraCocinaGuardada() || getImpresoraGuardada();
    if (!impresora || esImpresoraVirtual(impresora)) return;
    try {
      await imprimirTicketCocina(impresora, pedido);
    } catch (e) {
      setErrorCajon(`No se pudo imprimir la comanda (${e.message}).`);
    }
  };

  // Lo que se hace solo después de cobrar o de enviar sin cobrar: abrir el
  // cajón (efectivo), ticket del cliente y comanda, según los interruptores.
  // En orden, para no mandar tres cosas a la vez a la misma impresora.
  const trasCrearOCobrar = async (pedido, { metodoPago = null, comanda = true } = {}) => {
    if (metodoPago === "efectivo") await clicAbrirCajon();
    if (autoTicket) await clicImprimirRecibo(pedido);
    if (comanda && autoComanda) await imprimirComandaDesdeCaja(pedido);
  };

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getTurnos(undefined, sede);
        setTurnos(data);
        setCargado(true);
      } catch {
        // se reintenta en el siguiente ciclo de polling
      } finally {
        enVuelo.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
  }, [sede]);

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVueloSinCobrar.current) return;
      enVueloSinCobrar.current = true;
      try {
        const data = await api.getPedidosSinCobrar(sede);
        // Un pedido cancelado antes de cobrarse no debe aparecer aquí —
        // no hay nada que cobrar por él.
        setPedidosSinCobrar(data.filter((o) => o.estado !== "cancelado"));
      } catch {
        // se reintenta en el siguiente ciclo de polling
      } finally {
        enVueloSinCobrar.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
  }, [sede]);

  // Anular la última venta cobrada, sin salir de /caja — el motivo es
  // obligatorio (ver client/api/orders/[id]/pagar.js). El pedido no se
  // borra: sigue existiendo en /historial, solo deja de contar como
  // venta/efectivo esperado.
  const anularUltimaVenta = async () => {
    const motivo = window.prompt("Motivo de la anulación (obligatorio):");
    if (motivo === null) return;
    if (!motivo.trim()) {
      setError("El motivo de la anulación es obligatorio");
      return;
    }
    setError("");
    try {
      const actualizada = await api.anularOrder(ultimaVenta.id, motivo.trim());
      setUltimaVenta(actualizada);
    } catch (e) {
      setError(e.message);
    }
  };

  const cobrarPedidoKiosco = async (pedido, metodoPago) => {
    setError("");
    setCobrandoPedidoId(pedido.id);
    try {
      const pagado = await api.pagarOrder(pedido.id, metodoPago);
      setUltimaVenta(pagado);
      setPedidosSinCobrar((prev) => prev.filter((p) => p.id !== pedido.id));
      // Ya estaba en cocina: solo cajón y ticket del cliente.
      trasCrearOCobrar(pagado, { metodoPago, comanda: false });
    } catch (e) {
      setError(e.message);
    } finally {
      setCobrandoPedidoId(null);
    }
  };

  const turnoAbierto = turnos.find((t) => t.estado === "abierto") || null;

  const abrirTurno = async (e) => {
    e.preventDefault();
    setError("");

    const valor = Number(efectivoInicial);
    if (efectivoInicial === "" || Number.isNaN(valor) || valor < 0) {
      setError("Introduce un efectivo inicial válido");
      return;
    }

    setAbriendo(true);
    try {
      const turno = await api.abrirTurno(valor, sede);
      setTurnos((prev) => [turno, ...prev]);
      setEfectivoInicial("");
    } catch (e) {
      setError(e.message);
    } finally {
      setAbriendo(false);
    }
  };

  const cerrarTurno = async (e) => {
    e.preventDefault();
    setError("");

    const valor = Number(efectivoFinal);
    if (efectivoFinal === "" || Number.isNaN(valor) || valor < 0) {
      setError("Introduce el efectivo final contado");
      return;
    }

    setCerrando(true);
    try {
      const cerrado = await api.cerrarTurno(turnoAbierto.id, valor);
      setTurnos((prev) => prev.map((t) => (t.id === cerrado.id ? cerrado : t)));
      setEfectivoFinal("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCerrando(false);
    }
  };

  const addItem = (producto) => {
    setUltimaVenta(null);
    if (producto.modificadores) {
      setProductoPersonalizando(producto);
      return;
    }
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === producto.id && !i.modificadoresTexto);
      if (existente) {
        return prev.map((i) => (i.lineId === existente.lineId ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          lineId: nuevoLineId(),
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          modificadores: null,
          modificadoresTexto: "",
        },
      ];
    });
  };

  const confirmarPersonalizacion = ({ seleccion, cantidad, precioUnidad, modificadoresTexto }) => {
    const producto = productoPersonalizando;
    setUltimaVenta(null);
    setItems((prev) => [
      ...prev,
      {
        lineId: nuevoLineId(),
        productId: producto.id,
        nombre: producto.nombre,
        precio: precioUnidad,
        cantidad,
        modificadores: seleccion,
        modificadoresTexto,
      },
    ]);
    setProductoPersonalizando(null);
  };

  const increase = (lineId) =>
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad + 1 } : i)));

  const decrease = (lineId) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0)
    );

  const remove = (lineId) => setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const { subtotal, iva, total } = useMemo(() => calcularTotales(items), [items]);

  const personas = Number(dividirEntre);
  const porPersona = personas > 1 ? Number((total / personas).toFixed(2)) : null;

  const crearPedidoCaja = () =>
    api.createOrder({
        mesa: { aqui: "Comer aquí", llevar: "Para llevar", recoger: "Recoger en tienda", domicilio: "A domicilio" }[tipoServicio],
        local: sede,
        notasGenerales: "",
        cliente: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          direccion: tipoServicio === "domicilio" ? cliente.direccion : "",
        },
        items: items.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          notas: "",
          modificadores: i.modificadores,
        })),
      });

  const limpiarVenta = () => {
    setItems([]);
    setDividirEntre("");
    setTipoServicio("aqui");
    setCliente({ nombre: "", telefono: "", direccion: "" });
  };

  // "Recoger en tienda" / "Para llevar" (a petición del cliente): el pedido
  // va a cocina y sale su ticket, pero se cobra cuando el cliente llega. Se
  // queda en "Pedidos sin cobrar" de esta misma pantalla para cobrarlo
  // después con Efectivo o Tarjeta.
  const enviarSinCobrar = async () => {
    setError("");
    setCobrando(true);
    try {
      const pedido = await crearPedidoCaja();
      setUltimaVenta(pedido);
      limpiarVenta();
      setPedidosSinCobrar((prev) => (prev.some((p) => p.id === pedido.id) ? prev : [...prev, pedido]));
      // El ticket "Pendiente de pago" sale siempre (es lo que se le da al
      // cliente); la comanda, según el interruptor.
      await clicImprimirRecibo(pedido);
      if (autoComanda) await imprimirComandaDesdeCaja(pedido);
    } catch (e) {
      setError(e.message);
    } finally {
      setCobrando(false);
    }
  };

  const cobrar = async (metodoPago) => {
    setError("");
    setCobrando(true);
    try {
      const nuevoPedido = await crearPedidoCaja();
      const pagado = await api.pagarOrder(nuevoPedido.id, metodoPago);
      setUltimaVenta(pagado);
      limpiarVenta();
      // Cobro en efectivo: se abre el cajón solo (a petición del cliente),
      // igual que con el botón "Abrir cajón"; y los tickets automáticos.
      trasCrearOCobrar(pagado, { metodoPago });
    } catch (e) {
      setError(e.message);
    } finally {
      setCobrando(false);
    }
  };

  // Igual que el kiosco: caja necesita saber su sede antes de nada —
  // pedidos, turnos y la cola de "sin cobrar" se filtran por ella.
  if (!sede) {
    return (
      <SelectorSede
        onElegir={(elegida) => {
          guardarSede(elegida);
          setSede(elegida);
        }}
      />
    );
  }

  if (!cargado) return <p className="loading">Cargando caja...</p>;

  return (
    <div className="caja-page">
      <div className="caja-titulo-row">
        <h2>Caja · {SEDES[sede].nombre}</h2>
        <div className="caja-titulo-acciones">
          <button
            type="button"
            className="caja-abrir-cajon"
            onClick={clicAbrirCajon}
            disabled={abriendoCajon}
          >
            {abriendoCajon ? "Abriendo..." : "🗄️ Abrir cajón"}
          </button>
          <button
            type="button"
            className="caja-cambiar-sede"
            onClick={() => {
              borrarSede();
              setSede(null);
            }}
          >
            Cambiar sede
          </button>
        </div>
      </div>
      <div className="caja-auto-impresion">
        <span>Al cobrar, imprimir solo:</span>
        <label>
          <input
            type="checkbox"
            checked={autoTicket}
            onChange={(e) => {
              setAutoTicket(e.target.checked);
              guardarInterruptor(CLAVE_AUTO_TICKET, e.target.checked);
            }}
          />
          Ticket del cliente
        </label>
        <label>
          <input
            type="checkbox"
            checked={autoComanda}
            onChange={(e) => {
              setAutoComanda(e.target.checked);
              guardarInterruptor(CLAVE_AUTO_COMANDA, e.target.checked);
            }}
          />
          Comanda de cocina
        </label>
      </div>
      {impresoraCajon && !impresorasParaElegir && (
        <p className="caja-aviso-cajon">
          Impresora del cajón: <strong>{impresoraCajon}</strong> ·{" "}
          <button type="button" className="caja-cambiar-impresora" onClick={() => pedirElegirImpresora()}>
            Cambiar
          </button>
        </p>
      )}
      {errorCajon && (
        <p className="error">
          {errorCajon}{" "}
          {impresoraCajon && (
            <button type="button" className="caja-cambiar-impresora" onClick={() => pedirElegirImpresora()}>
              Cambiar impresora
            </button>
          )}
        </p>
      )}
      {errorFirmaQz && (
        <p className="error">
          QZ Tray seguirá pidiendo «Allow» porque la firma falló: {errorFirmaQz}
        </p>
      )}
      {avisoCajon && !impresorasParaElegir && (
        <p className="caja-aviso-cajon">
          {avisoCajon} ¿No se ha abierto?{" "}
          <button type="button" className="caja-cambiar-impresora" onClick={() => pedirElegirImpresora()}>
            Cambiar impresora
          </button>
        </p>
      )}

      {impresorasParaElegir && (
        <div className="caja-elegir-impresora">
          <label htmlFor="impresora-cajon">
            {motivoElegirImpresora && (
              <>
                {motivoElegirImpresora}
                <br />
              </>
            )}
            Elige la impresora de tickets a la que está conectado el cajón (no «PDF», «XPS» ni «Fax»)
          </label>
          <div className="caja-elegir-impresora-row">
            <select
              id="impresora-cajon"
              value={impresoraElegida}
              onChange={(e) => setImpresoraElegida(e.target.value)}
            >
              {impresorasParaElegir.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            <button type="button" onClick={confirmarImpresoraYAbrir} disabled={abriendoCajon}>
              {accionTrasElegir === "recibo" ? "Guardar e imprimir" : "Guardar y abrir"}
            </button>
            <button type="button" onClick={() => setImpresorasParaElegir(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <form className="tiempo-espera-form" onSubmit={guardarTiempoEspera}>
        <label htmlFor="tiempo-espera">Tiempo de espera del kiosco (min)</label>
        <div className="tiempo-espera-row">
          <input
            id="tiempo-espera"
            type="number"
            min="1"
            value={tiempoEsperaInput}
            onChange={(e) => {
              setTiempoEsperaInput(e.target.value);
              setTiempoEsperaGuardadoOk(false);
            }}
          />
          <button type="submit" disabled={guardandoTiempoEspera || !tiempoEsperaInput}>
            {guardandoTiempoEspera ? "Guardando..." : "Guardar"}
          </button>
          {tiempoEsperaGuardadoOk && <span className="tiempo-espera-ok">✔️ Guardado</span>}
        </div>
      </form>

      <ReciboImprimible venta={ultimaVenta} />

      {ultimaVenta && (
        <div className="caja-venta-ok">
          {ultimaVenta.anulado ? (
            <p className="historial-anulado">
              ⛔ {formatTicket(ultimaVenta.ticketNumero)} anulado
              {ultimaVenta.anuladoMotivo ? `: ${ultimaVenta.anuladoMotivo}` : ""}
            </p>
          ) : (
            <>
              <p>
                {ultimaVenta.pagado ? "Cobrado" : "Enviado a cocina, pendiente de cobro:"}{" "}
                {formatTicket(ultimaVenta.ticketNumero)} · {ultimaVenta.total.toFixed(2)} €
              </p>
              <button
                type="button"
                className="btn-imprimir-recibo"
                onClick={() => clicImprimirRecibo()}
                disabled={imprimiendoRecibo}
              >
                {imprimiendoRecibo ? "Imprimiendo..." : ultimaVenta.pagado ? "Imprimir recibo" : "Imprimir ticket"}
              </button>
              {ultimaVenta.pagado && (
                <button type="button" className="btn-anular" onClick={anularUltimaVenta}>
                  Anular pedido
                </button>
              )}
              {avisoRecibo && <p className="caja-aviso-cajon">{avisoRecibo}</p>}
            </>
          )}
        </div>
      )}

      {pedidosSinCobrar.length > 0 && (
        <div className="pedidos-sin-cobrar">
          <h3 className="pedidos-sin-cobrar-titulo">
            Pedidos sin cobrar ({pedidosSinCobrar.length})
          </h3>
          <div className="pedidos-sin-cobrar-lista">
            {pedidosSinCobrar.map((pedido) => (
              <div key={pedido.id} className="pedido-sin-cobrar-card">
                <div className="pedido-sin-cobrar-info">
                  <span className="pedido-sin-cobrar-ticket">{formatTicket(pedido.ticketNumero)}</span>
                  <span className="pedido-sin-cobrar-origen">
                    {pedido.mesa}
                    {pedido.clienteNombre ? ` · ${pedido.clienteNombre}` : ""}
                    {pedido.clienteTelefono ? ` · ${pedido.clienteTelefono}` : ""}
                  </span>
                  <p className="pedido-sin-cobrar-items">
                    {pedido.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")}
                  </p>
                </div>
                <div className="pedido-sin-cobrar-derecha">
                  <strong className="pedido-sin-cobrar-total">{pedido.total.toFixed(2)} €</strong>
                  <div className="pedido-sin-cobrar-botones">
                    <button
                      disabled={cobrandoPedidoId === pedido.id}
                      onClick={() => cobrarPedidoKiosco(pedido, "efectivo")}
                    >
                      {cobrandoPedidoId === pedido.id ? "Cobrando..." : "Efectivo"}
                    </button>
                    <button
                      disabled={cobrandoPedidoId === pedido.id}
                      onClick={() => cobrarPedidoKiosco(pedido, "tarjeta")}
                    >
                      {cobrandoPedidoId === pedido.id ? "Cobrando..." : "Tarjeta"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {turnoAbierto ? (
        <div className="caja-pos-layout">
          <div className="caja-productos">
            <div className="categorias">
              {menu.map((cat) => (
                <button
                  key={cat.categoria}
                  className={categoriaActiva === cat.categoria ? "active" : ""}
                  onClick={() => setCategoriaActiva(cat.categoria)}
                >
                  {cat.categoria}
                </button>
              ))}
            </div>
            <div className="caja-botones-grid">
              {menu
                .find((cat) => cat.categoria === categoriaActiva)
                ?.productos.map((producto) => (
                  <button key={producto.id} className="caja-boton-producto" onClick={() => addItem(producto)}>
                    <span>
                      {producto.nombre}
                      {producto.modificadores && <span className="caja-personalizable-punto" title="Personalizable" />}
                    </span>
                    <strong>{producto.precio.toFixed(2)} €</strong>
                  </button>
                ))}
            </div>
          </div>

          {productoPersonalizando && (
            <Personalizar
              salsaBlancaAPatatas
              producto={productoPersonalizando}
              onConfirmar={confirmarPersonalizacion}
              onCancelar={() => setProductoPersonalizando(null)}
            />
          )}

          <aside className="caja-ticket-panel">
            {items.length === 0 ? (
              <p className="empty">Toca un producto para añadirlo</p>
            ) : (
              <ul className="cart-items">
                {items.map((item) => (
                  <li key={item.lineId} className="cart-item">
                    <div className="cart-item-row">
                      <span className="cart-item-name">{item.nombre}</span>
                      <button className="btn-remove" onClick={() => remove(item.lineId)}>
                        ✕
                      </button>
                    </div>
                    {item.modificadoresTexto && (
                      <p className="cart-item-mods">{item.modificadoresTexto}</p>
                    )}
                    <div className="cart-item-row">
                      <div className="qty-controls">
                        <button onClick={() => decrease(item.lineId)}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => increase(item.lineId)}>+</button>
                      </div>
                      <span>{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="totales">
              <div>
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div>
                <span>IVA (10%)</span>
                <span>{iva.toFixed(2)} €</span>
              </div>
              <div className="total-final">
                <span>Total</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="caja-servicio">
              <div className="caja-servicio-botones" role="group" aria-label="Tipo de pedido">
                {[
                  ["aqui", "Comer aquí"],
                  ["llevar", "Para llevar"],
                  ["recoger", "Recoger en tienda"],
                  ["domicilio", "A domicilio"],
                ].map(([valor, texto]) => (
                  <button
                    key={valor}
                    type="button"
                    className={tipoServicio === valor ? "activo" : ""}
                    aria-pressed={tipoServicio === valor}
                    onClick={() => setTipoServicio(valor)}
                  >
                    {texto}
                  </button>
                ))}
              </div>
              <div className="caja-servicio-cliente">
                {CAMPOS_CLIENTE[tipoServicio].map((campo) => (
                  <input
                    key={campo}
                    type={CAMPO_CLIENTE[campo].type}
                    className="caja-servicio-direccion"
                    placeholder={CAMPO_CLIENTE[campo].placeholder}
                    maxLength={CAMPO_CLIENTE[campo].maxLength}
                    value={cliente[campo]}
                    onChange={(e) => cambiarCliente(campo, e.target.value)}
                  />
                ))}
                {clienteEncontrado && <span className="caja-cliente-encontrado">✓ Cliente conocido: datos rellenados</span>}
              </div>
            </div>

            <div className="caja-dividir">
              <label>
                Dividir cuenta entre
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Nº personas"
                  value={dividirEntre}
                  onChange={(e) => setDividirEntre(e.target.value)}
                />
              </label>
              {porPersona !== null && (
                <span className="caja-por-persona">{porPersona.toFixed(2)} € cada uno</span>
              )}
            </div>

            {CON_CLIENTE.includes(tipoServicio) && (
              <button
                type="button"
                className="caja-enviar-sin-cobrar"
                disabled={items.length === 0 || cobrando}
                onClick={enviarSinCobrar}
              >
                {cobrando ? "Enviando..." : "Enviar a cocina sin cobrar"}
              </button>
            )}
            <div className="caja-pago-botones">
              <button disabled={items.length === 0 || cobrando} onClick={() => cobrar("efectivo")}>
                {cobrando ? "Cobrando..." : "Efectivo"}
              </button>
              <button disabled={items.length === 0 || cobrando} onClick={() => cobrar("tarjeta")}>
                {cobrando ? "Cobrando..." : "Tarjeta"}
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="card-caja card-caja-form estado-cerrado">
          <span className="badge-estado badge-cerrado-caja">Sin turno abierto</span>
          <h3>Abrir turno</h3>
          <p className="caja-hint">
            Cuenta el efectivo que hay en caja e introdúcelo para empezar a cobrar pedidos.
          </p>
          <form onSubmit={abrirTurno}>
            <label className="caja-input">
              Efectivo inicial (€)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={efectivoInicial}
                onChange={(ev) => setEfectivoInicial(ev.target.value)}
                className={error ? "campo-requerido" : ""}
              />
            </label>
            <button type="submit" className="btn-abrir-turno" disabled={abriendo}>
              {abriendo ? "Abriendo turno..." : "Abrir turno"}
            </button>
          </form>
        </div>
      )}

      {turnoAbierto && (
        <div className="card-caja card-caja-form estado-abierto caja-cerrar-turno">
          <span className="badge-estado badge-abierto-caja">Turno abierto</span>
          <p className="caja-detalle">
            Abierto hoy a las {formatHora(turnoAbierto.abiertoEn)} · Efectivo inicial:{" "}
            <strong>{turnoAbierto.efectivoInicial.toFixed(2)} €</strong>
          </p>
          <form onSubmit={cerrarTurno} className="caja-cerrar-form">
            <label className="caja-input">
              Efectivo final contado (€)
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={efectivoFinal}
                onChange={(ev) => setEfectivoFinal(ev.target.value)}
                className={error ? "campo-requerido" : ""}
              />
            </label>
            <button type="submit" className="btn-cerrar-turno" disabled={cerrando}>
              {cerrando ? "Cerrando turno..." : "Cerrar turno"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
