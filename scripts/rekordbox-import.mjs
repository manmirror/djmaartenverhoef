// Zet een export uit rekordbox om naar content/collection.json, zodat de
// verzoekjespagina kan voorstellen welke nummers Maarten heeft en de booth de
// bpm erbij ziet staan.
//
// In rekordbox: Bestand > Bibliotheek > Collectie in xml-formaat opslaan.
// Daarna:
//
//   node scripts/rekordbox-import.mjs ~/Downloads/rekordbox.xml
//
// Alleen titel, artiest, bpm, toonaard, genre en jaar gaan mee. Het pad naar
// je muziekbestanden (Location) laten we expres staan: dat hoort niet op een
// website thuis.

import { readFile, writeFile } from "node:fs/promises";

const bron = process.argv[2];
const doel = process.argv[3] ?? "content/collection.json";

if (!bron) {
  console.error("Gebruik: node scripts/rekordbox-import.mjs <rekordbox.xml> [doel.json]");
  process.exit(1);
}

const ENTITEITEN = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Zet &amp; en &#39; weer om naar gewone tekens. */
function ontsnap(waarde) {
  return waarde.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (heel, naam) => {
    if (naam[0] === "#") {
      const nummer =
        naam[1] === "x" || naam[1] === "X"
          ? Number.parseInt(naam.slice(2), 16)
          : Number.parseInt(naam.slice(1), 10);
      return Number.isNaN(nummer) ? heel : String.fromCodePoint(nummer);
    }
    return ENTITEITEN[naam] ?? heel;
  });
}

/**
 * Leest de attributen van één tag, beginnend net achter de tagnaam. Houdt
 * rekening met aanhalingstekens, zodat een titel met een > erin niets breekt.
 */
function leesAttributen(tekst, vanaf) {
  const attributen = {};
  let i = vanaf;

  while (i < tekst.length) {
    while (i < tekst.length && /\s/.test(tekst[i])) i++;
    if (i >= tekst.length) break;
    if (tekst[i] === ">" || tekst[i] === "/") return { attributen, einde: i };

    const naamStart = i;
    while (i < tekst.length && !/[\s=>/]/.test(tekst[i])) i++;
    const naam = tekst.slice(naamStart, i);

    while (i < tekst.length && /\s/.test(tekst[i])) i++;
    if (tekst[i] !== "=") {
      if (!naam) i++;
      continue;
    }
    i++;

    while (i < tekst.length && /\s/.test(tekst[i])) i++;
    const aanhaling = tekst[i];
    if (aanhaling !== '"' && aanhaling !== "'") continue;
    i++;

    const waardeStart = i;
    while (i < tekst.length && tekst[i] !== aanhaling) i++;
    attributen[naam] = tekst.slice(waardeStart, i);
    i++;
  }

  return { attributen, einde: i };
}

/**
 * Bestanden uit DJ-pools hebben vaak een rommelige titel: een tracknummer
 * ervoor ("1_", "2. "), een "_pn" erachter, en de artiest in de titel in plaats
 * van in het artiestveld. Dat ruimen we op, voorzichtig: alleen wat zeker is.
 */
function schoonOp(titel, artiest) {
  let t = titel
    .replace(/_pn$/i, "")
    .replace(/^\d{1,2}(?:_|\.\s+)(?=[A-Za-z])/, "")
    .trim();
  let a = artiest;

  // "Artiest - Titel" zonder artiestveld: splitsen, maar alleen bij precies
  // één streepje en niet bij mixtapes als "[SUMMER MIXTAPE] ... - CHILL".
  if (!a && !/^[[_]/.test(t)) {
    const stukken = t.split(" - ");
    if (stukken.length === 2 && stukken[0].trim() && stukken[1].trim()) {
      a = stukken[0].trim();
      t = stukken[1].trim();
    }
  }

  return { titel: t, artiest: a };
}

function getal(waarde) {
  if (!waarde) return null;
  const nummer = Number.parseFloat(waarde);
  return Number.isFinite(nummer) && nummer > 0 ? nummer : null;
}

function sleutel(titel, artiest) {
  return `${titel}|${artiest}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, " ")
    .trim();
}

const xml = (await readFile(bron, "utf8")).replace(/^﻿/, "");

const gevonden = new Map();
let bekeken = 0;
let overgeslagen = 0;

let positie = xml.indexOf("<TRACK");
while (positie !== -1) {
  const na = positie + "<TRACK".length;
  // Alleen echte tracks; "<TRACKS" of iets dergelijks slaan we over.
  if (!/[\s>/]/.test(xml[na] ?? "")) {
    positie = xml.indexOf("<TRACK", na);
    continue;
  }

  const { attributen, einde } = leesAttributen(xml, na);

  // In <PLAYLISTS> staan verwijzingen zonder titel; die hebben we niet nodig.
  if (attributen.Name) {
    bekeken++;
    const { titel, artiest } = schoonOp(
      ontsnap(attributen.Name).trim(),
      ontsnap(attributen.Artist ?? "").trim()
    );

    if (!titel) {
      overgeslagen++;
    } else {
      const id = sleutel(titel, artiest);
      const track = {
        t: titel,
        a: artiest,
        b: getal(attributen.AverageBpm),
        k: ontsnap(attributen.Tonality ?? "").trim() || null,
        g: ontsnap(attributen.Genre ?? "").trim() || null,
        y: getal(attributen.Year),
      };

      const bestaand = gevonden.get(id);
      // Hetzelfde nummer kan meerdere keren in de collectie staan; we houden de
      // versie waarvan we het meeste weten.
      if (!bestaand || (bestaand.b === null && track.b !== null)) {
        gevonden.set(id, track);
      }
    }
  }

  positie = xml.indexOf("<TRACK", einde);
}

const tracks = [...gevonden.values()].sort((a, b) =>
  `${a.a} ${a.t}`.localeCompare(`${b.a} ${b.t}`, "nl")
);

const metBpm = tracks.filter((track) => track.b !== null).length;

await writeFile(
  doel,
  `${JSON.stringify(
    {
      gemaakt: new Date().toISOString().slice(0, 10),
      aantal: tracks.length,
      tracks,
    },
    null,
    0
  )}\n`
);

console.log(`Gelezen uit ${bron}`);
console.log(`  ${bekeken} tracks in de collectie`);
if (overgeslagen) console.log(`  ${overgeslagen} zonder titel overgeslagen`);
console.log(`  ${bekeken - tracks.length - overgeslagen} dubbelen samengevoegd`);
console.log(`  ${tracks.length} nummers weggeschreven naar ${doel}`);
console.log(`  ${metBpm} daarvan met een bpm`);
if (tracks.length > 50000) {
  console.log("  Let op: dit is een flinke lijst; de site wordt er wat zwaarder van.");
}
