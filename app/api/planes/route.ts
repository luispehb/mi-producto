import { getUser, supabaseUser } from "@/lib/supabase-server";
import { parsePlanInput } from "@/lib/plans";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Iniciá sesión para armar un plan." }, { status: 401 });

  const input = parsePlanInput(await request.json().catch(() => null));
  if (input.error !== undefined) return Response.json({ error: input.error }, { status: 400 });

  const { error } = await (await supabaseUser()).from("plans").insert({ ...input.data, user_id: user.id });
  if (error) {
    console.error("plans insert", error);
    return Response.json({ error: "No se pudo guardar, probá de nuevo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
