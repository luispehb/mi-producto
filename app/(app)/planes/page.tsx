import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import { formatStartsAt, type Plan } from "@/lib/plans";
import LogoutButton from "@/components/LogoutButton";
import PlanForm from "@/components/PlanForm";

export const metadata: Metadata = { title: "Hap — Mis planes" };

export default async function PlanesPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/planes");

  // Con la sesión del usuario: el RLS deja ver solo sus planes
  const { data, error } = await (await supabaseUser()).from("plans")
    .select("id, city, title, starts_at, energy, spots")
    .order("starts_at", { ascending: true });
  if (error) console.error("plans select", error);
  const plans = (data ?? []) as Plan[];

  return (
    <main>
      <div className="topbar">
        <div>
          <span className="eyebrow">Hap</span>
          <h1>Mis planes</h1>
          <p className="who">{user.email}</p>
        </div>
        <div className="topbar-actions">
          <LogoutButton />
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Armá un plan</h2>
        </div>
        <PlanForm />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Tus planes<span className="count">{plans.length}</span></h2>
        </div>
        {error ? (
          <p className="empty">No se pudieron cargar tus planes. Probá recargar.</p>
        ) : plans.length === 0 ? (
          <p className="empty">Todavía no armaste ningún plan.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Cuándo</th><th>Ciudad</th><th>Qué hacer</th><th>Energía</th><th>Cupo</th></tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id}>
                    <td className="date">{formatStartsAt(p.starts_at)}</td>
                    <td>{p.city}</td>
                    <td className="msg">{p.title}</td>
                    <td>{p.energy}</td>
                    <td>{p.spots}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
