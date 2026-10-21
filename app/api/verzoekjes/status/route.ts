import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { vindFeest } from "@/app/verzoekjes/feesten";
import { verwijderVerzoek, zetStatus } from "@/app/verzoekjes/store";
import type { VerzoekStatus } from "@/app/verzoekjes/types";

export const runtime = "nodejs";

const STATUSSEN: VerzoekStatus[] = ["nieuw", "gedraaid", "overgeslagen"];

/**
 * Een verzoekje afvinken, overslaan, terugzetten of weghalen. Altijd binnen
 * één feest, en alleen met de juiste code.
 *
 * Er is met opzet geen knop om een hele lijst te wissen: die lijsten vormen
 * samen het archief waar de jaarlijst uit komt.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  let body: { feest?: string; id?: string; status?: string; verwijder?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const feest = vindFeest((body.feest ?? "").trim());
  if (!feest || !body.id) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  if (body.verwijder) {
    const weg = await verwijderVerzoek(feest.slug, body.id);
    return weg
      ? Response.json({ ok: true })
      : Response.json({ error: "onbekend" }, { status: 404 });
  }

  const status = body.status as VerzoekStatus | undefined;
  if (!status || !STATUSSEN.includes(status)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const gelukt = await zetStatus(feest.slug, body.id, status);
  return gelukt
    ? Response.json({ ok: true })
    : Response.json({ error: "onbekend" }, { status: 404 });
}
