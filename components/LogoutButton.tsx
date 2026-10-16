"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  const [sending, setSending] = useState(false);

  async function onClick() {
    setSending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    router.replace("/login");
    router.refresh();
  }

  return <button className="btn btn-ghost" type="button" onClick={onClick} disabled={sending}>Cerrar sesión</button>;
}
