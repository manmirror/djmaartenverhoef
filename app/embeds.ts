// Zet een gewone SoundCloud- of Spotify-link om in een speler die op de site
// zelf afspeelt, zodat bezoekers de site niet hoeven te verlaten.

export type Embed = { src: string; height: number; title: string };

export function buildEmbed(url: string): Embed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.includes("soundcloud.com")) {
    const params = new URLSearchParams({
      url: trimmed,
      color: "#ff2f7e",
      auto_play: "false",
      hide_related: "true",
      show_comments: "false",
      show_user: "true",
      show_reposts: "false",
      show_teaser: "false",
    });
    // Sets/playlists hebben meer hoogte nodig dan één track.
    const isSet = /soundcloud\.com\/[^/]+\/sets\//.test(trimmed);
    return {
      src: `https://w.soundcloud.com/player/?${params.toString()}`,
      height: isSet ? 320 : 166,
      title: "SoundCloud-speler",
    };
  }

  if (trimmed.includes("open.spotify.com")) {
    const path = trimmed
      .split("?")[0]
      .replace(/^https?:\/\/open\.spotify\.com/, "")
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
