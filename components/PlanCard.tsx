"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dateParts, type Plan } from "@/lib/plans";
import PlanForm from "./PlanForm";

type Mode = "view" | "edit" | "confirm";

// Tarjeta de un plan: se ve, se edita en el lugar y se borra con confirmación
export default function PlanCard({ plan, past = false }: { plan: Plan; past?: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("view");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const d = dateParts(plan.starts_at);

  async function onDelete() {
    setDeleting(true);
    setError("");
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch(`/api/planes/${plan.id}`, { method: "DELETE" });
      result = await res.json().catch(() => null);
    } catch (err) {
      console.error(err);
    }
    if (result?.ok) {
      router.refresh();
      return;
    }
    setDeleting(false);
    setError(result?.error ?? "No se pudo borrar, probá de nuevo.");
  }

  if (mode === "edit") {
    return (
      <article className="plan-card editing">
        <h3 className="plan-card-edit-title">Editar plan</h3>
        <PlanForm plan={plan} onDone={() => setMode("view")} onCancel={() => setMode("view")} />
      </article>
    );
  }

  return (
    <article className={past ? "plan-card past" : "plan-card"}>
      <div className="plan-card-main">
        <div className="plan-date" aria-hidden="true">
          <span className="plan-date-day">{d.day}</span>
          <span className="plan-date-month">{d.month}</span>
        </div>
        <div className="plan-info">
          <h3>{plan.title}</h3>
          <p className="plan-when">{d.weekday} {d.day} {d.month} · {d.time}</p>
          <div className="plan-tags">
            <span className="tag">{plan.city}</span>
            <span className={`tag energy-tag energy-${plan.energy}`}><i aria-hidden="true" />{plan.energy}</span>
            <span className="tag">Busca {plan.spots} {plan.spots === 1 ? "persona" : "personas"}</span>
          </div>
        </div>
      </div>

      <div className="plan-card-foot">
        {mode === "confirm" ? (
          <>
            <span className="confirm-text">¿Borrar este plan?</span>
            <button className="btn btn-danger" type="button" onClick={onDelete} disabled={deleting}>{deleting ? "Borrando…" : "Sí, borrar"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setMode("view")} disabled={deleting}>No</button>
          </>
        ) : (
          <>
            {!past && <button className="btn btn-ghost" type="button" onClick={() => setMode("edit")}>Editar</button>}
            <button className="btn btn-ghost" type="button" onClick={() => setMode("confirm")}>Borrar</button>
          </>
        )}
      </div>
      {error && <p className="status" aria-live="polite">{error}</p>}
    </article>
  );
}
