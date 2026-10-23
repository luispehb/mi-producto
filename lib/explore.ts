// Filtros de /explorar (sin nada de servidor: lo usan la página y el formulario).
// explore_plans() aplica en SQL un tope más amplio (hoy UTC −1 … +8) como red de seguridad.
import { cityInfo, dayOffset, isValidDate, type CurrentCity } from "./current-city";
import { CITY_TZ } from "./city-coords";
import type { Plan } from "./plans";

// Se puede mirar de hoy hasta 7 días adelante
export const MAX_DAYS = 7;

export type ExplorePlan = Plan & { mine: boolean };

// today y last: el primer y el último día que se pueden mirar en esa ciudad
export type ExploreQuery = { city: string; from: string; to: string; today: string; last: string; error?: string } | null;

// Día de hoy (YYYY-MM-DD) en la zona horaria de la ciudad; sin ciudad, el día UTC
export function cityToday(city: string | undefined) {
  const tz = city ? CITY_TZ[city] : undefined;
  if (!tz) return dayOffset(0);
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

// Suma días a una fecha YYYY-MM-DD
export function addDays(day: string, days: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// ¿Sigue en su ciudad actual? (no se fue todavía)
export function isHere(current: CurrentCity | null, city: string, today: string) {
  return current?.city === city && (!current.leaves_on || current.leaves_on >= today);
}

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// Arma ciudad y rango desde la URL; lo que falta sale de "Mi ciudad" (o de hoy a +7).
// Devuelve null si no hay ciudad para buscar.
export function parseExploreQuery(params: Record<string, string | string[] | undefined>, current: CurrentCity | null): ExploreQuery {
  const city = param(params.city) || current?.city || "";
  if (!city) return null;

  const today = cityToday(city);
  const last = addDays(today, MAX_DAYS);
  // Si es tu ciudad actual y ya sabés cuándo te vas, el rango termina ese día (si no pasó)
  const leaves = isHere(current, city, today) && current?.leaves_on && current.leaves_on < last ? current.leaves_on : last;
  const from = param(params.from) || today;
  const to = param(params.to) || (leaves >= from ? leaves : last);

  if (!cityInfo(city)) return { city: "", from, to, today, last, error: "Elegí una ciudad de la lista." };
  if (!isValidDate(from) || !isValidDate(to)) return { city, from, to, today, last, error: "Elegí fechas válidas." };
  if (from < today) return { city, from, to, today, last, error: "La fecha de inicio ya pasó." };
  if (to > last) return { city, from, to, today, last, error: `Podés mirar hasta ${MAX_DAYS} días desde hoy.` };
  if (to < from) return { city, from, to, today, last, error: "La fecha final tiene que ser después de la inicial." };
  return { city, from, to, today, last };
}
