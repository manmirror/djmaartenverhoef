import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { normaliseer } from "@/app/verzoekjes/collectie";
import { alleFeesten, jaarVan } from "@/app/verzoekjes/feesten";
import { leesMeerdere } from "@/app/verzoekjes/store";
import type { TopNummer } from "@/app/verzoekjes/types";

export const runtime = "nodejs";

/** Zoveel nummers staan er hoogstens in de lijst. */
const MAX_TOP = 100;

/**
 * De jaarlijst: welke nummers het vaakst gevraagd zijn. Zonder `jaar` telt hij
 * alles mee. Alleen met de juiste code.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const gevraagd = new URL(request.url).searchParams.get("jaar");
  const jaar = gevraagd ? Number(gevraagd) : null;

  const agenda = alleFeesten().filter(
    (feest) => jaar === null || jaarVan(feest) === jaar
  );
  const lijsten = await leesMeerdere(agenda.map((feest) => feest.slug));

  // Per nummer optellen. Verschillende schrijfwijzes van dezelfde plaat
  // belanden onder dezelfde noemer.
  type Teller = TopNummer & { feestSlugs: Set<string> };
  const tellers = new Map<string, Teller>();

  for (const verzoeken of lijsten.values()) {
    for (const verzoek of verzoeken) {
      const kenmerk = `${normaliseer(verzoek.titel)}|${normaliseer(verzoek.artiest)}`;
      let teller = tellers.get(kenmerk);
      if (!teller) {
        teller = {
          titel: verzoek.titel,
          artiest: verzoek.artiest,
          bpm: verzoek.bpm,
          aantal: 0,
          gedraaid: 0,
          feesten: 0,
          feestSlugs: new Set(),
        };
        tellers.set(kenmerk, teller);
      }
      teller.aantal += 1;
      if (verzoek.status === "gedraaid") teller.gedraaid += 1;
      if (teller.bpm === null && verzoek.bpm !== null) teller.bpm = verzoek.bpm;
      teller.feestSlugs.add(verzoek.feest);
    }
  }

  const top: TopNummer[] = [...tellers.values()]
    .map(({ feestSlugs, ...rest }) => ({ ...rest, feesten: feestSlugs.size }))
    .sort((a, b) => b.aantal - a.aantal || b.gedraaid - a.gedraaid)
    .slice(0, MAX_TOP);

  const totaal = [...lijsten.values()].reduce((som, lijst) => som + lijst.length, 0);

  return Response.json({
    jaar,
    jaren: [...new Set(alleFeesten().map(jaarVan))].sort((a, b) => b - a),
    feesten: agenda.length,
    totaal,
    top,
  });
}
