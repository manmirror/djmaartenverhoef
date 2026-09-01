import Effects from "./Effects";

export default function Home() {
  return (
    <>
      <header>
        <nav className="wrap">
          <div className="logo">
            DJ <span>MAARTEN</span> VERHOEF
          </div>
          <div className="navlinks">
            <a href="#home">Home</a>
            <a href="#over">Over</a>
            <a href="#media">Media</a>
            <a href="#muziek">Muziek</a>
            <a href="#contact">Contact</a>
          </div>
          <a
            href="https://wa.me/31621211313"
            target="_blank"
            rel="noopener"
            className="navcta"
          >
            WhatsApp
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="wrap hero-content">
          <div className="eyebrow">DJ · Uithoorn e.o. · sinds 1994</div>
          <h1 className="title">
            DJ MAARTEN
            <br />
            <em>VERHOEF</em>
          </h1>
          <p className="tagline">
            Van intieme cafés tot Koningsdag op het plein — al ruim 30 jaar
            leest hij elke zaal en houdt hij de dansvloer vol.
          </p>
          <div className="btnrow">
            <a
              href="https://wa.me/31621211313"
              target="_blank"
              rel="noopener"
              className="btn-primary"
            >
              App voor een offerte
            </a>
            <a href="#muziek" className="btn-ghost">
              Beluister zijn sets
            </a>
          </div>
        </div>
      </section>

      <section className="sequence">
        <div className="wrap">
          <div className="seq-head">Van eerste plaat tot lichten aan.</div>
          <div className="seq-grid">
            <div className="step" style={{ ["--stepcolor" as string]: "var(--pink)" }}>
              <div className="step-num">01 — LEZEN</div>
              <div className="step-line">De zaal bepaalt de richting.</div>
            </div>
            <div className="step" style={{ ["--stepcolor" as string]: "var(--violet)" }}>
              <div className="step-num">02 — VERZOEKEN</div>
              <div className="step-line">Jij vraagt. Ik draai. Soms.</div>
            </div>
            <div className="step" style={{ ["--stepcolor" as string]: "var(--orange)" }}>
              <div className="step-num">03 — DANSEN</div>
              <div className="step-line">Tot de lichten aangaan.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="over" id="over">
        <div className="wrap over-grid">
          <div className="over-photo">Foto van Maarten tijdens een optreden</div>
          <div>
            <h2>Meer dan 30 jaar op de dansvloer.</h2>
            <p>
              Sinds de jaren &apos;90 draait Maarten in en rond Uithoorn — van
              kroeg tot koningsdag. Zijn stijl is veelzijdig: electro, dance,
              pop, R&amp;B, disco en Nederlandstalig, vloeiend door elkaar
              gemengd zodat elke generatie op de vloer blijft staan.
            </p>
            <p>Vaste gast op onder meer:</p>
            <div className="venues">
              <span className="venue-tag">Koningsdag</span>
              <span className="venue-tag">Ibiza Night aan de Amstel</span>
              <span className="venue-tag">café De River</span>
              <span className="venue-tag">café Bloemenbeppie</span>
              <span className="venue-tag">Qui Vive</span>
              <span className="venue-tag">The Good Men events</span>
            </div>
          </div>
        </div>
      </section>

      <section className="chatsection">
        <div className="wrap chat-grid">
          <div className="chat-copy">
            <h2>Altijd dichtbij.</h2>
            <p>
              Geen omweg via een booker of formulier-limbo. Je appt, en binnen
              no time weet je waar je aan toe bent.
            </p>
          </div>
          <div className="phone">
            <div className="bubble them">Hey! 👋 Ben je nog vrij op 14 juni?</div>
            <div className="bubble me">
              Zeker weten! 🎉 Wat voor feest wordt het?
            </div>
            <div className="bubble them">
              50-jarig huwelijksfeest, zo&apos;n 80 gasten.
            </div>
            <div className="bubble me">Leuk! Zullen we morgen even bellen?</div>
          </div>
        </div>
      </section>

      <section className="media" id="media">
        <div className="wrap">
          <div className="sec-head">
            <h2>Media</h2>
            <p>Sfeerbeelden van optredens door de jaren heen.</p>
          </div>
          <div className="media-grid">
            <div
              className="media-item tall"
              style={{ background: "linear-gradient(160deg,#ff2f7e,#3a0f2b)" }}
            >
              Koningsdag
            </div>
            <div
              className="media-item"
              style={{ background: "linear-gradient(160deg,#8b5cf6,#241638)" }}
            >
              café De River
            </div>
            <div
              className="media-item"
              style={{ background: "linear-gradient(160deg,#ff8a3d,#3a230f)" }}
            >
              Bruiloft
            </div>
            <div
              className="media-item tall"
              style={{ background: "linear-gradient(160deg,#8b5cf6,#ff2f7e)" }}
            >
              Ibiza Night a/d Amstel
            </div>
            <div
              className="media-item"
              style={{ background: "linear-gradient(160deg,#3a0f2b,#ff2f7e)" }}
            >
              Bloemenbeppie
            </div>
            <div
              className="media-item"
              style={{ background: "linear-gradient(160deg,#241638,#8b5cf6)" }}
            >
              Qui Vive
            </div>
          </div>
        </div>
      </section>

      <section className="muziek" id="muziek">
        <div className="wrap">
          <div className="sec-head">
            <h2>Muziek</h2>
            <p>Beluister recente sets — van rustig tot rauw.</p>
          </div>
          <div className="player-grid">
            <div className="player">
              <div className="player-top">
                <span className="dot" style={{ background: "var(--pink)" }} />
                <span className="player-title">SoundCloud — Zomerset 2026</span>
              </div>
              <div className="waveform" id="wave1" />
            </div>
            <div className="player">
              <div className="player-top">
                <span className="dot" style={{ background: "var(--violet)" }} />
                <span className="player-title">Spotify — Bruiloften Mix</span>
              </div>
              <div className="waveform" id="wave2" />
            </div>
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="wrap contact-grid">
          <h2>Zullen we het even hebben over jouw feest?</h2>
          <p>
            Geen formulier, geen omweg. App gewoon je datum en het type feest —
            je hoort binnen no time of Maarten beschikbaar is.
          </p>
          <a
            className="wa-btn"
            href="https://wa.me/31621211313?text=Hoi%20Maarten%2C%20ik%20wil%20graag%20een%20offerte%20aanvragen%20voor..."
            target="_blank"
            rel="noopener"
          >
            <svg className="wa-icon" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16.02 3C9.4 3 4 8.36 4 15.02c0 2.35.64 4.55 1.86 6.48L4 29l7.68-1.82a11.9 11.9 0 0 0 4.34.82h.01c6.62 0 12.02-5.36 12.02-12.02C28.05 8.36 22.66 3 16.02 3zm7.02 17.14c-.3.85-1.5 1.55-2.46 1.75-.65.13-1.5.24-4.36-.93-3.66-1.5-6.02-5.2-6.2-5.44-.18-.24-1.5-2-1.5-3.8 0-1.8.94-2.68 1.28-3.05.34-.37.73-.46.97-.46.25 0 .49 0 .7.01.23.01.53-.09.83.63.3.74 1.03 2.54 1.12 2.73.09.19.15.42.03.66-.12.24-.18.39-.36.6-.18.21-.38.47-.55.63-.18.18-.37.37-.16.73.21.36.94 1.55 2.02 2.5 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.85-.21 1.7z" />
            </svg>
            App met Maarten
          </a>
          <div className="contact-alt">
            <span>
              Liever bellen? <a href="tel:+31621211313">06 - 21 21 13 13</a>
            </span>
            <span>
              Of mail naar{" "}
              <a href="mailto:info@maartenverhoef.nl">info@maartenverhoef.nl</a>
            </span>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-row">
          <div className="logo" style={{ fontSize: 15 }}>
            DJ <span>MAARTEN</span> VERHOEF
          </div>
          <div className="foot-links">
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="mailto:info@maartenverhoef.nl">info@maartenverhoef.nl</a>
          </div>
          <div className="copyright">© 2026 maartenverhoef.nl</div>
        </div>
      </footer>

      <Effects />
    </>
  );
}
