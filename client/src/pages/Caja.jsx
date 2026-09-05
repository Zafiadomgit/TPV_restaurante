import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import { calcularTotales } from "../totales.js";
import { formatTicket } from "../format.js";
import ReciboImprimible from "../components/ReciboImprimible.jsx";
import Personalizar from "../components/Personalizar.jsx";

const POLL_MS = 3000;

function nuevoLineId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
  const [items, setItems] = useState([]);
  const [cobrando, setCobrando] = useState(false);
  const [dividirEntre, setDividirEntre] = useState("");
  const [ultimaVenta, setUltimaVenta] = useState(null);
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [pedidosSinCobrar, setPedidosSinCobrar] = useState([]);
  const [cobrandoPedidoId, setCobrandoPedidoId] = useState(null);
  const enVueloSinCobrar = useRef(false);
  const [tiempoEsperaInput, setTiempoEsperaInput] = useState("");
  const [guardandoTiempoEspera, setGuardandoTiempoEspera] = useState(false);
  const [tiempoEsperaGuardadoOk, setTiempoEsperaGuardadoOk] = useState(false);

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
    api
      .getAjustes()
      .then((data) => setTiempoEsperaInput(String(data.tiempoEsperaMinutos)))
      .catch(() => {});
  }, []);

  const guardarTiempoEspera = async (e) => {
    e.preventDefault();
    setError("");
    setTiempoEsperaGuardadoOk(false);
    setGuardandoTiempoEspera(true);
    try {
      const actualizado = await api.actualizarAjustes({ tiempoEsperaMinutos: tiempoEsperaInput });
      setTiempoEsperaInput(String(actualizado.tiempoEsperaMinutos));
      setTiempoEsperaGuardadoOk(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardandoTiempoEspera(false);
    }
  };

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

  useEffect(() => {
    const cargar = async () => {
      if (enVueloSinCobrar.current) return;
      enVueloSinCobrar.current = true;
      try {
        const data = await api.getPedidosSinCobrar();
        // Un pedido cancelado antes de cobrarse no debe aparecer aquí —
        // no hay nada que cobrar por él.
        setPedidosSinCobrar(data.filter((o) => o.estado !== "cancelado"));
      } catch {
        // se reintenta en el siguiente ciclo de polling
      } finally {
        enVueloSinCobrar.current = false;
      }
    };

    cargar();
    const interval = setInterval(cargar, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const cobrarPedidoKiosco = async (pedido, metodoPago) => {
    setError("");
    setCobrandoPedidoId(pedido.id);
    try {
      const pagado = await api.pagarOrder(pedido.id, metodoPago);
      setUltimaVenta(pagado);
      setPedidosSinCobrar((prev) => prev.filter((p) => p.id !== pedido.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCobrandoPedidoId(null);
    }
  };

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
    if (producto.modificadores) {
      setProductoPersonalizando(producto);
      return;
    }
    setItems((prev) => {
      const existente = prev.find((i) => i.productId === producto.id && !i.modificadoresTexto);
      if (existente) {
        return prev.map((i) => (i.lineId === existente.lineId ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          lineId: nuevoLineId(),
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          modificadores: null,
          modificadoresTexto: "",
        },
      ];
    });
  };

  const confirmarPersonalizacion = ({ seleccion, cantidad, precioUnidad, modificadoresTexto }) => {
    const producto = productoPersonalizando;
    setUltimaVenta(null);
    setItems((prev) => [
      ...prev,
      {
        lineId: nuevoLineId(),
        productId: producto.id,
        nombre: producto.nombre,
        precio: precioUnidad,
        cantidad,
        modificadores: seleccion,
        modificadoresTexto,
      },
    ]);
    setProductoPersonalizando(null);
  };

  const increase = (lineId) =>
    setItems((prev) => prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad + 1 } : i)));

  const decrease = (lineId) =>
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, cantidad: i.cantidad - 1 } : i)).filter((i) => i.cantidad > 0)
    );

  const remove = (lineId) => setItems((prev) => prev.filter((i) => i.lineId !== lineId));

  const { subtotal, iva, total } = useMemo(() => calcularTotales(items), [items]);

  const personas = Number(dividirEntre);
  const porPersona = personas > 1 ? Number((total / personas).toFixed(2)) : null;

  const cobrar = async (metodoPago) => {
    setError("");
    setCobrando(true);
    try {
      const nuevoPedido = await api.createOrder({
        mesa: "Mostrador",
        notasGenerales: "",
        items: items.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          notas: "",
          modificadores: i.modificadores,
        })),
      });
      const pagado = await api.pagarOrder(nuevoPedido.id, metodoPago);
      setUltimaVenta(pagado);
      setItems([]);
      setDividirEntre("");
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

      <form className="tiempo-espera-form" onSubmit={guardarTiempoEspera}>
        <label htmlFor="tiempo-espera">Tiempo de espera del kiosco (min)</label>
        <div className="tiempo-espera-row">
          <input
            id="tiempo-espera"
            type="number"
            min="1"
            value={tiempoEsperaInput}
            onChange={(e) => {
              setTiempoEsperaInput(e.target.value);
              setTiempoEsperaGuardadoOk(false);
            }}
          />
          <button type="submit" disabled={guardandoTiempoEspera || !tiempoEsperaInput}>
            {guardandoTiempoEspera ? "Guardando..." : "Guardar"}
          </button>
          {tiempoEsperaGuardadoOk && <span className="tiempo-espera-ok">✔️ Guardado</span>}
        </div>
      </form>

      <ReciboImprimible venta={ultimaVenta} />

      {ultimaVenta && (
        <div className="caja-venta-ok">
          <p>
            Cobrado {formatTicket(ultimaVenta.ticketNumero)} · {ultimaVenta.total.toFixed(2)} €
          </p>
          <button type="button" className="btn-imprimir-recibo" onClick={() => window.print()}>
            Imprimir recibo
          </button>
        </div>
      )}

      {pedidosSinCobrar.length > 0 && (
        <div className="pedidos-sin-cobrar">
          <h3 className="pedidos-sin-cobrar-titulo">
            Pedidos del kiosco sin cobrar ({pedidosSinCobrar.length})
          </h3>
          <div className="pedidos-sin-cobrar-lista">
            {pedidosSinCobrar.map((pedido) => (
              <div key={pedido.id} className="pedido-sin-cobrar-card">
                <div className="pedido-sin-cobrar-info">
                  <span className="pedido-sin-cobrar-ticket">{formatTicket(pedido.ticketNumero)}</span>
                  <span className="pedido-sin-cobrar-origen">{pedido.mesa}</span>
                  <p className="pedido-sin-cobrar-items">
                    {pedido.items.map((i) => `${i.cantidad}x ${i.nombre}`).join(", ")}
                  </p>
                </div>
                <div className="pedido-sin-cobrar-derecha">
                  <strong className="pedido-sin-cobrar-total">{pedido.total.toFixed(2)} €</strong>
                  <div className="pedido-sin-cobrar-botones">
                    <button
                      disabled={cobrandoPedidoId === pedido.id}
                      onClick={() => cobrarPedidoKiosco(pedido, "efectivo")}
                    >
                      {cobrandoPedidoId === pedido.id ? "Cobrando..." : "Efectivo"}
                    </button>
                    <button
                      disabled={cobrandoPedidoId === pedido.id}
                      onClick={() => cobrarPedidoKiosco(pedido, "tarjeta")}
                    >
                      {cobrandoPedidoId === pedido.id ? "Cobrando..." : "Tarjeta"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                ?.productos.map((producto) => (
                  <button key={producto.id} className="caja-boton-producto" onClick={() => addItem(producto)}>
                    <span>
                      {producto.nombre}
                      {producto.modificadores && <span className="caja-personalizable-punto" title="Personalizable" />}
                    </span>
                    <strong>{producto.precio.toFixed(2)} €</strong>
                  </button>
                ))}
            </div>
          </div>

          {productoPersonalizando && (
            <Personalizar
              producto={productoPersonalizando}
              onConfirmar={confirmarPersonalizacion}
              onCancelar={() => setProductoPersonalizando(null)}
            />
          )}

          <aside className="caja-ticket-panel">
            {items.length === 0 ? (
              <p className="empty">Toca un producto para añadirlo</p>
            ) : (
              <ul className="cart-items">
                {items.map((item) => (
                  <li key={item.lineId} className="cart-item">
                    <div className="cart-item-row">
                      <span className="cart-item-name">{item.nombre}</span>
                      <button className="btn-remove" onClick={() => remove(item.lineId)}>
                        ✕
                      </button>
                    </div>
                    {item.modificadoresTexto && (
                      <p className="cart-item-mods">{item.modificadoresTexto}</p>
                    )}
                    <div className="cart-item-row">
                      <div className="qty-controls">
                        <button onClick={() => decrease(item.lineId)}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => increase(item.lineId)}>+</button>
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
