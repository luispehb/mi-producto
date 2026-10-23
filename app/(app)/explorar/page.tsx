import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import { formatDay, type CurrentCity } from "@/lib/current-city";
import { parseExploreQuery, type ExplorePlan } from "@/lib/explore";
import { dateParts } from "@/lib/plans";
import LogoutButton from "@/components/LogoutButton";
import VisitTracker from "@/components/VisitTracker";
import ExploreFilters from "@/components/ExploreFilters";
import PlanCard from "@/components/PlanCard";

export const metadata: Metadata = { title: "Hap — Explorar planes" };

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/explorar");

  const db = await supabaseUser();
  // Con la sesión del usuario: el RLS deja ver solo su ciudad actual, que da los valores por defecto
  const { data: currentRow, error: currentError } = await db.from("current_cities")
    .select("city, country, arrived_on, leaves_on")
    .maybeSingle();
  if (currentError) console.error("current_cities select", currentError);
  const current = (currentRow ?? null) as CurrentCity | null;

  const query = parseExploreQuery(await searchParams, current);

  // explore_plans() devuelve planes de todos sin datos del creador, y aplica el tope de 7 días
  let plans: ExplorePlan[] = [];
  let error = false;
  if (query && !query.error) {
    const res = await db.rpc("explore_plans", { p_city: query.city, p_from: query.from, p_to: query.to });
    if (res.error) console.error("explore_plans", res.error);
    error = Boolean(res.error);
    plans = (res.data ?? []) as ExplorePlan[];
  }

  // Agrupados por día (starts_at es hora local de la ciudad)
  const days = new Map<string, ExplorePlan[]>();
  for (const p of plans) days.set(p.starts_at.slice(0, 10), [...(days.get(p.starts_at.slice(0, 10)) ?? []), p]);

  const here = query?.city && query.city === current?.city;

  return (
    <main className="planes">
      <VisitTracker endpoint="/api/app-visit" />
      <div className="topbar planes-topbar">
        <div>
          <span className="eyebrow">Hap</span>
          <h1>Explorar planes</h1>
          <p className="who">{user.email}</p>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-ghost" href="/planes">Mis planes</Link>
          <Link className="btn btn-ghost" href="/ciudad-actual">Mi ciudad</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="planes-layout">
        <section className="panel" aria-label="Buscá planes">
          <div className="panel-head"><h2>¿Dónde y cuándo?</h2></div>
          <ExploreFilters city={query?.city} from={query?.from} to={query?.to} />
          {query?.error && <p className="status" aria-live="polite">{query.error}</p>}
        </section>

        <div className="planes-list">
          {!query ? (
            <div className="planes-empty">
              <h2>Elegí una ciudad para ver qué hay</h2>
              <p>Puede ser donde estás ahora o adonde vas a viajar. <Link href="/ciudad-actual">Contanos dónde estás</Link> y la buscamos sola.</p>
            </div>
          ) : query.error ? null : error ? (
            <p className="empty">No se pudieron cargar los planes. Probá recargar.</p>
          ) : (
            <>
              <p className="who">
                {here ? "Estás acá" : "Para tu próximo viaje"} · {query.city} · del {formatDay(query.from)} al {formatDay(query.to)}
              </p>
              {plans.length === 0 ? (
                <div className="planes-empty">
                  <h2>Todavía no hay planes en {query.city} esos días</h2>
                  <p><Link href="/planes">¿Armás el primero?</Link></p>
                </div>
              ) : (
                [...days].map(([day, list]) => {
                  const d = dateParts(list[0].starts_at);
                  return (
                    <section key={day} className="plan-group">
                      <h2>{d.weekday} {d.day} {d.month}<span className="count">{list.length}</span></h2>
                      {list.map(p => <PlanCard key={p.id} plan={p} readOnly mine={p.mine} />)}
                    </section>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
