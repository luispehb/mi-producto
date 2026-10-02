"use client";

import { useFormSubmit } from "./useFormSubmit";

const messages = { ok: "¡Listo! Te avisamos cuando Hap llegue a tu ciudad.", duplicate: "¡Ya estabas en la lista!" };

export default function SignupForm({ variant }: { variant: "inline" | "card" }) {
  const { sending, status, onSubmit } = useFormSubmit(
    "/api/signup",
    fd => ({ email: String(fd.get("email") ?? "").trim().toLowerCase() }),
    messages,
  );

  const statusEl = <p className={status.error ? "form-status error" : "form-status"} aria-live="polite">{status.text}</p>;

  if (variant === "inline") {
    return (
      <div>
        <form className="waitlist-inline js-signup" onSubmit={onSubmit}>
          <input type="email" name="email" placeholder="tu@email.com" aria-label="Email" maxLength={254} required />
          <button className="btn btn-primary" type="submit" disabled={sending}>Unirme</button>
        </form>
        {statusEl}
      </div>
    );
  }

  return (
    <>
      <form className="waitlist-form js-signup" onSubmit={onSubmit}>
        <input type="email" name="email" placeholder="tu@email.com" aria-label="Email" maxLength={254} required />
        <button type="submit" disabled={sending}>Sumarme</button>
      </form>
      {statusEl}
    </>
  );
}
