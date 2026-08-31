import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import { formatTicket } from "../format.js";

const POLL_MS = 3000;

function formatHora(iso) {
  return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function formatFecha(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "";
}

export default function Caja() {
  const [turnos, setTurnos] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState("");
  const [efectivoInicial, setEfectivoInicial] = useState("");
  const [efectivoFinal, setEfectivoFinal] = useState("");
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const enVuelo = useRef(false);

  const [categoriaActiva, setCategoriaActiva] = useState("");
  const [mesa, setMesa] = useState("Mostrador");
  const [items, setItems] = useState([]);
  const [cobrando, setCobrando] = useState(false);
  const [dividirEntre, setDividirEntre] = useState("");
  const [ultimaVenta, setUltimaVenta] = useState(null);

  useEffect(() => {
    api
      .getMenu()
      .then((data) => {
        setMenu(data);
        if (data.length > 0) setCategoriaActiva(data[0].categoria);
      })
      .catch(() => {});
  }, []);

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

  const addItem = (producto) => {
    setUltimaVenta(null);
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === producto.id);
      if (existente) {
        return prev.map((i) =>
          i.productId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { productId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 }];
    });
  };

  const increase = (productId) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, cantidad: i.cantidad + 1 } : i)));

  const decrease = (productId) =>
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0)
    );

  const remove = (productId) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const { subtotal, iva, total } = useMemo(() => calcularTotales(items), [items]);

  const personas = Number(dividirEntre);
  const porPersona = personas > 1 ? Number((total / personas).toFixed(2)) : null;

  const cobrar = async (metodoPago) => {
    setError("");
    setCobrando(true);
    try {
      const nuevoPedido = await api.createOrder({ mesa: mesa.trim() || "Mostrador", items, notasGenerales: "" });
      const pagado = await api.pagarOrder(nuevoPedido.id, metodoPago);
      setUltimaVenta(pagado);
      setItems([]);
      setDividirEntre("");
      setMesa("Mostrador");
    } catch (e) {
      setError(e.message);
    } finally {
      setCobrando(false);
    }
  };

  if (!cargado) return <p className="loading">Cargando caja...</p>;

  return (
    <div className="caja-page">
      <h2>Caja</h2>
      {error && <p className="error">{error}</p>}

      {turnoAbierto ? (
        <div className="caja-pos-layout">
          <div className="caja-productos">
            <div className="categorias">
              {menu.map((cat) => (
                <button
                  key={cat.categoria}
                  className={categoriaActiva === cat.categoria ? "active" : ""}
                  onClick={() => setCategoriaActiva(cat.categoria)}
                >
                  {cat.categoria}
                </button>
              ))}
            </div>
            <div className="caja-botones-grid">
              {menu
                .find((cat) => cat.categoria === categoriaActiva)
                ?.productos.map((producto) => {
                  const agotado = producto.disponible === false;
                  return (
                    <button
                      key={producto.id}
                      className={`caja-boton-producto ${agotado ? "agotado" : ""}`}
                      disabled={agotado}
                      onClick={() => addItem(producto)}
                    >
                      <span>{producto.nombre}</span>
                      {agotado ? (
                        <strong className="caja-boton-agotado-label">Agotado</strong>
                      ) : (
                        <>
                          <strong>{producto.precio.toFixed(2)} €</strong>
                          {producto.avisoStock && <em>{producto.avisoStock}</em>}
                        </>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          <aside className="caja-ticket-panel">
            <div className="caja-ticket-mesa">
              <label>
                Mesa / referencia
                <input type="text" value={mesa} onChange={(e) => setMesa(e.target.value)} placeholder="Mostrador" />
              </label>
            </div>

            {ultimaVenta && (
              <p className="caja-venta-ok">
                Cobrado {formatTicket(ultimaVenta.ticketNumero)} · {ultimaVenta.total.toFixed(2)} €
              </p>
            )}

            {items.length === 0 ? (
              <p className="empty">Toca un producto para añadirlo</p>
            ) : (
              <ul className="cart-items">
                {items.map((item) => (
                  <li key={item.productId} className="cart-item">
                    <div className="cart-item-row">
                      <span className="cart-item-name">{item.nombre}</span>
                      <button className="btn-remove" onClick={() => remove(item.productId)}>
                        ✕
                      </button>
                    </div>
                    <div className="cart-item-row">
                      <div className="qty-controls">
                        <button onClick={() => decrease(item.productId)}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => increase(item.productId)}>+</button>
                      </div>
                      <span>{(item.precio * item.cantidad).toFixed(2)} €</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="totales">
              <div>
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div>
                <span>IVA (10%)</span>
                <span>{iva.toFixed(2)} €</span>
              </div>
              <div className="total-final">
                <span>Total</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>

            <div className="caja-dividir">
              <label>
                Dividir cuenta entre
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Nº personas"
                  value={dividirEntre}
                  onChange={(e) => setDividirEntre(e.target.value)}
                />
              </label>
              {porPersona !== null && (
                <span className="caja-por-persona">{porPersona.toFixed(2)} € cada uno</span>
              )}
            </div>

            <div className="caja-pago-botones">
              <button disabled={items.length === 0 || cobrando} onClick={() => cobrar("efectivo")}>
                {cobrando ? "Cobrando..." : "Efectivo"}
              </button>
              <button disabled={items.length === 0 || cobrando} onClick={() => cobrar("tarjeta")}>
                {cobrando ? "Cobrando..." : "Tarjeta"}
              </button>
            </div>
          </aside>
        </div>
      ) : (
        <div className="card-caja card-caja-form estado-cerrado">
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
      )}

      {turnoAbierto && (
        <div className="card-caja card-caja-form estado-abierto caja-cerrar-turno">
          <span className="badge-estado badge-abierto-caja">Turno abierto</span>
          <p className="caja-detalle">
            Abierto hoy a las {formatHora(turnoAbierto.abiertoEn)} · Efectivo inicial:{" "}
            <strong>{turnoAbierto.efectivoInicial.toFixed(2)} €</strong>
          </p>
          <form onSubmit={cerrarTurno} className="caja-cerrar-form">
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
