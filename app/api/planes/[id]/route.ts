import type { NextRequest } from "next/server";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import { parsePlanInput } from "@/lib/plans";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND = () => Response.json({ error: "No encontramos ese plan." }, { status: 404 });

// Sesión del usuario + id válido. El RLS hace que solo se toquen planes propios:
// si el plan es de otro, la consulta no devuelve filas y respondemos 404.
async function authorize(ctx: RouteContext<"/api/planes/[id]">) {
  const user = await getUser();
  if (!user) return { denied: Response.json({ error: "Iniciá sesión para editar tus planes." }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return { denied: NOT_FOUND() };
  return { id };
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/planes/[id]">) {
  const { id, denied } = await authorize(ctx);
  if (denied) return denied;

  const input = parsePlanInput(await request.json().catch(() => null));
  if (input.error !== undefined) return Response.json({ error: input.error }, { status: 400 });

  const { data: rows, error } = await (await supabaseUser()).from("plans").update(input.data).eq("id", id).select("id");
  if (error) {
    console.error("plans update", error);
    return Response.json({ error: "No se pudo guardar, probá de nuevo." }, { status: 500 });
  }
  if (!rows.length) return NOT_FOUND();
  return Response.json({ ok: true });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/planes/[id]">) {
  const { id, denied } = await authorize(ctx);
  if (denied) return denied;

  const { data: rows, error } = await (await supabaseUser()).from("plans").delete().eq("id", id).select("id");
  if (error) {
    console.error("plans delete", error);
    return Response.json({ error: "No se pudo borrar, probá de nuevo." }, { status: 500 });
  }
  if (!rows.length) return NOT_FOUND();
  return Response.json({ ok: true });
}
