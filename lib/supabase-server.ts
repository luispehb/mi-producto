import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

// Cliente con la llave secreta: saltea RLS, así que solo vive en el servidor
// y solo lo usan las rutas del panel admin.
// `server-only` hace fallar el build si algún componente del navegador lo importa.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Cliente con la llave pública y la sesión del usuario (cookies): se aplica el RLS
export async function supabaseUser() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll(toSet) {
          // En un server component no se pueden escribir cookies: las renueva proxy.ts
          try {
            toSet.forEach(({ name, value, options }) => store.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}

// getUser valida el token contra Supabase; no alcanza con que exista la cookie
export async function getUser() {
  const { data: { user } } = await (await supabaseUser()).auth.getUser();
  return user;
}

// ADMIN_EMAILS: lista separada por comas
export function isAdmin(email: string | null | undefined) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}

// Mismas reglas que el check de la tabla signups
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

// Destino después del login: solo rutas internas
export function safeNext(next: unknown, fallback = "/planes") {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
