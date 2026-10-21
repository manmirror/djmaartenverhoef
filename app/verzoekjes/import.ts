// Verzoekjes van feesten van vóór de verzoekjespagina. Die staan als lijstje in
// content/feesten.ts; hier zetten we ze de eerste keer in de database, gekoppeld
// aan de collectie. Daarna zijn het gewone verzoekjes: te corrigeren, af te
// vinken en mee te tellen in de jaarlijst.

import { naarMatch, vindInCollectie } from "./collectie";
import { tijdstipVoorRegel, type Feest } from "./feesten";
import { importStand, voegToeAlsNieuw, zetImportStand } from "./store";

/** Leest de nog niet ingelezen regels van deze feesten in. */
export async function leesOudeVerzoekjesIn(feesten: Feest[]): Promise<void> {
  await Promise.all(feesten.map(leesFeestIn));
}

async function leesFeestIn(feest: Feest): Promise<void> {
  const regels = feest.verzoekjes ?? [];
  if (regels.length === 0) return;

  // Alleen wat er nieuw bij is gekomen: wat al eens is ingelezen en daarna in
  // de booth is weggehaald, moet weg blijven.
  const stand = await importStand(feest.slug);
  if (stand >= regels.length) return;

  for (let nummer = stand; nummer < regels.length; nummer++) {
    const titel = regels[nummer].trim().replace(/\s+/g, " ");
    if (!titel) continue;
    const treffer = vindInCollectie(titel, "");

    await voegToeAlsNieuw({
      id: `import-${feest.slug}-${nummer}`,
      feest: feest.slug,
      titel,
      artiest: "",
      van: "",
      match: treffer
        ? naarMatch(treffer.track, {
            versies: treffer.versies,
            andereArtiest: treffer.andereArtiest,
          })
        : null,
      status: "nieuw",
      tijd: tijdstipVoorRegel(feest, nummer),
    });
  }

  await zetImportStand(feest.slug, regels.length);
}
