"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cityInfo, formatDay, type CurrentCity } from "@/lib/current-city";

// Tarjeta de la ciudad actual: se ve y se borra con confirmación
export default function CurrentCityCard({ current }: { current: CurrentCity }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function onDelete() {
    setDeleting(true);
    setError("");
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch("/api/ciudad-actual", { method: "DELETE" });
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

  return (
    <article className="plan-card">
      <div className="plan-info">
        <h3>{current.city}</h3>
        <p className="plan-when city-when">
          Desde el {formatDay(current.arrived_on)}
          {current.leaves_on ? ` · hasta el ${formatDay(current.leaves_on)}` : " · sin fecha de salida"}
        </p>
        <div className="plan-tags">
          <span className="tag">{current.country}</span>
          <span className="tag">{cityInfo(current.city)?.region}</span>
        </div>
      </div>

      <div className="plan-card-foot">
        {confirming ? (
          <>
            <span className="confirm-text">¿Ya no estás en {current.city}?</span>
            <button className="btn btn-danger" type="button" onClick={onDelete} disabled={deleting}>{deleting ? "Borrando…" : "Sí, borrar"}</button>
            <button className="btn btn-ghost" type="button" onClick={() => setConfirming(false)} disabled={deleting}>No</button>
          </>
        ) : (
          <button className="btn btn-ghost" type="button" onClick={() => setConfirming(true)}>Ya no estoy acá</button>
        )}
      </div>
      {error && <p className="status" aria-live="polite">{error}</p>}
    </article>
  );
}
