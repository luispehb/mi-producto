import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, supabaseUser } from "@/lib/supabase-server";
import type { CurrentCity } from "@/lib/current-city";
import LogoutButton from "@/components/LogoutButton";
import CurrentCityCard from "@/components/CurrentCityCard";
import CurrentCityForm from "@/components/CurrentCityForm";

export const metadata: Metadata = { title: "Hap — Mi ciudad actual" };

export default async function CiudadActualPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/ciudad-actual");

  // Con la sesión del usuario: el RLS deja ver solo su fila
  const { data, error } = await (await supabaseUser()).from("current_cities")
    .select("city, country, arrived_on, leaves_on")
    .maybeSingle();
  if (error) console.error("current_cities select", error);
  const current = (data ?? null) as CurrentCity | null;

  return (
    <main className="planes">
      <div className="topbar planes-topbar">
        <div>
          <span className="eyebrow">Hap</span>
          <h1>Mi ciudad actual</h1>
          <p className="who">{user.email}</p>
        </div>
        <div className="topbar-actions">
          <Link className="btn btn-ghost" href="/planes">Mis planes</Link>
          <LogoutButton />
        </div>
      </div>

      <div className="planes-layout">
        <section className="panel" aria-label={current ? "Cambiá tu ciudad" : "Contá dónde estás"}>
          <div className="panel-head"><h2>{current ? "Cambiá tu ciudad" : "¿Dónde estás?"}</h2></div>
          <CurrentCityForm current={current} />
        </section>

        <div className="planes-list">
          {error ? (
            <p className="empty">No se pudo cargar tu ciudad. Probá recargar.</p>
          ) : current ? (
            <section className="plan-group">
              <h2>Estás en</h2>
              <CurrentCityCard current={current} />
            </section>
          ) : (
            <div className="planes-empty">
              <h2>Todavía no sabemos dónde estás</h2>
              <p>Elegí tu ciudad y desde cuándo estás ahí, así te conectamos con viajeros cerca.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
