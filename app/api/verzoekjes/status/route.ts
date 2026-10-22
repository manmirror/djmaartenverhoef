import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { naarMatch, trackOp } from "@/app/verzoekjes/collectie";
import { vindInAgenda } from "@/app/verzoekjes/agenda";
import { verwijderVerzoek, zetMatch, zetStatus } from "@/app/verzoekjes/store";
import type { VerzoekStatus } from "@/app/verzoekjes/types";

export const runtime = "nodejs";

const STATUSSEN: VerzoekStatus[] = ["nieuw", "gedraaid", "overgeslagen"];

/**
 * Een verzoekje afvinken, overslaan, terugzetten, weghalen of aan een ander
 * nummer koppelen. Altijd binnen één feest, en alleen met de juiste code.
 *
 * Er is met opzet geen knop om een hele lijst te wissen: die lijsten vormen
 * samen het archief waar de jaarlijst uit komt.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  let body: {
    feest?: string;
    id?: string;
    status?: string;
    verwijder?: boolean;
    /** Het gekozen nummer uit de zoekfunctie, of null voor "geen match". */
    koppel?: { nr: number; titel: string; artiest: string } | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const feest = await vindInAgenda((body.feest ?? "").trim());
  if (!feest || !body.id) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  if (body.verwijder) {
    const weg = await verwijderVerzoek(feest.slug, body.id);
    return weg
      ? Response.json({ ok: true })
      : Response.json({ error: "onbekend" }, { status: 404 });
  }

  if (body.koppel !== undefined) {
    let match = null;
    if (body.koppel !== null) {
      const track = trackOp(Number(body.koppel.nr));
      // De booth stuurt titel en artiest mee. Klopt dat niet meer met wat er
      // op die plek staat, dan is de collectie intussen vernieuwd.
      if (
        !track ||
        track.t !== body.koppel.titel ||
        track.a !== body.koppel.artiest
      ) {
        return Response.json({ error: "collectie-veranderd" }, { status: 409 });
      }
      match = naarMatch(track, { handmatig: true });
    }
    const gelukt = await zetMatch(feest.slug, body.id, match);
    return gelukt
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
