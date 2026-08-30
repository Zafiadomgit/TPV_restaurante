import { createClient } from "@supabase/supabase-js";

// La clave "anon" de Supabase está pensada para exponerse (el acceso real
// lo controlan las políticas RLS de la tabla `orders`, ver /supabase/policies.sql).
// Se puede sobreescribir con variables de entorno en Vercel si se prefiere.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://cpizjcpixtyoqulfkqij.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwaXpqY3BpeHR5b3F1bGZrcWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMDgxNDUsImV4cCI6MjEwMzY4NDE0NX0.Mh4mGwEX4oq8Vwo_GHdG-EvUMAi6BFPHWztoJGzEXKU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
