"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "login" | "registro" | "olvide" | "nueva-clave";

type Copy = {
  title: string;
  submit: string;
  email: boolean;
  password?: "current-password" | "new-password";
  links: { text: string; href: string; keepNext?: boolean }[];
};

const COPY: Record<Mode, Copy> = {
  login: {
    title: "Entrar", submit: "Iniciar sesión", email: true, password: "current-password",
    links: [{ text: "Crear una cuenta", href: "/registro" }, { text: "Olvidé mi contraseña", href: "/olvide" }],
  },
  registro: {
    title: "Crear cuenta", submit: "Registrarme", email: true, password: "new-password",
    links: [{ text: "Ya tengo cuenta", href: "/login", keepNext: true }],
  },
  olvide: {
    title: "Recuperar contraseña", submit: "Mandarme el link", email: true,
    links: [{ text: "Volver a entrar", href: "/login" }],
  },
  "nueva-clave": {
    title: "Contraseña nueva", submit: "Guardar contraseña", email: false, password: "new-password",
    links: [],
  },
};

// Envía los datos a /api/auth/*: el navegador no habla con Supabase
export default function AuthForm({ mode, next = "/planes", notice = "" }: { mode: Mode; next?: string; notice?: string }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(notice);
  const copy = COPY[mode];
  const withNext = (href: string) => (next !== "/planes" ? `${href}?next=${encodeURIComponent(next)}` : href);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSending(true);
    setStatus("");
    let result: { ok?: boolean; confirm?: boolean; sent?: boolean; error?: string } | null = null;
    try {
      const res = await fetch(`/api/auth/${mode}`, {
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
      router.replace(next);
      router.refresh();
    } else if (result?.confirm) {
      setStatus("Te mandamos un email para confirmar la cuenta. Abrí el link y vas a entrar.");
    } else if (result?.sent) {
      form.reset();
      setStatus("Si hay una cuenta con ese email, te mandamos un link. Abrilo en este mismo navegador.");
    } else {
      setStatus(result?.error ?? "No se pudo enviar, probá de nuevo.");
    }
  }

  return (
    <main>
      <form className="login" onSubmit={onSubmit}>
        <span className="eyebrow">Hap</span>
        <h1>{copy.title}</h1>
        {copy.email && <input type="email" name="email" placeholder="Email" aria-label="Email" autoComplete="username" required />}
        {copy.password && (
          <input type="password" name="password" placeholder={copy.password === "new-password" ? "Contraseña (mínimo 6)" : "Contraseña"} aria-label="Contraseña"
            autoComplete={copy.password} minLength={copy.password === "new-password" ? 6 : undefined} required />
        )}
        <button className="btn btn-primary" type="submit" disabled={sending}>{copy.submit}</button>
        {copy.links.map(l => (
          <Link key={l.href} className="btn btn-ghost" href={l.keepNext ? withNext(l.href) : l.href}>{l.text}</Link>
        ))}
        <p className="status" aria-live="polite">{status}</p>
      </form>
    </main>
  );
}
