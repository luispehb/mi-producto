"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { LatLngBoundsExpression, LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CITY_COORDS } from "@/lib/city-coords";

type Props = { city?: string; from?: string; to?: string; counts: Record<string, number> };

// Todas las ciudades: el mapa arranca encuadrándolas (en un teléfono también se ven América y Asia)
const ALL: LatLngBoundsExpression = Object.values(CITY_COORDS);

// Mapa de las 50 ciudades: las que tienen planes esos días muestran cuántos.
// Tocar una ciudad abre un globo con su nombre y "Ver planes" (en touch no hay hover para saber cuál es).
// Leaflet necesita window: se carga al montar.
export default function ExploreMap({ city, from, to, counts }: Props) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<{ L: typeof import("leaflet"); map: LeafletMap; pins: LayerGroup } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !box.current) return;
      // En touch, un dedo hace scroll de la página (no arrastra el mapa); con dos dedos se hace zoom
      const m = L.map(box.current, {
        center: [25, 0], zoom: 1, minZoom: 0, maxZoom: 9, zoomSnap: 0.25, worldCopyJump: true,
        zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile,
      });
      // Abajo van la leyenda (izquierda) y el zoom (derecha); los créditos arriba
      L.control.zoom({ position: "bottomright" }).addTo(m);
      L.control.attribution({ position: "topright" }).addTo(m);
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

    // En mobile, después de elegir baja hasta los resultados (el mapa queda arriba de todo)
    const go = (name: string) => {
      const q = new URLSearchParams({ city: name });
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const mobile = window.matchMedia("(max-width: 899px)").matches;
      router.push(`/explorar?${q}${mobile ? "#resultados" : ""}`, { scroll: mobile });
    };

    for (const [name, coords] of Object.entries(CITY_COORDS)) {
      const n = counts[name] ?? 0;
      const selected = name === city;
      // El área para tocar es de 32 px o más aunque el punto se vea chico
      const dot = n > 0 ? 30 + Math.min(n, 9) * 2 : selected ? 18 : 12;
      const hit = Math.max(dot, 32);
      const cls = ["map-pin", n > 0 ? "has-plans" : "", selected ? "selected" : ""].join(" ");
      const icon = L.divIcon({ className: cls, html: `<span style="width:${dot}px;height:${dot}px">${n > 0 ? n : ""}</span>`, iconSize: [hit, hit] });
      const label = n > 0 ? `${name} · ${n} ${n === 1 ? "plan" : "planes"}` : `${name} · sin planes`;

      // Globo: nombre, cantidad y botón. Se arma con nodos (no HTML) aunque los nombres son de la lista fija
      const popup = document.createElement("div");
      popup.className = "map-popup";
      const title = document.createElement("strong");
      title.textContent = name;
      const sub = document.createElement("span");
      sub.textContent = n > 0 ? `${n} ${n === 1 ? "plan" : "planes"} esos días` : "Sin planes esos días";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary";
      btn.textContent = selected ? "Estás viendo esta" : "Ver planes";
      btn.disabled = selected;
      btn.addEventListener("click", () => go(name));
      popup.append(title, sub, btn);

      L.marker(coords, { icon, title: label, alt: label, riseOnHover: true, zIndexOffset: selected ? 1000 : n * 10 })
        .bindPopup(popup, { closeButton: false, offset: [0, -hit / 2 + 4], className: "map-popup-wrap" })
        .addTo(pins);
    }
  }, [ready, city, from, to, counts, router]);

  // Vuela a la ciudad elegida; sin ciudad, encuadra todas
  useEffect(() => {
    if (!ready || !map.current) return;
    const coords = city ? CITY_COORDS[city] : undefined;
    if (coords) map.current.map.flyTo(coords, 5, { duration: 1.2 });
    else map.current.map.fitBounds(ALL, { padding: [24, 24] });
  }, [ready, city]);

  return <div ref={box} className="explore-map" role="region" aria-label="Mapa de ciudades con planes" />;
}
