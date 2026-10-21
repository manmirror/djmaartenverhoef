"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Suggestie } from "./types";

type Teksten = {
  titelLabel: string;
  titelPlaceholder: string;
  artiestLabel: string;
  artiestPlaceholder: string;
  vanLabel: string;
  vanPlaceholder: string;
  knop: string;
  knopBezig: string;
  geluktKop: string;
  geluktTekst: string;
  dubbelKop: string;
  dubbelTekst: string;
  nogEen: string;
  foutTekst: string;
  suggestieHint: string;
};

type Status = "idle" | "bezig" | "gelukt" | "dubbel" | "fout";

/** Per oorzaak een eigen melding, zodat een gast weet wat hij eraan kan doen. */
const REDENEN: Record<string, string> = {
  "geen-titel": "Vul even in welk nummer je wilt horen.",
  "te-vaak": "Je hebt er net al een paar gestuurd. Geef de dansvloer even de tijd.",
  vol: "De lijst van vanavond is vol. Loop even langs de booth.",
  gesloten: "De lijst voor dit feest is inmiddels gesloten.",
  "onbekend-feest": "Deze link hoort bij geen enkel feest. Scan de code opnieuw.",
};

/** Hoe lang we wachten met zoeken nadat er is getypt. */
const TYPPAUZE_MS = 180;

export default function VerzoekForm({
  feest,
  teksten,
}: {
  /** De slug van het feest waar dit formulier bij hoort. */
  feest: string;
  teksten: Teksten;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [reden, setReden] = useState<string | null>(null);

  const [vraag, setVraag] = useState("");
  const [suggesties, setSuggesties] = useState<Suggestie[]>([]);
  const [open, setOpen] = useState(false);
  const [gemarkeerd, setGemarkeerd] = useState(-1);

  // De velden zelf zijn de waarheid, niet de react-status: vult de browser ze
  // automatisch in, dan merkt react dat niet altijd en zouden we leegte sturen.
  const titelVeld = useRef<HTMLInputElement>(null);
  const artiestVeld = useRef<HTMLInputElement>(null);
  const lijstId = useId();
  const titelId = useId();

  useEffect(() => {
    const stop = new AbortController();
    // Even wachten met zoeken: anders vuurt elke aanslag een verzoek af.
    const wacht = setTimeout(async () => {
      if (vraag.trim().length < 2) {
        setSuggesties([]);
        return;
      }
      try {
        const antwoord = await fetch(
          `/api/verzoekjes/zoek?q=${encodeURIComponent(vraag)}`,
          { signal: stop.signal }
        );
        if (!antwoord.ok) return;
        const body = (await antwoord.json()) as { suggesties?: Suggestie[] };
        setSuggesties(body.suggesties ?? []);
        setGemarkeerd(-1);
      } catch {
        // Geen suggesties is geen ramp; het formulier werkt ook zonder.
      }
    }, TYPPAUZE_MS);

    return () => {
      clearTimeout(wacht);
      stop.abort();
    };
  }, [vraag]);

  function kies(suggestie: Suggestie) {
    if (titelVeld.current) titelVeld.current.value = suggestie.titel;
    if (artiestVeld.current) artiestVeld.current.value = suggestie.artiest;
    setOpen(false);
    setVraag("");
    setSuggesties([]);
    setGemarkeerd(-1);
  }

  function toetsInTitel(event: React.KeyboardEvent<HTMLInputElement>) {
    const zichtbaar = open && suggesties.length > 0;
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!zichtbaar) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setGemarkeerd((vorig) => (vorig + 1) % suggesties.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setGemarkeerd((vorig) => (vorig <= 0 ? suggesties.length - 1 : vorig - 1));
    } else if (event.key === "Enter" && gemarkeerd >= 0) {
      event.preventDefault();
      kies(suggesties[gemarkeerd]);
    }
  }

  async function verstuur(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "bezig") return;

    const formulier = event.currentTarget;
    const data = new FormData(formulier);
    const payload = {
      feest,
      titel: String(data.get("nummer") ?? ""),
      artiest: String(data.get("artiest") ?? ""),
      van: String(data.get("vanwie") ?? ""),
      bedrijfsnaam: String(data.get("bedrijfsnaam") ?? ""),
    };

    setOpen(false);
    setStatus("bezig");
    try {
      const antwoord = await fetch("/api/verzoekjes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await antwoord.json().catch(() => null);

      if (!antwoord.ok) {
        setReden(body?.error ?? `http-${antwoord.status}`);
        setStatus("fout");
        return;
      }

      formulier.reset();
      setVraag("");
      setSuggesties([]);
      setStatus(body?.resultaat === "stond-er-al" ? "dubbel" : "gelukt");
    } catch {
      setReden("netwerk");
      setStatus("fout");
    }
  }

  if (status === "gelukt" || status === "dubbel") {
    const dubbel = status === "dubbel";
    return (
      <div className="vz-klaar" role="status">
        <div className="vz-klaar-vink" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 12.5 9.5 18 20 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2>{dubbel ? teksten.dubbelKop : teksten.geluktKop}</h2>
        <p>{dubbel ? teksten.dubbelTekst : teksten.geluktTekst}</p>
        <button type="button" className="vz-nogeen" onClick={() => setStatus("idle")}>
          {teksten.nogEen}
        </button>
      </div>
    );
  }

  const lijstZichtbaar = open && vraag.trim().length >= 2 && suggesties.length > 0;

  return (
    <form className="vz-form" onSubmit={verstuur} autoComplete="off">
      {/* Geen <label> om dit veld heen: een tik op een suggestie zou dan ook
          als tik op het invoerveld gelden. */}
      <div className="vz-veld">
        <label className="vz-label" htmlFor={titelId}>
          {teksten.titelLabel}
        </label>
        <input
          id={titelId}
          ref={titelVeld}
          type="text"
          name="nummer"
          placeholder={teksten.titelPlaceholder}
          enterKeyHint="done"
          autoComplete="off"
          autoCapitalize="words"
          required
          role="combobox"
          aria-expanded={lijstZichtbaar}
          aria-controls={lijstId}
          aria-autocomplete="list"
          onInput={(event) => {
            setVraag(event.currentTarget.value);
            setOpen(true);
          }}
          onKeyDown={toetsInTitel}
          onBlur={() => {
            // Even wachten, anders is de lijst weg voordat een tik aankomt.
            setTimeout(() => setOpen(false), 120);
          }}
        />
        {lijstZichtbaar && (
          <div className="vz-dropdown">
            <span className="vz-sug-hint">{teksten.suggestieHint}</span>
            <ul className="vz-suggesties" id={lijstId} role="listbox">
              {suggesties.map((suggestie, nummer) => (
                <li key={`${suggestie.titel}-${suggestie.artiest}-${nummer}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={nummer === gemarkeerd}
                    className={nummer === gemarkeerd ? "vz-suggestie aan" : "vz-suggestie"}
                    onMouseEnter={() => setGemarkeerd(nummer)}
                    onClick={() => kies(suggestie)}
                  >
                    <span className="vz-sug-titel">{suggestie.titel}</span>
                    <span className="vz-sug-artiest">{suggestie.artiest}</span>
                    {suggestie.bpm !== null && (
                      <span className="vz-sug-bpm">{Math.round(suggestie.bpm)} bpm</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <label className="vz-veld">
        <span className="vz-label">{teksten.artiestLabel}</span>
        <input
          ref={artiestVeld}
          type="text"
          name="artiest"
          placeholder={teksten.artiestPlaceholder}
          autoComplete="off"
          autoCapitalize="words"
        />
      </label>

      <label className="vz-veld">
        <span className="vz-label">{teksten.vanLabel}</span>
        <input
          type="text"
          name="vanwie"
          placeholder={teksten.vanPlaceholder}
          autoComplete="off"
          autoCapitalize="words"
        />
      </label>

      {/* Onzichtbaar voor bezoekers; vult een bot dit in, dan negeren we het. */}
      <input
        type="text"
        name="bedrijfsnaam"
        className="vz-honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <button type="submit" className="vz-knop" disabled={status === "bezig"}>
        {status === "bezig" ? teksten.knopBezig : teksten.knop}
      </button>

      {status === "fout" && (
        <p className="vz-fout" role="alert">
          {REDENEN[reden ?? ""] ?? teksten.foutTekst}
          {reden && <span className="vz-code"> (code: {reden})</span>}
        </p>
      )}
    </form>
  );
}
