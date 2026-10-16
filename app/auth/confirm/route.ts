import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseUser, safeNext } from "@/lib/supabase-server";

const OTP_TYPES: EmailOtpType[] = ["signup", "recovery", "email", "invite", "magiclink", "email_change"];

// Links de los emails de Supabase: confirmación de cuenta y recuperar contraseña.
// token_hash (plantilla de email propia) funciona en cualquier navegador;
// code (PKCE, plantilla por defecto) solo en el navegador donde se pidió el link.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next") ?? (type === "recovery" ? "/nueva-clave" : null));
  const supabase = await supabaseUser();

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(next, url));
    console.error("verifyOtp", error);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url));
    console.error("exchangeCodeForSession", error);
  }
  return NextResponse.redirect(new URL("/login?error=confirm", url));
}
