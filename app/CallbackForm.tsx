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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: blijft leeg bij mensen
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    try {
      const response = await fetch("/api/terugbellen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, website }),
      });
      if (!response.ok) {
        // De server vertelt wát er misging; dat helpt bij het oplossen.
        const body = await response.json().catch(() => null);
        setReason(body?.error ?? `http-${response.status}`);
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setPhone("");
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
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={phoneLabel}
          aria-label={phoneLabel}
          autoComplete="tel"
          required
        />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={nameLabel}
          aria-label={nameLabel}
          autoComplete="name"
          required
        />
        {/* Onzichtbaar voor bezoekers; vult een bot dit in, dan negeren we het. */}
        <input
          type="text"
          className="callback-honeypot"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
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
