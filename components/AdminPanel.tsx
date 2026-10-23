"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { dateParts } from "@/lib/plans";

type Signup = { email: string; created_at: string };
type Feedback = { message: string; email: string | null; created_at: string };
type PlanRow = { city: string; title: string; starts_at: string; energy: string; spots: number; created_at: string; email: string | null };
type Data = { signups: Signup[]; feedback: Feedback[]; plans: PlanRow[] } | "error" | null;

const fmtDate = (iso: string) => new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });

// starts_at es hora local de la ciudad, sin zona: se muestra tal cual
function fmtPlanDate(startsAt: string) {
  const d = dateParts(startsAt);
  return `${d.day} ${d.month} ${startsAt.slice(0, 4)} · ${d.time}`;
}

// CSV: comillas escapadas y sin fórmulas al abrirlo en Excel/Sheets
function csvCell(value: unknown) {
  let v = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replace(/"/g, '""') + '"';
}

function downloadCsv(signups: Signup[]) {
  const lines = [["email", "created_at"], ...signups.map(r => [r.email, r.created_at])]
    .map(row => row.map(csvCell).join(","));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Los datos vienen de visitantes: React los escapa como texto
function EmptyRow({ colSpan, text = "Todavía no hay nada." }: { colSpan: number; text?: string }) {
  return <tr><td colSpan={colSpan} className="empty">{text}</td></tr>;
}

// La página ya chequeó ADMIN_EMAILS; /api/admin/data lo vuelve a chequear
export default function AdminPanel({ email }: { email: string }) {
  const [data, setData] = useState<Data>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/data", { cache: "no-store" })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then(d => { if (!cancelled) setData(d); })
      .catch(err => { console.error(err); if (!cancelled) setData("error"); });
    return () => { cancelled = true; };
  }, []);

  const loaded = data && data !== "error" ? data : null;

  return (
    <main>
      {/* Con sesión de admin: los datos */}
      <div id="dashboard">
        <div className="topbar">
          <div>
            <span className="eyebrow">Hap · Admin</span>
            <h1>Lista de espera, planes y comentarios</h1>
            <p className="who" id="whoami">{email}</p>
          </div>
          <div className="topbar-actions">
            <Link className="btn btn-primary" href="/admin/metricas">Métricas</Link>
            <LogoutButton />
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Signups<span className="count" id="signupsCount">{loaded ? `(${loaded.signups.length})` : ""}</span></h2>
            <button className="btn btn-primary" id="downloadCsv" type="button" onClick={() => downloadCsv(loaded?.signups ?? [])}>Descargar CSV</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
              <tbody id="signupsBody">
                {data === "error" && <EmptyRow colSpan={2} text="No se pudieron cargar los datos." />}
                {loaded && !loaded.signups.length && <EmptyRow colSpan={2} />}
                {loaded?.signups.map((r, i) => (
                  <tr key={i}><td className="email">{r.email}</td><td className="date">{fmtDate(r.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Planes<span className="count">{loaded ? `(${loaded.plans.length})` : ""}</span></h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ciudad</th><th>Qué hacer</th><th>Fecha</th><th>Energía</th><th>Cupo</th><th>Creador</th><th>Creado</th></tr></thead>
              <tbody>
                {data === "error" && <EmptyRow colSpan={7} text="No se pudieron cargar los datos." />}
                {loaded && !loaded.plans.length && <EmptyRow colSpan={7} />}
                {loaded?.plans.map((r, i) => (
                  <tr key={i}>
                    <td>{r.city}</td><td className="msg">{r.title}</td><td className="date">{fmtPlanDate(r.starts_at)}</td>
                    <td>{r.energy}</td><td>{r.spots}</td><td className="email">{r.email || "—"}</td><td className="date">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Feedback<span className="count" id="feedbackCount">{loaded ? `(${loaded.feedback.length})` : ""}</span></h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Comentario</th><th>Email</th><th>Fecha</th></tr></thead>
              <tbody id="feedbackBody">
                {loaded && !loaded.feedback.length && <EmptyRow colSpan={3} />}
                {loaded?.feedback.map((r, i) => (
                  <tr key={i}><td className="msg">{r.message}</td><td className="email">{r.email || "—"}</td><td className="date">{fmtDate(r.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
