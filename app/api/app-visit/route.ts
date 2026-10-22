import { getUser, supabaseUser } from "@/lib/supabase-server";

// Una fila por usuario por día en visits. Con la sesión del usuario: el RLS
// solo lo deja registrar sus propias visitas.
export async function POST() {
  const user = await getUser();
  if (!user) return new Response(null, { status: 401 });

  // El día lo pone la base (UTC); si ya hay fila para hoy no hace nada
  const { error } = await (await supabaseUser()).from("visits")
    .upsert({ user_id: user.id }, { onConflict: "user_id,day", ignoreDuplicates: true });

  if (error) {
    console.error("app visit insert", error);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
