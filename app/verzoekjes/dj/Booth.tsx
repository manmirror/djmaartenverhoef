"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import type { Verzoek, VerzoekStatus } from "../types";

const CODE_HEADER = "x-verzoekjes-code";
const SLEUTEL = "verzoekjes-code";
/** Hoe vaak de lijst zichzelf ververst zolang de pagina open staat. */
const VERVERS_MS = 8000;

// De code onthouden we in de browser, zodat de boothpagina na een refresh niet
// opnieuw om de code vraagt. Een klein eigen winkeltje, zodat react meekrijgt
// wanneer de code verandert.
const luisteraars = new Set<() => void>();

function leesCode(): string {
  try {
    return localStorage.getItem(SLEUTEL) ?? "";
  } catch {
    return "";
  }
}

function bewaarCode(waarde: string) {
  try {
    if (waarde) localStorage.setItem(SLEUTEL, waarde);
    else localStorage.removeItem(SLEUTEL);
  } catch {
    // Privémodus of geblokkeerde opslag: dan vraagt de pagina het elke keer.
  }
  for (const luisteraar of luisteraars) luisteraar();
}

function abonneer(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  return () => {
    luisteraars.delete(luisteraar);
  };
}

type Lijst = { verzoeken: Verzoek[]; opslag: boolean; collectie: number };
type Sortering = "tijd" | "bpm";

export default function Booth() {
  // Op de server weten we de code niet; vandaar de lege derde waarde.
  const code = useSyncExternalStore(abonneer, leesCode, () => "");

  const [lijst, setLijst] = useState<Lijst | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [sortering, setSortering] = useState<Sortering>("tijd");
  const [toonAf, setToonAf] = useState(false);
  const [bezigMet, setBezigMet] = useState<string | null>(null);

  const haal = useCallback(async (metCode: string) => {
    const antwoord = await fetch("/api/verzoekjes/lijst", {
      headers: { [CODE_HEADER]: metCode },
      cache: "no-store",
    });

    if (antwoord.status === 401) {
      bewaarCode("");
      setFout("Die code klopt niet.");
      return;
    }
    if (antwoord.status === 429) {
      setFout("Te veel pogingen. Wacht even tien minuten.");
      return;
    }
    if (antwoord.status === 503) {
      setFout(
        "Er is nog geen code ingesteld. Zet VERZOEKJES_CODE in de instellingen van Vercel."
      );
      return;
    }
    if (!antwoord.ok) {
      setFout(`Kon de lijst niet ophalen (${antwoord.status}).`);
      return;
    }

    setLijst((await antwoord.json()) as Lijst);
    setFout(null);
  }, []);

  useEffect(() => {
    if (!code) return;

    let actief = true;
    async function vernieuw() {
      try {
        await haal(code);
      } catch {
        if (actief) setFout("Geen verbinding. De lijst probeert het straks opnieuw.");
      }
    }

    vernieuw();
    const tik = setInterval(() => {
      if (!document.hidden) vernieuw();
    }, VERVERS_MS);

    return () => {
      actief = false;
      clearInterval(tik);
    };
  }, [code, haal]);

  async function stuurStatus(id: string, status: VerzoekStatus) {
    setBezigMet(id);
    // Meteen bijwerken in beeld; de volgende ronde haalt de echte stand op.
    setLijst((vorig) =>
      vorig
        ? {
            ...vorig,
            verzoeken: vorig.verzoeken.map((verzoek) =>
              verzoek.id === id ? { ...verzoek, status } : verzoek
            ),
          }
        : vorig
    );
    try {
      await fetch("/api/verzoekjes/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", [CODE_HEADER]: code },
        body: JSON.stringify({ id, status }),
      });
      await haal(code);
    } catch {
      setFout("Kon dat niet opslaan. Probeer het nog eens.");
    } finally {
      setBezigMet(null);
    }
  }

  async function wisAlles() {
    if (!confirm("De hele lijst leegmaken? Dit kan niet terug.")) return;
    try {
      await fetch("/api/verzoekjes/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", [CODE_HEADER]: code },
        body: JSON.stringify({ wis: true }),
      });
      await haal(code);
    } catch {
      setFout("Kon de lijst niet leegmaken.");
    }
  }

  if (!code) {
    return <CodeHek fout={fout} />;
  }

  const alles = lijst?.verzoeken ?? [];
  const nieuw = sorteer(
    alles.filter((verzoek) => verzoek.status === "nieuw"),
    sortering
  );
  const afgehandeld = alles.filter((verzoek) => verzoek.status !== "nieuw");

  return (
    <div className="bt">
      <header className="bt-kop">
        <div>
          <h1>Booth</h1>
          <p>
            {nieuw.length} open
            {afgehandeld.length > 0 && ` · ${afgehandeld.length} afgehandeld`}
            {lijst && lijst.collectie > 0 &&
              ` · ${lijst.collectie.toLocaleString("nl-NL")} nummers in de collectie`}
          </p>
        </div>
        <button type="button" className="bt-mini" onClick={() => bewaarCode("")}>
          Vergrendel
        </button>
      </header>

      {lijst && !lijst.opslag && (
        <p className="bt-waarschuwing">
          Er hangt nog geen gedeelde opslag aan het project, dus deze lijst is niet
          betrouwbaar. Verzoekjes worden nu per mail doorgestuurd. Zie VERZOEKJES.md.
        </p>
      )}

      {fout && <p className="bt-waarschuwing">{fout}</p>}

      <div className="bt-balk">
        <div className="bt-sorteer">
          <button
            type="button"
            className={sortering === "tijd" ? "aan" : undefined}
            onClick={() => setSortering("tijd")}
          >
            Nieuwste eerst
          </button>
          <button
            type="button"
            className={sortering === "bpm" ? "aan" : undefined}
            onClick={() => setSortering("bpm")}
          >
            Op bpm
          </button>
        </div>
        <button type="button" className="bt-mini" onClick={wisAlles}>
          Lijst wissen
        </button>
      </div>

      {!lijst && <p className="bt-leeg">Laden…</p>}

      {lijst && nieuw.length === 0 && (
        <p className="bt-leeg">Nog geen open verzoekjes.</p>
      )}

      <ul className="bt-lijst">
        {nieuw.map((verzoek) => (
          <Rij
            key={verzoek.id}
            verzoek={verzoek}
            bezig={bezigMet === verzoek.id}
            onStatus={stuurStatus}
          />
        ))}
      </ul>

      {afgehandeld.length > 0 && (
        <>
          <button
            type="button"
            className="bt-klap"
            onClick={() => setToonAf((vorig) => !vorig)}
          >
            {toonAf ? "Verberg" : "Toon"} afgehandeld ({afgehandeld.length})
          </button>
          {toonAf && (
            <ul className="bt-lijst bt-lijst-af">
              {sorteer(afgehandeld, sortering).map((verzoek) => (
                <Rij
                  key={verzoek.id}
                  verzoek={verzoek}
                  bezig={bezigMet === verzoek.id}
                  onStatus={stuurStatus}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Nummers zonder bpm achteraan, zodat de bpm-sortering bruikbaar blijft. */
function sorteer(verzoeken: Verzoek[], sortering: Sortering): Verzoek[] {
  const gesorteerd = [...verzoeken];
  if (sortering === "bpm") {
    gesorteerd.sort((a, b) => {
      if (a.bpm === null && b.bpm === null) return b.tijd - a.tijd;
      if (a.bpm === null) return 1;
      if (b.bpm === null) return -1;
      return a.bpm - b.bpm;
    });
  } else {
    gesorteerd.sort((a, b) => b.tijd - a.tijd);
  }
  return gesorteerd;
}

function Rij({
  verzoek,
  bezig,
  onStatus,
}: {
  verzoek: Verzoek;
  bezig: boolean;
  onStatus: (id: string, status: VerzoekStatus) => void;
}) {
  const klok = new Date(verzoek.tijd).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <li className={`bt-rij bt-${verzoek.status}`}>
      <div className="bt-rij-tekst">
        <div className="bt-titel">{verzoek.titel}</div>
        {verzoek.artiest && <div className="bt-artiest">{verzoek.artiest}</div>}
        <div className="bt-meta">
          <span className="bt-tijd">{klok}</span>
          {verzoek.van && <span className="bt-van">van {verzoek.van}</span>}
          {!verzoek.inCollectie && <span className="bt-niet">niet in collectie</span>}
        </div>
      </div>

      <div className="bt-cijfers">
        {verzoek.bpm !== null ? (
          <span className="bt-bpm">
            {Math.round(verzoek.bpm)}
            <small>bpm</small>
          </span>
        ) : (
          <span className="bt-bpm bt-bpm-leeg" title="Niet in de collectie gevonden">
            ?<small>bpm</small>
          </span>
        )}
        {verzoek.toon && <span className="bt-toon">{verzoek.toon}</span>}
      </div>

      <div className="bt-acties">
        {verzoek.status === "nieuw" ? (
          <>
            <button
              type="button"
              className="bt-ok"
              disabled={bezig}
              onClick={() => onStatus(verzoek.id, "gedraaid")}
            >
              Gedraaid
            </button>
            <button
              type="button"
              className="bt-nee"
              disabled={bezig}
              onClick={() => onStatus(verzoek.id, "overgeslagen")}
            >
              Overslaan
            </button>
          </>
        ) : (
          <button
            type="button"
            className="bt-nee"
            disabled={bezig}
            onClick={() => onStatus(verzoek.id, "nieuw")}
          >
            Terugzetten
          </button>
        )}
      </div>
    </li>
  );
}

function CodeHek({ fout }: { fout: string | null }) {
  const [waarde, setWaarde] = useState("");

  return (
    <form
      className="bt-hek"
      onSubmit={(event) => {
        event.preventDefault();
        if (waarde.trim()) bewaarCode(waarde.trim());
      }}
    >
      <h1>Booth</h1>
      <p>Vul de code in om de verzoekjes van vanavond te zien.</p>
      <input
        type="password"
        value={waarde}
        onChange={(event) => setWaarde(event.target.value)}
        placeholder="Code"
        aria-label="Code"
        autoComplete="off"
        autoFocus
      />
      <button type="submit">Open de booth</button>
      {fout && (
        <p className="bt-waarschuwing" role="alert">
          {fout}
        </p>
      )}
    </form>
  );
}
