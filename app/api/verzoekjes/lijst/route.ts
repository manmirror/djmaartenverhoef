import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { collectieAantal } from "@/app/verzoekjes/collectie";
import {
  alleFeesten,
  feestVoorBooth,
  naarInfo,
  venster,
  vindFeest,
} from "@/app/verzoekjes/feesten";
import { leesOudeVerzoekjesIn } from "@/app/verzoekjes/import";
import { feestVoorAlgemeen, openstandVan } from "@/app/verzoekjes/schakelaar";
import {
  leesSchakelaars,
  leesVerzoeken,
  opslagActief,
  opslagInfo,
} from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/**
 * De lijst voor de boothpagina. Zonder `feest` kiest hij zelf: het feest dat op
 * Aan staat, anders het feest dat nu aan de gang is, anders het feest dat het
 * dichtst bij vandaag ligt. Alleen met de juiste code.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const nu = Date.now();
  const schakelaars = await leesSchakelaars();
  const gevraagd = new URL(request.url).searchParams.get("feest");
  const opAan = schakelaars.aan ? vindFeest(schakelaars.aan.feest) : null;
  const feest = gevraagd ? vindFeest(gevraagd) : (opAan ?? feestVoorBooth(nu));

  const agenda = alleFeesten().map((ander) => ({
    ...naarInfo(ander, nu),
    ...openstandVan(ander, schakelaars, nu),
  }));

  // Waar de sticker en de algemene QR-code nu naartoe wijzen.
  const algemeenGekozen = feestVoorAlgemeen(schakelaars, nu);
  const algemeen =
    algemeenGekozen && algemeenGekozen.stand !== "uit"
      ? { slug: algemeenGekozen.feest.slug, naam: algemeenGekozen.feest.naam }
      : null;

  if (!feest) {
    return Response.json({
      feest: null,
      verzoeken: [],
      agenda,
      algemeen,
      opslag: opslagActief(),
      opslagInfo: opslagInfo(),
      collectie: collectieAantal(),
    });
  }

  await leesOudeVerzoekjesIn([feest]);
  const tijden = venster(feest);

  return Response.json({
    feest: {
      ...naarInfo(feest, nu),
      ...openstandVan(feest, schakelaars, nu),
      venster: tijden,
      // Waar we staan ten opzichte van het agendavenster, voor de uitleg bij
      // de schakelaar. Hier uitgerekend, zodat de klok van het apparaat in
      // de booth er niet toe doet.
      fase: nu < tijden.van ? "voor" : nu >= tijden.tot ? "na" : "tijdens",
    },
    verzoeken: await leesVerzoeken(feest.slug),
    agenda,
    algemeen,
    opslag: opslagActief(),
    opslagInfo: opslagInfo(),
    collectie: collectieAantal(),
  });
}
