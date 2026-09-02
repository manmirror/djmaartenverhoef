"use client";

import { useState } from "react";

type Props = {
  heading: string;
  nameLabel: string;
  phoneLabel: string;
  buttonLabel: string;
  whatsappNumber: string;
};

export default function CallbackForm({
  heading,
  nameLabel,
  phoneLabel,
  buttonLabel,
  whatsappNumber,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Geen server nodig: het verzoek gaat als WhatsApp-bericht naar Maarten.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const message = `Hoi Maarten, bel je me even terug?${
      name ? `\nNaam: ${name}` : ""
    }${phone ? `\nNummer: ${phone}` : ""}`;
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener"
    );
  }

  return (
    <form className="callback" onSubmit={handleSubmit}>
      <div className="callback-head">{heading}</div>
      <div className="callback-fields">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={nameLabel}
          aria-label={nameLabel}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={phoneLabel}
          aria-label={phoneLabel}
        />
      </div>
      <button type="submit" className="callback-btn">
        {buttonLabel}
      </button>
    </form>
  );
}
