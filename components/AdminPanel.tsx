"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Signup = { email: string; created_at: string };
type Feedback = { message: string; email: string | null; created_at: string };
type Data = { signups: Signup[]; feedback: Feedback[] } | "error" | null;

// Supabase devuelve como máximo 1000 filas por consulta: pedimos de a páginas
async function fetchAll<T>(table: string, cols: string): Promise<T[]> {
  const db = supabaseBrowser();
  const pageSize = 1000, rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db.from(table).select(cols)
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (data.length < pageSize) return rows;
  }
}

const fmtDate = (iso: string) => new Date(iso).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });

// CSV: comillas escapadas y sin fórmulas al abrirlo en Excel/Sheets
function csvCell(value: unknown) {
  let v = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(v)) v = "'" + v;
  return '"' + v.replace(/"/g, '""') + '"';
}

function downloadCsv(signups: Signup[]) {
  const lines = [["email", "created_at"], ...signups.map(r => [r.email, r.created_at])]
    .map(row => row.map(csvCell).join(","));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `signups-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Los datos vienen de visitantes: React los escapa como texto
function EmptyRow({ colSpan, text = "Todavía no hay nada." }: { colSpan: number; text?: string }) {
  return <tr><td colSpan={colSpan} className="empty">{text}</td></tr>;
}

export default function AdminPanel() {
  const [view, setView] = useState<"loading" | "login" | "dashboard">("loading");
  const [loginStatus, setLoginStatus] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Data>(null);

  useEffect(() => {
    const db = supabaseBrowser();

    function showLogin(message = "") {
      setData(null);
      setUser(null);
      setView("login");
      setLoginStatus(message);
    }

    async function showDashboard(u: User) {
      // ¿Este usuario está en la lista de admins?
      const { data: admin, error } = await db.from("admins").select("user_id").eq("user_id", u.id).maybeSingle();
      if (error || !admin) {
        await db.auth.signOut();
        showLogin("Esta cuenta no tiene acceso.");
        return;
      }
      setUser(u);
      setView("dashboard");
      try {
        const [signups, feedback] = await Promise.all([
          fetchAll<Signup>("signups", "email, created_at"),
          fetchAll<Feedback>("feedback", "message, email, created_at"),
        ]);
        setData({ signups, feedback });
      } catch (err) {
        console.error(err);
        setData("error");
      }
    }

    // Mantiene la sesión al recargar y alterna entre login y datos
    const { data: { subscription } } = db.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;
      // diferido: no llamar a Supabase dentro del propio callback
      setTimeout(() => session ? showDashboard(session.user) : showLogin(), 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSigningIn(true);
    setLoginStatus("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({
      email: String(fd.get("email") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    });
    setSigningIn(false);
    if (error) { setLoginStatus("Email o contraseña incorrectos."); return; }
    form.reset();
  }

  const loaded = data && data !== "error" ? data : null;

  return (
    <main>
      {/* Sin sesión: solo el login */}
      <form className="login" id="loginView" hidden={view !== "login"} onSubmit={onLogin}>
        <span className="eyebrow">Hap · Admin</span>
        <h1>Entrar</h1>
        <input type="email" name="email" placeholder="Email" aria-label="Email" autoComplete="username" required />
        <input type="password" name="password" placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password" required />
        <button className="btn btn-primary" type="submit" disabled={signingIn}>Iniciar sesión</button>
        <p className="status" id="loginStatus" aria-live="polite">{loginStatus}</p>
      </form>

      {/* Con sesión de admin: los datos */}
      <div id="dashboard" hidden={view !== "dashboard"}>
        <div className="topbar">
          <div>
            <span className="eyebrow">Hap · Admin</span>
            <h1>Lista de espera y comentarios</h1>
            <p className="who" id="whoami">{user?.email}</p>
          </div>
          <button className="btn btn-ghost" id="logout" type="button" onClick={() => supabaseBrowser().auth.signOut()}>Cerrar sesión</button>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2>Signups<span className="count" id="signupsCount">{loaded ? `(${loaded.signups.length})` : ""}</span></h2>
            <button className="btn btn-primary" id="downloadCsv" type="button" onClick={() => downloadCsv(loaded?.signups ?? [])}>Descargar CSV</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Email</th><th>Fecha</th></tr></thead>
              <tbody id="signupsBody">
                {data === "error" && <EmptyRow colSpan={2} text="No se pudieron cargar los datos." />}
                {loaded && !loaded.signups.length && <EmptyRow colSpan={2} />}
                {loaded?.signups.map((r, i) => (
                  <tr key={i}><td className="email">{r.email}</td><td className="date">{fmtDate(r.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Feedback<span className="count" id="feedbackCount">{loaded ? `(${loaded.feedback.length})` : ""}</span></h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Comentario</th><th>Email</th><th>Fecha</th></tr></thead>
              <tbody id="feedbackBody">
                {loaded && !loaded.feedback.length && <EmptyRow colSpan={3} />}
                {loaded?.feedback.map((r, i) => (
                  <tr key={i}><td className="msg">{r.message}</td><td className="email">{r.email || "—"}</td><td className="date">{fmtDate(r.created_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
