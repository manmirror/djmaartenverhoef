import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { vindFeest } from "@/app/verzoekjes/feesten";
import { zetOpen } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/**
 * Een feest met de hand openzetten. Voor het geval de datum in de agenda niet
 * klopt en de gasten er al staan: dan hoeft er niets opnieuw gedeployd te
 * worden. Vervalt na twaalf uur vanzelf.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  let body: { feest?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const feest = vindFeest((body.feest ?? "").trim());
  if (!feest) return Response.json({ error: "invalid" }, { status: 400 });

  await zetOpen(feest.slug);
  return Response.json({ ok: true });
}
