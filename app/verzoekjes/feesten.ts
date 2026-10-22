// Alles wat met de agenda te maken heeft: welk feest is er nu, wanneer gaat de
// deur open en dicht, en hoe schrijven we een datum op.
//
// De tijden rekenen we expres in Europe/Amsterdam uit. De servers van Vercel
// draaien op UTC, en in de zomer scheelt dat twee uur — genoeg om een feest op
// de verkeerde dag te laten beginnen.

import { feesten, type Feest } from "@/content/feesten";

export type { Feest };

const ZONE = "Europe/Amsterdam";
const STANDAARD_VANAF = 12;
const STANDAARD_TOT = 6;

/** Hoeveel een tijdstip in Nederland afwijkt van UTC, op dat moment. */
function zoneVerschil(utcMs: number): number {
  const delen = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));

  const stuk = (soort: string) =>
    Number(delen.find((deel) => deel.type === soort)?.value ?? "0");

  const alsUtc = Date.UTC(
    stuk("year"),
    stuk("month") - 1,
    stuk("day"),
    stuk("hour") % 24,
    stuk("minute"),
    stuk("second")
  );
  return alsUtc - utcMs;
}

/** "2026-10-24" plus een uur in Nederlandse tijd, omgerekend naar een tijdstip. */
function lokaalNaarTijdstip(datum: string, uur: number, dagenErbij = 0): number {
  const [jaar, maand, dag] = datum.split("-").map(Number);
  const gok = Date.UTC(jaar, maand - 1, dag + dagenErbij, uur);
  // Twee rondes: de eerste schatting kan er net naast zitten op de dag dat de
  // klok verzet wordt.
  const eerste = gok - zoneVerschil(gok);
  return gok - zoneVerschil(eerste);
}

export function venster(feest: Feest): { van: number; tot: number } {
  return {
    van: lokaalNaarTijdstip(feest.datum, feest.vanafUur ?? STANDAARD_VANAF),
    tot: lokaalNaarTijdstip(feest.datum, feest.totUur ?? STANDAARD_TOT, 1),
  };
}

/** Het feest moet nog komen: de deur is nog niet open geweest. */
export function nogNietBegonnen(feest: Feest, nu = Date.now()): boolean {
  return nu < venster(feest).van;
}

/**
 * Tijdstip voor een ingelezen verzoekje van een oud feest: om 21:00 die avond,
 * en daarna een minuut per regel, zodat de volgorde bewaard blijft.
 */
export function tijdstipVoorRegel(feest: Feest, regel: number): number {
  return lokaalNaarTijdstip(feest.datum, 21) + regel * 60_000;
}

export function isOpen(feest: Feest, nu = Date.now()): boolean {
  const { van, tot } = venster(feest);
  return nu >= van && nu < tot;
}

/** De feesten uit content/feesten.ts, zonder wat er in de booth aan veranderd is. */
export function basisFeesten(): Feest[] {
  return feesten;
}

/** Nieuwste bovenaan. */
export function opDatum(lijst: Feest[]): Feest[] {
  return [...lijst].sort((a, b) => b.datum.localeCompare(a.datum));
}

export function vindIn(lijst: Feest[], slug: string): Feest | null {
  return lijst.find((feest) => feest.slug === slug) ?? null;
}

/** Het feest dat op dit moment aan de gang is, als dat er is. */
export function feestNu(lijst: Feest[], nu = Date.now()): Feest | null {
  return lijst.find((feest) => isOpen(feest, nu)) ?? null;
}

/** Het eerstvolgende feest dat nog moet komen. */
export function volgendFeest(lijst: Feest[], nu = Date.now()): Feest | null {
  return (
    [...lijst]
      .filter((feest) => venster(feest).van > nu)
      .sort((a, b) => a.datum.localeCompare(b.datum))[0] ?? null
  );
}

/**
 * Welk feest de booth standaard laat zien: wat er nu is, anders het feest dat
 * het dichtst bij vandaag ligt.
 */
export function feestVoorBooth(lijst: Feest[], nu = Date.now()): Feest | null {
  const bezig = feestNu(lijst, nu);
  if (bezig) return bezig;

  return (
    [...lijst].sort((a, b) => {
      const afstand = (feest: Feest) => Math.abs(venster(feest).van - nu);
      return afstand(a) - afstand(b);
    })[0] ?? null
  );
}

/** "zaterdag 24 oktober 2026" */
export function datumVoluit(feest: Feest): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(lokaalNaarTijdstip(feest.datum, 12)));
}

/** "za 24 okt 2026" */
export function datumKort(feest: Feest): string {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(lokaalNaarTijdstip(feest.datum, 12)));
}

export function jaarVan(feest: Feest): number {
  return Number(feest.datum.slice(0, 4));
}

/** Wat de boothpagina van een feest hoeft te weten. */
export type FeestInfo = {
  slug: string;
  naam: string;
  datum: string;
  plaats: string | null;
  kort: string;
  voluit: string;
  /** Of het venster nu openstaat volgens de agenda. */
  open: boolean;
  /** Proeffeest; telt niet mee in de jaarlijst. */
  test: boolean;
};

export function naarInfo(feest: Feest, nu = Date.now()): FeestInfo {
  return {
    slug: feest.slug,
    naam: feest.naam,
    datum: feest.datum,
    plaats: feest.plaats ?? null,
    kort: datumKort(feest),
    voluit: datumVoluit(feest),
    open: isOpen(feest, nu),
    test: feest.test === true,
  };
}
