import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import VerzoekPagina from "../../VerzoekPagina";
import { vindInAgenda } from "../../agenda";
import { openstand } from "../../schakelaar";

export async function generateMetadata(
  props: PageProps<"/verzoekjes/f/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const feest = await vindInAgenda(slug);

  return {
    title: feest ? `Verzoekje — ${feest.naam}` : "Verzoekje",
    robots: { index: false, follow: false },
  };
}

export default async function FeestPagina(props: PageProps<"/verzoekjes/f/[slug]">) {
  // De agenda wordt in de booth bijgehouden, en of het feest open is hangt van
  // het moment af; niets hiervan vooraf uitrekenen.
  await connection();

  const { slug } = await props.params;
  const feest = await vindInAgenda(slug);
  if (!feest) notFound();

  return (
    <VerzoekPagina feest={feest} stand={(await openstand(feest)).stand} />
  );
}
