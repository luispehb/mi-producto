"use client";

import { useState, type FormEvent } from "react";

type Messages = { ok: string; duplicate?: string };

// Equivalente a handleForm del HTML original, pero envía a una ruta del servidor
export function useFormSubmit(endpoint: string, buildBody: (fd: FormData) => object, messages: Messages) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ text: "", error: false });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    setStatus({ text: "Enviando…", error: false });
    let result: { ok?: boolean; duplicate?: boolean } | null = null;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(new FormData(form))),
      });
      result = res.ok ? await res.json() : null;
    } catch (err) {
      console.error(err);
    }
    setSending(false);
    if (result?.ok || result?.duplicate) {
      setStatus({ text: result.duplicate && messages.duplicate ? messages.duplicate : messages.ok, error: false });
      form.reset();
    } else {
      setStatus({ text: "No se pudo enviar, probá de nuevo.", error: true });
    }
  }

  return { sending, status, onSubmit };
}
