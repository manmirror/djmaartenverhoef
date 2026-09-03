"use client";

import { useState } from "react";

type Props = {
  heading: string;
  nameLabel: string;
  phoneLabel: string;
  buttonLabel: string;
  sendingLabel: string;
  successMessage: string;
  errorMessage: string;
  errorLinkLabel: string;
  /** Uitwijk als versturen niet lukt, bijvoorbeeld door een adblocker. */
  whatsappHref: string;
};

type Status = "idle" | "sending" | "success" | "error";

// Per oorzaak een eigen melding, zodat een bezoeker weet wat hij eraan kan doen
// en jij bij een storing meteen ziet waar het fout gaat.
const REASON_MESSAGES: Record<string, string> = {
  ratelimited:
    "Je hebt net al een verzoek gestuurd. Wacht even een kwartier, of",
  phone: "Dat telefoonnummer lijkt niet te kloppen. Controleer het even, of",
  incomplete: "Vul allebei de velden in, of",
};

export default function CallbackForm({
  heading,
  nameLabel,
  phoneLabel,
  buttonLabel,
  sendingLabel,
  successMessage,
  errorMessage,
  errorLinkLabel,
  whatsappHref,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    // Rechtstreeks uit het formulier lezen in plaats van uit de React-status.
    // Vult de browser velden automatisch in, dan komt dat niet altijd in die
    // status terecht en zou er leegte verstuurd worden.
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("naam") ?? ""),
      phone: String(data.get("telefoon") ?? ""),
      website: String(data.get("bedrijfsnaam") ?? ""),
    };

    setStatus("sending");
    try {
      const response = await fetch("/api/terugbellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // De server vertelt wát er misging; dat helpt bij het oplossen.
        const body = await response.json().catch(() => null);
        setReason(body?.error ?? `http-${response.status}`);
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      // De aanvraag kwam niet eens bij de server aan.
      setReason("netwerk");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="callback">
        <div className="callback-head">{heading}</div>
        <p className="callback-success" role="status">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form className="callback" onSubmit={handleSubmit}>
      <div className="callback-head">{heading}</div>
      <div className="callback-fields">
        <input
          type="tel"
          name="telefoon"
          placeholder={phoneLabel}
          aria-label={phoneLabel}
          autoComplete="tel"
          required
        />
        <input
          type="text"
          name="naam"
          placeholder={nameLabel}
          aria-label={nameLabel}
          autoComplete="name"
          required
        />
        {/* Onzichtbaar voor bezoekers; vult een bot dit in, dan negeren we het.
            De naam is bewust iets wat de browser niet automatisch invult. */}
        <input
          type="text"
          name="bedrijfsnaam"
          className="callback-honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>
      <button type="submit" className="callback-btn" disabled={status === "sending"}>
        {status === "sending" ? sendingLabel : buttonLabel}
      </button>
      {status === "error" && (
        <p className="callback-error" role="alert">
          {REASON_MESSAGES[reason ?? ""] ?? errorMessage}{" "}
          <a href={whatsappHref} target="_blank" rel="noopener">
            {errorLinkLabel}
          </a>
          {reason && <span className="callback-code"> (code: {reason})</span>}
        </p>
      )}
    </form>
  );
}
