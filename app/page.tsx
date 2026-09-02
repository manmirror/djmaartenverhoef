import ChatCard from "./ChatCard";
import Effects from "./Effects";
import { siteContent } from "@/content/site";

export default function Home() {
  const settings = siteContent;

  const whatsappBase = `https://wa.me/${settings.whatsappNumber}`;
  const whatsappWithText = `${whatsappBase}?text=${encodeURIComponent(
    settings.whatsappMessage
  )}`;

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
          <a href={whatsappBase} target="_blank" rel="noopener" className="navcta">
            WhatsApp
          </a>
        </nav>
      </header>

      <section className="hero" id="home">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="wrap hero-content">
          <div className="eyebrow">{settings.eyebrow}</div>
          <h1 className="title">
            {settings.heroTitleLine1}
            <br />
            <em>{settings.heroTitleLine2}</em>
          </h1>
          <p className="tagline">{settings.tagline}</p>
          <div className="btnrow">
            <a href={whatsappWithText} target="_blank" rel="noopener" className="btn-primary">
              {settings.primaryButtonLabel}
            </a>
            <a href="#muziek" className="btn-ghost">
              {settings.secondaryButtonLabel}
            </a>
          </div>
        </div>
      </section>

      <section className="sequence">
        <div className="wrap">
          <div className="seq-head">{settings.sequenceHeading}</div>
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
          <div
            className="over-photo"
            style={
              settings.aboutPhoto
                ? {
                    backgroundImage: `url(${settings.aboutPhoto})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    color: "transparent",
                  }
                : undefined
            }
          >
            {!settings.aboutPhoto && "Foto van Maarten tijdens een optreden"}
          </div>
          <div>
            <h2>{settings.aboutHeading}</h2>
            {settings.aboutText
              .split("\n")
              .filter(Boolean)
              .map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            <div className="venues">
              {settings.venues.map((venue) => (
                <span className="venue-tag" key={venue}>
                  {venue}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="chatsection">
        <div className="wrap chat-grid">
          <div className="chat-copy">
            <h2>{settings.chatHeading}</h2>
            <p>{settings.chatText}</p>
          </div>
          <ChatCard
            label={settings.chatCardLabel}
            messages={settings.chatMessages}
            avatarThem={settings.chatAvatarThem}
            avatarMe={settings.chatAvatarMe}
            avatarMeInitial={settings.chatAvatarMeInitial}
          />
        </div>
      </section>

      <section className="contact" id="contact">
        <div className="wrap contact-grid">
          <h2>{settings.contactHeading}</h2>
          <p>{settings.contactText}</p>
          <a className="wa-btn" href={whatsappWithText} target="_blank" rel="noopener">
            <svg className="wa-icon" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16.02 3C9.4 3 4 8.36 4 15.02c0 2.35.64 4.55 1.86 6.48L4 29l7.68-1.82a11.9 11.9 0 0 0 4.34.82h.01c6.62 0 12.02-5.36 12.02-12.02C28.05 8.36 22.66 3 16.02 3zm7.02 17.14c-.3.85-1.5 1.55-2.46 1.75-.65.13-1.5.24-4.36-.93-3.66-1.5-6.02-5.2-6.2-5.44-.18-.24-1.5-2-1.5-3.8 0-1.8.94-2.68 1.28-3.05.34-.37.73-.46.97-.46.25 0 .49 0 .7.01.23.01.53-.09.83.63.3.74 1.03 2.54 1.12 2.73.09.19.15.42.03.66-.12.24-.18.39-.36.6-.18.21-.38.47-.55.63-.18.18-.37.37-.16.73.21.36.94 1.55 2.02 2.5 1.39 1.24 2.56 1.62 2.92 1.8.36.18.57.15.78-.09.21-.24.9-1.05 1.14-1.41.24-.36.48-.3.81-.18.33.12 2.1.99 2.46 1.17.36.18.6.27.69.42.09.15.09.85-.21 1.7z" />
            </svg>
            App met Maarten
          </a>
        </div>
      </section>

      <section className="media" id="media">
        <div className="wrap">
          <div className="sec-head">
            <h2>{settings.mediaHeading}</h2>
            <p>{settings.mediaSubtext}</p>
          </div>
          <div className="media-grid">
            {settings.mediaItems.map((item, i) => {
              const background = item.image
                ? `url(${item.image}) center / cover`
                : `linear-gradient(160deg, ${item.gradientFrom}, ${item.gradientTo})`;
              return (
                <div
                  key={i}
                  className={`media-item${item.tall ? " tall" : ""}`}
                  style={{ background }}
                >
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="muziek" id="muziek">
        <div className="wrap">
          <div className="sec-head">
            <h2>{settings.musicHeading}</h2>
            <p>{settings.musicSubtext}</p>
          </div>
          <div className="player-grid">
            {settings.tracks.map((track, i) => (
              <div className="player" key={i}>
                <div className="player-top">
                  <span className="dot" style={{ background: track.dotColor || "var(--pink)" }} />
                  <span className="player-title">{track.title}</span>
                </div>
                <div className="waveform" />
                {track.audioFile ? (
                  <audio
                    controls
                    src={track.audioFile}
                    style={{ width: "100%", marginTop: 14 }}
                  />
                ) : track.externalUrl ? (
                  <a
                    href={track.externalUrl}
                    target="_blank"
                    rel="noopener"
                    style={{
                      display: "inline-block",
                      marginTop: 14,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--muted)",
                    }}
                  >
                    Beluister deze track →
                  </a>
                ) : null}
              </div>
            ))}
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
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
          </div>
          <div className="copyright">{settings.footerCopyright}</div>
        </div>
      </footer>

      <Effects />
    </>
  );
}
