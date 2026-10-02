import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Llave pública (publishable): la seguridad la dan la sesión del usuario y las políticas RLS.
let client: SupabaseClient | null = null;

export function supabaseBrowser() {
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return client;
}
