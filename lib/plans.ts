// Lo comparten el formulario, la página y /api/planes (sin nada de servidor)
import { cityInfo } from "./current-city";

export const ENERGIES = ["tranquilo", "activo", "fiestero"] as const;
export type Energy = (typeof ENERGIES)[number];

export const SPOTS_MIN = 1;
export const SPOTS_MAX = 20;

export type Plan = {
  id: string;
  city: string;
  title: string;
  starts_at: string;
  energy: Energy;
  spots: number;
};

export type PlanInput = Omit<Plan, "id">;

// Fecha y hora local del plan, como la manda <input type="datetime-local">
const LOCAL_DT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

// starts_at es la hora local de la ciudad, sin zona: se arma como fecha UTC y se formatea en UTC,
// así se muestra tal cual la eligió el viajero
function toUtcDate(value: string) {
  const [y, mo, d, h, mi] = value.match(/\d+/g)!.map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi));
}

// Día de hoy menos uno (UTC): margen para las zonas horarias, la hora es local de cada ciudad
function yesterday() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

const text = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "");

// Valida y arma a mano cada campo, con las mismas reglas que los check de la tabla
export function parsePlanInput(body: unknown): { data: PlanInput; error?: undefined } | { error: string; data?: undefined } {
  const b = (body ?? {}) as Record<string, unknown>;
  const city = typeof b.city === "string" ? b.city : "";
  const title = text(b.title);
  const startsAt = typeof b.starts_at === "string" ? b.starts_at : "";
  const energy = ENERGIES.find(e => e === b.energy);
  const spots = Number(b.spots);

  // La ciudad sale de la lista cerrada de lib/current-city.ts (igual que el check de la tabla)
  if (!cityInfo(city)) return { error: "Elegí la ciudad de la lista." };
  if (title.length < 3 || title.length > 120) return { error: "Contá qué quieren hacer (3 a 120 letras)." };
  const m = LOCAL_DT_RE.exec(startsAt);
  if (!m) return { error: "Elegí fecha y hora." };
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const dt = toUtcDate(startsAt);
  // Descarta fechas que no existen (31 de febrero, 25:00, etc.)
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d || dt.getUTCHours() !== h || dt.getUTCMinutes() !== mi) {
    return { error: "Elegí fecha y hora." };
  }
  if (startsAt.slice(0, 10) < yesterday()) return { error: "La fecha ya pasó." };
  if (!energy) return { error: "Elegí la energía del plan." };
  if (!Number.isInteger(spots) || spots < SPOTS_MIN || spots > SPOTS_MAX) return { error: `El cupo va de ${SPOTS_MIN} a ${SPOTS_MAX} personas.` };

  return { data: { city, title, starts_at: startsAt, energy, spots } };
}

// Un plan ya pasó si su día es anterior a ayer (mismo margen que la validación)
export function isPast(startsAt: string) {
  return startsAt.slice(0, 10) < yesterday();
}

// Partes de la fecha para el bloque de la tarjeta
export function dateParts(startsAt: string) {
  const date = toUtcDate(startsAt);
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: "UTC" }).format(date);
  return {
    day: fmt({ day: "numeric" }),
    month: fmt({ month: "short" }).replace(".", ""),
    weekday: fmt({ weekday: "short" }).replace(".", ""),
    time: fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
  };
}

// Valor para <input type="datetime-local"> (Supabase devuelve "YYYY-MM-DDTHH:mm:ss")
export function toInputValue(startsAt: string) {
  return startsAt.slice(0, 16);
}
