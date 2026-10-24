// De agenda zoals hij nu is: de feesten uit content/feesten.ts, met wat er in
// de booth aan is veranderd eroverheen, plus de feesten die in de booth zijn
// aangemaakt. Gebruik dit overal waar een feest opgezocht of getoond wordt.

import { basisFeesten, opDatum, vindIn, type Feest } from "./feesten";
import { leesAanpassingen, type Aanpassing } from "./store";

/** Een feest uit het agendabestand, met eventuele aanpassingen uit de booth. */
function pasToe(feest: Feest, aanpassing: Aanpassing | undefined): Feest {
  if (!aanpassing) return feest;
  return {
    ...feest,
    naam: aanpassing.naam ?? feest.naam,
    datum: aanpassing.datum ?? feest.datum,
    plaats: aanpassing.plaats === undefined ? feest.plaats : (aanpassing.plaats ?? undefined),
    test: aanpassing.test ?? feest.test,
  };
}

export function stelSamen(aanpassingen: Map<string, Aanpassing>): Feest[] {
  const basis = basisFeesten();
  const slugs = new Set(basis.map((feest) => feest.slug));
  const agenda: Feest[] = [];

  for (const feest of basis) {
    const aanpassing = aanpassingen.get(feest.slug);
    if (aanpassing?.verwijderd) continue;
    agenda.push(pasToe(feest, aanpassing));
  }

  for (const [slug, aanpassing] of aanpassingen) {
    if (slugs.has(slug) || !aanpassing.nieuw || aanpassing.verwijderd) continue;
    if (!aanpassing.naam || !aanpassing.datum) continue;
    agenda.push({
      slug,
      naam: aanpassing.naam,
      datum: aanpassing.datum,
      plaats: aanpassing.plaats ?? undefined,
      test: aanpassing.test,
    });
  }

  return opDatum(agenda);
}

/** Alle feesten, nieuwste bovenaan. */
export async function leesAgenda(): Promise<Feest[]> {
  return stelSamen(await leesAanpassingen());
}

export async function vindInAgenda(slug: string): Promise<Feest | null> {
  return vindIn(await leesAgenda(), slug);
}

/** "Bo Chantal & Mitchel" → "bo-chantal-en-mitchel". */
export function maakSlug(naam: string, datum: string, bezet: Set<string>): string {
  const basis =
    naam
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/&/g, " en ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/g, "") || "feest";

  const kandidaten = [basis, `${basis}-${datum}`];
  for (const kandidaat of kandidaten) {
    if (!bezet.has(kandidaat)) return kandidaat;
  }
  let teller = 2;
  while (bezet.has(`${basis}-${datum}-${teller}`)) teller++;
  return `${basis}-${datum}-${teller}`;
}
