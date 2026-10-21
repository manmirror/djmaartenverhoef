import type { Metadata } from "next";
import Link from "next/link";

import { siteContent } from "@/content/site";

import PrintKnop from "../qr/PrintKnop";

export const metadata: Metadata = {
  title: "Sticker verzoekjes — DJ Maarten Verhoef",
  robots: { index: false, follow: false },
};

/**
 * Een vierkante sticker van 20 × 20 cm, voor op de laptop. Met de algemene
 * code: die wijst altijd naar het feest dat op dat moment bezig is, dus de
 * sticker werkt op elk feest.
 *
 * Met ?afloop=3 komt er rondom 3 mm extra achtergrond bij, voor drukkerijen die
 * om "afloop" (bleed) vragen: dan blijft er na het snijden geen witte rand over.
 */
/** De kleuren van het verloop op de site: roze, paars, oranje. */
const VERLOOP: [number, number, number][] = [
  [0xff, 0x2f, 0x7e],
  [0x8b, 0x5c, 0xf6],
  [0xff, 0x8a, 0x3d],
];

/** De kleur op plek `t` (0 tot 1) in het verloop. */
function kleurOp(t: number): string {
  const stuk = Math.min(VERLOOP.length - 2, Math.floor(t * (VERLOOP.length - 1)));
  const binnen = t * (VERLOOP.length - 1) - stuk;
  const [van, naar] = [VERLOOP[stuk], VERLOOP[stuk + 1]];
  const kanaal = (i: number) => Math.round(van[i] + (naar[i] - van[i]) * binnen);
  return `rgb(${kanaal(0)}, ${kanaal(1)}, ${kanaal(2)})`;
}

export default async function Sticker(props: PageProps<"/verzoekjes/sticker">) {
  const { afloop } = await props.searchParams;
  const metAfloop = afloop === "3";
  const teksten = siteContent.verzoekjes;

  return (
    <main className="st-pagina">
      <div className={metAfloop ? "st-vel st-vel-afloop" : "st-vel"}>
        <div className="st-binnen">
          {/* Elke letter een eigen, effen kleur in plaats van een echt
              kleurverloop: tekst met een verloop komt niet goed uit een pdf
              (een dun kader, of een blok kleur zonder letters). Zo lijkt het
              op het verloop van de site en drukt het overal goed. */}
          <div className="st-kop" aria-label={teksten.posterKop}>
            {[...teksten.posterKop].map((letter, nummer, letters) => (
              <span
                key={nummer}
                aria-hidden="true"
                style={{ color: kleurOp(nummer / Math.max(1, letters.length - 1)) }}
              >
                {letter}
              </span>
            ))}
          </div>
          <p className="st-regel">{teksten.posterRegel}</p>
          <div className="st-kaart">
            {/* Donkere code op wit: zo lezen telefooncamera's hem het best. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/verzoekjes/qr/algemeen" alt={`QR-code naar ${teksten.posterUrl}`} />
          </div>
          <p className="st-url">{teksten.posterUrl}</p>
          <p className="st-voet">{teksten.posterVoet}</p>
        </div>
      </div>

      {/* Alles hieronder is voor het scherm; op papier valt het weg. */}
      <div className="qr-acties st-acties">
        <PrintKnop label="Print of bewaar als pdf" />
        <p className="st-uitleg">
          20 × 20 cm. Kies in het printvenster <strong>Marges: geen</strong> en zet{" "}
          <strong>Achtergrondafbeeldingen</strong> aan.
          {metAfloop ? (
            <>
              {" "}Dit is de versie met 3 mm afloop (20,6 × 20,6 cm).{" "}
              <Link href="/verzoekjes/sticker">Zonder afloop</Link>
            </>
          ) : (
            <>
              {" "}Vraagt de drukker om afloop?{" "}
              <Link href="/verzoekjes/sticker?afloop=3">Versie met 3 mm afloop</Link>
            </>
          )}
        </p>
        <Link className="qr-terug" href="/verzoekjes/qr">
          Alle posters
        </Link>
      </div>
    </main>
  );
}
