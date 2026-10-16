import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { safeNext } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Hap — Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const notice = error === "confirm" ? "El link de confirmación no es válido o ya venció." : "";
  return <AuthForm mode="login" next={safeNext(next)} notice={notice} />;
}
