import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

// Supabase devuelve como máximo 1000 filas por consulta: pedimos de a páginas
async function fetchAll(table: string, cols: string) {
  const db = supabaseAdmin();
  const pageSize = 1000, rows: unknown[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from(table).select(cols)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

export async function GET() {
  const { error: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const [signups, feedback] = await Promise.all([
      fetchAll("signups", "email, created_at"),
      fetchAll("feedback", "message, email, created_at"),
    ]);
    return Response.json({ signups, feedback }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("admin data", err);
    return Response.json({ error: "No se pudieron cargar" }, { status: 500 });
  }
}
