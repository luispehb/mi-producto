import { supabaseUser, EMAIL_RE } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return Response.json({ error: "Email inválido." }, { status: 400 });
  }

  // El link vuelve a /auth/confirm, que abre la sesión y manda a elegir la contraseña nueva
  const redirectTo = new URL("/auth/confirm?next=/nueva-clave", request.url).toString();
  const { error } = await (await supabaseUser()).auth.resetPasswordForEmail(email, { redirectTo });

  if (error?.status === 429) {
    return Response.json({ error: "Pediste muchos emails seguidos. Probá de nuevo en un rato." }, { status: 429 });
  }
  if (error) console.error("resetPasswordForEmail", error);
  // Misma respuesta exista o no la cuenta: no revela qué emails están registrados
  return Response.json({ sent: true });
}
