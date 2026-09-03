import { checkBotId } from "botid/server";
import { Resend } from "resend";

import { siteContent } from "@/content/site";

export const runtime = "nodejs";

// Het domein dat in Resend geverifieerd is, is djmaartenverhoef.nl zelf — de
// DKIM-sleutel staat daar. Het subdomein send.djmaartenverhoef.nl is alleen de
// route voor bounces, geen adres waar vandaan verstuurd mag worden.
// Bewust een ander postvak dan de ontvanger: mail van en naar precies hetzelfde
// adres wordt door ontvangende servers eerder als spoofing gelezen.
const FROM = process.env.CALLBACK_FROM || "Website <formulier@djmaartenverhoef.nl>";

const MAX_NAME = 100;
const MAX_PHONE = 40;

// Eenvoudige rem per IP: hooguit een paar aanvragen per kwartier. Draait in het
// geheugen van de functie, dus het is geen harde garantie — het vangt vooral
// het herhaald versturen van hetzelfde formulier af.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 3;
const recent = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 500) {
    for (const [key, times] of recent) {
      if (times.every((t) => now - t >= WINDOW_MS)) recent.delete(key);
    }
  }
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; website?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  // Honeypot: dit veld is onzichtbaar voor bezoekers, dus alleen bots vullen het.
  if (body.website) {
    return Response.json({ ok: true });
  }

  const name = (body.name ?? "").trim().slice(0, MAX_NAME);
  const phone = (body.phone ?? "").trim().slice(0, MAX_PHONE);

  if (!name || !phone) {
    return Response.json({ error: "incomplete" }, { status: 400 });
  }
  // Minstens een paar cijfers, anders is het geen telefoonnummer.
  if ((phone.match(/\d/g) ?? []).length < 8) {
    return Response.json({ error: "phone" }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "onbekend";
  if (isRateLimited(ip)) {
    return Response.json({ error: "ratelimited" }, { status: 429 });
  }

  // De bot-controle draait alleen op Vercel. Kan hij niet draaien — lokaal, of
  // bij een storing — dan laten we het verzoek door in plaats van een echte
  // klant tegen te houden; de honeypot en de limiet per IP blijven gelden.
  try {
    const verification = await checkBotId();
    if (verification.isBot) {
      return Response.json({ error: "bot" }, { status: 403 });
    }
  } catch (error) {
    console.warn("Bot-controle kon niet draaien, verzoek toch doorgelaten:", error);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY ontbreekt; terugbelverzoek niet verstuurd.");
    return Response.json({ error: "unconfigured" }, { status: 500 });
  }

  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: siteContent.email,
    replyTo: siteContent.email,
    subject: `Terugbelverzoek van ${name}`,
    text: [
      `${name} wil teruggebeld worden.`,
      "",
      `Naam: ${name}`,
      `Telefoon: ${phone}`,
      "",
      "Verstuurd via het formulier op djmaartenverhoef.nl",
    ].join("\n"),
  });

  if (error) {
    console.error("Resend gaf een fout bij het terugbelverzoek:", error);
    // De melding van Resend meesturen, anders is een storing niet te herleiden.
    return Response.json(
      { error: "send", detail: error.message ?? error.name },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
