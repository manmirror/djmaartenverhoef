import type { Metadata } from "next";
import Link from "next/link";

import { siteContent } from "@/content/site";

import PrintKnop from "./PrintKnop";

export const metadata: Metadata = {
  title: "QR-code verzoekjes — DJ Maarten Verhoef",
  robots: { index: false, follow: false },
};

export default function QrPagina() {
  const teksten = siteContent.verzoekjes;

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
            src="/verzoekjes-qr.svg"
            alt={`QR-code naar ${teksten.posterUrl}`}
            width={520}
            height={520}
          />
        </div>

        <p className="qr-url">{teksten.posterUrl}</p>
        <p className="qr-voet">{teksten.posterVoet}</p>
      </div>

      {/* Alles hieronder is voor het scherm; op papier valt het weg. */}
      <div className="qr-acties">
        <PrintKnop />
        <a className="qr-knop qr-knop-zacht" href="/verzoekjes-qr.png" download>
          Download PNG — om te delen
        </a>
        <a className="qr-knop qr-knop-zacht" href="/verzoekjes-qr.svg" download>
          Download SVG — om te printen
        </a>
        <Link className="qr-terug" href="/verzoekjes">
          Bekijk het formulier
        </Link>
      </div>
    </main>
  );
}
