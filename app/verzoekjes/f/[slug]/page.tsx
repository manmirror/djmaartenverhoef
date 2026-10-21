import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import VerzoekPagina from "../../VerzoekPagina";
import { alleFeesten, vindFeest } from "../../feesten";
import { isHandmatigOpen } from "../../store";

/** De pagina's van alle bekende feesten vooraf klaarzetten. */
export function generateStaticParams() {
  return alleFeesten().map((feest) => ({ slug: feest.slug }));
}

export async function generateMetadata(
  props: PageProps<"/verzoekjes/f/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const feest = vindFeest(slug);

  return {
    title: feest ? `Verzoekje — ${feest.naam}` : "Verzoekje",
    robots: { index: false, follow: false },
  };
}

export default async function FeestPagina(props: PageProps<"/verzoekjes/f/[slug]">) {
  const { slug } = await props.params;
  const feest = vindFeest(slug);
  if (!feest) notFound();

  // Of het feest open is hangt van het moment af; niet vooraf uitrekenen.
  await connection();

  return (
    <VerzoekPagina feest={feest} handmatigOpen={await isHandmatigOpen(feest.slug)} />
  );
}
