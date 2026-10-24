"use client";

import { useState } from "react";

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

/**
 * Het formulier voor de gasten. Ze typen zelf wat ze willen horen; het
 * koppelen aan de collectie gebeurt achter de schermen.
 */
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

  async function verstuur(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "bezig") return;

    // De velden zelf zijn de waarheid, niet de react-status: vult de browser ze
    // automatisch in, dan merkt react dat niet altijd en zouden we leegte sturen.
    const formulier = event.currentTarget;
    const data = new FormData(formulier);
    const payload = {
      feest,
      titel: String(data.get("nummer") ?? ""),
      artiest: String(data.get("artiest") ?? ""),
      van: String(data.get("vanwie") ?? ""),
      bedrijfsnaam: String(data.get("bedrijfsnaam") ?? ""),
    };

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

  return (
    <form className="vz-form" onSubmit={verstuur} autoComplete="off">
      <label className="vz-veld">
        <span className="vz-label">{teksten.titelLabel}</span>
        <input
          type="text"
          name="nummer"
          placeholder={teksten.titelPlaceholder}
          autoComplete="off"
          autoCapitalize="words"
          required
        />
      </label>

      <label className="vz-veld">
        <span className="vz-label">{teksten.artiestLabel}</span>
        <input
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
          maxLength={140}
          autoComplete="off"
          autoCapitalize="sentences"
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
