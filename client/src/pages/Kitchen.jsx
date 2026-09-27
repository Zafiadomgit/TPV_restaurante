import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import OrderTicket from "../components/OrderTicket.jsx";
import { getSede, guardarSede, SEDES } from "../sede.js";
import SelectorSede from "../components/SelectorSede.jsx";
import { desbloquearSonido, reproducirSonidoNuevoPedido } from "../sonidoCocina.js";

const POLL_MS = 3000;

const COLUMNAS = [
  { estado: "pendiente", titulo: "NUEVO", accentClass: "accent-rojo" },
  { estado: "en_preparacion", titulo: "PREPARANDO", accentClass: "accent-naranja" },
  { estado: "listo", titulo: "LISTO", accentClass: "accent-verde" },
];

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [sede, setSede] = useState(() => getSede());
  const enVuelo = useRef(false);
  // Ids de pedidos "pendiente" ya vistos, para saber cuáles son NUEVOS
  // de verdad y avisar solo de esos — no de todos los que ya estaban en
  // la pantalla desde antes. null hasta la primera carga, para no sonar
  // por los pedidos que ya estaban pendientes al abrir la pantalla.
  const idsPendientesVistos = useRef(null);

  // El navegador bloquea el audio hasta la primera interacción real del
  // usuario en la página — con cualquier toque/clic en cocina, desde
  // ahí el aviso sonoro ya puede sonar solo.
  useEffect(() => {
    const desbloquear = () => desbloquearSonido();
    window.addEventListener("pointerdown", desbloquear, { once: true });
    return () => window.removeEventListener("pointerdown", desbloquear);
  }, []);

  useEffect(() => {
    if (!sede) return;
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getOrders(undefined, sede);
        const activos = data.filter((o) => COLUMNAS.some((c) => c.estado === o.estado));
        setOrders(activos);

        const idsPendientesAhora = new Set(activos.filter((o) => o.estado === "pendiente").map((o) => o.id));
        if (idsPendientesVistos.current) {
          const hayNuevo = [...idsPendientesAhora].some((id) => !idsPendientesVistos.current.has(id));
          if (hayNuevo) reproducirSonidoNuevoPedido();
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
  }, [sede]);

  const avanzarEstado = async (id, estado) => {
    setOrders((prev) =>
      COLUMNAS.some((c) => c.estado === estado)
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

  return (
    <div className="kds-page">
      <div className="kds-header">
        <span className="kds-titulo">COCINA · CALIFORNIA · {SEDES[sede].nombre}</span>
        <span className="kds-contador">{ordenadas.length} comandas activas</span>
      </div>
      <div className="kds-columnas">
        {COLUMNAS.map((col) => {
          const pedidos = ordenadas.filter((o) => o.estado === col.estado);
          return (
            <div className="kds-columna" key={col.estado}>
              <div className={`kds-columna-header ${col.accentClass}`}>
                <span>{col.titulo}</span>
                <span>{pedidos.length}</span>
              </div>
              <div className="kds-columna-body">
                {pedidos.length === 0 ? (
                  <p className="kds-empty">Sin comandas</p>
                ) : (
                  pedidos.map((order) => (
                    <OrderTicket key={order.id} order={order} onAvanzar={avanzarEstado} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
