// Filtros de /explorar (sin nada de servidor). Los mismos topes los aplica explore_plans() en SQL.
import { cityInfo, dayOffset, isValidDate, type CurrentCity } from "./current-city";
import type { Plan } from "./plans";

// Se puede mirar de hoy hasta 7 días adelante
export const MAX_DAYS = 7;

export type ExplorePlan = Plan & { mine: boolean };

export type ExploreQuery = { city: string; from: string; to: string; error?: string } | null;

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// Arma ciudad y rango desde la URL; lo que falta sale de "Mi ciudad" (o de hoy a +7).
// Devuelve null si no hay ciudad para buscar. Hoy va corrido un día para cada lado por las zonas horarias.
export function parseExploreQuery(params: Record<string, string | string[] | undefined>, current: CurrentCity | null): ExploreQuery {
  const city = param(params.city) || current?.city || "";
  if (!city) return null;

  // El servidor va en UTC: arrancar ayer evita perder los planes de "hoy" en las zonas que van atrás
  const start = dayOffset(-1);
  const max = dayOffset(MAX_DAYS);
  // Si buscás tu ciudad actual y ya sabés cuándo te vas, el rango termina ese día
  const leaves = city === current?.city && current.leaves_on && current.leaves_on < max ? current.leaves_on : max;
  const from = param(params.from) || start;
  const to = param(params.to) || (leaves >= from ? leaves : max);

  if (!cityInfo(city)) return { city: "", from, to, error: "Elegí una ciudad de la lista." };
  if (!isValidDate(from) || !isValidDate(to)) return { city, from, to, error: "Elegí fechas válidas." };
  if (from < dayOffset(-1)) return { city, from, to, error: "La fecha de inicio ya pasó." };
  if (to > dayOffset(MAX_DAYS + 1)) return { city, from, to, error: `Podés mirar hasta ${MAX_DAYS} días desde hoy.` };
  if (to < from) return { city, from, to, error: "La fecha final tiene que ser después de la inicial." };
  return { city, from, to };
}
