"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { CurrentCity } from "@/lib/current-city";
import CitySelect from "./CitySelect";

// Hoy en la zona del navegador, como lo espera <input type="date">
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

// Carga o cambia la ciudad actual por /api/ciudad-actual: el navegador no habla con Supabase
export default function CurrentCityForm({ current }: { current: CurrentCity | null }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setStatus({ text: "", error: false });
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch("/api/ciudad-actual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(fd)),
      });
      result = await res.json().catch(() => null);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
    if (result?.ok) {
      setStatus({ text: "¡Listo! Ya sabemos dónde estás.", error: false });
      router.refresh();
    } else {
      setStatus({ text: result?.error ?? "No se pudo guardar, probá de nuevo.", error: true });
    }
  }

  return (
    // La key hace que el formulario se rearme con los valores nuevos después de guardar
    <form key={current ? `${current.city}-${current.arrived_on}-${current.leaves_on}` : "nueva"} className="plan-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Ciudad</span>
        <CitySelect defaultValue={current?.city} placeholder="Elegí tu ciudad" />
      </label>

      <label className="field">
        <span>Llegaste el</span>
        <input type="date" name="arrived_on" defaultValue={current?.arrived_on}
          // Los límites se ponen al enfocar: calcularlos al renderizar no coincide entre servidor y navegador
          onFocus={e => { e.currentTarget.max = today(); }}
          required />
      </label>

      <label className="field">
        <span>Te vas el · opcional</span>
        <input type="date" name="leaves_on" defaultValue={current?.leaves_on ?? undefined}
          onFocus={e => { e.currentTarget.min = today(); }} />
      </label>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={sending}>
          {sending ? "Guardando…" : current ? "Cambiar ciudad" : "Guardar ciudad"}
        </button>
      </div>
      <p className={status.error ? "status" : "status ok"} aria-live="polite">{status.text}</p>
    </form>
  );
}
