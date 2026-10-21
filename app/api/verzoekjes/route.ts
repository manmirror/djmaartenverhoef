import { randomUUID } from "node:crypto";

import { Resend } from "resend";

import { kenmerk, naarMatch, vindInCollectie } from "@/app/verzoekjes/collectie";
import { datumVoluit, isOpen, vindFeest } from "@/app/verzoekjes/feesten";
import {
  geefIp,
  isHandmatigOpen,
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
    feest?: string;
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

  const feest = vindFeest((body.feest ?? "").trim());
  if (!feest) {
    return Response.json({ error: "onbekend-feest" }, { status: 400 });
  }

  // Buiten de avond van het feest nemen we niets aan, tenzij het feest in de
  // booth met de hand is opengezet.
  if (!isOpen(feest) && !(await isHandmatigOpen(feest.slug))) {
    return Response.json(
      { error: "gesloten", datum: datumVoluit(feest) },
      { status: 403 }
    );
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

  // Achter de schermen koppelen aan de rekordbox-collectie. Wat de gast typte
  // bewaren we ongewijzigd; de match staat ernaast.
  const treffer = vindInCollectie(titel, artiest);

  const verzoek: Verzoek = {
    id: randomUUID(),
    feest: feest.slug,
    titel,
    artiest,
    van,
    match: treffer
      ? naarMatch(treffer.track, {
          versies: treffer.versies,
          andereArtiest: treffer.andereArtiest,
        })
      : null,
    status: "nieuw",
    tijd: Date.now(),
  };

  // "dancing queen" en "ABBA - Dancing Queen" zijn hetzelfde verzoekje.
  const dit = kenmerk(verzoek);
  const resultaat = await voegVerzoekToe(verzoek, (ander) => {
    if (verzoek.tijd - ander.tijd > DUBBEL_VENSTER_MS) return false;
    return kenmerk(ander) === dit;
  });

  if (resultaat === "vol") {
    return Response.json({ error: "vol" }, { status: 409 });
  }

  // Zonder gedeelde opslag staat de lijst alleen in het geheugen van deze
  // server; dan mailen we het verzoekje door zodat het niet verdwijnt.
  if (resultaat === "toegevoegd" && (!opslagActief() || process.env.VERZOEKJES_MAIL === "1")) {
    await mailDoor(verzoek, feest.naam);
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

async function mailDoor(verzoek: Verzoek, feestnaam: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY ontbreekt; verzoekje niet doorgemaild.");
    return;
  }

  const from = process.env.CALLBACK_FROM || "Website <formulier@djmaartenverhoef.nl>";
  const to = process.env.VERZOEKJES_TO || process.env.CALLBACK_TO || siteContent.email;

  const { match } = verzoek;
  const regels = [
    `${verzoek.titel}${verzoek.artiest ? ` — ${verzoek.artiest}` : ""}`,
    "",
    `Feest: ${feestnaam}`,
    verzoek.van ? `Aangevraagd door: ${verzoek.van}` : "Aangevraagd door: (niet ingevuld)",
    "",
    match
      ? `In je collectie: ${match.titel}${match.artiest ? ` — ${match.artiest}` : ""}`
      : "Niet gevonden in je collectie",
    match?.andereArtiest ? "Let op: andere artiest dan gevraagd" : null,
    match?.bpm != null ? `BPM: ${Math.round(match.bpm)}` : null,
    match?.toon ? `Toonaard: ${match.toon}` : null,
    match && match.versies > 1 ? `Versies in je collectie: ${match.versies}` : null,
    "",
    "Verstuurd via djmaartenverhoef.nl/verzoekjes",
  ].filter((regel) => regel !== null);

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to,
    replyTo: siteContent.email,
    subject: `Verzoekje (${feestnaam}): ${verzoek.titel}`,
    text: regels.join("\n"),
  });

  if (error) {
    console.error("Resend gaf een fout bij het verzoekje:", error);
  }
}
