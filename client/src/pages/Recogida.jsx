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
    <div className="recogida-page">
      <div className="recogida-header">
        <span>TU PEDIDO · YOUR ORDER</span>
        <span className="recogida-reloj">
          {hora.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <div className="recogida-columnas">
        <div className="recogida-columna">
          <span className="recogida-titulo titulo-preparando">PREPARANDO · IN PROGRESS</span>
          <div className="recogida-tickets">
            {preparando.map((o) => (
              <span key={o.id} className="recogida-ticket ticket-preparando">
                {formatTicket(o.ticketNumero)}
              </span>
            ))}
          </div>
        </div>
        <div className="recogida-columna">
          <span className="recogida-titulo titulo-listo">LISTO · READY</span>
          <div className="recogida-tickets">
            {listos.map((o) => (
              <span key={o.id} className="recogida-ticket ticket-listo">
                {formatTicket(o.ticketNumero)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
