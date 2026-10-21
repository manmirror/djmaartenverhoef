import { randomUUID } from "node:crypto";

import { Resend } from "resend";

import { normaliseer, zoekGegevens } from "@/app/verzoekjes/collectie";
import {
  geefIp,
  opslagActief,
  teVaak,
  voegVerzoekToe,
} from "@/app/verzoekjes/store";
import type { Verzoek } from "@/app/verzoekjes/types";
import { siteContent } from "@/content/site";

export const runtime = "nodejs";

const MAX_TITEL = 120;
const MAX_ARTIEST = 120;
const MAX_VAN = 60;

/** Zelfde nummer binnen dit tijdvak telt als hetzelfde verzoekje. */
const DUBBEL_VENSTER_MS = 2 * 60 * 60 * 1000;

export async function POST(request: Request) {
  let body: {
    titel?: string;
    artiest?: string;
    van?: string;
    bedrijfsnaam?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Honeypot: onzichtbaar voor bezoekers, dus alleen bots vullen dit in.
  if (body.bedrijfsnaam) {
    return Response.json({ ok: true, resultaat: "toegevoegd" });
  }

  const titel = (body.titel ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_TITEL);
  const artiest = (body.artiest ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_ARTIEST);
  const van = (body.van ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_VAN);

  if (!titel) {
    return Response.json({ error: "geen-titel" }, { status: 400 });
  }

  if (await teVaak(geefIp(request), "verzoek")) {
    return Response.json({ error: "te-vaak" }, { status: 429 });
  }

  // Staat het nummer in de rekordbox-collectie, dan weten we de bpm erbij.
  const gevonden = zoekGegevens(titel, artiest);

  const verzoek: Verzoek = {
    id: randomUUID(),
    titel: gevonden?.t ?? titel,
    artiest: gevonden?.a ?? artiest,
    van,
    bpm: gevonden?.b ?? null,
    toon: gevonden?.k ?? null,
    genre: gevonden?.g ?? null,
    jaar: gevonden?.y ?? null,
    inCollectie: gevonden !== null,
    status: "nieuw",
    tijd: Date.now(),
  };

  const sleutel = `${normaliseer(verzoek.titel)}|${normaliseer(verzoek.artiest)}`;
  const resultaat = await voegVerzoekToe(verzoek, (ander) => {
    if (verzoek.tijd - ander.tijd > DUBBEL_VENSTER_MS) return false;
    return `${normaliseer(ander.titel)}|${normaliseer(ander.artiest)}` === sleutel;
  });

  if (resultaat === "vol") {
    return Response.json({ error: "vol" }, { status: 409 });
  }

  // Zonder gedeelde opslag staat de lijst alleen in het geheugen van deze
  // server; dan mailen we het verzoekje door zodat het niet verdwijnt.
  if (resultaat === "toegevoegd" && (!opslagActief() || process.env.VERZOEKJES_MAIL === "1")) {
    await mailDoor(verzoek);
  }

  return Response.json({ ok: true, resultaat });
}

/**
 * Alleen om te kunnen zien of de route leeft en of de opslag staat. Bewust
 * zonder de lijst zelf: die haalt de boothpagina op, mét code.
 */
export async function GET() {
  return Response.json({ opslag: opslagActief() });
}

async function mailDoor(verzoek: Verzoek) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY ontbreekt; verzoekje niet doorgemaild.");
    return;
  }

  const from = process.env.CALLBACK_FROM || "Website <formulier@djmaartenverhoef.nl>";
  const to = process.env.VERZOEKJES_TO || process.env.CALLBACK_TO || siteContent.email;

  const regels = [
    `${verzoek.titel}${verzoek.artiest ? ` — ${verzoek.artiest}` : ""}`,
    "",
    verzoek.van ? `Aangevraagd door: ${verzoek.van}` : "Aangevraagd door: (niet ingevuld)",
    verzoek.bpm !== null ? `BPM: ${verzoek.bpm}` : "BPM: niet gevonden in de collectie",
    verzoek.toon ? `Toonaard: ${verzoek.toon}` : null,
    verzoek.genre ? `Genre: ${verzoek.genre}` : null,
    "",
    "Verstuurd via djmaartenverhoef.nl/verzoekjes",
  ].filter((regel) => regel !== null);

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: siteContent.email,
    subject: `Verzoekje: ${verzoek.titel}`,
    text: regels.join("\n"),
  });

  if (error) {
    console.error("Resend gaf een fout bij het verzoekje:", error);
  }
}
