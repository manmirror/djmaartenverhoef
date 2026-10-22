"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";

import type { FeestInfo } from "../feesten";
import type { Stand } from "../store";
import type { TopNummer, Verzoek, VerzoekStatus, Zoekresultaat } from "../types";

import Agenda from "./Agenda";
import Koppelen from "./Koppelen";
import Materiaal from "./Materiaal";
import SleepLijst, { type Greep } from "./SleepLijst";
import { THEMA_ATTRIBUUT, THEMA_SLEUTEL } from "./thema";

const CODE_HEADER = "x-verzoekjes-code";
const SLEUTEL = "verzoekjes-code";
/** De gekozen sortering, per apparaat onthouden. */
const SORTERING_SLEUTEL = "verzoekjes-sortering";
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

/** Hoe een feest er nu voor staat: de schakelaar en of het verzoekjes aanneemt. */
type Openstand = { stand: Stand; open: boolean; aanTot: number | null };

// ---- licht of donker ----
// Het attribuut op <html> is de waarheid: dat zet het script in de pagina al
// bij het laden, en de knop zet het om.
type Thema = "donker" | "licht";
const themaLuisteraars = new Set<() => void>();

function leesThema(): Thema {
  return document.documentElement.getAttribute(THEMA_ATTRIBUUT) === "licht" ? "licht" : "donker";
}

function pasThemaToe(thema: Thema) {
  if (thema === "licht") document.documentElement.setAttribute(THEMA_ATTRIBUUT, "licht");
  else document.documentElement.removeAttribute(THEMA_ATTRIBUUT);
  for (const luisteraar of themaLuisteraars) luisteraar();
}

function kiesThema(thema: Thema) {
  pasThemaToe(thema);
  try {
    localStorage.setItem(THEMA_SLEUTEL, thema);
  } catch {
    // Geen opslag in deze browser: dan geldt de keuze tot je de pagina sluit.
  }
}

function abonneerThema(luisteraar: () => void) {
  themaLuisteraars.add(luisteraar);
  return () => {
    themaLuisteraars.delete(luisteraar);
  };
}

type Lijst = {
  feest:
    | (FeestInfo &
        Openstand & {
          venster: { van: number; tot: number };
          fase: "voor" | "tijdens" | "na";
        })
    | null;
  verzoeken: Verzoek[];
  agenda: (FeestInfo & Openstand)[];
  /** Het feest waar de sticker en de algemene QR-code nu naartoe wijzen. */
  algemeen: { slug: string; naam: string } | null;
  opslag: boolean;
  opslagInfo: { soort: "upstash" | "redis" | null; namen: string[] };
  collectie: number;
};
type Jaarlijst = {
  jaar: number | null;
  jaren: number[];
  feesten: number;
  totaal: number;
  top: TopNummer[];
};
/** Eén feest in het archief, met tellingen. */
type ArchiefFeest = FeestInfo & { aantal: number; gekoppeld: number; gedraaid: number };
type Sortering = "tijd" | "bpm" | "eigen";

function leesSortering(): Sortering {
  if (typeof window === "undefined") return "tijd";
  try {
    const opgeslagen = localStorage.getItem(SORTERING_SLEUTEL);
    return opgeslagen === "bpm" || opgeslagen === "eigen" ? opgeslagen : "tijd";
  } catch {
    return "tijd";
  }
}
type Weergave = "lijst" | "archief" | "top" | "agenda";

export default function Booth() {
  // Op de server weten we de code niet; vandaar de lege derde waarde.
  const code = useSyncExternalStore(abonneer, leesCode, () => "");
  const thema = useSyncExternalStore(abonneerThema, leesThema, (): Thema => "donker");

  // Het script in de pagina zet de lichte weergave al bij het laden. Tijdens
  // ontwikkelen haalt React dat attribuut bij het opnieuw opbouwen weer weg;
  // hier zetten we het terug, nog voor het tekenen. En verlaat je de booth,
  // dan gaat het eraf, zodat de rest van de site er niets van merkt.
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(THEMA_SLEUTEL) === "licht") pasThemaToe("licht");
    } catch {
      // Geen opslag: dan blijft het donker.
    }
    return () => document.documentElement.removeAttribute(THEMA_ATTRIBUUT);
  }, []);

  const [lijst, setLijst] = useState<Lijst | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [gekozenFeest, setGekozenFeest] = useState<string | null>(null);
  const [weergave, setWeergave] = useState<Weergave>("lijst");
  // De booth tekent pas iets met de sortering na het invullen van de code, dus
  // dat de server hier "tijd" ziet en de browser iets anders, botst niet.
  const [sortering, setSorteringState] = useState<Sortering>(leesSortering);

  function setSortering(nieuw: Sortering) {
    setSorteringState(nieuw);
    try {
      localStorage.setItem(SORTERING_SLEUTEL, nieuw);
    } catch {
      // Geen opslag in deze browser: dan geldt de keuze alleen nu.
    }
  }
  const [toonAf, setToonAf] = useState(false);
  const [bezigMet, setBezigMet] = useState<string | null>(null);
  const [top, setTop] = useState<Jaarlijst | null>(null);
  /** Het verzoekje waarvan het koppelpaneel open staat. */
  const [koppelId, setKoppelId] = useState<string | null>(null);
  const [archief, setArchief] = useState<ArchiefFeest[] | null>(null);
  const [standBezig, setStandBezig] = useState(false);
  /** Het feest dat in het archief openstaat; null is het overzicht. */
  const [archiefFeest, setArchiefFeest] = useState<string | null>(null);
  /** Het feest dat in de agenda meteen open moet voor bewerken. */
  const [agendaBewerk, setAgendaBewerk] = useState<string | null>(null);

  // Welk feest de lijst laat zien: in het archief het daar gekozen feest, en
  // anders het feest uit de keuzelijst (of, zonder keuze, dat van vanavond).
  const actiefFeest = weergave === "archief" ? archiefFeest : gekozenFeest;
  const toontLijst = weergave === "lijst" || (weergave === "archief" && archiefFeest !== null);

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
    if (!code || !toontLijst) return;

    let actief = true;
    async function vernieuw() {
      try {
        await haal(code, actiefFeest);
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
  }, [code, actiefFeest, haal, toontLijst]);

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
      await haal(code, actiefFeest);
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
      await haal(code, actiefFeest);
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
      await haal(code, actiefFeest);
      return null;
    } catch {
      return "Geen verbinding. Probeer het nog eens.";
    }
  }

  /**
   * Slaat een nieuwe eigen volgorde op. `deel` is de versleepte lijst, die maar
   * een deel van het feest kan zijn (alleen de open verzoekjes, bijvoorbeeld):
   * de rest blijft op zijn plek staan.
   */
  async function slaVolgordeOp(deel: string[]) {
    if (!feest || !lijst) return;
    const heel = sorteer(lijst.verzoeken, "eigen").map((verzoek) => verzoek.id);
    const inDeel = new Set(deel);
    const plekken = heel.flatMap((id, plek) => (inDeel.has(id) ? [plek] : []));
    const nieuw = [...heel];
    if (plekken.length === deel.length) {
      plekken.forEach((plek, nummer) => {
        nieuw[plek] = deel[nummer];
      });
    }
    const positie = new Map(nieuw.map((id, nummer) => [id, nummer]));

    // Meteen tonen; anders springt de rij even terug tot de server antwoordt.
    setLijst((vorig) =>
      vorig
        ? {
            ...vorig,
            verzoeken: vorig.verzoeken.map((verzoek) => ({
              ...verzoek,
              positie: positie.get(verzoek.id) ?? verzoek.positie,
            })),
          }
        : vorig
    );
    try {
      const antwoord = await stuur("volgorde", { feest: feest.slug, ids: nieuw });
      if (!antwoord.ok) setFout(`De volgorde is niet opgeslagen (${antwoord.status}).`);
      await haal(code, actiefFeest);
    } catch {
      setFout("De volgorde is niet opgeslagen. Probeer het nog eens.");
    }
  }

  async function zetStand(stand: Stand) {
    if (!feest || !lijst || feest.stand === stand) return;

    // Er kan maar één feest tegelijk aan staan. Even zeggen welk feest daardoor
    // terug naar Automatisch gaat, zodat dat geen verrassing is.
    const anderAan = lijst.agenda.find((ander) => ander.stand === "aan" && ander.slug !== feest.slug);
    if (
      stand === "aan" &&
      anderAan &&
      !confirm(`${anderAan.naam} staat nu aan. Die gaat dan terug naar Automatisch. Doorgaan?`)
    ) {
      return;
    }

    setStandBezig(true);
    try {
      const antwoord = await stuur("stand", { feest: feest.slug, stand });
      if (!antwoord.ok) setFout(`De schakelaar is niet omgezet (${antwoord.status}).`);
      await haal(code, actiefFeest);
    } catch {
      setFout("De schakelaar is niet omgezet. Probeer het nog eens.");
    } finally {
      setStandBezig(false);
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

  useEffect(() => {
    if (!code || weergave !== "archief" || archiefFeest !== null) return;

    async function laad() {
      try {
        const antwoord = await fetch("/api/verzoekjes/archief", {
          headers: { [CODE_HEADER]: code },
          cache: "no-store",
        });
        if (!antwoord.ok) {
          setFout(`Kon het archief niet ophalen (${antwoord.status}).`);
          return;
        }
        setArchief(((await antwoord.json()) as { feesten: ArchiefFeest[] }).feesten);
        setFout(null);
      } catch {
        setFout("Kon het archief niet ophalen.");
      }
    }
    laad();
  }, [archiefFeest, code, weergave]);

  function kiesWeergave(nieuw: Weergave) {
    setWeergave(nieuw);
    setAgendaBewerk(null);
    setKoppelId(null);
    // Anders staat heel even de lijst van het vorige scherm in beeld.
    setLijst(null);
    if (nieuw === "archief") setArchiefFeest(null);
  }

  /** Vanuit de agenda naar de verzoekjes van een feest. */
  function openFeest(slug: string) {
    kiesWeergave("lijst");
    setGekozenFeest(slug);
  }

  function wijzigFeest(slug: string) {
    kiesWeergave("agenda");
    setAgendaBewerk(slug);
  }

  function openArchiefFeest(slug: string | null) {
    setKoppelId(null);
    setLijst(null);
    setArchiefFeest(slug);
  }

  if (!code) {
    return <CodeHek fout={fout} />;
  }

  const rij = (verzoek: Verzoek, greep?: Greep, sleept = false) => (
    <Rij
      key={verzoek.id}
      verzoek={verzoek}
      greep={greep}
      sleept={sleept}
      bezig={bezigMet === verzoek.id}
      onStatus={stuurStatus}
      onWeg={verwijder}
      koppelOpen={koppelId === verzoek.id}
      onKoppelOpen={() => setKoppelId((vorig) => (vorig === verzoek.id ? null : verzoek.id))}
      zoek={zoek}
      koppel={(keuze) => koppel(verzoek.id, keuze)}
    />
  );

  const lijstVan = (verzoeken: Verzoek[], klasse = "bt-lijst") =>
    sortering === "eigen" ? (
      <SleepLijst
        verzoeken={verzoeken}
        className={klasse}
        rij={rij}
        onVolgorde={slaVolgordeOp}
      />
    ) : (
      <ul className={klasse}>{verzoeken.map((verzoek) => rij(verzoek))}</ul>
    );

  const sorteerKnoppen = (
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
        <button
          type="button"
          className={sortering === "eigen" ? "aan" : undefined}
          onClick={() => setSortering("eigen")}
        >
          Eigen volgorde
        </button>
      </div>
      {sortering === "eigen" && (
        <span className="bt-sleeptip">Sleep aan ⋮⋮ om de volgorde te veranderen</span>
      )}
    </div>
  );

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
              : weergave === "archief"
                ? "Eerdere feesten"
                : weergave === "agenda"
                  ? "Feesten aanmaken, wijzigen en weghalen"
                  : "Vaakst gevraagd"}
            {lijst && lijst.collectie > 0 &&
              ` · ${lijst.collectie.toLocaleString("nl-NL")} nummers in de collectie`}
          </p>
        </div>
        <div className="bt-kop-knoppen">
          <button
            type="button"
            className="bt-mini"
            aria-pressed={thema === "licht"}
            onClick={() => kiesThema(thema === "licht" ? "donker" : "licht")}
          >
            {thema === "licht" ? "Donker" : "Licht"}
          </button>
          <button type="button" className="bt-mini" onClick={() => bewaarCode("")}>
            Vergrendel
          </button>
        </div>
      </header>

      <div className="bt-tabs">
        <button
          type="button"
          className={weergave === "lijst" ? "aan" : undefined}
          onClick={() => kiesWeergave("lijst")}
        >
          Verzoekjes
        </button>
        <button
          type="button"
          className={weergave === "archief" ? "aan" : undefined}
          onClick={() => kiesWeergave("archief")}
        >
          Archief
        </button>
        <button
          type="button"
          className={weergave === "top" ? "aan" : undefined}
          onClick={() => kiesWeergave("top")}
        >
          Jaarlijst
        </button>
        <button
          type="button"
          className={weergave === "agenda" ? "aan" : undefined}
          onClick={() => kiesWeergave("agenda")}
        >
          Agenda
        </button>
      </div>

      {lijst && !lijst.opslag && (
        <p className="bt-waarschuwing">
          De site vindt geen database, dus deze lijsten worden niet bewaard en zijn
          niet betrouwbaar. Verzoekjes gaan nu per mail. Zie VERZOEKJES.md.
          <br />
          {lijst.opslagInfo.namen.length > 0 ? (
            <>
              Wel gevonden, maar niet bruikbaar:{" "}
              <code>{lijst.opslagInfo.namen.join(", ")}</code>
            </>
          ) : (
            <>
              Er staat geen enkele database-variabele in deze omgeving. Staat de
              koppeling in Vercel aan voor Production, en is er daarna opnieuw
              gedeployd?
            </>
          )}
        </p>
      )}

      {fout && <p className="bt-waarschuwing">{fout}</p>}

      {weergave === "agenda" ? (
        <Agenda
          key={agendaBewerk ?? ""}
          code={code}
          codeHeader={CODE_HEADER}
          bewerkStart={agendaBewerk}
          onOpen={openFeest}
        />
      ) : weergave === "top" ? (
        <Jaaroverzicht data={top} opHalen={haalTop} />
      ) : weergave === "archief" ? (
        archiefFeest === null ? (
          <Archiefoverzicht feesten={archief} onOpen={openArchiefFeest} />
        ) : (
          <>
            <button type="button" className="bt-terug" onClick={() => openArchiefFeest(null)}>
              ← Alle feesten
            </button>
            {!lijst || !feest ? (
              <p className="bt-leeg">Laden…</p>
            ) : (
              <>
                <div className="bt-archiefkop">
                  <h2>{feest.naam}</h2>
                  <p>
                    {feest.voluit}
                    {feest.plaats && ` · ${feest.plaats}`}
                    {feest.test && " · test"}
                  </p>
                  <p>
                    {alles.length} verzoekjes · {alles.filter((v) => v.match).length} in je
                    collectie · {alles.filter((v) => v.status === "gedraaid").length} gedraaid
                  </p>
                </div>
                {sorteerKnoppen}
                {alles.length === 0 ? (
                  <p className="bt-leeg">Bij dit feest zijn geen verzoekjes binnengekomen.</p>
                ) : (
                  lijstVan(sorteer(alles, sortering))
                )}
              </>
            )}
          </>
        )
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
                      {ander.stand === "aan" ? " · AAN" : ander.stand === "uit" ? " · uit" : ""}
                      {ander.test ? " (test, telt niet mee)" : ""}
                    </option>
                  ))}
                </select>
              </label>
              {feest && (
                <button type="button" className="bt-mini" onClick={() => wijzigFeest(feest.slug)}>
                  Naam of datum wijzigen
                </button>
              )}
            </div>
          )}

          {lijst && feest && (
            <div className="bt-schakelaar">
              {lijst.opslag && (
                <div className="bt-stand" role="radiogroup" aria-label="Verzoekjes voor dit feest">
                  {STANDEN.map(([waarde, label]) => (
                    <button
                      key={waarde}
                      type="button"
                      role="radio"
                      aria-checked={feest.stand === waarde}
                      className={feest.stand === waarde ? `aan bt-stand-${waarde}` : undefined}
                      disabled={standBezig}
                      onClick={() => zetStand(waarde)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <p className="bt-stand-uitleg">
                <span className={feest.open ? "bt-stip aan" : "bt-stip"} />
                <span>{standUitleg(feest)}</span>
              </p>
              {!lijst.opslag && (
                <p className="bt-stand-uitleg">
                  De aan/uit-schakelaar werkt pas als de database gekoppeld is: zonder
                  database zou hij maar op één server staan.
                </p>
              )}
              <p className="bt-stand-qr">
                Je vaste QR-code en de sticker wijzen nu naar:{" "}
                <strong>{lijst.algemeen?.naam ?? "geen enkel feest"}</strong>
              </p>
              <Materiaal feest={feest} />
            </div>
          )}

          {lijst && lijst.agenda.length === 0 && (
            <p className="bt-leeg">
              Er staan nog geen feesten in de agenda. Maak er een aan onder Agenda.
            </p>
          )}

          {sorteerKnoppen}

          {!lijst && <p className="bt-leeg">Laden…</p>}

          {lijst && feest && nieuw.length === 0 && (
            <p className="bt-leeg">Nog geen open verzoekjes voor dit feest.</p>
          )}

          {lijstVan(nieuw)}

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
                lijstVan(sorteer(afgehandeld, sortering), "bt-lijst bt-lijst-af")
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

const STANDEN: [Stand, string][] = [
  ["automatisch", "Automatisch"],
  ["aan", "Aan"],
  ["uit", "Uit"],
];

/** "do 22 okt 02:15", altijd in Nederlandse tijd. */
function tijdLabel(ms: number): string {
  return new Date(ms).toLocaleString("nl-NL", {
    timeZone: "Europe/Amsterdam",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Eén zin bij de schakelaar: wat de stand nu betekent. */
function standUitleg(feest: NonNullable<Lijst["feest"]>): string {
  if (feest.stand === "aan") {
    return feest.aanTot
      ? `Aan tot ${tijdLabel(feest.aanTot)}. Daarna gaat hij vanzelf terug naar Automatisch.`
      : "Aan.";
  }
  if (feest.stand === "uit") {
    return "Uit: dit feest neemt geen verzoekjes aan, ook niet tijdens het feest.";
  }
  if (feest.fase === "tijdens") {
    return `Automatisch: open volgens de agenda, tot ${tijdLabel(feest.venster.tot)}.`;
  }
  if (feest.fase === "voor") {
    return `Automatisch: gaat open op ${tijdLabel(feest.venster.van)}.`;
  }
  return "Automatisch: gesloten, het feest is voorbij.";
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
  } else if (sortering === "eigen") {
    // Versleepte verzoekjes op hun plek; nieuwe, nog niet versleepte achteraan,
    // in volgorde van binnenkomst. Zo werkt het als een wachtrij.
    gesorteerd.sort((a, b) => {
      const plekA = a.positie ?? Infinity;
      const plekB = b.positie ?? Infinity;
      if (plekA !== plekB) return plekA - plekB;
      return a.tijd - b.tijd;
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
  greep,
  sleept,
}: {
  verzoek: Verzoek;
  greep?: Greep;
  sleept: boolean;
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
    <li
      data-id={verzoek.id}
      className={`bt-rij bt-${verzoek.status}${greep ? " bt-rij-sleep" : ""}${
        sleept ? " bt-sleept" : ""
      }`}
    >
      {greep && (
        <button
          type="button"
          className="bt-greep"
          aria-label={`Versleep ${verzoek.match?.titel ?? verzoek.titel}`}
          title="Slepen, of met de pijltjestoetsen verplaatsen"
          onPointerDown={greep.onPointerDown}
          onKeyDown={greep.onKeyDown}
        >
          ⋮⋮
        </button>
      )}
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

function Archiefoverzicht({
  feesten,
  onOpen,
}: {
  feesten: ArchiefFeest[] | null;
  onOpen: (slug: string) => void;
}) {
  if (!feesten) return <p className="bt-leeg">Laden…</p>;
  if (feesten.length === 0) return <p className="bt-leeg">Nog geen feesten geweest.</p>;

  return (
    <ul className="bt-archief">
      {feesten.map((feest) => (
        <li key={feest.slug}>
          <button type="button" onClick={() => onOpen(feest.slug)}>
            <span className="bt-archief-tekst">
              <span className="bt-titel">
                {feest.naam}
                {feest.test && <span className="bt-archief-test">test</span>}
              </span>
              <span className="bt-artiest">
                {feest.kort}
                {feest.plaats && ` · ${feest.plaats}`}
              </span>
              <span className="bt-meta">
                <span>{feest.gekoppeld} in je collectie</span>
                <span>{feest.gedraaid} gedraaid</span>
              </span>
            </span>
            <span className="bt-aantal">
              {feest.aantal}
              <small>verzoekjes</small>
            </span>
          </button>
        </li>
      ))}
    </ul>
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
