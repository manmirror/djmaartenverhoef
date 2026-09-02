// Zet een gewone SoundCloud- of Spotify-link om in een speler die op de site
// zelf afspeelt, zodat bezoekers de site niet hoeven te verlaten.
//
// Het maakt niet uit wat je precies plakt: de kale link uit de adresbalk, een
// link met tracking-parameters erachter, of de complete <iframe>-code uit het
// "Embed"-tabblad van SoundCloud of Spotify.

export type Embed = { src: string; height: number; title: string };

// Haalt de echte track-URL uit wat er ook geplakt is.
function normalizeInput(raw: string): string {
  let value = raw.trim();

  // Complete embed-code geplakt: pak de src eruit.
  const srcMatch = value.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) value = srcMatch[1];
  value = value.replace(/&amp;/g, "&").trim();

  // Al een speler-URL (w.soundcloud.com/player/?url=...): pak de echte link.
  const widgetMatch = value.match(/[?&]url=([^&]+)/i);
  if (widgetMatch) {
    try {
      value = decodeURIComponent(widgetMatch[1]);
    } catch {
      value = widgetMatch[1];
    }
  }

  return value.trim();
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function buildEmbed(raw: string): Embed | null {
  const url = normalizeInput(raw || "");
  if (!url) return null;
  const host = hostOf(url);

  // Deel-links (on.soundcloud.com/xxxx) kan de speler niet openen; die moeten
  // eerst in de browser worden geopend om de echte link te krijgen.
  if (host === "on.soundcloud.com" || host === "soundcloud.app.goo.gl") {
    return null;
  }

  if (host === "soundcloud.com" || host.endsWith(".soundcloud.com")) {
    // Tracking-parameters (?si=, ?utm_...) weghalen; het geheime deel van een
    // privétrack zit in het pad (/s-xxxxx) en blijft dus staan.
    const clean = url.split("?")[0].replace(/^https?:\/\/m\.soundcloud\.com/i, "https://soundcloud.com");
    const params = new URLSearchParams({
      url: clean,
      color: "#ff2f7e",
      auto_play: "false",
      hide_related: "true",
      show_comments: "false",
      show_user: "true",
      show_reposts: "false",
      show_teaser: "false",
    });
    // Sets/playlists hebben meer hoogte nodig dan één track.
    const isSet = /soundcloud\.com\/[^/]+\/sets\//i.test(clean);
    return {
      src: `https://w.soundcloud.com/player/?${params.toString()}`,
      height: isSet ? 320 : 166,
      title: "SoundCloud-speler",
    };
  }

  if (host === "open.spotify.com") {
    const path = url
      .split("?")[0]
      .replace(/^https?:\/\/open\.spotify\.com/i, "")
      .replace(/^\/intl-[a-z]{2}/i, "")
      .replace(/^\/embed/, "");
    const isSingleTrack = path.startsWith("/track/");
    return {
      src: `https://open.spotify.com/embed${path}`,
      height: isSingleTrack ? 152 : 352,
      title: "Spotify-speler",
    };
  }

  return null;
}
