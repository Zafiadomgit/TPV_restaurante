import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { getSede, guardarSede } from "../sede.js";
import SelectorSede from "../components/SelectorSede.jsx";
import { visibleEnCocina } from "../programado.js";

const POLL_MS = 3000;
// El fondo/logo casi nunca cambia mientras el monitor está encendido —
// no hace falta pedirlo cada 3s como los pedidos, con cada minuto sobra
// para que un cambio hecho desde Caja se vea sin reiniciar la pantalla.
const POLL_AJUSTES_MS = 60000;

export default function Recogida() {
  const [orders, setOrders] = useState([]);
  const [hora, setHora] = useState(new Date());
  const [sede, setSede] = useState(() => getSede());
  const [fondoRecogidaUrl, setFondoRecogidaUrl] = useState(null);
  const [logoRecogidaUrl, setLogoRecogidaUrl] = useState(null);
  const enVuelo = useRef(false);
  // Modo pantalla completa (a petición del cliente): quita también la
  // barra del navegador en el monitor de recogida. Se entra con el botón
  // (el navegador exige un gesto del usuario) y, como es un TPV táctil, se
  // sale con doble toque en cualquier parte (o Esc si hay teclado).
  const [pantallaCompleta, setPantallaCompleta] = useState(() => Boolean(document.fullscreenElement));
  const [cursorOculto, setCursorOculto] = useState(false);

  useEffect(() => {
    const alCambiar = () => setPantallaCompleta(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", alCambiar);
    return () => document.removeEventListener("fullscreenchange", alCambiar);
  }, []);

  // En pantalla completa el cursor se esconde a los 3 s sin mover el ratón.
  useEffect(() => {
    if (!pantallaCompleta) {
      setCursorOculto(false);
      return undefined;
    }
    let id = setTimeout(() => setCursorOculto(true), 3000);
    const alMover = () => {
      setCursorOculto(false);
      clearTimeout(id);
      id = setTimeout(() => setCursorOculto(true), 3000);
    };
    window.addEventListener("mousemove", alMover);
    return () => {
      clearTimeout(id);
      window.removeEventListener("mousemove", alMover);
    };
  }, [pantallaCompleta]);

  const entrarPantallaCompleta = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Doble toque (dos toques en menos de 400 ms, cerca uno del otro) =
  // salir. Se detecta a mano con pointerup porque en pantallas táctiles no
  // todos los navegadores convierten un doble toque en "dblclick".
  const ultimoToque = useRef(null);
  const alSoltarToque = (e) => {
    if (!document.fullscreenElement) return;
    const ahora = Date.now();
    const previo = ultimoToque.current;
    if (previo && ahora - previo.t < 400 && Math.hypot(e.clientX - previo.x, e.clientY - previo.y) < 60) {
      ultimoToque.current = null;
      document.exitFullscreen?.().catch(() => {});
      return;
    }
    ultimoToque.current = { t: ahora, x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders(undefined, sede);
        setOrders(data.filter((o) => ["pendiente", "en_preparacion", "listo"].includes(o.estado) && visibleEnCocina(o)));
      } catch {
        // se reintenta en el siguiente ciclo
      } finally {
        enVuelo.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    const relojInterval = setInterval(() => setHora(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(relojInterval);
    };
  }, [sede]);

  useEffect(() => {
    if (!sede) return;
    const cargarAjustes = () => {
      api
        .getAjustes(sede)
        .then((data) => {
          setFondoRecogidaUrl(data.fondoRecogidaUrl || null);
          setLogoRecogidaUrl(data.logoRecogidaUrl || null);
        })
        .catch(() => {
          // si falla, la pantalla se queda con el fondo/logo que ya tenía
        });
    };
    cargarAjustes();
    const interval = setInterval(cargarAjustes, POLL_AJUSTES_MS);
    return () => clearInterval(interval);
  }, [sede]);

  // Igual que en el kiosco: este monitor necesita saber su sede para no
  // mezclar los tickets "Listo"/"Preparando" de los dos locales.
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

  // Lo recién llegado a cocina ya cuenta como "Preparando" (no hay paso
  // "Nuevo"). Los programados no salen hasta que cocina los ve.
  const preparando = orders.filter((o) => o.estado === "pendiente" || o.estado === "en_preparacion");
  const listos = orders.filter((o) => o.estado === "listo");
  // Que siempre quepan todos en pantalla (a petición del cliente): cuantos
  // más pedidos, más columnas y números más pequeños, sin tener que hacer
  // scroll en un monitor que nadie toca.
  const densidadListos = listos.length <= 4 ? 1 : listos.length <= 9 ? 2 : listos.length <= 16 ? 3 : 4;
  const densidadPreparando = preparando.length <= 6 ? 1 : preparando.length <= 12 ? 2 : preparando.length <= 24 ? 3 : 4;

  const estiloFondo = fondoRecogidaUrl
    ? { backgroundImage: `url(${fondoRecogidaUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <div
      className={`kiosco k-recogida ${cursorOculto ? "k-recogida--sin-cursor" : ""}`}
      style={estiloFondo}
      onPointerUp={alSoltarToque}
    >
      {fondoRecogidaUrl && <div className="k-recogida-overlay" />}
      <div className="k-recogida-cabecera">
        <div className="k-recogida-marca">
          <img
            src={logoRecogidaUrl || "/brand/svg/logo-monocromo-blanco.svg"}
            alt="California"
            className="k-recogida-logo"
          />
          <span className="k-recogida-titulo">TU PEDIDO · YOUR ORDER</span>
        </div>
        <div className="k-recogida-derecha">
          {!pantallaCompleta && (
            <button
              type="button"
              className="k-recogida-pantalla-completa"
              onClick={entrarPantallaCompleta}
              title="Para salir: doble toque en la pantalla (o Esc)"
            >
              ⛶ Pantalla completa
            </button>
          )}
          <span className="k-recogida-reloj">
            {hora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      </div>
      <div className="k-recogida-columnas">
        <div className="k-recogida-col k-recogida-col--preparando">
          <span className="k-recogida-etiqueta k-recogida-etiqueta--preparando">PREPARANDO · IN PROGRESS</span>
          <div className={`k-recogida-lista k-recogida-lista--d${densidadPreparando}`}>
            {preparando.map((o) => (
              <div key={o.id} className="k-recogida-fila">
                <span className="k-recogida-num">{o.ticketNumero}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="k-recogida-col">
          <span className="k-recogida-etiqueta k-recogida-etiqueta--listo">LISTO · READY</span>
          <div className={`k-recogida-listos k-recogida-listos--d${densidadListos}`}>
            {listos.map((o) => (
              <div key={o.id} className="k-recogida-listo">
                {o.ticketNumero}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
