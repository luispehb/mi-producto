import { getUser, supabaseUser } from "@/lib/supabase-server";
import { parseCurrentCityInput } from "@/lib/current-city";

// Hay una sola ciudad actual por viajero: POST la crea o la reemplaza
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Iniciá sesión para contar dónde estás." }, { status: 401 });

  const input = parseCurrentCityInput(await request.json().catch(() => null));
  if (input.error !== undefined) return Response.json({ error: input.error }, { status: 400 });

  const { error } = await (await supabaseUser()).from("current_cities")
    .upsert({ ...input.data, user_id: user.id }, { onConflict: "user_id" });
  if (error) {
    console.error("current_cities upsert", error);
    return Response.json({ error: "No se pudo guardar, probá de nuevo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}

// Borra la ciudad actual del viajero. El RLS hace que solo se toque la propia.
export async function DELETE() {
  const user = await getUser();
  if (!user) return Response.json({ error: "Iniciá sesión para contar dónde estás." }, { status: 401 });

  const { data: rows, error } = await (await supabaseUser()).from("current_cities").delete().eq("user_id", user.id).select("id");
  if (error) {
    console.error("current_cities delete", error);
    return Response.json({ error: "No se pudo borrar, probá de nuevo." }, { status: 500 });
  }
  if (!rows.length) return Response.json({ error: "No tenías una ciudad cargada." }, { status: 404 });
  return Response.json({ ok: true });
}
