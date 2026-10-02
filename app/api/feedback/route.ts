import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
  const email = rawEmail || null;

  if (!message || message.length > 2000 || (email && email.length > 254)) {
    return Response.json({ error: "Comentario inválido" }, { status: 400 });
  }

  // Solo estos dos campos: la llave secreta saltea RLS, así que el servidor es el único filtro
  const { error } = await supabaseAdmin().from("feedback").insert({ message, email });

  if (error) {
    console.error("feedback insert", error);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
