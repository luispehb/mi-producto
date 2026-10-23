"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_COORDS } from "@/lib/city-coords";

type Props = { city?: string; from?: string; to?: string; counts: Record<string, number> };

// Mapa de las 50 ciudades: las que tienen planes esos días muestran cuántos.
// Tocar una ciudad la busca (misma URL que el filtro). Leaflet necesita window: se carga al montar.
export default function ExploreMap({ city, from, to, counts }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<{ L: typeof import("leaflet"); map: LeafletMap; pins: LayerGroup } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !box.current) return;
      const m = L.map(box.current, { center: [25, 0], zoom: 2, minZoom: 2, maxZoom: 9, worldCopyJump: true, zoomControl: false, scrollWheelZoom: false });
      L.control.zoom({ position: "bottomright" }).addTo(m);
      // Tiles de OpenStreetMap (sin llave); el CSS las oscurece para que combinen con la app
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      map.current = { L, map: m, pins: L.layerGroup().addTo(m) };
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.map.remove();
      map.current = null;
    };
  }, []);

  // Pines: se rearman cuando cambian la ciudad elegida o los conteos
  useEffect(() => {
    if (!ready || !map.current) return;
    const { L, pins } = map.current;
    pins.clearLayers();
    for (const [name, coords] of Object.entries(CITY_COORDS)) {
      const n = counts[name] ?? 0;
      const selected = name === city;
      const cls = ["map-pin", n > 0 ? "has-plans" : "", selected ? "selected" : ""].join(" ");
      const size = n > 0 ? 30 + Math.min(n, 9) * 2 : selected ? 18 : 10;
      const icon = L.divIcon({ className: cls, html: n > 0 ? `<span>${n}</span>` : "", iconSize: [size, size] });
      const label = n > 0 ? `${name} · ${n} ${n === 1 ? "plan" : "planes"}` : `${name} · sin planes`;
      L.marker(coords, { icon, title: label, alt: label, riseOnHover: true, zIndexOffset: selected ? 1000 : n * 10 })
        .bindTooltip(label, { direction: "top", offset: [0, -size / 2], className: "map-tip" })
        .on("click", () => {
          const q = new URLSearchParams({ city: name });
          if (from) q.set("from", from);
          if (to) q.set("to", to);
          router.push(`/explorar?${q}`, { scroll: false });
        })
        .addTo(pins);
    }
  }, [ready, city, from, to, counts, router]);

  // Vuela a la ciudad elegida
  useEffect(() => {
    if (!ready || !map.current) return;
    const coords = city ? CITY_COORDS[city] : undefined;
    if (coords) map.current.map.flyTo(coords, 5, { duration: 1.2 });
    else map.current.map.setView([25, 0], 2);
  }, [ready, city]);

  return <div ref={box} className="explore-map" role="region" aria-label="Mapa de ciudades con planes" />;
}
