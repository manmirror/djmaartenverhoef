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
};

export const feesten: Feest[] = [
  {
    slug: "bo-chantal-en-mitchel",
    naam: "Bo Chantal & Mitchel",
    datum: "2026-10-24",
  },
];
