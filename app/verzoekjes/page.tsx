import type { Metadata } from "next";
import { connection } from "next/server";

import VerzoekPagina from "./VerzoekPagina";
import { feestNu, volgendFeest } from "./feesten";

export const metadata: Metadata = {
  title: "Verzoekje — DJ Maarten Verhoef",
  description: "Vraag een nummer aan bij DJ Maarten Verhoef.",
  // Deze pagina is voor de gasten op een feest, niet voor Google.
  robots: { index: false, follow: false },
};

/**
 * Het algemene adres. Handig voor een poster die je vaker gebruikt: hij wijst
 * automatisch naar het feest dat op dat moment aan de gang is.
 */
export default async function Verzoekjes() {
  // Welk feest er nu is hangt van het moment af, dus niet vooraf uitrekenen.
  await connection();

  return <VerzoekPagina feest={feestNu()} volgende={volgendFeest()} />;
}
