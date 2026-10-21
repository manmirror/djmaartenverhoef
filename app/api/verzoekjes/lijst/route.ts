import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { collectieAantal } from "@/app/verzoekjes/collectie";
import {
  alleFeesten,
  feestVoorBooth,
  isOpen,
  naarInfo,
  vindFeest,
} from "@/app/verzoekjes/feesten";
import { leesOudeVerzoekjesIn } from "@/app/verzoekjes/import";
import { isHandmatigOpen, leesVerzoeken, opslagActief } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/**
 * De lijst voor de boothpagina. Zonder `feest` kiest hij zelf het feest dat nu
 * aan de gang is, of anders het feest dat het dichtst bij vandaag ligt.
 * Alleen met de juiste code.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const gevraagd = new URL(request.url).searchParams.get("feest");
  const feest = gevraagd ? vindFeest(gevraagd) : feestVoorBooth();

  const agenda = alleFeesten().map((ander) => naarInfo(ander));

  if (!feest) {
    return Response.json({
      feest: null,
      verzoeken: [],
      agenda,
      opslag: opslagActief(),
      collectie: collectieAantal(),
    });
  }

  await leesOudeVerzoekjesIn([feest]);
  const handmatig = await isHandmatigOpen(feest.slug);

  return Response.json({
    feest: { ...naarInfo(feest), open: isOpen(feest) || handmatig, handmatig },
    verzoeken: await leesVerzoeken(feest.slug),
    agenda,
    opslag: opslagActief(),
    collectie: collectieAantal(),
  });
}
