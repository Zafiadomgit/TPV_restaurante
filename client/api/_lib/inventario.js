export function mapRow(row) {
  return {
    id: row.id,
    clave: row.clave,
    nombre: row.nombre,
    categoria: row.categoria || "",
    stock: Number(row.stock),
    unidad: row.unidad,
    umbralBajo: Number(row.umbral_bajo),
    visibleEnKiosco: row.visible_en_kiosco,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

// "agotado" (stock <= 0), "bajo" (por debajo del umbral) u "ok".
export function estadoStock(item) {
  if (item.stock <= 0) return "agotado";
  if (item.stock <= item.umbralBajo) return "bajo";
  return "ok";
}
