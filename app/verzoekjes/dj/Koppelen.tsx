"use client";

import { useEffect, useState } from "react";

import type { Verzoek, Zoekresultaat } from "../types";

type Props = {
  verzoek: Verzoek;
  zoek: (vraag: string) => Promise<Zoekresultaat[]>;
  /** Koppelt het gekozen nummer, of met null: geen match. Geeft een foutmelding terug als het niet lukte. */
  koppel: (keuze: Zoekresultaat | null) => Promise<string | null>;
  sluit: () => void;
};

/** Hoe lang we wachten met zoeken nadat er is getypt. */
const TYPPAUZE_MS = 250;

/**
 * Het paneel onder een verzoekje waarmee de DJ zelf het juiste nummer uit de
 * collectie kiest. Begint met de titel die de gast typte, zonder de artiest:
 * die is vaak net anders gespeld, en zo staan alle versies er meteen tussen.
 */
export default function Koppelen({ verzoek, zoek, koppel, sluit }: Props) {
  const [vraag, setVraag] = useState(verzoek.titel);
  const [resultaten, setResultaten] = useState<Zoekresultaat[] | null>(null);
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState<string | null>(null);

  useEffect(() => {
    let actief = true;
    const wacht = setTimeout(async () => {
      try {
        const gevonden = await zoek(vraag);
        if (actief) setResultaten(gevonden);
      } catch {
        if (actief) setFout("Zoeken lukte niet. Probeer het nog eens.");
      }
    }, TYPPAUZE_MS);

    return () => {
      actief = false;
      clearTimeout(wacht);
    };
  }, [vraag, zoek]);

  async function kies(keuze: Zoekresultaat | null) {
    setBezig(true);
    setFout(await koppel(keuze));
    setBezig(false);
  }

  const huidig = verzoek.match;

  return (
    <div className="bt-koppel">
      <div className="bt-koppel-kop">
        <span>Koppel aan een nummer uit je collectie</span>
        <button type="button" className="bt-weg" onClick={sluit}>
          sluiten
        </button>
      </div>

      <input
        type="search"
        value={vraag}
        onChange={(event) => setVraag(event.target.value)}
        placeholder="Zoek op titel of artiest"
        aria-label="Zoek in je collectie"
        autoComplete="off"
        autoFocus
      />

      {resultaten === null ? (
        <p className="bt-koppel-leeg">Zoeken…</p>
      ) : resultaten.length === 0 ? (
        <p className="bt-koppel-leeg">Niets gevonden. Probeer minder of andere woorden.</p>
      ) : (
        <ul className="bt-koppel-lijst">
          {resultaten.map((resultaat) => {
            const isHuidig =
              huidig !== null &&
              huidig.titel === resultaat.titel &&
              huidig.artiest === resultaat.artiest;
            return (
              <li key={resultaat.nr}>
                <button
                  type="button"
                  className={isHuidig ? "aan" : undefined}
                  disabled={bezig}
                  onClick={() => kies(resultaat)}
                >
                  <span className="bt-koppel-titel">{resultaat.titel}</span>
                  <span className="bt-koppel-artiest">{resultaat.artiest || "—"}</span>
                  <span className="bt-koppel-cijfers">
                    {resultaat.bpm !== null ? `${Math.round(resultaat.bpm)} bpm` : "? bpm"}
                    {resultaat.toon && ` · ${resultaat.toon}`}
                    {resultaat.jaar && ` · ${resultaat.jaar}`}
                    {isHuidig && " · gekoppeld"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {huidig && (
        <button
          type="button"
          className="bt-mini bt-koppel-los"
          disabled={bezig}
          onClick={() => kies(null)}
        >
          Geen match — staat niet in mijn collectie
        </button>
      )}

      {fout && (
        <p className="bt-koppel-fout" role="alert">
          {fout}
        </p>
      )}
    </div>
  );
}
