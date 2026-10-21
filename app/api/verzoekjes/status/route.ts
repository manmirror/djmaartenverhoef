import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { wisVerzoeken, zetStatus } from "@/app/verzoekjes/store";
import type { VerzoekStatus } from "@/app/verzoekjes/types";

export const runtime = "nodejs";

const STATUSSEN: VerzoekStatus[] = ["nieuw", "gedraaid", "overgeslagen"];

/**
 * Een verzoekje afvinken, overslaan of terugzetten — en met `{ wis: true }` de
 * hele lijst leegmaken voor een volgende avond. Alleen met de juiste code.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  let body: { id?: string; status?: string; wis?: boolean };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  if (body.wis) {
    await wisVerzoeken();
    return Response.json({ ok: true });
  }

  const status = body.status as VerzoekStatus | undefined;
  if (!body.id || !status || !STATUSSEN.includes(status)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const gelukt = await zetStatus(body.id, status);
  if (!gelukt) {
    return Response.json({ error: "onbekend" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
