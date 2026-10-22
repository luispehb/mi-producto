"use client";

import { useEffect } from "react";

// Avisa al servidor que este visitante entró hoy (una vez por día y pestaña).
// /api/visit registra la landing; /api/app-visit, a los usuarios con sesión.
export default function VisitTracker({ endpoint = "/api/visit" }: { endpoint?: string }) {
  useEffect(() => {
    const key = `hap_visit_day:${endpoint}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (sessionStorage.getItem(key) === today) return;
    } catch {}
    fetch(endpoint, { method: "POST", keepalive: true })
      .then(res => {
        if (!res.ok) return;
        try { sessionStorage.setItem(key, today); } catch {}
      })
      .catch(() => {});
  }, [endpoint]);

  return null;
}
