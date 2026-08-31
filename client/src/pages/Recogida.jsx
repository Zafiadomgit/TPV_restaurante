import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { formatTicket } from "../format.js";

const POLL_MS = 3000;

export default function Recogida() {
  const [orders, setOrders] = useState([]);
  const [hora, setHora] = useState(new Date());
  const enVuelo = useRef(false);

  useEffect(() => {
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders();
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
  }, []);

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
