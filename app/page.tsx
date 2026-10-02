import type { Metadata, Viewport } from "next";
import ClockTicker from "@/components/ClockTicker";
import CityCards from "@/components/CityCards";
import SignupForm from "@/components/SignupForm";
import FeedbackForm from "@/components/FeedbackForm";
import "./landing.css";

export const metadata: Metadata = { title: "Hap — Conocé gente viajando" };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const Check = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

// Mismas fuentes que el HTML original (Turbopack descarta los @import remotos en CSS)
const FONTS = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&family=JetBrains+Mono:wght@400;600&display=swap";

export default function Home() {
  return (
    <>
<link rel="stylesheet" href={FONTS} precedence="default" />
<header className="site-header">
  <a className="brand" href="#" aria-label="Hap, inicio">
    <span className="mark">
      <svg viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M9 17.5 Q13.5 9.5 18 7.5" stroke="rgba(251,246,236,0.4)" strokeWidth="1.4" strokeDasharray="1.6 3.2" strokeLinecap="round"/>
        <circle cx="8" cy="18" r="6" fill="#ff5a3c"/>
        <circle cx="19" cy="7" r="4" fill="#ffc24c"/>
      </svg>
    </span>
    Hap
  </a>
  <nav className="site-nav">
    <a href="#como-funciona">Cómo funciona</a>
    <a href="#ciudades">Ciudades</a>
    <a href="#comunidad">Comunidad</a>
    <a href="#comentarios">Comentarios</a>
  </nav>
  <div className="header-right">
    <ClockTicker />
    <a className="btn btn-primary" href="#waitlist">Sumate</a>
  </div>
</header>

<section className="hero">
  <span className="hero-pill"><span className="dot"></span> Lista de espera abierta</span>
  <h1 className="hero-headline">
    GENTE VERIFICADA<br/>
    <span className="rotator">
      <span>
        <em>POR INVITACIÓN</em>
        <em>EN BARCELONA</em>
        <em>EN LISBOA</em>
        <em>EN CDMX</em>
        <em>EN BUENOS AIRES</em>
        <em>EN TOKIO</em>
        <em>EN BERLÍN</em>
      </span>
    </span>
  </h1>
  <div className="hero-foot">
    <p className="hero-intro">Cada persona en Hap entra invitada por alguien que ya está adentro, así que sabés que es real. Conectás con viajeros afines a vos para armar un plan juntos y salir a vivirlo, no solo a chatear.</p>
    <SignupForm variant="inline" />
  </div>
</section>

<section className="thesis-wrap">
  <div className="row" style={{ position: "relative" }}>
    <h2 className="thesis">VIAJAR SOLX<br/>NO ES ESTAR<br/>SOLX.</h2>
    <div className="thesis-orbit" aria-hidden="true">
      <svg viewBox="0 0 200 200" fill="none">
        <circle cx="70" cy="85" r="34" fill="#ff5a3c"/>
        <circle cx="128" cy="118" r="24" fill="#ffc24c" opacity="0.85"/>
        <path d="M96 92 L112 108" stroke="#fbf6ec" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round"/>
      </svg>
    </div>
    <p className="thesis-copy">La mayoría de las mejores historias de viaje no son sobre lugares — son sobre con quién las viviste. Hap existe para que ese encuentro no dependa de la suerte: te muestra viajeros y locales con tu misma energía, en la ciudad donde estás hoy, listos para armar algo juntos.</p>
  </div>
</section>

<section id="como-funciona">
  <div className="row">
    <div className="widget-bar"><h2>Cómo funciona</h2></div>
    <div className="steps">
      <div className="step">
        <span className="num">01</span>
        <h3>Contanos quién sos</h3>
        <p>Intereses, idiomas, ritmo de viaje — mochilero o de lujo, planes tranquilos o de fiesta. Cuanto más real, mejor el match.</p>
      </div>
      <div className="step">
        <span className="num">02</span>
        <h3>Mirá quién hay cerca</h3>
        <p>Te mostramos viajeros y locales afines en tu ciudad actual, ordenados por afinidad real, no por cercanía nada más.</p>
      </div>
      <div className="step">
        <span className="num">03</span>
        <h3>Armen un plan y salgan</h3>
        <p>De un café a una noche entera explorando. Propongan, súmense, coordinen — y que el buen momento pase afuera de la app.</p>
      </div>
    </div>
  </div>
</section>

<section id="ciudades">
  <div className="row">
    <div className="widget-bar">
      <h2>Las primeras ciudades</h2>
      <a className="see-all" href="#">Ver el mapa completo <Arrow /></a>
    </div>
    <CityCards />
  </div>
</section>

<section>
  <div className="row match-spotlight">
    <div className="match-copy">
      <span className="eyebrow">Match por afinidad</span>
      <h2 style={{ marginTop: "0.6rem" }}>No es geolocalización. Es afinidad real.</h2>
      <p>El match de Hap cruza intereses, idiomas, energía social y ritmo de viaje — para que la persona que te aparece sea alguien con quien de verdad tendría sentido tomar algo.</p>
      <ul>
        <li><Check /> Intereses y estilo de viaje en común</li>
        <li><Check /> Idiomas que ambos hablan</li>
        <li><Check /> Energía social: tranquilo, activo o fiestero</li>
      </ul>
    </div>
    <div className="mock-stack">
      <div>
        <p className="mock-label">Vista previa — match</p>
        <div className="mock-card mock-match">
          <span className="avatar">S</span>
          <div className="who">
            <div className="name">Sofía, 27</div>
            <div className="loc">Ahora en Lisboa</div>
          </div>
          <span className="mock-score">91%</span>
        </div>
      </div>
      <div className="mock-card" style={{ padding: "1.1rem 1.25rem" }}>
        <div className="mock-interests">
          <span>Surf</span><span>Fotografía</span><span>Comida callejera</span><span>Trekking</span>
        </div>
        <span className="mock-cta">Proponer un plan →</span>
      </div>
      <div>
        <p className="mock-label">Vista previa — plan</p>
        <div className="mock-card mock-plan">
          <div className="title">Café + mirador</div>
          <div className="when">Sáb · 18:00 · Alfama, Lisboa</div>
          <div className="mock-avatars">
            <span className="avatar" style={{ background: "linear-gradient(155deg,#ffc24c,#ff5a3c)" }}>S</span>
            <span className="avatar" style={{ background: "linear-gradient(155deg,#7d6bff,#4cd4ff)" }}>M</span>
            <span className="avatar" style={{ background: "linear-gradient(155deg,#ff5ca0,#c22a70)" }}>+2</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section>
  <div className="row banner"><p>El mejor souvenir es la gente que conocés en el camino.</p></div>
</section>

<section id="waitlist">
  <div className="row split">
    <div>
      <span className="eyebrow">Próximamente</span>
      <h2 style={{ marginTop: "0.6rem" }}>SÉ DE LOS<br/>PRIMEROS.</h2>
      <p className="lead">Estamos armando Hap ciudad por ciudad. Sumate a la lista de espera y te avisamos apenas esté disponible donde estás — o donde vas.</p>
    </div>
    <div className="waitlist-card">
      <div>
        <h3>Reservá tu lugar</h3>
        <p>Sin spam. Un solo email cuando Hap llegue a tu ciudad.</p>
      </div>
      <SignupForm variant="card" />
      <span className="waitlist-note">000 viajeros en la lista — vas a ser de los primeros</span>
    </div>
  </div>
</section>

<section id="comunidad">
  <div className="row about">
    <div className="about-copy">
      <span className="eyebrow">Por qué existe Hap</span>
      <p style={{ marginTop: "0.6rem" }}>Viajar te cambia más rápido cuando lo hacés con gente. Pero conocer a alguien afín en una ciudad nueva suele ser cuestión de suerte: el hostel correcto, la mesa de al lado, un grupo de Facebook.</p>
      <p>Hap le saca la suerte de la ecuación. Construimos un match pensado para viajeros — no para citas — y herramientas simples para pasar de &quot;hola&quot; a un plan concreto en minutos.</p>
      <a href="#waitlist">Sumate a la lista de espera <Arrow /></a>
    </div>
    <div className="about-media" aria-hidden="true"></div>
  </div>
</section>

<section id="comentarios">
  <div className="row split">
    <div>
      <span className="eyebrow">Tu opinión</span>
      <h2 style={{ marginTop: "0.6rem" }}>CONTANOS<br/>QUÉ PENSÁS.</h2>
      <p className="lead">¿Qué te gustaría que tenga Hap? ¿Qué dudas te quedaron — precio, seguridad, cómo funciona? Te leemos a todos.</p>
    </div>
    <div className="waitlist-card">
      <FeedbackForm />
    </div>
  </div>
</section>

<footer className="site-footer">
  <div className="row">
    <div className="footer-cta-row">
      <h2 className="footer-cta">¿LISTX PARA TU<br/><span className="accent">PRÓXIMO PLAN?</span></h2>
      <a className="btn btn-primary" href="#waitlist">Sumarme a la lista de espera</a>
    </div>
    <div className="footer-grid">
      <div className="footer-col">
        <h4>Contacto</h4>
        <a href="mailto:hola@hap.app">hola@hap.app</a>
      </div>
      <div className="footer-col">
        <h4>Comunidad</h4>
        <a href="#">Instagram</a>
        <a href="#">TikTok</a>
        <a href="#">Grupo de viajeros</a>
      </div>
      <div className="footer-col">
        <h4>Legal</h4>
        <a href="#">Privacidad</a>
        <a href="#">Términos</a>
      </div>
    </div>
    <div className="footer-bottom">
      <span>© Hap — 2026</span>
      <span className="footer-status"><span className="dot"></span> En construcción, ciudad por ciudad.</span>
    </div>
  </div>
</footer>
    </>
  );
}
