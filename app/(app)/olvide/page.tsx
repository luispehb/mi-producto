import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Hap — Recuperar contraseña" };

export default function OlvidePage() {
  return <AuthForm mode="olvide" />;
}
