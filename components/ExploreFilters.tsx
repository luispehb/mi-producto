"use client";

import { MAX_DAYS } from "@/lib/explore";
import CitySelect from "./CitySelect";

// Día en la zona del navegador, corrido "days" días, como lo espera <input type="date">
const localDay = (days: number) => new Date(Date.now() + days * 86_400_000 - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

// Filtro de /explorar: un GET común a la misma página, la búsqueda se hace en el servidor
export default function ExploreFilters({ city, from, to }: { city?: string; from?: string; to?: string }) {
  // Los límites se ponen al enfocar: calcularlos al renderizar no coincide entre servidor y navegador
  const limit = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.min = localDay(-1);
    e.currentTarget.max = localDay(MAX_DAYS);
  };

  return (
    <form key={`${city}-${from}-${to}`} className="plan-form explore-filters" action="/explorar" method="get">
      <label className="field">
        <span>Ciudad</span>
        <CitySelect defaultValue={city} />
      </label>

      <label className="field">
        <span>Desde</span>
        <input type="date" name="from" defaultValue={from} onFocus={limit} required />
      </label>

      <label className="field">
        <span>Hasta</span>
        <input type="date" name="to" defaultValue={to} onFocus={limit} required />
      </label>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit">Ver planes</button>
      </div>
      <p className="explore-hint">De hoy hasta {MAX_DAYS} días adelante: en tu ciudad o en la que vas a visitar.</p>
    </form>
  );
}
