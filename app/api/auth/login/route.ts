import { supabaseUser } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return Response.json({ error: "Completá email y contraseña." }, { status: 400 });
  }

  const { error } = await (await supabaseUser()).auth.signInWithPassword({ email, password });
  if (error?.code === "email_not_confirmed") {
    return Response.json({ error: "Confirmá tu email antes de entrar." }, { status: 400 });
  }
  if (error) return Response.json({ error: "Email o contraseña incorrectos." }, { status: 400 });
  return Response.json({ ok: true });
}
