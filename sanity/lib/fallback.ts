import type { MediaItem, SiteSettings, Track, Venue } from "./types";

// Exact copy of the original static site. Used whenever a piece of content
// hasn't been filled in in the Studio yet (or no Sanity project is linked at
// all), so the site always renders something sensible.
export const fallbackContent: {
  siteSettings: SiteSettings;
  venues: Venue[];
  mediaItems: MediaItem[];
  tracks: Track[];
} = {
  siteSettings: {
    eyebrow: "DJ · Uithoorn e.o. · sinds 1994",
    heroTitleLine1: "DJ MAARTEN",
    heroTitleLine2: "VERHOEF",
    tagline:
      "Van intieme cafés tot Koningsdag op het plein — al ruim 30 jaar leest hij elke zaal en houdt hij de dansvloer vol.",
    primaryButtonLabel: "App voor een offerte",
    secondaryButtonLabel: "Beluister zijn sets",
    whatsappNumber: "31621211313",
    whatsappMessage: "Hoi Maarten, ik wil graag een offerte aanvragen voor...",
    phoneNumber: "06 - 21 21 13 13",
    email: "info@maartenverhoef.nl",
    sequenceHeading: "Van eerste plaat tot lichten aan.",
    aboutHeading: "Meer dan 30 jaar op de dansvloer.",
    aboutText:
      "Sinds de jaren '90 draait Maarten in en rond Uithoorn — van kroeg tot koningsdag. Zijn stijl is veelzijdig: electro, dance, pop, R&B, disco en Nederlandstalig, vloeiend door elkaar gemengd zodat elke generatie op de vloer blijft staan.\nVaste gast op onder meer:",
    aboutPhoto: null,
    chatHeading: "Altijd dichtbij.",
    chatText:
      "Geen omweg via een booker of formulier-limbo. Je appt, en binnen no time weet je waar je aan toe bent.",
    mediaHeading: "Media",
    mediaSubtext: "Sfeerbeelden van optredens door de jaren heen.",
    musicHeading: "Muziek",
    musicSubtext: "Beluister recente sets — van rustig tot rauw.",
    contactHeading: "Zullen we het even hebben over jouw feest?",
    contactText:
      "Geen formulier, geen omweg. App gewoon je datum en het type feest — je hoort binnen no time of Maarten beschikbaar is.",
    footerCopyright: "© 2026 maartenverhoef.nl",
  },
  venues: [
    { name: "Koningsdag" },
    { name: "Ibiza Night aan de Amstel" },
    { name: "café De River" },
    { name: "café Bloemenbeppie" },
    { name: "Qui Vive" },
    { name: "The Good Men events" },
  ],
  mediaItems: [
    { label: "Koningsdag", gradientFrom: "#ff2f7e", gradientTo: "#3a0f2b", tall: true },
    { label: "café De River", gradientFrom: "#8b5cf6", gradientTo: "#241638" },
    { label: "Bruiloft", gradientFrom: "#ff8a3d", gradientTo: "#3a230f" },
    { label: "Ibiza Night a/d Amstel", gradientFrom: "#8b5cf6", gradientTo: "#ff2f7e", tall: true },
    { label: "Bloemenbeppie", gradientFrom: "#3a0f2b", gradientTo: "#ff2f7e" },
    { label: "Qui Vive", gradientFrom: "#241638", gradientTo: "#8b5cf6" },
  ],
  tracks: [
    { title: "SoundCloud — Zomerset 2026", dotColor: "var(--pink)" },
    { title: "Spotify — Bruiloften Mix", dotColor: "var(--violet)" },
  ],
};
