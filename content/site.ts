// Alle teksten, afbeeldingen en muziek voor maartenverhoef.nl staan hier.
//
// Teksten aanpassen: verander gewoon de tekst tussen de aanhalingstekens.
// Afbeeldingen toevoegen: zet het bestand in /public/images/ en vul hieronder
//   het pad in als "/images/jouw-bestand.jpg" (laat op `null` staan voor de
//   kleurverloop-placeholder).
// Muziek toevoegen: zet het bestand in /public/music/ en vul hieronder het
//   pad in als "/music/jouw-track.mp3" (of laat leeg en vul `externalUrl` in
//   voor een link naar SoundCloud/Spotify).

export const siteContent = {
  eyebrow: "DJ · Uithoorn e.o. · sinds 1994",
  heroTitleLine1: "DJ MAARTEN",
  heroTitleLine2: "VERHOEF",
  tagline:
    "Van intieme cafés tot Koningsdag op het plein — al ruim 30 jaar leest hij elke zaal (en plein) en houdt hij de dansvloer vol.",
  primaryButtonLabel: "App voor een offerte",
  secondaryButtonLabel: "Beluister zijn sets",

  // Internationaal formaat zonder + of spaties, bv. 31621211313
  whatsappNumber: "31621211313",
  // Vooraf ingevulde tekst voor de WhatsApp-knop in de contact-sectie
  whatsappMessage: "Hoi Maarten, ik wil graag een offerte aanvragen voor...",
  email: "info@maartenverhoef.nl",

  sequenceHeading: "Van eerste plaat tot lichten aan.",

  aboutHeading: "Meer dan 30 jaar op de dansvloer.",
  // Elke nieuwe regel (Enter) wordt een eigen alinea.
  aboutText:
    "Sinds de jaren '90 draait Maarten in en rond Uithoorn — van kroeg tot koningsdag. Zijn stijl is veelzijdig: electro, dance, pop, R&B, disco en Nederlandstalig, vloeiend door elkaar gemengd zodat elke generatie op de vloer blijft staan.\nVaste gast op onder meer:",
  // Zet bv. "/images/maarten-optreden.jpg", of laat op null voor de placeholder.
  aboutPhoto: null as string | null,
  venues: [
    "Koningsdag Uithoorn",
    "Watch Me Now",
    "Uithoorn Crossfit",
    "CrossFit Culemborg",
    "Ibiza Night aan de Amstel",
    "Café De River",
    "Café Bloemenbeppie",
    "Hockeyclub Qui Vive",
    "Sportvereniging Legmeervogels",
  ],

  chatHeading: "Altijd dichtbij.",
  chatText:
    "Geen omweg via een booker of formulier-limbo. Je appt, en binnen no time weet je waar je aan toe bent.",

  mediaHeading: "Media",
  mediaSubtext: "Sfeerbeelden van optredens door de jaren heen.",
  mediaItems: [
    {
      label: "Koningsdag",
      image: null as string | null,
      gradientFrom: "#ff2f7e",
      gradientTo: "#3a0f2b",
      tall: true,
    },
    {
      label: "café De River",
      image: null as string | null,
      gradientFrom: "#8b5cf6",
      gradientTo: "#241638",
      tall: false,
    },
    {
      label: "Bruiloft",
      image: null as string | null,
      gradientFrom: "#ff8a3d",
      gradientTo: "#3a230f",
      tall: false,
    },
    {
      label: "Ibiza Night a/d Amstel",
      image: null as string | null,
      gradientFrom: "#8b5cf6",
      gradientTo: "#ff2f7e",
      tall: true,
    },
    {
      label: "Bloemenbeppie",
      image: null as string | null,
      gradientFrom: "#3a0f2b",
      gradientTo: "#ff2f7e",
      tall: false,
    },
    {
      label: "Qui Vive",
      image: null as string | null,
      gradientFrom: "#241638",
      gradientTo: "#8b5cf6",
      tall: false,
    },
  ],

  musicHeading: "Muziek",
  musicSubtext: "Beluister recente sets — van rustig tot rauw.",
  tracks: [
    {
      title: "SoundCloud — Zomerset 2026",
      dotColor: "var(--pink)",
      audioFile: null as string | null,
      externalUrl: null as string | null,
    },
    {
      title: "Spotify — Bruiloften Mix",
      dotColor: "var(--violet)",
      audioFile: null as string | null,
      externalUrl: null as string | null,
    },
  ],

  contactHeading: "Zullen we het even hebben over jouw feest?",
  contactText:
    "Geen formulier, geen omweg. App gewoon je datum en het type feest — je hoort binnen no time of Maarten beschikbaar is.",

  footerCopyright: "© 2026 maartenverhoef.nl",
};
