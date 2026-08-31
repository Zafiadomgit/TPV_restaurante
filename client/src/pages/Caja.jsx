import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";

const POLL_MS = 3000;

function formatHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function formatFecha(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "";
}

export default function Caja() {
  const [turnos, setTurnos] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState("");
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoFinal, setEfectivoFinal] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enVuelo = useRef(false);

  useEffect(() => {
    const cargar = async () => {
      if (enVuelo.current) return;
      enVuelo.current = true;
      try {
        const data = await api.getTurnos();
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
  }, []);

  const turnoAbierto = turnos.find((t) => t.estado === "abierto") || null;
  const turnosCerrados = [...turnos]
    .filter((t) => t.estado === "cerrado")
    .sort((a, b) => new Date(b.cerradoEn) - new Date(a.cerradoEn))
    .slice(0, 5);

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
      const turno = await api.abrirTurno(valor);
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

  if (!cargado) return <p className="loading">Cargando caja...</p>;

  return (
    <div className="caja-page">
      <h2>Caja</h2>
      {error && <p className="error">{error}</p>}

      {!turnoAbierto ? (
        <div className="card-caja estado-cerrado">
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
      ) : (
        <div className="card-caja estado-abierto">
          <span className="badge-estado badge-abierto-caja">Turno abierto</span>
          <h3>Turno en curso</h3>
          <p className="caja-detalle">
            Abierto hoy a las {formatHora(turnoAbierto.abiertoEn)} · Efectivo inicial:{" "}
            <strong>{turnoAbierto.efectivoInicial.toFixed(2)} €</strong>
          </p>
          <p className="caja-hint">
            Los pedidos se siguen cobrando con normalidad desde /pago. Al cerrar turno se compara
            el efectivo contado contra el efectivo inicial más lo cobrado en efectivo durante el
            turno.
          </p>
          <form onSubmit={cerrarTurno}>
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
