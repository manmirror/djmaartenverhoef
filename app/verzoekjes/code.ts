// De boothpagina zit achter een code. Die code staat als VERZOEKJES_CODE in de
// omgevingsvariabelen van Vercel; staat hij daar niet, dan gaat de boothpagina
// op slot in plaats van open.

import { timingSafeEqual } from "node:crypto";

import { geefIp, teVaak } from "./store";

/** Bij elk verzoek meegegeven door de boothpagina. */
export const CODE_HEADER = "x-verzoekjes-code";

export function codeIsIngesteld(): boolean {
  return Boolean(process.env.VERZOEKJES_CODE);
}

function klopt(gegeven: string): boolean {
  const juist = process.env.VERZOEKJES_CODE ?? "";
  if (!juist) return false;
  const a = Buffer.from(gegeven);
  const b = Buffer.from(juist);
  // Even lang maken zou niets opleveren: een verschil in lengte is al genoeg
  // om te weten dat de code niet klopt.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type CodeUitkomst = "ok" | "geen-code" | "fout" | "te-vaak";

/**
 * Controleert de code uit de header, met een rem op foute pogingen zodat
 * niemand hem kan doorproberen.
 */
export async function controleerCode(request: Request): Promise<CodeUitkomst> {
  if (!codeIsIngesteld()) return "geen-code";

  const gegeven = request.headers.get(CODE_HEADER) ?? "";
  if (klopt(gegeven)) return "ok";

  if (await teVaak(geefIp(request), "code", 10)) return "te-vaak";
  return "fout";
}

/** Het antwoord dat bij een mislukte controle hoort. */
export function codeAntwoord(uitkomst: Exclude<CodeUitkomst, "ok">): Response {
  if (uitkomst === "geen-code") {
    console.error("VERZOEKJES_CODE ontbreekt; de boothpagina blijft dicht.");
    return Response.json({ error: "geen-code" }, { status: 503 });
  }
  if (uitkomst === "te-vaak") {
    return Response.json({ error: "te-vaak" }, { status: 429 });
  }
  return Response.json({ error: "fout" }, { status: 401 });
}
