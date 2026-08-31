import { useEffect, useState } from "react";
import { api } from "../api.js";

function estadoStock(item) {
  if (item.stock <= 0) return "agotado";
  if (item.stock <= item.umbralBajo) return "bajo";
  return "ok";
}

const ESTADO_LABEL = { ok: "OK", bajo: "Bajo", agotado: "Agotado" };

export default function Inventario() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);

  const cargar = () =>
    api
      .getInventario()
      .then((data) => {
        setItems(data);
        setError("");
      })
      .catch(() => setError("No se pudo cargar el inventario"))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const valorStock = (item) => (editando[item.id] !== undefined ? editando[item.id] : String(item.stock));

  const onStockChange = (id, valor) => setEditando((prev) => ({ ...prev, [id]: valor }));

  const guardarStock = async (item) => {
    const nuevoValor = editando[item.id];
    if (nuevoValor === undefined) return;
    const numero = Number(nuevoValor);
    if (!Number.isFinite(numero) || numero === item.stock) {
      setEditando((prev) => {
        const { [item.id]: _omitido, ...resto } = prev;
        return resto;
      });
      return;
    }
    setGuardandoId(item.id);
    try {
      const actualizado = await api.actualizarInventario(item.id, { stock: numero });
      setItems((prev) => prev.map((i) => (i.id === item.id ? actualizado : i)));
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardandoId(null);
      setEditando((prev) => {
        const { [item.id]: _omitido, ...resto } = prev;
        return resto;
      });
    }
  };

  const toggleKiosco = async (item) => {
    try {
      const actualizado = await api.actualizarInventario(item.id, { visibleEnKiosco: !item.visibleEnKiosco });
      setItems((prev) => prev.map((i) => (i.id === item.id ? actualizado : i)));
    } catch (e) {
      setError(e.message);
    }
  };

  if (cargando) return <p className="loading">Cargando inventario...</p>;

  const bajos = items.filter((i) => estadoStock(i) === "bajo").length;
  const agotados = items.filter((i) => estadoStock(i) === "agotado").length;

  return (
    <div className="inventario-page">
      <h2>Inventario</h2>
      {error && <p className="error">{error}</p>}

      <div className="inventario-kpis">
        <div className="inventario-kpi">
          <span>Productos activos</span>
          <strong>{items.length}</strong>
        </div>
        <div className="inventario-kpi kpi-bajo">
          <span>Stock bajo</span>
          <strong>{bajos}</strong>
        </div>
        <div className="inventario-kpi kpi-agotado">
          <span>Agotados</span>
          <strong>{agotados}</strong>
        </div>
      </div>

      <div className="inventario-tabla">
        <div className="inventario-fila inventario-cabecera">
          <span>Producto</span>
          <span>Categoría</span>
          <span>Stock</span>
          <span>Aviso bajo</span>
          <span>Estado</span>
          <span>En kiosco</span>
        </div>
        {items.map((item) => {
          const estado = estadoStock(item);
          return (
            <div className="inventario-fila" key={item.id}>
              <span className="inventario-nombre">{item.nombre}</span>
              <span>{item.categoria}</span>
              <span className="inventario-stock-input">
                <input
                  type="number"
                  step="0.1"
                  value={valorStock(item)}
                  onChange={(e) => onStockChange(item.id, e.target.value)}
                  onBlur={() => guardarStock(item)}
                  disabled={guardandoId === item.id}
                />
                <span className="inventario-unidad">{item.unidad}</span>
              </span>
              <span>
                {item.umbralBajo} {item.unidad}
              </span>
              <span className={`badge-inventario badge-inventario-${estado}`}>{ESTADO_LABEL[estado]}</span>
              <button
                className={`toggle-kiosco ${item.visibleEnKiosco ? "on" : ""}`}
                onClick={() => toggleKiosco(item)}
                aria-label="En kiosco"
              >
                <span className="toggle-knob" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
