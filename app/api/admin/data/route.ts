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

// Email de cada usuario, para mostrar quién creó cada plan
async function fetchEmails() {
  const db = supabaseAdmin();
  const perPage = 1000, emails = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    data.users.forEach(u => emails.set(u.id, u.email ?? ""));
    if (data.users.length < perPage) return emails;
  }
}

type PlanRow = { city: string; title: string; starts_at: string; energy: string; spots: number; created_at: string; user_id: string };

export async function GET() {
  const { error: denied } = await requireAdmin();
  if (denied) return denied;

  try {
    const [signups, feedback, planRows, emails] = await Promise.all([
      fetchAll("signups", "email, created_at"),
      fetchAll("feedback", "message, email, created_at"),
      fetchAll("plans", "city, title, starts_at, energy, spots, created_at, user_id") as Promise<PlanRow[]>,
      fetchEmails(),
    ]);
    // Se arma a mano cada campo: el user_id no sale, va el email del creador
    const plans = planRows.map(p => ({
      city: p.city, title: p.title, starts_at: p.starts_at, energy: p.energy, spots: p.spots,
      created_at: p.created_at, email: emails.get(p.user_id) ?? null,
    }));
    return Response.json({ signups, feedback, plans }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("admin data", err);
    return Response.json({ error: "No se pudieron cargar" }, { status: 500 });
  }
}
