import { useState } from "react";

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nuevoPasoId(existentes) {
  let id = "paso";
  let n = existentes.length + 1;
  while (existentes.some((p) => p.id === `${id}-${n}`)) n += 1;
  return `${id}-${n}`;
}

export default function EditarProducto({ producto, categorias, otrosProductos, onGuardar, onCancelar, onEliminar }) {
  const esNuevo = !producto.id;
  const [nombre, setNombre] = useState(producto.nombre || "");
  const [descripcion, setDescripcion] = useState(producto.descripcion || "");
  const [precio, setPrecio] = useState(producto.precio ?? "");
  const [categoriaId, setCategoriaId] = useState(producto.categoriaId || categorias[0]?.id || "");
  const [activo, setActivo] = useState(producto.activo ?? true);
  const [modificadores, setModificadores] = useState(producto.modificadores || []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const copiarPersonalizacionDe = (productoId) => {
    const origen = otrosProductos.find((p) => p.id === productoId);
    if (origen?.modificadores) {
      setModificadores(JSON.parse(JSON.stringify(origen.modificadores)));
    }
  };

  const anadirPaso = () => {
    setModificadores((prev) => [
      ...prev,
      { id: nuevoPasoId(prev), titulo: "Nuevo paso", tipo: "multiple", opciones: [] },
    ]);
  };

  const cambiarTituloPaso = (pasoId, titulo) => {
    setModificadores((prev) => prev.map((p) => (p.id === pasoId ? { ...p, titulo } : p)));
  };

  const cambiarPrecioSiTodoQuitado = (pasoId, valor) => {
    setModificadores((prev) =>
      prev.map((p) => {
        if (p.id !== pasoId) return p;
        if (valor === null) {
          const { precioSiTodoQuitado, ...resto } = p;
          return resto;
        }
        return { ...p, precioSiTodoQuitado: Math.max(0, Number(valor) || 0) };
      })
    );
  };

  const eliminarPaso = (pasoId) => {
    setModificadores((prev) => prev.filter((p) => p.id !== pasoId));
  };

  const anadirOpcion = (pasoId) => {
    setModificadores((prev) =>
      prev.map((p) => {
        if (p.id !== pasoId) return p;
        const base = slugify("opcion") + "-" + (p.opciones.length + 1);
        return {
          ...p,
          opciones: [...p.opciones, { id: base, nombre: "Nueva opción", precioExtra: 0, porDefecto: false }],
        };
      })
    );
  };

  const cambiarOpcion = (pasoId, opcionId, cambios) => {
    setModificadores((prev) =>
      prev.map((p) => {
        if (p.id !== pasoId) return p;
        return {
          ...p,
          opciones: p.opciones.map((o) => {
            if (o.id !== opcionId) return o;
            const actualizada = { ...o, ...cambios };
            if (cambios.nombre !== undefined) actualizada.id = slugify(cambios.nombre) || o.id;
            return actualizada;
          }),
        };
      })
    );
  };

  const eliminarOpcion = (pasoId, opcionId) => {
    setModificadores((prev) =>
      prev.map((p) => (p.id === pasoId ? { ...p, opciones: p.opciones.filter((o) => o.id !== opcionId) } : p))
    );
  };

  const guardar = async () => {
    setError("");
    if (!nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    const precioNumero = Number(precio);
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      setError("Introduce un precio válido");
      return;
    }
    if (!categoriaId) {
      setError("Elige una categoría");
      return;
    }

    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNumero,
        categoriaId,
        activo,
        modificadores: modificadores.length > 0 ? modificadores : null,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="personalizar-overlay" onClick={onCancelar}>
      <div className="personalizar-modal gestion-modal" onClick={(e) => e.stopPropagation()}>
        <div className="personalizar-header">
          <h3>{esNuevo ? "Nuevo producto" : "Editar producto"}</h3>
          <button className="personalizar-cerrar" onClick={onCancelar}>
            ✕
          </button>
        </div>

        <div className="personalizar-body">
          {error && <p className="error">{error}</p>}

          <div className="gestion-form-grid">
            <label className="gestion-campo">
              Nombre
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="gestion-campo">
              Precio (€)
              <input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
              />
            </label>
            <label className="gestion-campo gestion-campo-ancho">
              Descripción
              <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </label>
            <label className="gestion-campo">
              Categoría
              <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="gestion-campo gestion-campo-check">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              Visible en el kiosco
            </label>
          </div>

          <div className="gestion-personalizacion">
            <div className="gestion-personalizacion-header">
              <span>Personalización</span>
              {otrosProductos.length > 0 && (
                <select defaultValue="" onChange={(e) => e.target.value && copiarPersonalizacionDe(e.target.value)}>
                  <option value="">Copiar de otro producto...</option>
                  {otrosProductos
                    .filter((p) => p.modificadores)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {modificadores.map((paso) => (
              <div key={paso.id} className="gestion-paso">
                <div className="gestion-paso-header">
                  <input
                    type="text"
                    value={paso.titulo}
                    onChange={(e) => cambiarTituloPaso(paso.id, e.target.value)}
                    placeholder="Título del paso (ej. Quitar ingredientes)"
                  />
                  <button type="button" className="gestion-borrar" onClick={() => eliminarPaso(paso.id)}>
                    Eliminar paso
                  </button>
                </div>
                <label className="gestion-precio-todo-quitado">
                  <input
                    type="checkbox"
                    checked={paso.precioSiTodoQuitado !== undefined}
                    onChange={(e) => cambiarPrecioSiTodoQuitado(paso.id, e.target.checked ? 0 : null)}
                  />
                  Precio fijo si se marcan todas las opciones de este paso
                  {paso.precioSiTodoQuitado !== undefined && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={paso.precioSiTodoQuitado}
                      onChange={(e) => cambiarPrecioSiTodoQuitado(paso.id, e.target.value)}
                    />
                  )}
                </label>
                {paso.opciones.map((opcion) => (
                  <div key={opcion.id} className="gestion-opcion-fila">
                    <input
                      type="text"
                      value={opcion.nombre}
                      onChange={(e) => cambiarOpcion(paso.id, opcion.id, { nombre: e.target.value })}
                      placeholder="Nombre de la opción"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={opcion.precioExtra}
                      onChange={(e) =>
                        cambiarOpcion(paso.id, opcion.id, { precioExtra: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={opcion.porDefecto}
                        onChange={(e) => cambiarOpcion(paso.id, opcion.id, { porDefecto: e.target.checked })}
                      />
                      Por defecto
                    </label>
                    <button type="button" className="btn-remove" onClick={() => eliminarOpcion(paso.id, opcion.id)}>
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="gestion-anadir-opcion" onClick={() => anadirOpcion(paso.id)}>
                  + Añadir opción
                </button>
              </div>
            ))}

            <button type="button" className="gestion-anadir-paso" onClick={anadirPaso}>
              + Añadir paso de personalización
            </button>
          </div>
        </div>

        <div className="personalizar-footer gestion-footer">
          {!esNuevo && (
            <button type="button" className="gestion-eliminar" onClick={onEliminar} disabled={guardando}>
              Eliminar producto
            </button>
          )}
          <button type="button" className="personalizar-confirmar" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
