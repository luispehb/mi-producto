"use client";

import { useEffect } from "react";

const KEY = "hap_visit_day";

// Avisa al servidor que este visitante entró hoy (una vez por día y pestaña)
export default function VisitTracker() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (sessionStorage.getItem(KEY) === today) return;
    } catch {}
    fetch("/api/visit", { method: "POST", keepalive: true })
      .then(res => {
        if (!res.ok) return;
        try { sessionStorage.setItem(KEY, today); } catch {}
      })
      .catch(() => {});
  }, []);

  return null;
}
