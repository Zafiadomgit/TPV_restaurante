import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDuracion } from "../informes.js";

const POLL_MS = 15000;

function formatHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function formatFecha(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "";
}

export default function Panel() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [turnosCerrados, setTurnosCerrados] = useState([]);

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

  // Control de cierres de caja: solo el dueño lo ve (no pasa por
  // GET /api/informes, es GET /api/caja?estado=cerrado — el mismo
  // endpoint que usaba /caja, ahora también accesible con rol "panel"
  // en modo solo lectura).
  useEffect(() => {
    let activo = true;
    const cargar = () =>
      api
        .getTurnos("cerrado")
        .then((data) => {
          if (activo) {
            setTurnosCerrados(
              [...data].sort((a, b) => new Date(b.cerradoEn) - new Date(a.cerradoEn)).slice(0, 5)
            );
          }
        })
        .catch(() => {});

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

      {turnosCerrados.length > 0 && (
        <>
          <h3 className="caja-historial-titulo">Últimos cierres</h3>
          <div className="tickets-grid">
            {turnosCerrados.map((t) => (
              <div
                key={t.id}
                className={`card-caja historial-turno ${
                  t.diferencia === 0 ? "diferencia-ok" : "diferencia-alerta"
                }`}
              >
                <span className="badge-estado badge-cerrado-caja">Cerrado</span>
                <p className="caja-detalle">
                  {formatFecha(t.abiertoEn)} · {formatHora(t.abiertoEn)} → {formatHora(t.cerradoEn)}
                </p>
                <div className="caja-cierre-resumen">
                  <div>
                    <span>Efectivo inicial</span>
                    <span>{t.efectivoInicial.toFixed(2)} €</span>
                  </div>
                  <div>
                    <span>Efectivo esperado</span>
                    <span>{t.totalEfectivoEsperado.toFixed(2)} €</span>
                  </div>
                  <div>
                    <span>Efectivo declarado</span>
                    <span>{t.efectivoFinalDeclarado.toFixed(2)} €</span>
                  </div>
                  <div className="caja-diferencia">
                    <span>Diferencia</span>
                    <span>
                      {t.diferencia > 0 ? "+" : ""}
                      {t.diferencia.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
