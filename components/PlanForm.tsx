"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ENERGIES } from "@/lib/plans";

// Manda el plan a /api/planes: el navegador no habla con Supabase
export default function PlanForm() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    setStatus("");
    let result: { ok?: boolean; error?: string } | null = null;
    try {
      const res = await fetch("/api/planes", {
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
      form.reset();
      setStatus("¡Listo! Tu plan quedó armado.");
      router.refresh();
    } else {
      setStatus(result?.error ?? "No se pudo guardar, probá de nuevo.");
    }
  }

  return (
    <form className="plan-form" onSubmit={onSubmit}>
      <label>
        Ciudad
        <input name="city" placeholder="Lisboa" minLength={2} maxLength={60} required />
      </label>
      <label className="wide">
        Qué hacer
        <input name="title" placeholder="Atardecer y vinos en Alfama" minLength={3} maxLength={120} required />
      </label>
      <label>
        Fecha y hora
        <input type="datetime-local" name="starts_at" required />
      </label>
      <label>
        Energía
        <select name="energy" defaultValue="" required>
          <option value="" disabled>Elegí</option>
          {ENERGIES.map(e => <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>)}
        </select>
      </label>
      <label>
        Cupo
        <input type="number" name="spots" min={1} max={20} defaultValue={3} required />
      </label>
      <button className="btn btn-primary" type="submit" disabled={sending}>Armar plan</button>
      <p className="status" aria-live="polite">{status}</p>
    </form>
  );
}
