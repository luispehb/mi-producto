import { supabaseUser, EMAIL_RE } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido." }, { status: 400 });
  }
  if (password.length < 6 || password.length > 72) {
    return Response.json({ error: "La contraseña tiene que tener entre 6 y 72 caracteres." }, { status: 400 });
  }

  const supabase = await supabaseUser();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: new URL("/auth/confirm", request.url).toString() },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return Response.json({ error: "Ya hay una cuenta con ese email. Iniciá sesión." }, { status: 400 });
    }
    if (error.code === "weak_password") {
      return Response.json({ error: "Esa contraseña es muy débil, probá con otra." }, { status: 400 });
    }
    console.error("signUp", error);
    return Response.json({ error: "No se pudo crear la cuenta." }, { status: 500 });
  }

  // Sin sesión: el proyecto pide confirmar el email antes de entrar
  if (!data.session) return Response.json({ confirm: true });
  return Response.json({ ok: true });
}
