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
  // Groot woordmerk bovenaan: linkerhelft en rechterhelft.
  heroTitleLine1: "MAARTEN",
  heroTitleLine2: "VERHOEF",
  tagline:
    "Van intieme cafés tot Koningsdag op het plein — al ruim 30 jaar lees ik elke zaal (en plein) en hou ik de dansvloer vol.",

  // Drie labels boven de grote hero-foto.
  heroLabels: ["Bruiloften", "Bedrijfsfeesten", "Kroeg & festival"],
  // Grote sfeerfoto in de hero. Zet bv. "/images/hero.jpg", of laat op null.
  heroImage: null as string | null,
  // Tekst linksonder over de foto.
  heroOverlayEyebrow: "Al ruim 30 jaar",
  heroOverlayTitle: "Dansvloer vol.",
  // Kaartje rechtsonder over de foto.
  heroCardName: "App met Maarten",
  heroCardText: "Direct antwoord, geen booker ertussen",

  // Losse uitspraak-band onder de over-sectie.
  statementEyebrow: "Waarom een dj",
  statementText:
    "Niemand onthoudt de setlist. Iedereen onthoudt de avond. Daar draait het om.",

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

  // Linkerkaart van het drieluik: tekst in het midden, stijlen draaien eromheen.
  chatHeading: "Eén dj, meerdere stijlen.",
  orbitStyles: [
    "Electro",
    "Dance",
    "Pop",
    "R&B",
    "Disco",
    "Nederlandstalig",
    "Classics",
    "Feest",
  ],
  // Kaart rechtsonder in het drieluik.
  reachHeading: "Eén appje bij je vandaan.",
  reachButtonLabel: "Stuur een appje",
  chatText:
    "Geen omweg via een booker of formulier-limbo. Je appt, en binnen no time weet je waar je aan toe bent.",
  // Kleine kop bovenin het chat-kaartje (wordt in hoofdletters getoond).
  chatCardLabel: "Altijd dichtbij",
  // Optionele rondjes-foto's naast de berichten, bv. "/images/maarten.jpg".
  // Op null: een silhouet voor de klant en een gekleurd rondje met initiaal voor Maarten.
  chatAvatarThem: null as string | null,
  chatAvatarMe: null as string | null,
  chatAvatarMeInitial: "M",
  // Het gesprek dat zich in het kaartje afspeelt. "them" = klant, "me" = Maarten.
  chatMessages: [
    { from: "them", text: "Hey! 👋 Ben je nog vrij op 14 juni?" },
    { from: "me", text: "Zeker weten! 🎉 Wat voor feest wordt het?" },
    { from: "them", text: "50-jarig huwelijksfeest, zo'n 80 gasten." },
    { from: "me", text: "Leuk! Zullen we morgen even bellen?" },
  ] as { from: "them" | "me"; text: string }[],

  // ---- REVIEWS ----
  // LET OP: vul hier alleen échte reviews in van echte klanten.
  // Zolang `quote` leeg is, wordt het hele reviewblok niet getoond.
  reviewsEyebrow: "Reviews",
  reviewsHeading: "Dit zeggen tevreden klanten",
  reviews: [
    {
      quote: "",
      name: "",
      role: "",
      // Optionele foto bij de review, bv. "/images/bruiloft.jpg"
      image: null as string | null,
      // Aantal sterren (1 t/m 5)
      stars: 5,
    },
  ],
  // Optioneel kaartje met je Google-beoordeling; laat `rating` leeg om te verbergen.
  googleReview: {
    rating: "",
    label: "Google reviews",
    url: "",
  },

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
  // Muziek afspelen op de site zelf:
  //  - `embedUrl`: het adres van je SoundCloud-track of -set, zoals het in de
  //    adresbalk staat als je de track op soundcloud.com opent. Dus:
  //      "https://soundcloud.com/maartenverhoef/naam-van-de-track"
  //    Een speler-link (w.soundcloud.com/player/?url=...) werkt ook; die wordt
  //    automatisch omgezet. Twee dingen die NIET werken:
  //      * de complete <iframe>-code uit SoundCloud: de dubbele quotes daarin
  //        breken deze regel. Gebruik alleen het adres.
  //      * deel-links (on.soundcloud.com/...): open die eerst in je browser en
  //        kopieer dan het adres uit de adresbalk.
  //    Spotify-links werken op dezelfde manier als SoundCloud.
  //  - `audioFile`: een eigen mp3 uit /public/music/ (bv. "/music/set.mp3").
  //  - `externalUrl`: alleen een link naar buiten, zonder speler.
  // Het eerste veld dat is ingevuld wordt gebruikt.
  tracks: [
    {
      title: "Startup Set - Koningsdag Uithoorn aan de Amstel 2025",
      dotColor: "var(--pink)",
      embedUrl:
        "https://soundcloud.com/maartenverhoef/startup-set-koningsdag-uithoorn-aan-de-amstel-2025",
      audioFile: null as string | null,
      externalUrl: null as string | null,
    },
    {
      title: "Spotify — Bruiloften Mix",
      dotColor: "var(--violet)",
      embedUrl: "",
      audioFile: null as string | null,
      externalUrl: null as string | null,
    },
  ],

  contactHeading: "Zullen we het even hebben over jouw feest?",
  contactText:
    "Geen formulier, geen omweg. App gewoon je datum en het type feest — je hoort binnen no time of Maarten beschikbaar is.",

  // ---- FOOTER ----
  footerName: "DJ Maarten Verhoef",
  footerLinks: [
    { label: "Over", href: "#over" },
    { label: "Media", href: "#media" },
    { label: "Muziek", href: "#muziek" },
    { label: "Contact", href: "#contact" },
  ],
  // Laat `href` leeg om een icoon te verbergen.
  footerSocials: [
    { network: "instagram", href: "" },
    { network: "facebook", href: "" },
  ] as { network: "instagram" | "facebook" | "linkedin" | "tiktok"; href: string }[],
  // Terugbelblokje: opent WhatsApp met de ingevulde naam en het nummer erin.
  callbackHeading: "Graag even bellen?",
  callbackNameLabel: "Je naam",
  callbackPhoneLabel: "Je nummer",
  callbackButtonLabel: "Bel me terug",
  // Groot woordmerk onderaan de pagina.
  footerWordmark: "MAARTEN VERHOEF",
  footerCopyright: "© 2026 maartenverhoef.nl",
};
