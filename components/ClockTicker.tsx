"use client";

import { useEffect, useState } from "react";

// multi-city clock ticker
const cities: [string, string][] = [
  ["Lisboa", "Europe/Lisbon"],
  ["Barcelona", "Europe/Madrid"],
  ["Ciudad de México", "America/Mexico_City"],
  ["Buenos Aires", "America/Argentina/Buenos_Aires"],
  ["Tokio", "Asia/Tokyo"],
  ["Berlín", "Europe/Berlin"],
];

function timeIn(tz: string) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function ClockTicker() {
  // Mismo texto inicial que el HTML original; se corrige al montar
  const [clock, setClock] = useState({ city: "Lisboa", time: "21:04" });

  useEffect(() => {
    let ci = 0;
    const tick = () => {
      const [name, tz] = cities[ci];
      setClock({ city: name, time: timeIn(tz) });
    };
    tick();
    const every = setInterval(tick, 1000);
    const rotate = setInterval(() => { ci = (ci + 1) % cities.length; tick(); }, 4000);
    return () => { clearInterval(every); clearInterval(rotate); };
  }, []);

  return (
    <span className="clock-ticker"><span className="city" id="tickerCity">{clock.city}</span> · <span id="tickerTime">{clock.time}</span></span>
  );
}
