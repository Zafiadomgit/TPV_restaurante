import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import OrderTicket from "../components/OrderTicket.jsx";
import { getSede, guardarSede, SEDES } from "../sede.js";
import SelectorSede from "../components/SelectorSede.jsx";
import { visibleEnCocina } from "../programado.js";
import { desbloquearSonido, reproducirSonidoNuevoPedido } from "../sonidoCocina.js";
import {
  getImpresoraCocinaGuardada,
  guardarImpresoraCocina,
  imprimirTicketCocina,
  listarImpresoras,
} from "../qzTray.js";

const POLL_MS = 3000;

const COLUMNAS = [
  // Sin columna "Nuevo" (a petición del cliente, para ganar espacio): lo que
  // llega a cocina sale directamente en "Preparando".
  { estado: "en_preparacion", estados: ["pendiente", "en_preparacion"], titulo: "PREPARANDO", accentClass: "accent-naranja" },
  { estado: "listo", estados: ["listo"], titulo: "LISTO", accentClass: "accent-verde" },
];

const CLAVE_COMPACTO = "tpv_cocina_compacto";
// Ancho mínimo de una comanda en la vista compacta.
const ANCHO_COMANDA = 195;

// Vista compacta: las comandas se reparten en N columnas por turno (1ª, 2ª,
// 3ª... y vuelta a la 1ª), y cada una se apila justo debajo de la anterior
// de su columna. Así se leen en orden de izquierda a derecha y no quedan
// huecos cuando una comanda es más larga que las de al lado (a petición del
// cliente; con una rejilla normal, cada fila medía lo que la más alta).
function ColumnasCompactas({ pedidos, render }) {
  const ref = useRef(null);
  const [n, setN] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => setN(Math.max(1, Math.floor((el.clientWidth + 6) / (ANCHO_COMANDA + 6))));
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const columnas = Array.from({ length: n }, () => []);
  pedidos.forEach((p, i) => columnas[i % n].push(p));
  return (
    <div ref={ref} className="kds-compacto-columnas">
      {columnas.map((col, i) => (
        <div key={i} className="kds-compacto-columna">
          {col.map(render)}
        </div>
      ))}
    </div>
  );
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  // Pantalla completa (sin la barra del personal) y modo compacto (más
  // comandas a la vista con mucho trabajo), a petición del cliente.
  const [pantallaCompleta, setPantallaCompleta] = useState(() => Boolean(document.fullscreenElement));
  const [compacto, setCompacto] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_COMPACTO) !== "0";
    } catch {
      return true;
    }
  });
  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);
  const alternarPantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const alternarCompacto = () => {
    setCompacto((prev) => {
      try {
        localStorage.setItem(CLAVE_COMPACTO, prev ? "0" : "1");
      } catch {
        // sin localStorage: solo mientras esté abierta
      }
      return !prev;
    });
  };
  const [sede, setSede] = useState(() => getSede());
  const enVuelo = useRef(false);
  // Ids de pedidos "pendiente" ya vistos, para saber cuáles son NUEVOS
  // de verdad y avisar solo de esos — no de todos los que ya estaban en
  // la pantalla desde antes. null hasta la primera carga, para no sonar
  // por los pedidos que ya estaban pendientes al abrir la pantalla.
  const idsPendientesVistos = useRef(null);

  // Impresión de comandas en una impresora de cocina aparte de la de
  // caja (ver client/src/qzTray.js) — el dueño pidió "tickets claros y
  // separados" en papel además del tablero en pantalla. Igual que el
  // cajón en Caja.jsx: la primera vez hay que elegir a qué impresora de
  // este dispositivo mandar las comandas, luego queda guardada.
  const [impresoraCocina, setImpresoraCocina] = useState(() => getImpresoraCocinaGuardada());
  const [errorImpresionCocina, setErrorImpresionCocina] = useState("");
  const [impresorasParaElegir, setImpresorasParaElegir] = useState(null);
  const [impresoraElegida, setImpresoraElegida] = useState("");
  const [idsImprimiendo, setIdsImprimiendo] = useState(() => new Set());

  // El navegador bloquea el audio hasta la primera interacción real del
  // usuario en la página — con cualquier toque/clic en cocina, desde
  // ahí el aviso sonoro ya puede sonar solo.
  useEffect(() => {
    const desbloquear = () => desbloquearSonido();
    window.addEventListener("pointerdown", desbloquear, { once: true });
    return () => window.removeEventListener("pointerdown", desbloquear);
  }, []);

  const imprimirComanda = async (order) => {
    if (!impresoraCocina) {
      setErrorImpresionCocina("Configura primero la impresora de cocina (botón de arriba).");
      return;
    }
    setErrorImpresionCocina("");
    setIdsImprimiendo((prev) => new Set(prev).add(order.id));
    try {
      await imprimirTicketCocina(impresoraCocina, order);
    } catch (e) {
      setErrorImpresionCocina(e.message);
    } finally {
      setIdsImprimiendo((prev) => {
        const siguiente = new Set(prev);
        siguiente.delete(order.id);
        return siguiente;
      });
    }
  };

  const clicConfigurarImpresora = async () => {
    setErrorImpresionCocina("");
    try {
      const impresoras = await listarImpresoras();
      if (!impresoras || impresoras.length === 0) {
        setErrorImpresionCocina("QZ Tray no encontró ninguna impresora instalada en este dispositivo.");
        return;
      }
      setImpresorasParaElegir(impresoras);
      setImpresoraElegida(impresoraCocina || impresoras[0]);
    } catch (e) {
      setErrorImpresionCocina(e.message);
    }
  };

  const confirmarImpresoraCocina = () => {
    if (!impresoraElegida) return;
    guardarImpresoraCocina(impresoraElegida);
    setImpresoraCocina(impresoraElegida);
    setImpresorasParaElegir(null);
  };

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders(undefined, sede);
        // Los programados no se ven hasta MINUTOS_ANTES_COCINA (30 min) antes de su hora; entonces
        // cuentan como nuevos (aviso + comanda), ver programado.js.
        const activos = data.filter((o) => COLUMNAS.some((c) => c.estados.includes(o.estado)) && visibleEnCocina(o));
        setOrders(activos);

        const pendientesAhora = activos.filter((o) => o.estado === "pendiente");
        const idsPendientesAhora = new Set(pendientesAhora.map((o) => o.id));
        if (idsPendientesVistos.current) {
          const nuevos = pendientesAhora.filter((o) => !idsPendientesVistos.current.has(o.id));
          if (nuevos.length > 0) {
            reproducirSonidoNuevoPedido();
            if (impresoraCocina) {
              for (const nuevo of nuevos) imprimirComanda(nuevo);
            }
          }
        }
        idsPendientesVistos.current = idsPendientesAhora;
      } catch {
        // se reintenta en el siguiente ciclo
      } finally {
        enVuelo.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
    // impresoraCocina entra en las dependencias para que, si se configura
    // la impresora a mitad de turno, el cierre de `cargar` dentro de este
    // efecto deje de estar "congelado" con el valor null de antes —
    // idsPendientesVistos.current (fuera del efecto) no se reinicia, así
    // que no se duplican avisos/impresiones de pedidos ya vistos.
  }, [sede, impresoraCocina]);

  const avanzarEstado = async (id, estado) => {
    setOrders((prev) =>
      COLUMNAS.some((c) => c.estados.includes(estado))
        ? prev.map((o) => (o.id === id ? { ...o, estado } : o))
        : prev.filter((o) => o.id !== id)
    );
    try {
      await api.updateEstado(id, estado);
    } catch {
      // el siguiente ciclo de polling corrige el estado si algo falló
    }
  };

  // Igual que el kiosco: la pantalla de cocina necesita saber su sede
  // para no mezclar comandas de los dos locales en la misma cola.
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

  const ordenadas = [...orders].sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn));
  const renderComanda = (order) => (
    <OrderTicket
      key={order.id}
      order={order}
      onAvanzar={avanzarEstado}
      onReimprimir={imprimirComanda}
      imprimiendo={idsImprimiendo.has(order.id)}
    />
  );

  return (
    <div className={`kds-page ${compacto ? "kds-compacto" : ""} ${pantallaCompleta ? "kds-pantalla-completa" : ""}`}>
      <div className="kds-header">
        <span className="kds-titulo">COCINA · CALIFORNIA · {SEDES[sede].nombre}</span>
        <div className="kds-header-acciones">
          <button type="button" className="kds-btn-impresora" onClick={alternarCompacto}>
            {compacto ? "▤ Vista normal" : "▦ Vista compacta"}
          </button>
          <button type="button" className="kds-btn-impresora" onClick={alternarPantallaCompleta}>
            {pantallaCompleta ? "✕ Salir de pantalla completa" : "⛶ Pantalla completa"}
          </button>
          <button type="button" className="kds-btn-impresora" onClick={clicConfigurarImpresora}>
            🖨️ {impresoraCocina ? impresoraCocina : "Configurar impresora"}
          </button>
          <span className="kds-contador">{ordenadas.length} comandas activas</span>
        </div>
      </div>
      {errorImpresionCocina && <p className="kds-error-impresion">{errorImpresionCocina}</p>}
      {impresorasParaElegir && (
        <div className="kds-elegir-impresora">
          <label htmlFor="impresora-cocina">Impresora para las comandas de cocina</label>
          <div className="kds-elegir-impresora-row">
            <select
              id="impresora-cocina"
              value={impresoraElegida}
              onChange={(e) => setImpresoraElegida(e.target.value)}
            >
              {impresorasParaElegir.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
            <button type="button" onClick={confirmarImpresoraCocina}>
              Guardar
            </button>
            <button type="button" onClick={() => setImpresorasParaElegir(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="kds-columnas">
        {COLUMNAS.map((col) => {
          const pedidos = ordenadas.filter((o) => col.estados.includes(o.estado));
          return (
            <div className="kds-columna" key={col.estado}>
              <div className={`kds-columna-header ${col.accentClass}`}>
                <span>{col.titulo}</span>
                <span>{pedidos.length}</span>
              </div>
              <div className="kds-columna-body">
                {pedidos.length === 0 ? (
                  <p className="kds-empty">Sin comandas</p>
                ) : compacto ? (
                  <ColumnasCompactas pedidos={pedidos} render={renderComanda} />
                ) : (
                  pedidos.map(renderComanda)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
