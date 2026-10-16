import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { safeNext } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Hap — Crear cuenta" };

export default async function RegistroPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Una cuenta nueva nunca es admin: después del registro va a la app, no al panel
  const target = safeNext(await searchParams.then(p => p.next));
  return <AuthForm mode="registro" next={target === "/admin" || target.startsWith("/admin/") ? "/planes" : target} />;
}
