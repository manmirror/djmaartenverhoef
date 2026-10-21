"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import type { FeestInfo } from "../feesten";
import type { TopNummer, Verzoek, VerzoekStatus, Zoekresultaat } from "../types";

import Koppelen from "./Koppelen";

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

type Lijst = {
  feest: (FeestInfo & { handmatig: boolean }) | null;
  verzoeken: Verzoek[];
  agenda: FeestInfo[];
  opslag: boolean;
  collectie: number;
};
type Jaarlijst = {
  jaar: number | null;
  jaren: number[];
  feesten: number;
  totaal: number;
  top: TopNummer[];
};
type Sortering = "tijd" | "bpm";
type Weergave = "lijst" | "top";

export default function Booth() {
  // Op de server weten we de code niet; vandaar de lege derde waarde.
  const code = useSyncExternalStore(abonneer, leesCode, () => "");

  const [lijst, setLijst] = useState<Lijst | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [gekozenFeest, setGekozenFeest] = useState<string | null>(null);
  const [weergave, setWeergave] = useState<Weergave>("lijst");
  const [sortering, setSortering] = useState<Sortering>("tijd");
  const [toonAf, setToonAf] = useState(false);
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [top, setTop] = useState<Jaarlijst | null>(null);
  /** Het verzoekje waarvan het koppelpaneel open staat. */
  const [koppelId, setKoppelId] = useState<string | null>(null);

  const haal = useCallback(async (metCode: string, feest: string | null) => {
    const adres = feest
      ? `/api/verzoekjes/lijst?feest=${encodeURIComponent(feest)}`
      : "/api/verzoekjes/lijst";
    const antwoord = await fetch(adres, {
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
    if (!code || weergave !== "lijst") return;

    let actief = true;
    async function vernieuw() {
      try {
        await haal(code, gekozenFeest);
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
  }, [code, gekozenFeest, haal, weergave]);

  const feest = lijst?.feest ?? null;

  async function stuur(pad: string, inhoud: object) {
    return fetch(`/api/verzoekjes/${pad}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", [CODE_HEADER]: code },
      body: JSON.stringify(inhoud),
    });
  }

  async function stuurStatus(id: string, status: VerzoekStatus) {
    if (!feest) return;
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
      await stuur("status", { feest: feest.slug, id, status });
      await haal(code, gekozenFeest);
    } catch {
      setFout("Kon dat niet opslaan. Probeer het nog eens.");
    } finally {
      setBezigMet(null);
    }
  }

  async function verwijder(verzoek: Verzoek) {
    if (!feest) return;
    if (!confirm(`"${verzoek.titel}" weghalen? Dit kan niet terug.`)) return;
    setBezigMet(verzoek.id);
    try {
      await stuur("status", { feest: feest.slug, id: verzoek.id, verwijder: true });
      await haal(code, gekozenFeest);
    } catch {
      setFout("Kon dat niet weghalen.");
    } finally {
      setBezigMet(null);
    }
  }

  const zoek = useCallback(
    async (vraag: string): Promise<Zoekresultaat[]> => {
      if (!vraag.trim()) return [];
      const antwoord = await fetch(
        `/api/verzoekjes/zoek?q=${encodeURIComponent(vraag)}`,
        { headers: { [CODE_HEADER]: code }, cache: "no-store" }
      );
      if (!antwoord.ok) throw new Error(`zoeken: ${antwoord.status}`);
      return ((await antwoord.json()) as { resultaten: Zoekresultaat[] }).resultaten;
    },
    [code]
  );

  /** Koppelt een verzoekje aan een ander nummer; geeft een foutmelding terug als het misging. */
  async function koppel(id: string, keuze: Zoekresultaat | null): Promise<string | null> {
    if (!feest) return "Geen feest gekozen.";
    try {
      const antwoord = await stuur("status", {
        feest: feest.slug,
        id,
        koppel: keuze ? { nr: keuze.nr, titel: keuze.titel, artiest: keuze.artiest } : null,
      });
      if (antwoord.status === 409) {
        return "Je collectie is intussen vernieuwd. Zoek nog een keer.";
      }
      if (!antwoord.ok) return `Koppelen lukte niet (${antwoord.status}).`;
      setKoppelId(null);
      await haal(code, gekozenFeest);
      return null;
    } catch {
      return "Geen verbinding. Probeer het nog eens.";
    }
  }

  async function zetOpen() {
    if (!feest) return;
    try {
      await stuur("open", { feest: feest.slug });
      await haal(code, gekozenFeest);
    } catch {
      setFout("Kon het feest niet openzetten.");
    }
  }

  const haalTop = useCallback(
    async (jaar: number | null) => {
      const adres = jaar === null ? "/api/verzoekjes/top" : `/api/verzoekjes/top?jaar=${jaar}`;
      try {
        const antwoord = await fetch(adres, {
          headers: { [CODE_HEADER]: code },
          cache: "no-store",
        });
        if (!antwoord.ok) {
          setFout(`Kon de jaarlijst niet ophalen (${antwoord.status}).`);
          return;
        }
        setTop((await antwoord.json()) as Jaarlijst);
        setFout(null);
      } catch {
        setFout("Kon de jaarlijst niet ophalen.");
      }
    },
    [code]
  );

  useEffect(() => {
    if (!code || weergave !== "top") return;

    async function laad() {
      await haalTop(new Date().getFullYear());
    }
    laad();
  }, [code, haalTop, weergave]);

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
            {weergave === "lijst"
              ? `${nieuw.length} open${afgehandeld.length > 0 ? ` · ${afgehandeld.length} afgehandeld` : ""}`
              : "Vaakst gevraagd"}
            {lijst && lijst.collectie > 0 &&
              ` · ${lijst.collectie.toLocaleString("nl-NL")} nummers in de collectie`}
          </p>
        </div>
        <button type="button" className="bt-mini" onClick={() => bewaarCode("")}>
          Vergrendel
        </button>
      </header>

      <div className="bt-tabs">
        <button
          type="button"
          className={weergave === "lijst" ? "aan" : undefined}
          onClick={() => setWeergave("lijst")}
        >
          Verzoekjes
        </button>
        <button
          type="button"
          className={weergave === "top" ? "aan" : undefined}
          onClick={() => setWeergave("top")}
        >
          Jaarlijst
        </button>
      </div>

      {lijst && !lijst.opslag && (
        <p className="bt-waarschuwing">
          Er hangt nog geen gedeelde opslag aan het project, dus deze lijsten zijn
          niet betrouwbaar en worden niet bewaard. Verzoekjes gaan nu per mail.
          Zie VERZOEKJES.md.
        </p>
      )}

      {fout && <p className="bt-waarschuwing">{fout}</p>}

      {weergave === "top" ? (
        <Jaaroverzicht data={top} opHalen={haalTop} />
      ) : (
        <>
          {lijst && lijst.agenda.length > 0 && (
            <div className="bt-feest">
              <label>
                <span>Feest</span>
                <select
                  value={feest?.slug ?? ""}
                  onChange={(event) => setGekozenFeest(event.target.value)}
                >
                  {lijst.agenda.map((ander) => (
                    <option key={ander.slug} value={ander.slug}>
                      {ander.naam} — {ander.kort}
                    </option>
                  ))}
                </select>
              </label>

              {feest && (
                <div className="bt-open">
                  <span className={feest.open ? "bt-stip aan" : "bt-stip"} />
                  {feest.open
                    ? feest.handmatig
                      ? "handmatig open"
                      : "open voor verzoekjes"
                    : "gesloten"}
                  {/* Zonder database weet niet elke server van deze knop, dus
                      dan laten we hem weg in plaats van iets te beloven. */}
                  {!feest.open && lijst.opslag && (
                    <button type="button" className="bt-mini" onClick={zetOpen}>
                      Zet nu open
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {lijst && lijst.agenda.length === 0 && (
            <p className="bt-leeg">
              Er staan nog geen feesten in de agenda (content/feesten.ts).
            </p>
          )}

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
          </div>

          {!lijst && <p className="bt-leeg">Laden…</p>}

          {lijst && feest && nieuw.length === 0 && (
            <p className="bt-leeg">Nog geen open verzoekjes voor dit feest.</p>
          )}

          <ul className="bt-lijst">
            {nieuw.map((verzoek) => (
              <Rij
                key={verzoek.id}
                verzoek={verzoek}
                bezig={bezigMet === verzoek.id}
                onStatus={stuurStatus}
                onWeg={verwijder}
                koppelOpen={koppelId === verzoek.id}
                onKoppelOpen={() =>
                  setKoppelId((vorig) => (vorig === verzoek.id ? null : verzoek.id))
                }
                zoek={zoek}
                koppel={(keuze) => koppel(verzoek.id, keuze)}
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
                      onWeg={verwijder}
                      koppelOpen={koppelId === verzoek.id}
                      onKoppelOpen={() =>
                        setKoppelId((vorig) => (vorig === verzoek.id ? null : verzoek.id))
                      }
                      zoek={zoek}
                      koppel={(keuze) => koppel(verzoek.id, keuze)}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Kleine letters, zonder accenten en leestekens: om teksten te vergelijken. */
function plat(waarde: string): string {
  return waarde
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Nummers zonder bpm achteraan, zodat de bpm-sortering bruikbaar blijft. */
function sorteer(verzoeken: Verzoek[], sortering: Sortering): Verzoek[] {
  const gesorteerd = [...verzoeken];
  if (sortering === "bpm") {
    gesorteerd.sort((a, b) => {
      const bpmA = a.match?.bpm ?? null;
      const bpmB = b.match?.bpm ?? null;
      if (bpmA === null && bpmB === null) return b.tijd - a.tijd;
      if (bpmA === null) return 1;
      if (bpmB === null) return -1;
      return bpmA - bpmB;
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
  onWeg,
  koppelOpen,
  onKoppelOpen,
  zoek,
  koppel,
}: {
  verzoek: Verzoek;
  bezig: boolean;
  onStatus: (id: string, status: VerzoekStatus) => void;
  onWeg: (verzoek: Verzoek) => void;
  koppelOpen: boolean;
  onKoppelOpen: () => void;
  zoek: (vraag: string) => Promise<Zoekresultaat[]>;
  koppel: (keuze: Zoekresultaat | null) => Promise<string | null>;
}) {
  const klok = new Date(verzoek.tijd).toLocaleTimeString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { match } = verzoek;
  const gevraagd = [verzoek.titel, verzoek.artiest].filter(Boolean).join(" — ");
  // Wat de gast typte alleen tonen als het afwijkt van wat we vonden: een
  // andere titel, of een artiest die niet in die van de match voorkomt.
  const toonGevraagd =
    match !== null &&
    (plat(verzoek.titel) !== plat(match.titel) ||
      (verzoek.artiest !== "" && !plat(match.artiest).includes(plat(verzoek.artiest))));

  return (
    <li className={`bt-rij bt-${verzoek.status}`}>
      <div className="bt-rij-tekst">
        <div className="bt-titel">{match ? match.titel : verzoek.titel}</div>
        {(match ? match.artiest : verzoek.artiest) && (
          <div className="bt-artiest">{match ? match.artiest : verzoek.artiest}</div>
        )}
        {toonGevraagd && <div className="bt-gevraagd">gevraagd: “{gevraagd}”</div>}
        <div className="bt-meta">
          <span className="bt-tijd">{klok}</span>
          {verzoek.van && <span className="bt-van">van {verzoek.van}</span>}
          {!match && <span className="bt-niet">niet in collectie</span>}
          {match?.andereArtiest && (
            <span className="bt-niet" title={`Gevraagd: ${gevraagd}`}>
              andere artiest dan gevraagd
            </span>
          )}
          {match && match.versies > 1 && <span>{match.versies} versies</span>}
          {match?.handmatig && <span className="bt-hand">handmatig gekoppeld</span>}
          <button type="button" className="bt-weg" disabled={bezig} onClick={onKoppelOpen}>
            {match ? "match aanpassen" : "zelf koppelen"}
          </button>
          <button
            type="button"
            className="bt-weg"
            disabled={bezig}
            onClick={() => onWeg(verzoek)}
          >
            weghalen
          </button>
        </div>
      </div>

      <div className="bt-cijfers">
        {match?.bpm != null ? (
          <span className="bt-bpm">
            {Math.round(match.bpm)}
            <small>bpm</small>
          </span>
        ) : (
          <span className="bt-bpm bt-bpm-leeg" title="Niet in de collectie gevonden">
            ?<small>bpm</small>
          </span>
        )}
        {match?.toon && <span className="bt-toon">{match.toon}</span>}
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
      {koppelOpen && (
        <Koppelen verzoek={verzoek} zoek={zoek} koppel={koppel} sluit={onKoppelOpen} />
      )}
    </li>
  );
}

function Jaaroverzicht({
  data,
  opHalen,
}: {
  data: Jaarlijst | null;
  opHalen: (jaar: number | null) => void;
}) {
  if (!data) return <p className="bt-leeg">Laden…</p>;

  return (
    <div className="bt-top">
      <div className="bt-feest">
        <label>
          <span>Periode</span>
          <select
            value={data.jaar === null ? "alles" : String(data.jaar)}
            onChange={(event) =>
              opHalen(event.target.value === "alles" ? null : Number(event.target.value))
            }
          >
            {data.jaren.map((jaar) => (
              <option key={jaar} value={jaar}>
                {jaar}
              </option>
            ))}
            <option value="alles">Alles bij elkaar</option>
          </select>
        </label>
        <p className="bt-top-tel">
          {data.totaal.toLocaleString("nl-NL")} verzoekjes over {data.feesten}{" "}
          {data.feesten === 1 ? "feest" : "feesten"}
        </p>
      </div>

      {data.top.length === 0 ? (
        <p className="bt-leeg">Nog geen verzoekjes in deze periode.</p>
      ) : (
        <ol className="bt-toplijst">
          {data.top.map((nummer, plek) => (
            <li key={`${nummer.titel}-${nummer.artiest}`}>
              <span className="bt-plek">{plek + 1}</span>
              <span className="bt-rij-tekst">
                <span className="bt-titel">{nummer.titel}</span>
                {nummer.artiest && <span className="bt-artiest">{nummer.artiest}</span>}
                <span className="bt-meta">
                  <span>{nummer.gedraaid}× gedraaid</span>
                  <span>
                    op {nummer.feesten} {nummer.feesten === 1 ? "feest" : "feesten"}
                  </span>
                  {nummer.bpm !== null && <span>{Math.round(nummer.bpm)} bpm</span>}
                </span>
              </span>
              <span className="bt-aantal">
                {nummer.aantal}
                <small>×</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
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
      <p>Vul de code in om de verzoekjes te zien.</p>
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
