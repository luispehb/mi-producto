"use client";

import { useRef, useState } from "react";
import { addDays, cityToday, MAX_DAYS } from "@/lib/explore";
import CitySelect from "./CitySelect";

// Filtro de /explorar: un GET común a la misma página, la búsqueda se hace en el servidor.
// Los límites del calendario son los días de la ciudad elegida (mismo "hoy" que el servidor).
// En mobile se pliega cuando ya hay una búsqueda; en desktop siempre se ve (lo maneja el CSS).
export default function ExploreFilters({ city, from, to, startOpen }: { city?: string; from?: string; to?: string; startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [selected, setSelected] = useState(city ?? "");
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const min = cityToday(selected || undefined);
  const max = addDays(min, MAX_DAYS);

  // Otra ciudad puede ir un día adelante o atrás: las fechas que quedan afuera se acomodan al rango nuevo
  function onCity(next: string) {
    setSelected(next);
    const lo = cityToday(next), hi = addDays(lo, MAX_DAYS);
    for (const input of [fromRef.current, toRef.current]) {
      if (input?.value) input.value = input.value < lo ? lo : input.value > hi ? hi : input.value;
    }
  }

  return (
    <section id="filtros" className={open ? "panel explore-filters-panel open" : "panel explore-filters-panel"} aria-label="Buscá planes">
      <button className="btn btn-ghost explore-filters-toggle" type="button" aria-expanded={open} aria-controls="filtros-body" onClick={() => setOpen(o => !o)}>
        {open ? "Cerrar" : "Cambiar ciudad o fechas"}
      </button>
      {/* El #resultados hace que, al buscar, la página baje directo a los planes */}
      <form id="filtros-body" key={`${city}-${from}-${to}`} className="plan-form explore-filters" action="/explorar#resultados" method="get">
        <label className="field">
          <span>Ciudad</span>
          <CitySelect defaultValue={city} onChange={onCity} />
        </label>

        <label className="field">
          <span>Desde</span>
          <input ref={fromRef} type="date" name="from" defaultValue={from} min={min} max={max} required />
        </label>

        <label className="field">
          <span>Hasta</span>
          <input ref={toRef} type="date" name="to" defaultValue={to} min={min} max={max} required />
        </label>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Ver planes</button>
        </div>
        <p className="explore-hint">De hoy hasta {MAX_DAYS} días adelante, en el horario de la ciudad: la tuya o la que vas a visitar.</p>
      </form>
    </section>
  );
}
