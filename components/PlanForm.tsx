"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CITIES, ENERGIES, SPOTS_MAX, SPOTS_MIN, toInputValue, type Energy, type Plan } from "@/lib/plans";

// Crea (sin plan) o edita (con plan) por /api/planes: el navegador no habla con Supabase
export default function PlanForm({ plan, onDone, onCancel }: { plan?: Plan; onDone?: () => void; onCancel?: () => void }) {
  const router = useRouter();
  const uid = useId();
  const editing = Boolean(plan);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });
  const [energy, setEnergy] = useState<Energy | "">(plan?.energy ?? "");
  const [spots, setSpots] = useState(plan?.spots ?? 3);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!energy) {
      setStatus({ text: "Elegí la energía del plan.", error: true });
      return;
    }
    setSending(true);
    setStatus({ text: "", error: false });
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch(editing ? `/api/planes/${plan!.id}` : "/api/planes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(fd), energy, spots }),
      });
      result = await res.json().catch(() => null);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
    if (result?.ok) {
      if (!editing) {
        form.reset();
        setEnergy("");
        setSpots(3);
        setStatus({ text: "¡Listo! Tu plan quedó armado.", error: false });
      }
      router.refresh();
      onDone?.();
    } else {
      setStatus({ text: result?.error ?? "No se pudo guardar, probá de nuevo.", error: true });
    }
  }

  const clampSpots = (n: number) => Math.min(SPOTS_MAX, Math.max(SPOTS_MIN, n));

  return (
    <form className="plan-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Ciudad</span>
        <input name="city" placeholder="Lisboa" list={`${uid}-cities`} defaultValue={plan?.city}
          minLength={2} maxLength={60} autoComplete="off" enterKeyHint="next" required />
        <datalist id={`${uid}-cities`}>
          {CITIES.map(c => <option key={c} value={c} />)}
        </datalist>
      </label>

      <label className="field">
        <span>Qué hacer</span>
        <input name="title" placeholder="Atardecer y vinos en Alfama" defaultValue={plan?.title}
          minLength={3} maxLength={120} enterKeyHint="next" required />
      </label>

      <label className="field">
        <span>Fecha y hora</span>
        <input type="datetime-local" name="starts_at" defaultValue={plan ? toInputValue(plan.starts_at) : undefined}
          // El mínimo se pone al enfocar: calcularlo al renderizar no coincide entre servidor y navegador
          onFocus={e => { e.currentTarget.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16); }}
          required />
      </label>

      <fieldset className="field">
        <legend>Energía</legend>
        <div className="energy-picker">
          {ENERGIES.map(e => (
            <label key={e} className={`energy-option energy-${e}`}>
              <input type="radio" name={`${uid}-energy`} value={e} checked={energy === e} onChange={() => setEnergy(e)} />
              <span><i aria-hidden="true" />{e}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <span id={`${uid}-spots`}>Cupo · personas que buscás sumar</span>
        <div className="stepper" role="group" aria-labelledby={`${uid}-spots`}>
          <button type="button" onClick={() => setSpots(s => clampSpots(s - 1))} disabled={spots <= SPOTS_MIN} aria-label="Una persona menos">−</button>
          <input type="number" inputMode="numeric" min={SPOTS_MIN} max={SPOTS_MAX} value={spots} aria-labelledby={`${uid}-spots`}
            onChange={e => setSpots(clampSpots(Number(e.target.value) || SPOTS_MIN))} />
          <button type="button" onClick={() => setSpots(s => clampSpots(s + 1))} disabled={spots >= SPOTS_MAX} aria-label="Una persona más">+</button>
        </div>
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? "Guardando…" : editing ? "Guardar cambios" : "Armar plan"}
        </button>
        {onCancel && <button className="btn btn-ghost" type="button" onClick={onCancel}>Cancelar</button>}
      </div>
      <p className={status.error ? "status" : "status ok"} aria-live="polite">{status.text}</p>
    </form>
  );
}
