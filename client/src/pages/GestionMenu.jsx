import { useEffect, useState } from "react";
import { api } from "../api.js";
import EditarProducto from "../components/EditarProducto.jsx";

export default function GestionMenu() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [editando, setEditando] = useState(null); // producto existente, o {} para uno nuevo
  const [categoriaParaNuevo, setCategoriaParaNuevo] = useState(null);

  const cargar = () =>
    Promise.all([api.getCategorias(), api.getProductosAdmin()])
      .then(([cats, prods]) => {
        setCategorias(cats);
        setProductos(prods);
        setError("");
      })
      .catch(() => setError("No se pudo cargar la carta"))
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const crearCategoria = async (e) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    setCreandoCategoria(true);
    try {
      const cat = await api.crearCategoria(nuevaCategoria.trim());
      setCategorias((prev) => [...prev, cat]);
      setNuevaCategoria("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCreandoCategoria(false);
    }
  };

  const eliminarCategoria = async (categoria) => {
    const nProductos = productos.filter((p) => p.categoriaId === categoria.id).length;
    const aviso =
      nProductos > 0
        ? `"${categoria.nombre}" tiene ${nProductos} producto(s). Al borrar la categoría se borran también. ¿Seguro?`
        : `¿Borrar la categoría "${categoria.nombre}"?`;
    if (!window.confirm(aviso)) return;

    try {
      await api.eliminarCategoria(categoria.id);
      setCategorias((prev) => prev.filter((c) => c.id !== categoria.id));
      setProductos((prev) => prev.filter((p) => p.categoriaId !== categoria.id));
    } catch (e) {
      setError(e.message);
    }
  };

  const abrirNuevoProducto = (categoriaId) => {
    setCategoriaParaNuevo(categoriaId);
    setEditando({ categoriaId });
  };

  const guardarProducto = async (datos) => {
    if (editando.id) {
      const actualizado = await api.actualizarProducto(editando.id, datos);
      setProductos((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
    } else {
      const creado = await api.crearProducto(datos);
      setProductos((prev) => [...prev, creado]);
    }
    setEditando(null);
  };

  const eliminarProducto = async () => {
    if (!window.confirm(`¿Borrar "${editando.nombre}"? No afecta a pedidos ya hechos.`)) return;
    try {
      await api.eliminarProducto(editando.id);
      setProductos((prev) => prev.filter((p) => p.id !== editando.id));
      setEditando(null);
    } catch (e) {
      setError(e.message);
    }
  };

  if (cargando) return <p className="loading">Cargando carta...</p>;

  return (
    <div className="gestion-menu-page">
      <h2>Carta</h2>
      {error && <p className="error">{error}</p>}

      {editando && (
        <EditarProducto
          producto={editando}
          categorias={categorias}
          otrosProductos={productos.filter((p) => p.id !== editando.id)}
          onCancelar={() => setEditando(null)}
          onGuardar={guardarProducto}
          onEliminar={eliminarProducto}
        />
      )}

      <form className="gestion-nueva-categoria" onSubmit={crearCategoria}>
        <input
          type="text"
          placeholder="Nombre de la nueva categoría"
          value={nuevaCategoria}
          onChange={(e) => setNuevaCategoria(e.target.value)}
        />
        <button type="submit" disabled={creandoCategoria || !nuevaCategoria.trim()}>
          {creandoCategoria ? "Creando..." : "+ Nueva categoría"}
        </button>
      </form>

      {categorias.map((cat) => {
        const productosCategoria = productos.filter((p) => p.categoriaId === cat.id);
        return (
          <section className="gestion-categoria" key={cat.id}>
            <div className="gestion-categoria-header">
              <h3>
                {cat.nombre} <span className="gestion-categoria-count">({productosCategoria.length})</span>
              </h3>
              <button className="gestion-borrar" onClick={() => eliminarCategoria(cat)}>
                Borrar categoría
              </button>
            </div>

            <div className="gestion-productos-grid">
              {productosCategoria.map((p) => (
                <button key={p.id} className={`gestion-producto-card ${p.activo ? "" : "inactivo"}`} onClick={() => setEditando(p)}>
                  <span className="gestion-producto-nombre">{p.nombre}</span>
                  <span className="gestion-producto-precio">{p.precio.toFixed(2)} €</span>
                  {!p.activo && <span className="badge-inactivo">Oculto</span>}
                  {p.modificadores && <span className="badge-personalizable">Personalizable</span>}
                </button>
              ))}
              <button className="gestion-producto-nuevo" onClick={() => abrirNuevoProducto(cat.id)}>
                + Añadir producto
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
