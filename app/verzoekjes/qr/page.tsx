import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";

import { leesAgenda } from "../agenda";
import { datumVoluit } from "../feesten";

export const metadata: Metadata = {
  title: "QR-codes verzoekjes — DJ Maarten Verhoef",
  robots: { index: false, follow: false },
};

/** Overzicht van alle posters: één per feest. */
export default async function QrOverzicht() {
  // De agenda wordt in de booth bijgehouden: altijd vers lezen.
  await connection();
  const feesten = await leesAgenda();

  return (
    <main className="qro">
      <h1>QR-codes</h1>
      <p className="qro-intro">
        Elk feest heeft zijn eigen code. Klik erop voor de poster, om te printen
        of te downloaden.
      </p>

      <ul className="qro-lijst">
        {feesten.map((feest) => (
          <li key={feest.slug}>
            <Link href={`/verzoekjes/qr/${feest.slug}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/verzoekjes/qr/${feest.slug}`}
                alt=""
                width={120}
                height={120}
              />
              <span>
                <strong>{feest.naam}</strong>
                <small>{datumVoluit(feest)}</small>
              </span>
            </Link>
          </li>
        ))}

      </ul>

      {feesten.length === 0 && (
        <p className="qro-leeg">
          Er staan nog geen feesten in de agenda. Maak ze aan in de booth, onder Agenda.
        </p>
      )}
    </main>
  );
}
