// Waar de verzoekjes van een avond blijven staan.
//
// Zodra er een Upstash Redis aan het project hangt (via de Vercel Marketplace),
// gaat alles daarheen: dan ziet de booth precies wat de bezoekers insturen, ook
// als Vercel het verzoek op een andere server afhandelt.
//
// Zonder die opslag vallen we terug op het geheugen van de server. Dat is
// genoeg om lokaal te proberen, maar op Vercel heeft elke server zijn eigen
// geheugen — daarom mailt de api-route in dat geval elk verzoekje door, zodat
// er niets verdwijnt. Zie VERZOEKJES.md.

import { Redis } from "@upstash/redis";

import type { Verzoek, VerzoekStatus } from "./types";

const LIJST = "verzoekjes:lijst";
/** Zoveel verzoekjes houdt de lijst vast; daarna is hij vol tot je hem wist. */
const MAX_VERZOEKJES = 300;

/** Rem per ip-adres. Ruim, want op een feest zit iedereen op dezelfde wifi. */
const REM_VENSTER_SEC = 10 * 60;
const REM_MAX = 30;

let client: Redis | null | undefined;

/**
 * De Vercel-integratie van Upstash zet `KV_*` in de omgeving, Upstash zelf
 * `UPSTASH_REDIS_*`. We accepteren beide, zodat het werkt hoe je het ook koppelt.
 */
function geefClient(): Redis | null {
  if (client === undefined) {
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token =
      process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    client = url && token ? new Redis({ url, token }) : null;
    if (!client) {
      console.warn(
        "Geen Redis gevonden voor de verzoekjes; de lijst blijft alleen in het geheugen staan."
      );
    }
  }
  return client;
}

export function opslagActief(): boolean {
  return geefClient() !== null;
}

// ---- terugval: het geheugen van deze server ----
const geheugen = new Map<string, Verzoek>();
const geheugenRem = new Map<string, number[]>();

/** Upstash geeft json terug als object; een losse string lezen we zelf uit. */
function alsVerzoek(waarde: unknown): Verzoek | null {
  if (typeof waarde === "string") {
    try {
      return JSON.parse(waarde) as Verzoek;
    } catch {
      return null;
    }
  }
  return waarde && typeof waarde === "object" ? (waarde as Verzoek) : null;
}

export async function leesVerzoeken(): Promise<Verzoek[]> {
  const redis = geefClient();
  const alles = redis
    ? Object.values((await redis.hgetall<Record<string, unknown>>(LIJST)) ?? {})
    : [...geheugen.values()];

  return alles
    .map(alsVerzoek)
    .filter((verzoek): verzoek is Verzoek => verzoek !== null)
    .sort((a, b) => b.tijd - a.tijd);
}

export type ToevoegResultaat = "toegevoegd" | "stond-er-al" | "vol";

/**
 * Zet een verzoekje op de lijst. Staat hetzelfde nummer er al op als `nieuw`,
 * dan laten we het daarbij — anders staat dezelfde plaat er tien keer tussen.
 */
export async function voegVerzoekToe(
  verzoek: Verzoek,
  zelfdeAls: (ander: Verzoek) => boolean
): Promise<ToevoegResultaat> {
  const bestaand = await leesVerzoeken();
  if (bestaand.some((ander) => ander.status === "nieuw" && zelfdeAls(ander))) {
    return "stond-er-al";
  }
  if (bestaand.length >= MAX_VERZOEKJES) return "vol";

  const redis = geefClient();
  if (redis) {
    await redis.hset(LIJST, { [verzoek.id]: JSON.stringify(verzoek) });
  } else {
    geheugen.set(verzoek.id, verzoek);
  }
  return "toegevoegd";
}

export async function zetStatus(
  id: string,
  status: VerzoekStatus
): Promise<boolean> {
  const redis = geefClient();
  if (!redis) {
    const verzoek = geheugen.get(id);
    if (!verzoek) return false;
    geheugen.set(id, { ...verzoek, status });
    return true;
  }

  const huidig = alsVerzoek(await redis.hget(LIJST, id));
  if (!huidig) return false;
  await redis.hset(LIJST, { [id]: JSON.stringify({ ...huidig, status }) });
  return true;
}

export async function wisVerzoeken(): Promise<void> {
  const redis = geefClient();
  if (redis) {
    await redis.del(LIJST);
  } else {
    geheugen.clear();
  }
}

/**
 * Simpele rem per ip. Bedoeld tegen geautomatiseerd spammen, niet tegen een
 * enthousiaste gast: op een feest delen alle telefoons hetzelfde ip-adres.
 */
export async function teVaak(ip: string, soort: string, max = REM_MAX): Promise<boolean> {
  const sleutel = `verzoekjes:rem:${soort}:${ip}`;
  const redis = geefClient();

  if (redis) {
    const aantal = await redis.incr(sleutel);
    if (aantal === 1) await redis.expire(sleutel, REM_VENSTER_SEC);
    return aantal > max;
  }

  const nu = Date.now();
  const venster = REM_VENSTER_SEC * 1000;
  const tijden = (geheugenRem.get(sleutel) ?? []).filter((t) => nu - t < venster);
  tijden.push(nu);
  geheugenRem.set(sleutel, tijden);
  if (geheugenRem.size > 500) {
    for (const [key, times] of geheugenRem) {
      if (times.every((t) => nu - t >= venster)) geheugenRem.delete(key);
    }
  }
  return tijden.length > max;
}

/** Het ip-adres van de bezoeker, voor de rem hierboven. */
export function geefIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "onbekend";
}
