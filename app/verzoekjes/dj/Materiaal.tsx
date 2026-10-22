"use client";

import { useState } from "react";

import { siteContent } from "@/content/site";

type Props = {
  feest: { slug: string; naam: string };
};

/**
 * Alles wat je bij een feest wilt downloaden of delen, bij elkaar: de poster,
 * de QR-code als plaatje, de link voor de gasten, en de sticker met de
 * algemene code. Ingeklapt, zodat het tijdens een feest niet in de weg zit.
 */
export default function Materiaal({ feest }: Props) {
  const [gekopieerd, setGekopieerd] = useState(false);

  const code = `/api/verzoekjes/qr/${feest.slug}`;
  const bestandsnaam = `verzoekjes-${feest.slug}`;
  // Het echte adres, zoals het ook in de QR-code staat.
  const link = `${siteContent.siteUrl}/verzoekjes/f/${feest.slug}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `Verzoekje voor ${feest.naam}? Vraag hier je nummer aan: ${link}`
  )}`;

  async function kopieer() {
    try {
      await navigator.clipboard.writeText(link);
      setGekopieerd(true);
      setTimeout(() => setGekopieerd(false), 2000);
    } catch {
      // Geen toegang tot het klembord: dan maar de link zelf selecteren.
      window.prompt("Kopieer de link:", link);
    }
  }

  return (
    <details className="bt-materiaal">
      <summary>Posters, QR-codes en link</summary>

      <div className="bt-materiaal-groep">
        <span className="bt-materiaal-kop">{feest.naam}</span>
        <div className="bt-materiaal-knoppen">
          <a className="bt-mini" href={`/verzoekjes/qr/${feest.slug}`} target="_blank" rel="noopener">
            Poster A4 (printen of pdf)
          </a>
          <a className="bt-mini" href={`${code}?type=png`} download={`${bestandsnaam}.png`}>
            QR-code PNG
          </a>
          <a className="bt-mini" href={code} download={`${bestandsnaam}.svg`}>
            QR-code SVG
          </a>
        </div>
        <div className="bt-materiaal-link">
          <code>{link}</code>
          <div className="bt-materiaal-knoppen">
            <button type="button" className="bt-mini" onClick={kopieer}>
              {gekopieerd ? "Gekopieerd ✓" : "Kopieer link"}
            </button>
            <a className="bt-mini" href={whatsapp} target="_blank" rel="noopener">
              Deel via WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="bt-materiaal-groep">
        <span className="bt-materiaal-kop">Voor elk feest</span>
        <div className="bt-materiaal-knoppen">
          <a className="bt-mini" href="/verzoekjes/sticker" target="_blank" rel="noopener">
            Sticker 20 × 20 cm
          </a>
          <a
            className="bt-mini"
            href="/api/verzoekjes/qr/algemeen?type=png"
            download="verzoekjes-algemeen.png"
          >
            Algemene QR-code PNG
          </a>
          <a className="bt-mini" href="/verzoekjes/qr" target="_blank" rel="noopener">
            Alle posters
          </a>
        </div>
      </div>
    </details>
  );
}
