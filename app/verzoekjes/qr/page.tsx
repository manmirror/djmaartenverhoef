import type { Metadata } from "next";
import Link from "next/link";

import { alleFeesten, datumVoluit } from "../feesten";

export const metadata: Metadata = {
  title: "QR-codes verzoekjes — DJ Maarten Verhoef",
  robots: { index: false, follow: false },
};

/** Overzicht van alle posters: één per feest, plus de algemene. */
export default function QrOverzicht() {
  const feesten = alleFeesten();

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

        <li>
          <Link href="/verzoekjes/qr/algemeen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/api/verzoekjes/qr/algemeen" alt="" width={120} height={120} />
            <span>
              <strong>Algemene code</strong>
              <small>wijst naar het feest dat op dat moment aan de gang is</small>
            </span>
          </Link>
        </li>
      </ul>

      {feesten.length === 0 && (
        <p className="qro-leeg">
          Er staan nog geen feesten in de agenda. Zet ze in content/feesten.ts.
        </p>
      )}
    </main>
  );
}
