import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error: denied } = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await supabaseAdmin().rpc("admin_metrics");
  if (error) {
    console.error("admin_metrics", error);
    return Response.json({ error: "No se pudieron calcular" }, { status: 500 });
  }
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
