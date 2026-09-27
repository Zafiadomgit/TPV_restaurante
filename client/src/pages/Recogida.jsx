import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { formatTicket } from "../format.js";
import { getSede, guardarSede } from "../sede.js";
import SelectorSede from "../components/SelectorSede.jsx";

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

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders(undefined, sede);
        setOrders(data.filter((o) => o.estado === "en_preparacion" || o.estado === "listo"));
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

  const preparando = orders.filter((o) => o.estado === "en_preparacion");
  const listos = orders.filter((o) => o.estado === "listo");

  const estiloFondo = fondoRecogidaUrl
    ? { backgroundImage: `url(${fondoRecogidaUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <div className="kiosco k-recogida" style={estiloFondo}>
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
        <span className="k-recogida-reloj">
          {hora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="k-recogida-columnas">
        <div className="k-recogida-col k-recogida-col--preparando">
          <span className="k-recogida-etiqueta k-recogida-etiqueta--preparando">PREPARANDO · IN PROGRESS</span>
          <div className="k-recogida-lista">
            {preparando.map((o) => (
              <div key={o.id} className="k-recogida-fila">
                <span className="k-recogida-num">{formatTicket(o.ticketNumero)}</span>
                <span className="k-recogida-estado">EN COCINA</span>
              </div>
            ))}
          </div>
        </div>
        <div className="k-recogida-col">
          <span className="k-recogida-etiqueta k-recogida-etiqueta--listo">LISTO · READY</span>
          <div className="k-recogida-listos">
            {listos.map((o) => (
              <div key={o.id} className="k-recogida-listo">
                {formatTicket(o.ticketNumero)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
