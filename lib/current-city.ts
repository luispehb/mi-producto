// Lo comparten el formulario, la página y /api/ciudad-actual (sin nada de servidor)

// Lista cerrada de ciudades, agrupadas por región. Tiene que coincidir con el check
// de la tabla current_cities: si sumás una ciudad, sumala también en una migración.
export const REGIONS = [
  {
    name: "América del Norte",
    cities: [
      ["Nueva York", "Estados Unidos"], ["Los Ángeles", "Estados Unidos"], ["Miami", "Estados Unidos"],
      ["Chicago", "Estados Unidos"], ["San Francisco", "Estados Unidos"], ["Las Vegas", "Estados Unidos"],
      ["Toronto", "Canadá"], ["Vancouver", "Canadá"], ["Ciudad de México", "México"], ["Cancún", "México"],
    ],
  },
  {
    name: "América Central y del Sur",
    cities: [
      ["Ciudad de Guatemala", "Guatemala"], ["San José", "Costa Rica"], ["Ciudad de Panamá", "Panamá"],
      ["Bogotá", "Colombia"], ["Medellín", "Colombia"], ["Cartagena", "Colombia"], ["Buenos Aires", "Argentina"],
      ["Río de Janeiro", "Brasil"], ["São Paulo", "Brasil"], ["Lima", "Perú"],
    ],
  },
  {
    name: "Europa",
    cities: [
      ["París", "Francia"], ["Londres", "Reino Unido"], ["Madrid", "España"], ["Barcelona", "España"],
      ["Roma", "Italia"], ["Milán", "Italia"], ["Venecia", "Italia"], ["Ámsterdam", "Países Bajos"],
      ["Berlín", "Alemania"], ["Lisboa", "Portugal"], ["Praga", "República Checa"], ["Viena", "Austria"],
      ["Atenas", "Grecia"], ["Zúrich", "Suiza"], ["Estambul", "Turquía"],
    ],
  },
  {
    name: "Asia",
    cities: [
      ["Tokio", "Japón"], ["Kioto", "Japón"], ["Seúl", "Corea del Sur"], ["Bangkok", "Tailandia"],
      ["Singapur", "Singapur"], ["Hong Kong", "China"], ["Shanghái", "China"],
      ["Dubái", "Emiratos Árabes Unidos"], ["Bali (Denpasar)", "Indonesia"], ["Mumbai", "India"],
    ],
  },
  {
    name: "África y Oceanía",
    cities: [
      ["Ciudad del Cabo", "Sudáfrica"], ["Marrakech", "Marruecos"], ["El Cairo", "Egipto"],
      ["Sídney", "Australia"], ["Melbourne", "Australia"],
    ],
  },
] as const;

// Ciudad → país y región
const CITY_INFO = new Map<string, { country: string; region: string }>(
  REGIONS.flatMap(r => r.cities.map(([city, country]) => [city, { country, region: r.name }] as const)),
);

export const cityInfo = (city: string) => CITY_INFO.get(city);

export type CurrentCity = {
  city: string;
  country: string;
  arrived_on: string;
  leaves_on: string | null;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

// Las fechas son días locales de la ciudad: se arman y se formatean en UTC para mostrarlas tal cual
function toUtcDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isValidDate(value: string) {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const dt = toUtcDate(value);
  return dt.getUTCFullYear() === Number(m[1]) && dt.getUTCMonth() === Number(m[2]) - 1 && dt.getUTCDate() === Number(m[3]);
}

// Hoy (UTC) corrido un día para cada lado: margen para las zonas horarias
const dayOffset = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

// Valida y arma a mano cada campo, con las mismas reglas que los check de la tabla.
// El país no viene del navegador: sale de la lista.
export function parseCurrentCityInput(body: unknown): { data: CurrentCity; error?: undefined } | { error: string; data?: undefined } {
  const b = (body ?? {}) as Record<string, unknown>;
  const city = typeof b.city === "string" ? b.city : "";
  const arrivedOn = typeof b.arrived_on === "string" ? b.arrived_on : "";
  const leavesOn = typeof b.leaves_on === "string" && b.leaves_on !== "" ? b.leaves_on : null;

  const info = cityInfo(city);
  if (!info) return { error: "Elegí tu ciudad de la lista." };
  if (!isValidDate(arrivedOn)) return { error: "Elegí la fecha de llegada." };
  if (arrivedOn > dayOffset(1)) return { error: "La llegada no puede ser en el futuro." };
  if (leavesOn !== null) {
    if (!isValidDate(leavesOn)) return { error: "La fecha de salida no es válida." };
    if (leavesOn < arrivedOn) return { error: "La salida tiene que ser después de la llegada." };
    if (leavesOn < dayOffset(-1)) return { error: "La fecha de salida ya pasó." };
  }

  return { data: { city, country: info.country, arrived_on: arrivedOn, leaves_on: leavesOn } };
}

// "12 oct 2026" para mostrar una fecha
export function formatDay(value: string) {
  const date = toUtcDate(value);
  const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-AR", { ...opts, timeZone: "UTC" }).format(date);
  return `${fmt({ day: "numeric" })} ${fmt({ month: "short" }).replace(".", "")} ${fmt({ year: "numeric" })}`;
}
