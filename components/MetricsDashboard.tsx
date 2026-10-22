"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Week = { week: string; new_users: number; active_users: number };
type Metrics = {
  users: number; activated: number; returning: number;
  first_day_plan: number; second_plan: number; plans: number; plans_soon: number;
  waitlist: number; waitlist_users: number;
  weekly: Week[];
};
type State =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "forbidden" }
  | { kind: "error" }
  | { kind: "ready"; metrics: Metrics };

const pct = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : "—");

// "2026-10-12" → "12 oct" (sin pasar por la zona horaria del navegador)
const fmtWeek = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es", { day: "numeric", month: "short", timeZone: "UTC" });
};

// La página ya chequeó ADMIN_EMAILS; /api/admin/metrics lo vuelve a chequear
export default function MetricsDashboard({ email }: { email: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/metrics", { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 401) return setState({ kind: "login" });
        if (res.status === 403) return setState({ kind: "forbidden" });
        if (!res.ok) return setState({ kind: "error" });
        setState({ kind: "ready", metrics: await res.json() });
      } catch (err) {
        console.error(err);
        if (!cancelled) setState({ kind: "error" });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.kind !== "ready") {
    const text = {
      loading: "Cargando métricas…",
      login: "Iniciá sesión en el panel para ver las métricas.",
      forbidden: "Esta cuenta no tiene acceso.",
      error: "No se pudieron cargar las métricas.",
    }[state.kind];
    return (
      <main>
        <div className="login">
          <span className="eyebrow">Hap · Admin</span>
          <h1>Métricas</h1>
          <p className="empty" aria-live="polite">{text}</p>
          {state.kind !== "loading" && <Link className="btn btn-primary" href="/admin">Ir al panel</Link>}
        </div>
      </main>
    );
  }

  const m = state.metrics;
  return (
    <main>
      <div className="topbar">
        <div>
          <span className="eyebrow">Hap · Admin</span>
          <h1>Métricas</h1>
          <p className="who">{email}</p>
        </div>
        <Link className="btn btn-ghost" href="/admin">← Panel</Link>
      </div>

      <div className="stats">
        <Stat label="Registrados" value={String(m.users)} note="cuentas creadas en la app" />
        <Stat label="Activación" value={pct(m.activated, m.users)} note={`${m.activated} de ${m.users} crearon al menos un plan`} />
        <Stat label="Retorno" value={pct(m.returning, m.users)} note={`${m.returning} de ${m.users} entraron a la app en 2+ días`} />
      </div>

      <div className="stats">
        <Stat label="Plan el primer día" value={pct(m.first_day_plan, m.users)} note={`${m.first_day_plan} de ${m.users} crearon su primer plan el día que se registraron`} />
        <Stat label="Segundo plan" value={pct(m.second_plan, m.activated)} note={`${m.second_plan} de ${m.activated} activados crearon planes en 2+ días`} />
        <Stat label="Planes para ya" value={pct(m.plans_soon, m.plans)} note={`${m.plans_soon} de ${m.plans} planes son para los próximos 7 días`} />
        <Stat label="Lista → cuenta" value={pct(m.waitlist_users, m.waitlist)} note={`${m.waitlist_users} de ${m.waitlist} emails de la lista de espera crearon cuenta`} />
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Por semana</h2>
          <div className="legend">
            <span><i className="sw sw-new" /> Usuarios nuevos</span>
            <span><i className="sw sw-visit" /> Entraron a la app</span>
          </div>
        </div>
        <WeeklyChart weeks={m.weekly} />
      </section>
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="panel stat">
      <span className="eyebrow">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-note">{note}</span>
    </div>
  );
}

function WeeklyChart({ weeks }: { weeks: Week[] }) {
  const W = 720, H = 260, left = 36, right = 8, top = 12, bottom = 28;
  const plotW = W - left - right, plotH = H - top - bottom;
  const max = Math.max(1, ...weeks.flatMap(w => [w.new_users, w.active_users]));
  // Eje Y con 4 marcas redondas
  const step = Math.max(1, Math.ceil(max / 4));
  const yMax = step * 4;
  const y = (v: number) => top + plotH - (v / yMax) * plotH;
  const group = plotW / Math.max(1, weeks.length);
  const bar = Math.min(18, group * 0.34);

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Usuarios nuevos y usuarios que entraron a la app por semana">
        {[0, 1, 2, 3, 4].map(i => (
          <g key={i}>
            <line x1={left} x2={W - right} y1={y(step * i)} y2={y(step * i)} className="grid" />
            <text x={left - 8} y={y(step * i)} className="tick" textAnchor="end" dominantBaseline="middle">{step * i}</text>
          </g>
        ))}
        {weeks.map((w, i) => {
          const cx = left + group * i + group / 2;
          const label = `Semana del ${fmtWeek(w.week)}: ${w.new_users} nuevos, ${w.active_users} entraron a la app`;
          return (
            <g key={w.week}>
              <title>{label}</title>
              <rect x={cx - bar - 1} y={y(w.new_users)} width={bar} height={plotH + top - y(w.new_users)} rx={3} className="bar-new" />
              <rect x={cx + 1} y={y(w.active_users)} width={bar} height={plotH + top - y(w.active_users)} rx={3} className="bar-visit" />
              {(weeks.length <= 8 || i % 2 === weeks.length % 2) && (
                <text x={cx} y={H - 8} className="tick" textAnchor="middle">{fmtWeek(w.week)}</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
