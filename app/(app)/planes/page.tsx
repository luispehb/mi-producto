import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import { isPast, type Plan } from "@/lib/plans";
import LogoutButton from "@/components/LogoutButton";
import VisitTracker from "@/components/VisitTracker";
import NewPlanPanel from "@/components/NewPlanPanel";
import PlanCard from "@/components/PlanCard";

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
  const upcoming = plans.filter(p => !isPast(p.starts_at));
  // Los que ya pasaron, del más reciente al más viejo
  const past = plans.filter(p => isPast(p.starts_at)).reverse();

  return (
    <main className="planes">
      <VisitTracker endpoint="/api/app-visit" />
      <div className="topbar planes-topbar">
        <div>
          <span className="eyebrow">Hap</span>
          <h1>Mis planes</h1>
          <p className="who">{user.email}</p>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-ghost" href="/explorar">Explorar</Link>
          <Link className="btn btn-ghost" href="/ciudad-actual">Mi ciudad</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="planes-layout">
        <NewPlanPanel startOpen={!error && plans.length === 0} />

        <div className="planes-list">
          {error ? (
            <p className="empty">No se pudieron cargar tus planes. Probá recargar.</p>
          ) : plans.length === 0 ? (
            <div className="planes-empty">
              <svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
                <circle cx="70" cy="85" r="34" fill="#ff5a3c" />
                <circle cx="128" cy="118" r="24" fill="#ffc24c" opacity="0.85" />
                <path d="M96 92 L112 108" stroke="#fbf6ec" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              </svg>
              <h2>Tu primer plan está a un minuto</h2>
              <p>Contá dónde estás, qué te gustaría hacer y cuándo. Del &quot;hola&quot; al plan, sin vueltas.</p>
            </div>
          ) : (
            <>
              <section className="plan-group">
                <h2>Próximos<span className="count">{upcoming.length}</span></h2>
                {upcoming.length === 0
                  ? <p className="empty">No tenés planes por delante. ¿Armamos uno?</p>
                  : upcoming.map(p => <PlanCard key={p.id} plan={p} />)}
              </section>
              {past.length > 0 && (
                <section className="plan-group">
                  <h2>Ya pasaron<span className="count">{past.length}</span></h2>
                  {past.map(p => <PlanCard key={p.id} plan={p} past />)}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
