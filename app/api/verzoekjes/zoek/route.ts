import { collectieIsGevuld, zoek } from "@/app/verzoekjes/collectie";

export const runtime = "nodejs";

const MAX_VRAAG = 80;

/**
 * Zoekhulp voor het verzoekjesformulier: geeft nummers uit de rekordbox-
 * collectie die op de ingetypte tekst lijken, met bpm erbij. Is de collectie
 * nog niet ingelezen, dan komt er een lege lijst terug en laat het formulier
 * simpelweg geen suggesties zien.
 */
export async function GET(request: Request) {
  const vraag = (new URL(request.url).searchParams.get("q") ?? "").slice(0, MAX_VRAAG);

  return Response.json({
    collectie: collectieIsGevuld(),
    suggesties: collectieIsGevuld() ? zoek(vraag) : [],
  });
}
