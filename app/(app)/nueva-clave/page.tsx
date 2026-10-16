import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Hap — Contraseña nueva" };

// Se llega desde el link del email, que ya abrió la sesión en /auth/confirm
export default async function NuevaClavePage() {
  const user = await getUser();
  if (!user) redirect("/olvide");
  return <AuthForm mode="nueva-clave" notice={`Elegí una contraseña nueva para ${user.email}.`} />;
}
