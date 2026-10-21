import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { alleFeesten, naarInfo, venster } from "@/app/verzoekjes/feesten";
import { leesOudeVerzoekjesIn } from "@/app/verzoekjes/import";
import { leesMeerdere } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/**
 * Het archief voor de booth: alle feesten die al begonnen zijn, nieuwste
 * bovenaan, met per feest hoeveel verzoekjes er waren. Alleen met de juiste
 * code.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const nu = Date.now();
  const geweest = alleFeesten().filter((feest) => venster(feest).van <= nu);

  await leesOudeVerzoekjesIn(geweest);
  const lijsten = await leesMeerdere(geweest.map((feest) => feest.slug));

  return Response.json({
    feesten: geweest.map((feest) => {
      const verzoeken = lijsten.get(feest.slug) ?? [];
      return {
        ...naarInfo(feest, nu),
        aantal: verzoeken.length,
        gekoppeld: verzoeken.filter((verzoek) => verzoek.match !== null).length,
        gedraaid: verzoeken.filter((verzoek) => verzoek.status === "gedraaid").length,
      };
    }),
  });
}
