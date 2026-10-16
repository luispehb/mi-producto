import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";

const COOKIE = "hap_vid";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Una fila por visitante por día. El id vive en una cookie httpOnly que pone el
// servidor: el navegador no elige qué visitor_id registra.
export async function POST() {
  const store = await cookies();
  let visitorId = store.get(COOKIE)?.value ?? "";
  if (!UUID_RE.test(visitorId)) {
    visitorId = crypto.randomUUID();
    store.set(COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // El día lo pone la base (UTC); si ya hay fila para hoy no hace nada
  const { error } = await supabaseAdmin().from("visits")
    .upsert({ visitor_id: visitorId }, { onConflict: "visitor_id,day", ignoreDuplicates: true });

  if (error) {
    console.error("visit insert", error);
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
