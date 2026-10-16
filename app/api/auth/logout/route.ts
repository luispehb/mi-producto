import { supabaseUser } from "@/lib/supabase-server";

export async function POST() {
  // Borra las cookies de sesión aunque el token ya no sea válido
  await (await supabaseUser()).auth.signOut();
  return new Response(null, { status: 204 });
}
