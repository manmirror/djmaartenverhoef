// Het koppelen van een verzoekje aan de muziekcollectie uit rekordbox. De
// collectie zelf staat in content/collection.json; die maak je met
// `npm run verzoekjes:collectie -- <pad naar rekordbox.xml>`.
//
// Gasten typen zelf wat ze willen horen, met tikfouten, artiest en titel door
// elkaar, of "remix" erachter. Hier zoeken we uit welk nummer uit de collectie
// ze bedoelen. Uitgangspunt: liever geen match dan een verkeerde. Staat er
// niets in de collectie, dan werkt alles gewoon door, alleen zonder bpm.

import ruweCollectie from "@/content/collection.json";

import type { CollectieTrack, Collectie, Match, Verzoek, Zoekresultaat } from "./types";

const collectie = ruweCollectie as Collectie;

/** Accenten eraf, kleine letters, leestekens eruit. Zo matcht "Déjà Vu" ook op "deja vu". */
export function normaliseer(waarde: string): string {
  return waarde
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function woorden(waarde: string): string[] {
  const genormaliseerd = normaliseer(waarde);
  return genormaliseerd ? genormaliseerd.split(" ") : [];
}

/**
 * De kern van een titel: zonder wat tussen haakjes staat ("(Original Mix)",
 * "[Extended]") en zonder een kort staartje achter een streepje ("- Radio
 * Edit"). Dat is wat een gast intypt.
 */
function kernVan(titel: string): string[] {
  const kaal = titel
    .replace(/[([{][^)\]}]*[)\]}]/g, " ")
    .replace(/\s+-\s+[^-]{1,30}$/, " ");
  const kern = woorden(kaal);
  // Bestaat de titel alleen uit haakjes, dan maar de hele titel.
  return kern.length > 0 ? kern : woorden(titel);
}

/** Woorden die in een titel mogen ontbreken: "Mr. Brightside" vindt ook "brightside". */
const LOS_IN_TITEL = new Set(["the", "de", "het", "a", "an", "een", "mr", "mrs", "ms", "x"]);

/** Woorden die een gast er los bij kan typen zonder dat ze iets betekenen. */
const VULWOORDEN = new Set([
  ...LOS_IN_TITEL,
  "van", "by", "door", "feat", "ft", "featuring", "met", "en", "and", "of", "versie",
  "version", "nummer", "liedje", "song", "plaat", "please", "pls", "plz", "graag",
  "aub", "ajb", "alsjeblieft", "svp", "s", "t",
]);

/** Woorden die een versie aanduiden. Mag een gast noemen; we kiezen dan die versie. */
const VERSIEWOORDEN = new Set([
  "remix", "edit", "mix", "radio", "extended", "original", "live", "remaster",
  "remastered", "club", "bootleg", "mashup", "smashup", "rework", "vip", "intro",
  "clean", "dirty", "acoustic", "akoestisch", "cover",
]);

/** Kleine tikfouten toestaan, maar alleen in woorden die lang genoeg zijn. */
function lijktOp(a: string, b: string): boolean {
  if (a === b) return true;
  const korste = Math.min(a.length, b.length);
  const ruimte = korste >= 8 ? 2 : korste >= 4 ? 1 : 0;
  if (ruimte === 0 || Math.abs(a.length - b.length) > ruimte) return false;
  return afstand(a, b, ruimte) <= ruimte;
}

/** Levenshtein-afstand, met een plafond zodat het snel blijft. */
function afstand(a: string, b: string, plafond: number): number {
  let vorige = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const huidige = [i];
    let kleinste = i;
    for (let j = 1; j <= b.length; j++) {
      const waarde = Math.min(
        vorige[j] + 1,
        huidige[j - 1] + 1,
        vorige[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      huidige.push(waarde);
      kleinste = Math.min(kleinste, waarde);
    }
    if (kleinste > plafond) return plafond + 1;
    vorige = huidige;
  }
  return vorige[b.length];
}

type Rij = {
  /** Plek in de collectie. */
  nr: number;
  track: CollectieTrack;
  kern: string[];
  /** De kern als één tekst, om versies van hetzelfde nummer te herkennen. */
  kernTekst: string;
  titel: string[];
  artiest: string[];
};

// De index één keer per proces opbouwen.
let index: Rij[] | null = null;
let omgedraaid: Rij[] | null = null;

function maakRij(track: CollectieTrack, nr: number): Rij {
  const kern = kernVan(track.t);
  return {
    nr,
    track,
    kern,
    kernTekst: kern.join(" "),
    titel: woorden(track.t),
    artiest: woorden(track.a),
  };
}

function geefIndex(): Rij[] {
  if (!index) {
    index = collectie.tracks.map(maakRij);
  }
  return index;
}

/**
 * Nummers waarvan titel en artiest bij het inlezen uit één veld zijn gehaald,
 * nog een keer, maar dan andersom. "Titel - Artiest" komt in DJ-pools ook voor,
 * en dan wil het koppelen het nummer alsnog vinden — en goed om weergeven.
 *
 * Niet als het artiestdeel een artiest is die elders in de collectie voorkomt:
 * dan klopt de volgorde, en anders zou "guus meeuwis" ineens een willekeurig
 * nummer van hem opleveren.
 */
function geefOmgedraaid(): Rij[] {
  if (!omgedraaid) {
    const bekend = new Set<string>();
    for (const track of collectie.tracks) {
      if (track.s) continue;
      for (const deel of track.a.split(/,|&|\s(?:x|ft\.?|feat\.?|vs\.?)\s/i)) {
        const naam = normaliseer(deel);
        if (naam) bekend.add(naam);
      }
    }
    omgedraaid = collectie.tracks.flatMap((track, nr) =>
      track.s && !bekend.has(normaliseer(track.a))
        ? [maakRij({ ...track, t: track.a, a: track.t }, nr)]
        : []
    );
  }
  return omgedraaid;
}

export function collectieAantal(): number {
  return collectie.tracks.length;
}

export type Treffer = {
  track: CollectieTrack;
  /** Hoeveel versies van dit nummer er in de collectie staan, deze meegeteld. */
  versies: number;
  /**
   * De gast vroeg om een andere artiest dan deze. De titel klopt, maar het is
   * een andere versie dan bedoeld — bijvoorbeeld een cover.
   */
  andereArtiest: boolean;
};

/** Haalt het eerste ongebruikte woord uit `gevraagd` dat op `woord` lijkt. */
function pak(gevraagd: string[], gebruikt: boolean[], woord: string): boolean {
  for (let i = 0; i < gevraagd.length; i++) {
    if (!gebruikt[i] && lijktOp(gevraagd[i], woord)) {
      gebruikt[i] = true;
      return true;
    }
  }
  return false;
}

/** Hoe goed `rij` past bij wat de gast typte, of null als het niet past. */
function beoordeel(rij: Rij, gevraagd: string[], letterlijk: string): number | null {
  const gebruikt = gevraagd.map(() => false);

  // 1. Elk wezenlijk woord van de kern moet erin staan.
  let kernRaak = 0;
  for (const woord of rij.kern) {
    if (pak(gevraagd, gebruikt, woord)) kernRaak++;
    else if (!LOS_IN_TITEL.has(woord)) return null;
  }
  if (kernRaak === 0) return null;

  // 2. Wat de gast verder typte moet ergens bij horen.
  let artiestRaak = 0;
  let versieRaak = 0;
  let onverklaard = 0;
  gevraagd.forEach((woord, i) => {
    if (gebruikt[i]) return;
    if (rij.artiest.some((ander) => lijktOp(woord, ander))) artiestRaak++;
    else if (rij.titel.some((ander) => lijktOp(woord, ander))) versieRaak++;
    else if (VULWOORDEN.has(woord) || VERSIEWOORDEN.has(woord)) return;
    else onverklaard++;
  });

  // Geen enkel los woord: anders koppelt "always on my mind" aan "On My Mind".
  if (onverklaard > 0) return null;

  // Hoe minder extra's in de titel die de gast niet noemde, hoe liever: dan
  // wint "Levels" van "Levels (Skrillex Remix)" als iemand gewoon "levels" vraagt.
  const extra = rij.titel.length - rij.kern.length - versieRaak;

  return (
    kernRaak * 3 +
    artiestRaak * 2 +
    versieRaak * 1.5 -
    onverklaard * 3 -
    Math.max(0, extra) * 0.3 +
    (normaliseer(rij.track.t) === letterlijk ? 2 : 0)
  );
}

/**
 * Zoekt het nummer uit de collectie dat een gast bedoelt. Titel en artiest
 * mogen door elkaar staan; we kijken naar de woorden, niet naar het vakje.
 */
export function vindInCollectie(titel: string, artiest: string): Treffer | null {
  const precies = zoekBeste(woorden(`${titel} ${artiest}`), normaliseer(titel));
  if (precies) return { ...precies, andereArtiest: false };

  // Noemde de gast een artiest die we bij deze titel niet hebben, kijk dan of
  // we het nummer in een andere versie hebben. Alleen op het titelvak, en ook
  // daar moet elk woord kloppen.
  if (normaliseer(artiest)) {
    const anders = zoekBeste(woorden(titel), normaliseer(titel));
    if (anders) return { ...anders, andereArtiest: true };
  }
  return null;
}

function zoekBeste(
  gevraagd: string[],
  letterlijk: string
): { track: CollectieTrack; versies: number } | null {
  if (gevraagd.length === 0) return null;

  let beste: { rij: Rij; score: number } | null = null;
  const rijen = geefIndex();

  for (const rij of [...rijen, ...geefOmgedraaid()]) {
    const score = beoordeel(rij, gevraagd, letterlijk);
    if (score === null) continue;
    if (!beste || isBeter(rij, score, beste.rij, beste.score)) {
      beste = { rij, score };
    }
  }
  if (!beste) return null;

  const kern = beste.rij.kernTekst;
  const versies = rijen.filter((rij) => rij.kernTekst === kern).length;
  return { track: beste.rij.track, versies };
}

/** Bij een gelijke score: het oudste nummer, want dat is meestal het origineel. */
function isBeter(rij: Rij, score: number, ander: Rij, anderScore: number): boolean {
  if (Math.abs(score - anderScore) > 0.01) return score > anderScore;
  const jaar = rij.track.y ?? Infinity;
  const anderJaar = ander.track.y ?? Infinity;
  if (jaar !== anderJaar) return jaar < anderJaar;
  return rij.track.t.length < ander.track.t.length;
}

/** Hoeveel versies van dit nummer er in de collectie staan, deze meegeteld. */
function versiesVan(track: CollectieTrack): number {
  const kern = kernVan(track.t).join(" ");
  return geefIndex().filter((rij) => rij.kernTekst === kern).length;
}

/** Een nummer uit de collectie als match bij een verzoekje. */
export function naarMatch(
  track: CollectieTrack,
  opties: { andereArtiest?: boolean; handmatig?: boolean; versies?: number } = {}
): Match {
  return {
    titel: track.t,
    artiest: track.a,
    bpm: track.b,
    toon: track.k,
    genre: track.g,
    jaar: track.y,
    versies: opties.versies ?? versiesVan(track),
    andereArtiest: opties.andereArtiest ?? false,
    ...(opties.handmatig ? { handmatig: true } : {}),
  };
}

/** Het nummer op plek `nr`, om een keuze uit de booth te controleren. */
export function trackOp(nr: number): CollectieTrack | null {
  return Number.isInteger(nr) ? (collectie.tracks[nr] ?? null) : null;
}

/** Woord uit de zoekvraag dat op een woord uit de collectie lijkt, of ermee begint. */
function zoektermPast(term: string, woord: string): boolean {
  return (term.length >= 2 && woord.startsWith(term)) || lijktOp(term, woord);
}

/**
 * De zoekfunctie in de booth, voor het met de hand koppelen. Ruimer dan het
 * automatische koppelen: een half woord is genoeg ("dancing qu"), want hier
 * kiest de DJ zelf uit wat er terugkomt.
 */
export function zoekInCollectie(vraag: string, limiet = 12): Zoekresultaat[] {
  const termen = woorden(vraag);
  if (termen.length === 0) return [];

  const treffers: { rij: Rij; score: number }[] = [];
  for (const rij of geefIndex()) {
    let inTitel = 0;
    let inArtiest = 0;
    let past = true;
    for (const term of termen) {
      if (rij.titel.some((woord) => zoektermPast(term, woord))) inTitel++;
      else if (rij.artiest.some((woord) => zoektermPast(term, woord))) inArtiest++;
      else if (VULWOORDEN.has(term) || VERSIEWOORDEN.has(term)) continue;
      else {
        past = false;
        break;
      }
    }
    if (!past || inTitel + inArtiest === 0) continue;

    // Titels die precies de kern zijn, zonder extra's, zo hoog mogelijk.
    const extra = Math.max(0, rij.titel.length - inTitel);
    treffers.push({ rij, score: inTitel * 2 + inArtiest - extra * 0.1 });
  }

  treffers.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.01) return b.score - a.score;
    return (a.rij.track.y ?? Infinity) - (b.rij.track.y ?? Infinity);
  });

  return treffers.slice(0, limiet).map(({ rij }) => ({
    nr: rij.nr,
    titel: rij.track.t,
    artiest: rij.track.a,
    bpm: rij.track.b,
    toon: rij.track.k,
    jaar: rij.track.y,
  }));
}

/**
 * Waaraan we zien dat twee verzoekjes om hetzelfde nummer gaan. Met een match
 * is dat het nummer uit de collectie, anders wat de gast typte.
 */
export function kenmerk(verzoek: Verzoek): string {
  return verzoek.match
    ? `m:${normaliseer(verzoek.match.titel)}|${normaliseer(verzoek.match.artiest)}`
    : `v:${normaliseer(verzoek.titel)}|${normaliseer(verzoek.artiest)}`;
}
