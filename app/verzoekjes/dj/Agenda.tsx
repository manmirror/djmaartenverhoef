"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { FeestInfo } from "../feesten";

/** Eén feest in het agendabeheer. */
type AgendaFeest = FeestInfo & {
  aantal: number;
  /** Uit content/feesten.ts, of in de booth aangemaakt. */
  bron: "bestand" | "booth";
  /** Een feest uit het bestand waarvan in de booth iets is veranderd. */
  aangepast: boolean;
  geweest: boolean;
};

type Agendadata = { feesten: AgendaFeest[]; verwijderd: AgendaFeest[]; opslag: boolean };

type Velden = { naam: string; datum: string; plaats: string; test: boolean };

const LEEG: Velden = { naam: "", datum: "", plaats: "", test: false };

const FOUTEN: Record<string, string> = {
  "naam-leeg": "Vul de naam van het feest in.",
  "naam-te-lang": "Die naam is te lang; houd hem onder de 80 tekens.",
  "datum-ongeldig": "Kies een datum.",
  "plaats-te-lang": "Die plaats is te lang; houd hem onder de 80 tekens.",
  "geen-database":
    "Zonder database kan de agenda niet worden aangepast: de wijziging zou maar op één server staan.",
  onbekend: "Dat feest bestaat niet (meer). Ververs de pagina.",
};

type Props = {
  code: string;
  codeHeader: string;
  /** Het feest om meteen te bewerken, vanuit de verzoekjeslijst. */
  bewerkStart: string | null;
  /** Naar de verzoekjes van een feest. */
  onOpen: (slug: string) => void;
};

/**
 * De agenda bijhouden vanuit de booth: feesten aanmaken, de naam, datum of
 * plaats aanpassen, en feesten weghalen. De link en de QR-code van een feest
 * veranderen daarbij nooit, zodat geprinte posters blijven werken.
 */
export default function Agenda({ code, codeHeader, bewerkStart, onOpen }: Props) {
  const [data, setData] = useState<Agendadata | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [melding, setMelding] = useState<{ tekst: string; slug: string } | null>(null);
  /** "nieuw", de slug van het feest dat bewerkt wordt, of null. */
  const [bewerk, setBewerk] = useState<string | null>(bewerkStart);
  const [velden, setVelden] = useState<Velden>(LEEG);
  const [weg, setWeg] = useState<string | null>(null);
  const [bezig, setBezig] = useState(false);

  const laad = useCallback(async () => {
    try {
      const antwoord = await fetch("/api/verzoekjes/agenda", {
        headers: { [codeHeader]: code },
        cache: "no-store",
      });
      if (!antwoord.ok) {
        setFout(`Kon de agenda niet ophalen (${antwoord.status}).`);
        return null;
      }
      const nieuw = (await antwoord.json()) as Agendadata;
      setData(nieuw);
      return nieuw;
    } catch {
      setFout("Kon de agenda niet ophalen.");
      return null;
    }
  }, [code, codeHeader]);

  useEffect(() => {
    async function start() {
      const nieuw = await laad();
      // Vanuit de verzoekjeslijst op "Wijzig" gedrukt: dat feest meteen openen.
      const feest = nieuw?.feesten.find((ander) => ander.slug === bewerkStart);
      if (feest) setVelden(veldenVan(feest));
    }
    start();
  }, [bewerkStart, laad]);

  function begin(wat: string | null, feest?: AgendaFeest) {
    setBewerk(wat);
    setVelden(feest ? veldenVan(feest) : LEEG);
    setWeg(null);
    setFout(null);
    setMelding(null);
  }

  async function stuur(inhoud: object): Promise<{ ok: boolean; slug?: string }> {
    setBezig(true);
    setFout(null);
    try {
      const antwoord = await fetch("/api/verzoekjes/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json", [codeHeader]: code },
        body: JSON.stringify(inhoud),
      });
      const uitkomst = (await antwoord.json().catch(() => ({}))) as {
        slug?: string;
        error?: string;
      };
      if (!antwoord.ok) {
        setFout(FOUTEN[uitkomst.error ?? ""] ?? `Dat lukte niet (${antwoord.status}).`);
        return { ok: false };
      }
      await laad();
      return { ok: true, slug: uitkomst.slug };
    } catch {
      setFout("Geen verbinding. Probeer het nog eens.");
      return { ok: false };
    } finally {
      setBezig(false);
    }
  }

  async function bewaar(event: FormEvent) {
    event.preventDefault();
    if (!bewerk) return;
    const nieuw = bewerk === "nieuw";
    const uitkomst = await stuur({
      actie: nieuw ? "nieuw" : "wijzig",
      slug: nieuw ? undefined : bewerk,
      ...velden,
    });
    if (!uitkomst.ok || !uitkomst.slug) return;
    setBewerk(null);
    setMelding({
      tekst: nieuw ? `${velden.naam.trim()} staat in de agenda.` : "Opgeslagen.",
      slug: uitkomst.slug,
    });
  }

  async function verwijder(feest: AgendaFeest) {
    const uitkomst = await stuur({ actie: "verwijder", slug: feest.slug });
    if (!uitkomst.ok) return;
    setWeg(null);
    setMelding(null);
  }

  async function zetTerug(feest: AgendaFeest) {
    const uitkomst = await stuur({ actie: "terug", slug: feest.slug });
    if (uitkomst.ok) setMelding({ tekst: `${feest.naam} staat weer in de agenda.`, slug: feest.slug });
  }

  if (!data) {
    return fout ? <p className="bt-waarschuwing">{fout}</p> : <p className="bt-leeg">Laden…</p>;
  }

  const komend = [...data.feesten].filter((feest) => !feest.geweest).reverse();
  const geweest = data.feesten.filter((feest) => feest.geweest);

  const formulier = (
    <form className="bt-agenda-form" onSubmit={bewaar}>
      <label>
        <span>Naam</span>
        <input
          value={velden.naam}
          maxLength={80}
          required
          autoFocus
          placeholder="Bijv. Bo Chantal & Mitchel"
          onChange={(event) => setVelden({ ...velden, naam: event.target.value })}
        />
      </label>
      <div className="bt-agenda-twee">
        <label>
          <span>Datum</span>
          <input
            type="date"
            value={velden.datum}
            required
            onChange={(event) => setVelden({ ...velden, datum: event.target.value })}
          />
        </label>
        <label>
          <span>Plaats</span>
          <input
            value={velden.plaats}
            maxLength={80}
            placeholder="Bijv. De Vink, Vinkeveen"
            onChange={(event) => setVelden({ ...velden, plaats: event.target.value })}
          />
        </label>
      </div>
      <label className="bt-agenda-vink">
        <input
          type="checkbox"
          checked={velden.test}
          onChange={(event) => setVelden({ ...velden, test: event.target.checked })}
        />
        <span>Testfeest — telt niet mee in de jaarlijst</span>
      </label>
      {bewerk !== "nieuw" && (
        <p className="bt-agenda-uitleg">
          De link en de QR-code blijven hetzelfde, ook als je de naam verandert. Geprinte
          posters blijven dus werken; de nieuwe naam staat er vanzelf op als je hem opnieuw
          downloadt.
        </p>
      )}
      <div className="bt-agenda-knoppen">
        <button type="submit" className="bt-agenda-ok" disabled={bezig || !data.opslag}>
          {bewerk === "nieuw" ? "Zet in de agenda" : "Opslaan"}
        </button>
        <button type="button" className="bt-mini" onClick={() => begin(null)}>
          Annuleer
        </button>
      </div>
    </form>
  );

  const rij = (feest: AgendaFeest) => (
    <li key={feest.slug} className="bt-agenda-rij">
      {bewerk === feest.slug ? (
        formulier
      ) : (
        <>
          <div className="bt-agenda-info">
            <span className="bt-titel">
              {feest.naam}
              {feest.test && <span className="bt-archief-test">test</span>}
              {feest.open && <span className="bt-archief-test bt-agenda-nu">nu</span>}
            </span>
            <span className="bt-artiest">
              {feest.kort}
              {feest.plaats && ` · ${feest.plaats}`}
            </span>
            <span className="bt-meta">
              <span>
                {feest.aantal} {feest.aantal === 1 ? "verzoekje" : "verzoekjes"}
              </span>
              <span>
                {feest.bron === "booth"
                  ? "aangemaakt in de booth"
                  : feest.aangepast
                    ? "aangepast in de booth"
                    : "uit het agendabestand"}
              </span>
            </span>
          </div>
          <div className="bt-agenda-acties">
            <button type="button" className="bt-mini" onClick={() => onOpen(feest.slug)}>
              Verzoekjes
            </button>
            <button
              type="button"
              className="bt-mini"
              disabled={!data.opslag}
              onClick={() => begin(feest.slug, feest)}
            >
              Wijzig
            </button>
            <button
              type="button"
              className="bt-mini bt-agenda-weg"
              disabled={!data.opslag}
              onClick={() => {
                setWeg(weg === feest.slug ? null : feest.slug);
                setMelding(null);
              }}
            >
              Verwijder
            </button>
          </div>
          {weg === feest.slug && (
            <div className="bt-agenda-zeker" role="alert">
              <p>
                {feest.naam} uit de agenda halen? De link en de QR-code werken dan niet meer,
                en het feest telt niet meer mee in het archief en de jaarlijst.
                {feest.aantal > 0 && ` De ${feest.aantal} verzoekjes blijven wel bewaard.`} Zet
                je het feest later terug, dan is alles er weer.
              </p>
              <div className="bt-agenda-knoppen">
                <button
                  type="button"
                  className="bt-agenda-ok bt-agenda-rood"
                  disabled={bezig}
                  onClick={() => verwijder(feest)}
                >
                  Ja, verwijder
                </button>
                <button type="button" className="bt-mini" onClick={() => setWeg(null)}>
                  Laat staan
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );

  return (
    <div className="bt-agenda">
      {!data.opslag && (
        <p className="bt-waarschuwing">{FOUTEN["geen-database"]}</p>
      )}

      {bewerk === "nieuw" ? (
        <div className="bt-agenda-rij bt-agenda-nieuw">
          <h2>Nieuw feest</h2>
          {formulier}
        </div>
      ) : (
        <button
          type="button"
          className="bt-agenda-ok bt-agenda-plus"
          disabled={!data.opslag}
          onClick={() => begin("nieuw")}
        >
          + Nieuw feest
        </button>
      )}

      {fout && <p className="bt-waarschuwing">{fout}</p>}
      {melding && (
        <p className="bt-agenda-melding" role="status">
          <span>{melding.tekst}</span>
          <button type="button" className="bt-mini" onClick={() => onOpen(melding.slug)}>
            Naar het feest
          </button>
        </p>
      )}

      <h3 className="bt-agenda-kop">Komende feesten</h3>
      {komend.length === 0 ? (
        <p className="bt-leeg">Geen feesten gepland.</p>
      ) : (
        <ul className="bt-agenda-lijst">{komend.map(rij)}</ul>
      )}

      {geweest.length > 0 && (
        <>
          <h3 className="bt-agenda-kop">Geweest</h3>
          <ul className="bt-agenda-lijst">{geweest.map(rij)}</ul>
        </>
      )}

      {data.verwijderd.length > 0 && (
        <details className="bt-materiaal bt-agenda-verwijderd">
          <summary>Verwijderde feesten ({data.verwijderd.length})</summary>
          <ul className="bt-agenda-lijst">
            {data.verwijderd.map((feest) => (
              <li key={feest.slug} className="bt-agenda-rij">
                <div className="bt-agenda-info">
                  <span className="bt-titel">{feest.naam}</span>
                  <span className="bt-artiest">
                    {feest.kort}
                    {feest.plaats && ` · ${feest.plaats}`} · {feest.aantal}{" "}
                    {feest.aantal === 1 ? "verzoekje" : "verzoekjes"}
                  </span>
                </div>
                <div className="bt-agenda-acties">
                  <button
                    type="button"
                    className="bt-mini"
                    disabled={bezig || !data.opslag}
                    onClick={() => zetTerug(feest)}
                  >
                    Zet terug
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function veldenVan(feest: AgendaFeest): Velden {
  return {
    naam: feest.naam,
    datum: feest.datum,
    plaats: feest.plaats ?? "",
    test: feest.test,
  };
}
