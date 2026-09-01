import { useEffect, useState } from "react";
import { api } from "../api.js";
import EditarProducto from "../components/EditarProducto.jsx";

export default function GestionMenu() {
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaCategoriaEn, setNuevaCategoriaEn] = useState("");
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [editando, setEditando] = useState(null); // producto existente, o {} para uno nuevo
  const [categoriaParaNuevo, setCategoriaParaNuevo] = useState(null);
  const [editandoCategoria, setEditandoCategoria] = useState(null); // categoría cuyo nombre ES/EN se está editando
  const [nombreCategoriaEdit, setNombreCategoriaEdit] = useState("");
  const [nombreCategoriaEnEdit, setNombreCategoriaEnEdit] = useState("");
  const [guardandoCategoria, setGuardandoCategoria] = useState(false);

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
      const cat = await api.crearCategoria(nuevaCategoria.trim(), nuevaCategoriaEn.trim() || undefined);
      setCategorias((prev) => [...prev, cat]);
      setNuevaCategoria("");
      setNuevaCategoriaEn("");
    } catch (e) {
      setError(e.message);
    } finally {
      setCreandoCategoria(false);
    }
  };

  const abrirEdicionCategoria = (categoria) => {
    setEditandoCategoria(categoria.id);
    setNombreCategoriaEdit(categoria.nombre);
    setNombreCategoriaEnEdit(categoria.nombreEn || "");
  };

  const guardarNombreCategoria = async (categoria) => {
    if (!nombreCategoriaEdit.trim()) return;
    setGuardandoCategoria(true);
    try {
      const actualizada = await api.actualizarCategoria(categoria.id, {
        nombre: nombreCategoriaEdit.trim(),
        nombreEn: nombreCategoriaEnEdit.trim() || null,
      });
      setCategorias((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      setEditandoCategoria(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardandoCategoria(false);
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
        <input
          type="text"
          placeholder="Nombre en inglés (opcional)"
          value={nuevaCategoriaEn}
          onChange={(e) => setNuevaCategoriaEn(e.target.value)}
        />
        <button type="submit" disabled={creandoCategoria || !nuevaCategoria.trim()}>
          {creandoCategoria ? "Creando..." : "+ Nueva categoría"}
        </button>
      </form>

      {categorias.map((cat) => {
        const productosCategoria = productos.filter((p) => p.categoriaId === cat.id);
        return (
          <section className="gestion-categoria" key={cat.id}>
            {editandoCategoria === cat.id ? (
              <div className="gestion-categoria-header gestion-categoria-editando">
                <input
                  type="text"
                  value={nombreCategoriaEdit}
                  onChange={(e) => setNombreCategoriaEdit(e.target.value)}
                  placeholder="Nombre"
                />
                <input
                  type="text"
                  value={nombreCategoriaEnEdit}
                  onChange={(e) => setNombreCategoriaEnEdit(e.target.value)}
                  placeholder="Nombre en inglés (opcional)"
                />
                <button
                  type="button"
                  className="gestion-categoria-guardar"
                  disabled={guardandoCategoria || !nombreCategoriaEdit.trim()}
                  onClick={() => guardarNombreCategoria(cat)}
                >
                  {guardandoCategoria ? "Guardando..." : "Guardar"}
                </button>
                <button type="button" className="gestion-borrar" onClick={() => setEditandoCategoria(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="gestion-categoria-header">
                <h3>
                  {cat.nombre} <span className="gestion-categoria-count">({productosCategoria.length})</span>
                </h3>
                <div className="gestion-categoria-acciones">
                  <button className="gestion-editar" onClick={() => abrirEdicionCategoria(cat)}>
                    Editar
                  </button>
                  <button className="gestion-borrar" onClick={() => eliminarCategoria(cat)}>
                    Borrar categoría
                  </button>
                </div>
              </div>
            )}

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
