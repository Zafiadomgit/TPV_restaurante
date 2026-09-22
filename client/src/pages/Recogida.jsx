import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { formatTicket } from "../format.js";
import { getSede, guardarSede } from "../sede.js";
import SelectorSede from "../components/SelectorSede.jsx";

const POLL_MS = 3000;

export default function Recogida() {
  const [orders, setOrders] = useState([]);
  const [hora, setHora] = useState(new Date());
  const [sede, setSede] = useState(() => getSede());
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

  return (
    <div className="kiosco k-recogida">
      <div className="k-recogida-cabecera">
        <div className="k-recogida-marca">
          <img src="/brand/svg/logo-monocromo-blanco.svg" alt="California" className="k-recogida-logo" />
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
