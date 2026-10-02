"use client";

import { useFormSubmit } from "./useFormSubmit";

export default function FeedbackForm() {
  const { sending, status, onSubmit } = useFormSubmit(
    "/api/feedback",
    fd => ({ message: String(fd.get("message") ?? "").trim(), email: String(fd.get("email") ?? "").trim() || null }),
    { ok: "¡Gracias! Recibimos tu comentario." },
  );

  return (
    <>
      <form className="feedback-form" id="feedbackForm" onSubmit={onSubmit}>
        <textarea name="message" placeholder="Escribí tu comentario…" aria-label="Comentario" maxLength={2000} required></textarea>
        <input type="email" name="email" placeholder="tu@email.com (opcional)" aria-label="Email (opcional)" maxLength={254} />
        <button type="submit" disabled={sending}>Enviar comentario</button>
      </form>
      <p className={status.error ? "form-status error" : "form-status"} aria-live="polite">{status.text}</p>
    </>
  );
}
