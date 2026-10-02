import { supabaseAdmin, EMAIL_RE } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido" }, { status: 400 });
  }

  // Solo el email: la llave secreta saltea RLS, así que el servidor es el único filtro
  const { error } = await supabaseAdmin().from("signups").insert({ email });

  if (error?.code === "23505") return Response.json({ duplicate: true });
  if (error) {
    console.error("signup insert", error);
    return Response.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
