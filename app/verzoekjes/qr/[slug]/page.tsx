import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { siteContent } from "@/content/site";

import PrintKnop from "../PrintKnop";
import { vindInAgenda } from "../../agenda";
import { datumVoluit } from "../../feesten";

/** De poster zonder feest eraan, die naar het algemene adres wijst. */
const ALGEMEEN = "algemeen";

export async function generateMetadata(
  props: PageProps<"/verzoekjes/qr/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const feest = slug === ALGEMEEN ? null : await vindInAgenda(slug);

  return {
    title: feest ? `QR-code — ${feest.naam}` : "QR-code verzoekjes",
    robots: { index: false, follow: false },
  };
}

export default async function QrPoster(props: PageProps<"/verzoekjes/qr/[slug]">) {
  // Naam, datum en plaats kunnen in de booth veranderd zijn: altijd vers lezen.
  await connection();

  const { slug } = await props.params;
  const teksten = siteContent.verzoekjes;

  const feest = slug === ALGEMEEN ? null : await vindInAgenda(slug);
  if (!feest && slug !== ALGEMEEN) notFound();

  const code = `/api/verzoekjes/qr/${slug}`;
  const bestandsnaam = slug === ALGEMEEN ? "verzoekjes" : `verzoekjes-${slug}`;

  return (
    <main className="qr-pagina">
      {/* Dit blok is de poster zelf: op papier blijft alleen dit over. */}
      <div className="qr-poster">
        <div className="qr-kop">{teksten.posterKop}</div>
        <p className="qr-regel">{teksten.posterRegel}</p>

        <div className="qr-kaart">
          {/* Donkere code op wit: zo lezen telefooncamera's hem het best. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={code}
            alt={
              feest
                ? `QR-code voor het feest van ${feest.naam}`
                : `QR-code naar ${teksten.posterUrl}`
            }
            width={520}
            height={520}
          />
        </div>

        {feest ? (
          <>
            <p className="qr-url">{feest.naam}</p>
            <p className="qr-datum">
              {datumVoluit(feest)}
              {feest.plaats && ` · ${feest.plaats}`}
            </p>
          </>
        ) : (
          <p className="qr-url">{teksten.posterUrl}</p>
        )}
        <p className="qr-voet">{teksten.posterVoet}</p>
      </div>

      {/* Alles hieronder is voor het scherm; op papier valt het weg. */}
      <div className="qr-acties">
        <PrintKnop />
        <a className="qr-knop qr-knop-zacht" href={`${code}?type=png`} download={`${bestandsnaam}.png`}>
          Download PNG — om te delen
        </a>
        <a className="qr-knop qr-knop-zacht" href={code} download={`${bestandsnaam}.svg`}>
          Download SVG — om te printen
        </a>
        <Link className="qr-terug" href="/verzoekjes/qr">
          Alle posters
        </Link>
      </div>
    </main>
  );
}
