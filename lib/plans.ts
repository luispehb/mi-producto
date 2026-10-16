// Lo comparten el formulario, la página y /api/planes (sin nada de servidor)
export const ENERGIES = ["tranquilo", "activo", "fiestero"] as const;
export type Energy = (typeof ENERGIES)[number];

export type Plan = {
  id: string;
  city: string;
  title: string;
  starts_at: string;
  energy: Energy;
  spots: number;
};

// starts_at es la hora local de la ciudad, sin zona: se muestra tal cual, sin convertir
export function formatStartsAt(value: string) {
  const [y, mo, d, h, mi] = value.match(/\d+/g)!.map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d, h, mi));
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  }).format(date);
}
