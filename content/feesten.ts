// De agenda. Elk feest krijgt hier een eigen regel, en daarmee automatisch:
//
//   * een eigen adres        djmaartenverhoef.nl/verzoekjes/f/<slug>
//   * een eigen QR-poster    djmaartenverhoef.nl/verzoekjes/qr/<slug>
//   * een eigen lijst in de booth, die bewaard blijft
//
// Een feest toevoegen: zet er een regel bij en deploy. De volgorde maakt niet
// uit; de booth zet ze zelf op datum.
//
//   slug      wat er in het adres komt te staan: kleine letters, streepjes,
//             geen spaties of accenten. Verander hem niet meer nadat je de
//             poster hebt geprint — dan werkt die code niet meer.
//   naam      zoals het op de poster en in de booth komt te staan.
//   datum     "jjjj-mm-dd", de dag waarop het feest begint.
//   plaats    optioneel, komt klein onder de naam op de poster.
//   vanafUur  vanaf welk uur gasten verzoekjes mogen sturen (standaard 12).
//   totUur    tot welk uur de ochtend erna (standaard 6).
//   test      op true: werkt als elk ander feest, maar telt niet mee in de
//             jaarlijst. Voor het uitproberen.
//   verzoekjes
//             optioneel, voor feesten van vóór de verzoekjespagina: de
//             verzoekjes van die avond, één per regel, zoals ze gevraagd zijn.
//             De booth zet ze de eerste keer in de database en koppelt ze aan
//             je collectie; daarna zijn het gewone verzoekjes. Regels die je
//             later onderaan toevoegt komen er ook bij. Een regel aanpassen of
//             weghalen doe je in de booth, niet hier: wat al in de database
//             staat, wordt niet opnieuw ingelezen.
//
// Buiten dat venster neemt het formulier niets aan — zo kan niemand volgende
// week nog iets in de lijst van vorige week zetten. Loopt het anders dan
// gepland, dan kun je het feest in de booth met één knop alsnog openen.

export type Feest = {
  slug: string;
  naam: string;
  datum: string;
  plaats?: string;
  vanafUur?: number;
  totUur?: number;
  test?: boolean;
  verzoekjes?: string[];
};

export const feesten: Feest[] = [
  {
    slug: "test-feestje",
    naam: "Maarten's Test Feestje",
    datum: "2026-10-21",
    plaats: "Thuis, Uithoorn",
    test: true,
  },
  {
    slug: "justin-en-rachel-30",
    naam: "Justin & Rachel 30 jaar!",
    datum: "2026-10-10",
    plaats: "De Vink, Vinkeveen",
    verzoekjes: [
      "Bievenpad",
      "Meer NL",
      "WAAR DE LADIES ZIJ",
      "WAAR BLIJF JE NOU",
      "GHETTO",
      "Bunda",
      "Meisje Afro",
      "Proud Mary",
      "Summer 69",
      "Een glaasje bier",
      "Thunder opposites",
      "Sexyback",
      "Bring ken",
      "Loterij lil",
      "Don’t stop believing",
      "Paradise",
      "Terug in de tijd",
      "Drake one band",
      "GUUS MEEUWIS",
      "MAAK ME NOU NIET GEK",
      "Leef Hazes",
      "Sterrenstof",
      "Uitslover",
      "Vlinders",
      "Broken ev",
      "Pikketanusi",
    ],
  },
  {
    slug: "bo-chantal-en-mitchel",
    naam: "Bo Chantal & Mitchel",
    datum: "2026-10-24",
    plaats: "De Vink, Vinkeveen",
  },
  {
    // De namen volgen nog. Die kun je gewoon bij `naam` invullen; de slug
    // blijft staan, zodat een al geprinte poster blijft werken.
    slug: "de-vink-20-november",
    naam: "Privéfeest",
    datum: "2026-11-20",
    plaats: "De Vink, Vinkeveen",
  },
  {
    slug: "kim-en-nicole",
    naam: "Kim & Nicole",
    datum: "2026-12-12",
    plaats: "Qui Vive, De Kwakel",
  },
];
