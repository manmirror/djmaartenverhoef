import CallbackForm from "./CallbackForm";
import ChatCard from "./ChatCard";
import Effects from "./Effects";
import { siteContent } from "@/content/site";

const SOCIAL_ICONS: Record<string, string> = {
  instagram:
    "M12 2.2c3.2 0 3.6 0 4.9.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.8 3.8 0 0 1-1.38-.9 3.8 3.8 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 3.05a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5Zm0 11.13a4.38 4.38 0 1 1 0-8.76 4.38 4.38 0 0 1 0 8.76Zm6.99-11.4a1.58 1.58 0 1 1-3.15 0 1.58 1.58 0 0 1 3.15 0Z",
  facebook:
    "M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z",
  linkedin:
    "M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.2 8.98h3.6V21H3.2V8.98Zm5.86 0h3.45v1.64h.05c.48-.87 1.66-1.79 3.41-1.79 3.65 0 4.33 2.3 4.33 5.3V21h-3.6v-5.34c0-1.27-.02-2.91-1.83-2.91-1.83 0-2.11 1.39-2.11 2.82V21h-3.6V8.98Z",
  tiktok:
    "M16.5 2h-3v13.2a2.7 2.7 0 1 1-2.7-2.7c.28 0 .55.04.8.12V9.5a6 6 0 1 0 5 5.91V9.06a7.3 7.3 0 0 0 4 1.2V7.2a4.3 4.3 0 0 1-4.1-4.2V2Z",
};

// Breedte van een hoofdletter is ongeveer 0.66x de tekengrootte; daarmee kunnen
// we de woordmerken precies zo groot maken dat ze de regel vullen, ongeacht
// welke tekst er in content/site.ts staat.
const CHAR_WIDTH = 0.66;
// In de hero staan twee helften naast elkaar; iets kleiner zetten geeft de
// ruimte ertussen die het woordmerk leesbaar houdt.
const HERO_CHAR_WIDTH = 0.74;

export default function Home() {
  const settings = siteContent;
  const visibleSocials = settings.footerSocials.filter((social) => social.href);

  const heroChars =
    (settings.heroTitleLine1.length + settings.heroTitleLine2.length) * HERO_CHAR_WIDTH;
  const heroLineChars =
    Math.max(settings.heroTitleLine1.length, settings.heroTitleLine2.length) * CHAR_WIDTH;
  const footerChars = settings.footerWordmark.length * CHAR_WIDTH;

  const whatsappBase = `https://wa.me/${settings.whatsappNumber}`;
  const whatsappWithText = `${whatsappBase}?text=${encodeURIComponent(
    settings.whatsappMessage
  )}`;

  // Alleen ingevulde reviews tonen — geen lege of verzonnen quotes op de site.
  const filledReviews = settings.reviews.filter((review) => review.quote.trim());

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
          <h1
            className="wordmark"
            style={{
              ["--wm-chars" as string]: heroChars.toFixed(2),
              ["--wm-chars-line" as string]: heroLineChars.toFixed(2),
            }}
          >
            <span>{settings.heroTitleLine1}</span>
            <em>{settings.heroTitleLine2}</em>
          </h1>

          <div className="hero-panel">
            <div className="hero-labels">
              {settings.heroLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div
              className="hero-photo"
              style={
                settings.heroImage
                  ? {
                      backgroundImage: `url(${settings.heroImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              <div className="hero-overlay">
                <div className="hero-overlay-eyebrow">
                  {settings.heroOverlayEyebrow}
                </div>
                <div className="hero-overlay-title">
                  {settings.heroOverlayTitle}
                </div>
              </div>
              <a
                className="hero-card"
                href={whatsappWithText}
                target="_blank"
                rel="noopener"
              >
                <span className="hero-card-avatar">
                  {settings.chatAvatarMeInitial}
                </span>
                <span>
                  <span className="hero-card-name">{settings.heroCardName}</span>
                  <span className="hero-card-text">{settings.heroCardText}</span>
                </span>
              </a>
            </div>
          </div>

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

      <section className="statement">
        <div className="wrap statement-grid">
          <div className="statement-eyebrow">— {settings.statementEyebrow}</div>
          <p className="statement-text">{settings.statementText}</p>
        </div>
      </section>

      <section className="chatsection">
        <div className="wrap chat-grid">
          <div className="orbitcard">
            <div className="orbit">
              {settings.orbitStyles.map((style, i) => {
                const angle = (360 / settings.orbitStyles.length) * i;
                return (
                  <span
                    key={style}
                    className="orbit-item"
                    style={{ ["--angle" as string]: `${angle}deg` }}
                  >
                    <span className="orbit-chip">{style}</span>
                  </span>
                );
              })}
            </div>
            <h2 className="orbit-heading">{settings.chatHeading}</h2>
          </div>

          <div className="chat-column">
            <ChatCard
              label={settings.chatCardLabel}
              messages={settings.chatMessages}
              avatarThem={settings.chatAvatarThem}
              avatarMe={settings.chatAvatarMe}
              avatarMeInitial={settings.chatAvatarMeInitial}
            />
            <div className="reachcard">
              <div className="reachcard-copy">
                <h3>{settings.reachHeading}</h3>
                <p>{settings.chatText}</p>
              </div>
              <a
                className="reachcard-btn"
                href={whatsappWithText}
                target="_blank"
                rel="noopener"
              >
                {settings.reachButtonLabel}
              </a>
              <div className="reachcard-phone" aria-hidden="true">
                <span className="reachcard-phone-bubble" />
                <span className="reachcard-phone-bubble alt" />
                <span className="reachcard-phone-bubble" />
              </div>
            </div>
          </div>
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

      {filledReviews.length > 0 && (
        <section className="reviews">
          <div className="wrap reviews-grid">
            <div className="reviews-head">
              <div className="reviews-eyebrow">— {settings.reviewsEyebrow}</div>
              <h2>{settings.reviewsHeading}</h2>
            </div>
            <div className="review-list">
              {filledReviews.map((review, i) => (
                <figure
                  className="review-card"
                  key={i}
                  style={
                    review.image
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(12,10,18,.25), rgba(12,10,18,.92)), url(${review.image})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <div className="review-stars" aria-label={`${review.stars} van 5 sterren`}>
                    {"★".repeat(Math.max(1, Math.min(5, review.stars)))}
                  </div>
                  <blockquote>“{review.quote}”</blockquote>
                  <figcaption>
                    <span className="review-name">{review.name}</span>
                    {review.role && <span className="review-role">{review.role}</span>}
                  </figcaption>
                </figure>
              ))}
              {settings.googleReview.rating && (
                <a
                  className="google-card"
                  href={settings.googleReview.url || undefined}
                  target={settings.googleReview.url ? "_blank" : undefined}
                  rel="noopener"
                >
                  <span className="google-rating">{settings.googleReview.rating}</span>
                  <span className="google-label">{settings.googleReview.label}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

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
        <div className="wrap foot-top">
          <div className="foot-col">
            <div className="foot-name">{settings.footerName}</div>
            <div className="foot-links">
              {settings.footerLinks.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            </div>
          </div>

          <div className="foot-col foot-col-right">
            {visibleSocials.length > 0 && (
              <div className="foot-socials">
                {visibleSocials.map((social) => (
                  <a
                    key={social.network}
                    href={social.href}
                    target="_blank"
                    rel="noopener"
                    aria-label={social.network}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d={SOCIAL_ICONS[social.network]} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
            <CallbackForm
              heading={settings.callbackHeading}
              nameLabel={settings.callbackNameLabel}
              phoneLabel={settings.callbackPhoneLabel}
              buttonLabel={settings.callbackButtonLabel}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>
        </div>

        <div className="wrap foot-legal">
          <div className="copyright">{settings.footerCopyright}</div>
        </div>

        <div
          className="foot-wordmark"
          aria-hidden="true"
          style={{ ["--wm-chars" as string]: footerChars.toFixed(2) }}
        >
          {settings.footerWordmark}
        </div>
      </footer>

      <Effects />
    </>
  );
}
