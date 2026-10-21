// Zoeken in de muziekcollectie uit rekordbox, en het opzoeken van de bpm bij
// een verzoekje. De collectie zelf staat in content/collection.json; die maak
// je met `node scripts/rekordbox-import.mjs <pad naar rekordbox.xml>`.
//
// Staat er niets in het bestand, dan werkt alles gewoon door: geen suggesties
// en geen bpm, maar verzoekjes komen nog steeds binnen.

import ruweCollectie from "@/content/collection.json";

import type { Collectie, CollectieTrack, Suggestie } from "./types";

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

/** Zelfde, maar zonder wat tussen haakjes staat: "(Original Mix)", "[Extended]". */
function kern(waarde: string): string {
  return normaliseer(waarde.replace(/[([{][^)\]}]*[)\]}]/g, " "));
}

type Rij = {
  track: CollectieTrack;
  /** genormaliseerde titel */
  nt: string;
  /** titel zonder haakjes */
  kt: string;
  /** genormaliseerde artiest */
  na: string;
  /** artiest + titel, voor het zoekveld */
  alles: string;
};

// De index één keer per proces opbouwen; daarna is zoeken een simpele scan.
let index: Rij[] | null = null;

function geefIndex(): Rij[] {
  if (!index) {
    index = collectie.tracks.map((track) => {
      const nt = normaliseer(track.t);
      const na = normaliseer(track.a);
      return { track, nt, kt: kern(track.t), na, alles: `${na} ${nt}`.trim() };
    });
  }
  return index;
}

export function collectieIsGevuld(): boolean {
  return collectie.tracks.length > 0;
}

export function collectieAantal(): number {
  return collectie.tracks.length;
}

function naarSuggestie(track: CollectieTrack): Suggestie {
  return {
    titel: track.t,
    artiest: track.a,
    bpm: track.b,
    toon: track.k,
    genre: track.g,
    jaar: track.y,
  };
}

/**
 * Zoekhulp voor het formulier: geeft de nummers die het best op `vraag` lijken.
 * Titels die ermee beginnen staan vooraan, daarna de rest.
 */
export function zoek(vraag: string, limiet = 8): Suggestie[] {
  const nodig = normaliseer(vraag);
  if (nodig.length < 2) return [];

  const woorden = nodig.split(" ");
  // Eén emmer per soort treffer: hoe lager het nummer, hoe beter de match.
  // Per emmer houden we er maar een handvol bij, zodat een vage zoekterm niet
  // de halve collectie in het geheugen trekt.
  const ruimtePerEmmer = limiet * 3;
  const emmers: Rij[][] = [[], [], [], [], []];

  for (const rij of geefIndex()) {
    let score: number;
    if (rij.nt.startsWith(nodig)) score = 0;
    else if (rij.na.startsWith(nodig)) score = 1;
    else if (rij.nt.includes(nodig)) score = 2;
    else if (rij.alles.includes(nodig)) score = 3;
    else if (woorden.every((woord) => rij.alles.includes(woord))) score = 4;
    else continue;

    if (emmers[score].length < ruimtePerEmmer) emmers[score].push(rij);
    // Genoeg nummers waarvan de titel precies zo begint: beter wordt het niet.
    if (emmers[0].length >= ruimtePerEmmer) break;
  }

  const gekozen: Rij[] = [];
  for (const emmer of emmers) {
    // Binnen een emmer de kortste titels eerst: die lijken het meest op de vraag.
    emmer.sort((a, b) => a.nt.length - b.nt.length);
    for (const rij of emmer) {
      gekozen.push(rij);
      if (gekozen.length === limiet) return gekozen.map((r) => naarSuggestie(r.track));
    }
  }

  return gekozen.map((rij) => naarSuggestie(rij.track));
}

/**
 * Zoekt de bpm en toonaard bij een verzoekje op. Bewust streng: liever geen
 * bpm dan de bpm van een ander nummer. Alleen bij een exacte titel (en, als die
 * is ingevuld, een kloppende artiest) geven we iets terug.
 */
export function zoekGegevens(titel: string, artiest: string): CollectieTrack | null {
  const nt = normaliseer(titel);
  if (!nt) return null;
  const na = normaliseer(artiest);

  const rijen = geefIndex();
  let kandidaten = rijen.filter((rij) => rij.nt === nt);
  if (kandidaten.length === 0) {
    const kt = kern(titel);
    if (kt) kandidaten = rijen.filter((rij) => rij.kt === kt);
  }
  if (kandidaten.length === 0) return null;

  if (na) {
    const metArtiest = kandidaten.filter(
      (rij) => rij.na === na || rij.na.includes(na) || na.includes(rij.na)
    );
    // Is er een artiest ingevuld die niet voorkomt, dan is het vermoedelijk een
    // ander nummer met dezelfde titel.
    if (metArtiest.length === 0) return null;
    kandidaten = metArtiest;
  }

  if (kandidaten.length === 1) return kandidaten[0].track;

  // Meer dan één nummer met deze titel: alleen doorgeven als ze het over de
  // bpm eens zijn, anders weten we het niet zeker genoeg.
  const bpms = new Set(
    kandidaten.map((rij) => (rij.track.b === null ? "?" : Math.round(rij.track.b)))
  );
  return bpms.size === 1 ? kandidaten[0].track : null;
}
