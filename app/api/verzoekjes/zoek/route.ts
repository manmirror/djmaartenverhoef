import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { zoekInCollectie } from "@/app/verzoekjes/collectie";

export const runtime = "nodejs";

const MAX_VRAAG = 100;

/**
 * Zoeken in de collectie, voor het met de hand koppelen in de booth. Alleen
 * met de juiste code: gasten zien de collectie niet.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const vraag = (new URL(request.url).searchParams.get("q") ?? "").slice(0, MAX_VRAAG);
  return Response.json({ resultaten: zoekInCollectie(vraag) });
}
