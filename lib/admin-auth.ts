import "server-only";
import { getUser, isAdmin } from "@/lib/supabase-server";

// Para /api/admin/*: devuelve el usuario admin, o la respuesta de error lista para devolver
export async function requireAdmin() {
  const user = await getUser();
  if (!user) return { error: Response.json({ error: "Sin sesión" }, { status: 401 }) };
  if (!isAdmin(user.email)) return { error: Response.json({ error: "Sin acceso" }, { status: 403 }) };
  return { user };
}
