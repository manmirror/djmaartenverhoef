import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { vindFeest } from "@/app/verzoekjes/feesten";
import { opslagActief, zetStand, type Stand } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

const STANDEN: Stand[] = ["automatisch", "aan", "uit"];

/**
 * De aan/uit-schakelaar van een feest: Automatisch, Aan of Uit. Alleen met de
 * juiste code, en alleen met een database: zonder database heeft elke server
 * zijn eigen geheugen en zou de schakelaar maar op één ervan staan.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  if (!opslagActief()) {
    return Response.json({ error: "geen-database" }, { status: 409 });
  }

  let body: { feest?: string; stand?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const feest = vindFeest((body.feest ?? "").trim());
  const stand = body.stand as Stand | undefined;
  if (!feest || !stand || !STANDEN.includes(stand)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  await zetStand(feest.slug, stand);
  return Response.json({ ok: true });
}
