import type { Metadata } from "next";
import { connection } from "next/server";

import VerzoekPagina from "./VerzoekPagina";
import { leesAgenda } from "./agenda";
import { volgendFeest } from "./feesten";
import { feestVoorAlgemeen } from "./schakelaar";
import { leesSchakelaars } from "./store";

export const metadata: Metadata = {
  title: "Verzoekje — DJ Maarten Verhoef",
  description: "Vraag een nummer aan bij DJ Maarten Verhoef.",
  // Deze pagina is voor de gasten op een feest, niet voor Google.
  robots: { index: false, follow: false },
};

/**
 * Het algemene adres, waar de sticker en de algemene QR-code naartoe wijzen.
 * Toont het feest dat in de booth op Aan staat, en anders het feest dat volgens
 * de agenda bezig is.
 */
export default async function Verzoekjes() {
  // Welk feest er nu is hangt van het moment af, dus niet vooraf uitrekenen.
  await connection();

  const agenda = await leesAgenda();
  const gekozen = feestVoorAlgemeen(agenda, await leesSchakelaars());

  return (
    <VerzoekPagina
      feest={gekozen?.feest ?? null}
      stand={gekozen?.stand}
      volgende={volgendFeest(agenda)}
    />
  );
}
