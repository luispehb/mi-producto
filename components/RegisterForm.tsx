"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

// Crea la cuenta desde el landing: manda a /api/auth/registro, el navegador no habla con Supabase
export default function RegisterForm({ variant }: { variant: "inline" | "card" }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    setStatus({ text: "Creando tu cuenta…", error: false });
    let result: { ok?: boolean; confirm?: boolean; error?: string } | null = null;
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
      });
      result = await res.json().catch(() => null);
    } catch (err) {
      console.error(err);
    }
    setSending(false);
    if (result?.ok) {
      router.push("/planes");
      router.refresh();
    } else if (result?.confirm) {
      form.reset();
      setStatus({ text: "Te mandamos un email para confirmar la cuenta. Abrí el link y vas a entrar.", error: false });
    } else {
      setStatus({ text: result?.error ?? "No se pudo crear la cuenta, probá de nuevo.", error: true });
    }
  }

  const fields = (
    <>
      <input type="email" name="email" placeholder="tu@email.com" aria-label="Email" autoComplete="username" maxLength={254} required />
      <input type="password" name="password" placeholder="Contraseña (mínimo 6)" aria-label="Contraseña" autoComplete="new-password" minLength={6} maxLength={72} required />
    </>
  );
  const statusEl = <p className={status.error ? "form-status error" : "form-status"} aria-live="polite">{status.text}</p>;

  if (variant === "inline") {
    return (
      <div>
        <form className="waitlist-inline" onSubmit={onSubmit}>
          {fields}
          <button className="btn btn-primary" type="submit" disabled={sending}>Crear cuenta</button>
        </form>
        {statusEl}
      </div>
    );
  }

  return (
    <>
      <form className="waitlist-form" onSubmit={onSubmit}>
        {fields}
        <button type="submit" disabled={sending}>Crear mi cuenta</button>
      </form>
      {statusEl}
    </>
  );
}
