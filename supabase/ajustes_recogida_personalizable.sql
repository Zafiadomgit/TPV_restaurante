-- Pantalla de recogida (/recogida) personalizable: fondo y logo por sede.
-- Nullable a propósito — si no se rellenan, la pantalla sigue con el
-- tema oscuro y logo por defecto de siempre (sin hueco roto).
alter table ajustes
  add column if not exists fondo_recogida_url text,
  add column if not exists logo_recogida_url text;
