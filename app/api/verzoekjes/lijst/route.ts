import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { collectieAantal } from "@/app/verzoekjes/collectie";
import { leesVerzoeken, opslagActief } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/** De lijst voor de boothpagina. Alleen met de juiste code. */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  return Response.json({
    verzoeken: await leesVerzoeken(),
    opslag: opslagActief(),
    collectie: collectieAantal(),
  });
}
