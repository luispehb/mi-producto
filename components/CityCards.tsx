const cityData: [string, string, string, string[], string][] = [
  ["Barcelona", "BCN", "Playa de día, terraza de noche", ["Playa & Fiesta", "Nómades"], "c1"],
  ["Lisboa", "LIS", "Miradores, fado y tardes eternas", ["Cultura", "Vida nocturna"], "c2"],
  ["Ciudad de México", "CDMX", "Mezcal, arte y charlas hasta tarde", ["Gastronomía", "Cultura"], "c3"],
  ["Buenos Aires", "BUE", "Asado, tango y sobremesas infinitas", ["Gastronomía", "Vida nocturna"], "c4"],
  ["Tokio", "TYO", "Templos de día, karaoke de noche", ["Cultura", "Vida nocturna"], "c5"],
  ["Berlín", "BER", "Historia, techno y clubs sin reloj", ["Vida nocturna", "Cultura"], "c1"],
  ["Bangkok", "BKK", "Templos, mercados y calor humano", ["Aventura", "Gastronomía"], "c2"],
  ["Nueva York", "NYC", "Ritmo imparable, gente de todos lados", ["Cultura", "Nómades"], "c3"],
  ["Medellín", "MDE", "Eterna primavera y planes al aire libre", ["Naturaleza", "Nómades"], "c4"],
  ["Bali", "DPS", "Surf de mañana, coworking de tarde", ["Naturaleza", "Nómades"], "c5"],
];

export default function CityCards() {
  return (
    <div className="city-scroll" id="cityScroll">
      {cityData.map(([name, code, tagline, tags, pal]) => (
        <article className="city-card" key={code}>
          <div className={`city-thumb ${pal}`}><span className="code">{code}</span></div>
          <div className="city-meta">
            <div className="name">{name}</div>
            <div className="tagline">{tagline}</div>
            <div className="city-tags">{tags.map(t => <span key={t}>{t}</span>)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}
