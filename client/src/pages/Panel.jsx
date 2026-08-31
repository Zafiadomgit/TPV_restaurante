import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDuracion } from "../informes.js";

const POLL_MS = 15000;

export default function Panel() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    const cargar = () =>
      api
        .getResumen()
        .then((data) => {
          if (activo) setResumen(data);
        })
        .catch(() => {
          if (activo) setError("No se pudo cargar el panel");
        });

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => {
      activo = false;
      clearInterval(interval);
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!resumen) return <p className="loading">Cargando panel...</p>;

  const maxVentaHora = Math.max(1, ...resumen.ventasPorHora.map((h) => h.total));
  const maxTopProducto = Math.max(1, ...resumen.topProductos.map((p) => p.cantidad));

  return (
    <div className="panel-page">
      <h2>Panel del dueño</h2>

      <div className="panel-kpis">
        <div className="panel-kpi">
          <span>Ventas de hoy</span>
          <strong>{resumen.ventasHoy.toFixed(2)} €</strong>
        </div>
        <div className="panel-kpi">
          <span>Tickets</span>
          <strong>{resumen.tickets}</strong>
        </div>
        <div className="panel-kpi">
          <span>Ticket medio</span>
          <strong>{resumen.ticketMedio.toFixed(2)} €</strong>
        </div>
        <div className="panel-kpi">
          <span>Tiempo medio cocina</span>
          <strong>{formatDuracion(resumen.tiempoMedioCocinaSegundos)}</strong>
        </div>
      </div>

      <div className="panel-graficos">
        <div className="panel-card panel-ventas-hora">
          <span className="panel-card-titulo">Ventas por hora</span>
          {resumen.tickets === 0 ? (
            <p className="empty">Sin ventas todavía hoy</p>
          ) : (
            <div className="panel-barras">
              {resumen.ventasPorHora.map((h) => (
                <div key={h.hora} className="panel-barra-col">
                  <div
                    className="panel-barra"
                    style={{ height: `${Math.max(2, (h.total / maxVentaHora) * 100)}%` }}
                    title={`${h.total.toFixed(2)} €`}
                  />
                  <span className="panel-barra-label">{h.hora}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card panel-top-productos">
          <span className="panel-card-titulo">Más vendidos hoy</span>
          {resumen.topProductos.length === 0 ? (
            <p className="empty">Sin ventas todavía hoy</p>
          ) : (
            resumen.topProductos.map((p) => (
              <div key={p.nombre} className="panel-top-fila">
                <div className="panel-top-cabecera">
                  <span>{p.nombre}</span>
                  <span>{p.cantidad}</span>
                </div>
                <div className="panel-top-barra-fondo">
                  <div
                    className="panel-top-barra"
                    style={{ width: `${(p.cantidad / maxTopProducto) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
