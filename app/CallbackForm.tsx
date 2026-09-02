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
      if (!response.ok) throw new Error(String(response.status));
      setStatus("success");
      setName("");
      setPhone("");
    } catch {
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
          {errorMessage}{" "}
          <a href={whatsappHref} target="_blank" rel="noopener">
            {errorLinkLabel}
          </a>
        </p>
      )}
    </form>
  );
}
