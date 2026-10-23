import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import { cityInfo, dayOffset, formatDay, type CurrentCity } from "@/lib/current-city";
import { MAX_DAYS, parseExploreQuery, type ExplorePlan } from "@/lib/explore";
import { dateParts, ENERGIES } from "@/lib/plans";
import LogoutButton from "@/components/LogoutButton";
import VisitTracker from "@/components/VisitTracker";
import ExploreFilters from "@/components/ExploreFilters";
import ExploreMap from "@/components/ExploreMap";
import PlanCard from "@/components/PlanCard";

export const metadata: Metadata = { title: "Hap — Explorar planes" };

type Params = Record<string, string | string[] | undefined>;

export default async function ExplorarPage({ searchParams }: { searchParams: Promise<Params> }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/explorar");

  const db = await supabaseUser();
  // Con la sesión del usuario: el RLS deja ver solo su ciudad actual, que da los valores por defecto
  const { data: currentRow, error: currentError } = await db.from("current_cities")
    .select("city, country, arrived_on, leaves_on")
    .maybeSingle();
  if (currentError) console.error("current_cities select", currentError);
  const current = (currentRow ?? null) as CurrentCity | null;

  const params = await searchParams;
  const query = parseExploreQuery(params, current);
  const ok = query && !query.error ? query : null;
  const energy = ENERGIES.find(e => e === params.energy);

  // Los planes de la ciudad en toda la ventana (para contar por día) y los conteos por ciudad del mapa.
  // Los dos RPC devuelven planes de todos sin datos del creador y aplican el tope de 7 días.
  const [plansRes, countsRes] = await Promise.all([
    ok ? db.rpc("explore_plans", { p_city: ok.city, p_from: dayOffset(-1), p_to: dayOffset(MAX_DAYS + 1) }) : null,
    db.rpc("explore_city_counts", { p_from: ok?.from ?? dayOffset(-1), p_to: ok?.to ?? dayOffset(MAX_DAYS) }),
  ]);
  if (plansRes?.error) console.error("explore_plans", plansRes.error);
  if (countsRes.error) console.error("explore_city_counts", countsRes.error);
  const error = Boolean(plansRes?.error);
  const all = (plansRes?.data ?? []) as ExplorePlan[];
  const counts = Object.fromEntries(((countsRes.data ?? []) as { city: string; plans: number }[]).map(r => [r.city, Number(r.plans)]));

  const dayOf = (p: ExplorePlan) => p.starts_at.slice(0, 10);
  const inRange = ok ? all.filter(p => dayOf(p) >= ok.from && dayOf(p) <= ok.to) : [];
  const plans = energy ? inRange.filter(p => p.energy === energy) : inRange;

  // Agrupados por día (starts_at es hora local de la ciudad)
  const days = new Map<string, ExplorePlan[]>();
  for (const p of plans) days.set(dayOf(p), [...(days.get(dayOf(p)) ?? []), p]);

  // Links que cambian un filtro y conservan el resto
  const href = (change: { from?: string; to?: string; energy?: string | null }) => {
    const q = new URLSearchParams({ city: ok?.city ?? "" });
    const from = "from" in change ? change.from : (params.from as string | undefined);
    const to = "to" in change ? change.to : (params.to as string | undefined);
    const e = "energy" in change ? change.energy : energy;
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    if (e) q.set("energy", e);
    return `/explorar?${q}`;
  };

  const stripDays = Array.from({ length: MAX_DAYS + 1 }, (_, i) => dayOffset(i));
  const singleDay = ok && ok.from === ok.to ? ok.from : null;
  const info = ok ? cityInfo(ok.city) : undefined;
  const here = ok && ok.city === current?.city;

  return (
    <main className="planes explorar">
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

      <section className="explore-hero" aria-label="Buscá planes">
        <ExploreMap city={ok?.city} from={params.from as string | undefined} to={params.to as string | undefined} counts={counts} />
        <div className="map-legend" aria-hidden="true">
          <span><i className="dot has-plans" />Con planes</span>
          <span><i className="dot" />Sin planes todavía</span>
        </div>
      </section>

      <section className="panel explore-filters-panel">
        <ExploreFilters city={query?.city} from={query?.from} to={query?.to} />
        {query?.error && <p className="status" aria-live="polite">{query.error}</p>}
      </section>

      {!query ? (
        <div className="planes-empty">
          <h2>Elegí una ciudad para ver qué hay</h2>
          <p>Tocá una ciudad en el mapa o elegila arriba. <Link href="/ciudad-actual">Contanos dónde estás</Link> y la buscamos sola.</p>
        </div>
      ) : !ok ? null : (
        <>
          <header className="explore-city">
            <span className={here ? "explore-badge here" : "explore-badge"}>{here ? "Estás acá" : "Para tu próximo viaje"}</span>
            <h2>{ok.city}</h2>
            <p className="explore-city-meta">
              {info?.country} · {info?.region}
              <span> · {singleDay ? `el ${formatDay(ok.from)}` : `del ${formatDay(ok.from)} al ${formatDay(ok.to)}`}</span>
            </p>
            <p className="explore-city-count"><strong>{inRange.length}</strong> {inRange.length === 1 ? "plan" : "planes"} esos días</p>
          </header>

          <nav className="chip-row day-strip" aria-label="Elegí el día">
            <Link className={singleDay ? "day-chip" : "day-chip active"} href={href({ from: undefined, to: undefined })} scroll={false}>
              <span className="day-chip-wd">Todos</span><span className="day-chip-d">+{MAX_DAYS}</span>
            </Link>
            {stripDays.map(day => {
              const d = dateParts(`${day}T00:00`);
              const n = all.filter(p => dayOf(p) === day).length;
              return (
                <Link key={day} className={day === singleDay ? "day-chip active" : "day-chip"} href={href({ from: day, to: day })} scroll={false}
                  aria-label={`${d.weekday} ${d.day} ${d.month}: ${n} ${n === 1 ? "plan" : "planes"}`}>
                  <span className="day-chip-wd">{d.weekday}</span>
                  <span className="day-chip-d">{d.day}</span>
                  <span className={n ? "day-chip-n" : "day-chip-n none"}>{n || "·"}</span>
                </Link>
              );
            })}
          </nav>

          <nav className="chip-row" aria-label="Filtrá por energía">
            <Link className={energy ? "energy-chip" : "energy-chip active"} href={href({ energy: null })} scroll={false}>Todas</Link>
            {ENERGIES.map(e => (
              <Link key={e} className={`energy-chip energy-${e}${energy === e ? " active" : ""}`} href={href({ energy: e })} scroll={false}>
                <i aria-hidden="true" />{e}<span className="count">{inRange.filter(p => p.energy === e).length}</span>
              </Link>
            ))}
          </nav>

          {error ? (
            <p className="empty">No se pudieron cargar los planes. Probá recargar.</p>
          ) : plans.length === 0 ? (
            <div className="planes-empty">
              <svg viewBox="0 0 200 200" fill="none" aria-hidden="true">
                <circle cx="70" cy="85" r="34" fill="#ff5a3c" />
                <circle cx="128" cy="118" r="24" fill="#ffc24c" opacity="0.85" />
                <path d="M96 92 L112 108" stroke="#fbf6ec" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
              </svg>
              <h2>{energy ? `Nada ${energy} en ${ok.city} esos días` : `Todavía no hay planes en ${ok.city} esos días`}</h2>
              <p>Sé quien lo arranca: <Link href="/planes">armá el primero</Link> y que se sumen otros viajeros.</p>
            </div>
          ) : (
            <div className="explore-results">
              {[...days].map(([day, list]) => {
                const d = dateParts(list[0].starts_at);
                return (
                  <section key={day} className="plan-group">
                    <h2>{d.weekday} {d.day} {d.month}<span className="count">{list.length}</span></h2>
                    <div className="explore-grid">
                      {list.map(p => <PlanCard key={p.id} plan={p} readOnly mine={p.mine} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
