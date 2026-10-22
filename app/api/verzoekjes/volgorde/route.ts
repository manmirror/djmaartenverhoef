import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { vindInAgenda } from "@/app/verzoekjes/agenda";
import { zetVolgorde } from "@/app/verzoekjes/store";

export const runtime = "nodejs";

/** Ruim boven het maximum van een lijst, als rem op rare verzoeken. */
const MAX_IDS = 500;

/**
 * De volgorde die de DJ in de booth heeft gesleept: alle ids van het feest,
 * van boven naar beneden. Alleen met de juiste code.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  let body: { feest?: string; ids?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const feest = await vindInAgenda((body.feest ?? "").trim());
  const ids = body.ids;
  if (
    !feest ||
    !Array.isArray(ids) ||
    ids.length > MAX_IDS ||
    !ids.every((id) => typeof id === "string" && id.length > 0 && id.length < 100)
  ) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  await zetVolgorde(feest.slug, ids as string[]);
  return Response.json({ ok: true });
}
