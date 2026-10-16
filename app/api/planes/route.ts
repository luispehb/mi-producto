import { getUser, supabaseUser } from "@/lib/supabase-server";
import { ENERGIES } from "@/lib/plans";

// Fecha y hora local del plan, como la manda <input type="datetime-local">
const LOCAL_DT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseStartsAt(value: unknown) {
  if (typeof value !== "string") return null;
  const m = LOCAL_DT_RE.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h, mi));
  // Descarta fechas que no existen (31 de febrero, 25:00, etc.)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || dt.getUTCHours() !== h || dt.getUTCMinutes() !== mi) return null;
  return { value, day: value.slice(0, 10) };
}

const text = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Iniciá sesión para armar un plan." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const city = text(body?.city);
  const title = text(body?.title);
  const startsAt = parseStartsAt(body?.starts_at);
  const energy = ENERGIES.find(e => e === body?.energy);
  const spots = Number(body?.spots);

  if (city.length < 2 || city.length > 60) return Response.json({ error: "Poné una ciudad (2 a 60 letras)." }, { status: 400 });
  if (title.length < 3 || title.length > 120) return Response.json({ error: "Contá qué quieren hacer (3 a 120 letras)." }, { status: 400 });
  if (!startsAt) return Response.json({ error: "Elegí fecha y hora." }, { status: 400 });
  // La hora es local de la ciudad: comparamos solo el día, con un día de margen por las zonas horarias
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (startsAt.day < yesterday) return Response.json({ error: "La fecha ya pasó." }, { status: 400 });
  if (!energy) return Response.json({ error: "Elegí la energía del plan." }, { status: 400 });
  if (!Number.isInteger(spots) || spots < 1 || spots > 20) return Response.json({ error: "El cupo va de 1 a 20 personas." }, { status: 400 });

  const { error } = await (await supabaseUser()).from("plans").insert({
    user_id: user.id, city, title, starts_at: startsAt.value, energy, spots,
  });
  if (error) {
    console.error("plans insert", error);
    return Response.json({ error: "No se pudo guardar, probá de nuevo." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
