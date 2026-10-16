import { supabaseUser } from "@/lib/supabase-server";

// Solo con la sesión que abre el link del email (o una sesión normal)
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (password.length < 6 || password.length > 72) {
    return Response.json({ error: "La contraseña tiene que tener entre 6 y 72 caracteres." }, { status: 400 });
  }

  const supabase = await supabaseUser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "El link venció. Pedí uno nuevo." }, { status: 401 });

  const { error } = await supabase.auth.updateUser({ password });
  if (error?.code === "same_password") {
    return Response.json({ error: "Elegí una contraseña distinta a la anterior." }, { status: 400 });
  }
  if (error?.code === "weak_password") {
    return Response.json({ error: "Esa contraseña es muy débil, probá con otra." }, { status: 400 });
  }
  if (error) {
    console.error("updateUser", error);
    return Response.json({ error: "No se pudo guardar la contraseña." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
