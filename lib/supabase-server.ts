import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la llave secreta: saltea RLS, así que solo vive en el servidor.
// `server-only` hace fallar el build si algún componente del navegador lo importa.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Mismas reglas que el check de la tabla signups
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;
