// De verbinding met de database waar de verzoekjes in staan.
//
// Op Vercel kun je op twee manieren een Redis koppelen, en elk zet andere
// variabelen in de omgeving:
//
//   * Upstash for Redis  →  KV_REST_API_URL + KV_REST_API_TOKEN (praat via https)
//   * Redis              →  REDIS_URL (een gewone redis://-verbinding)
//
// Bij het koppelen kun je er ook nog een eigen voorvoegsel voor zetten, zoals
// STORAGE_KV_REST_API_URL. We zoeken daarom op het einde van de naam, en
// gebruiken wat we vinden. Upstash heeft de voorkeur: dat werkt zonder open
// verbinding, wat beter past bij hoe Vercel functies draait.

import { Redis as Upstash } from "@upstash/redis";
import { createClient } from "redis";

/** Alleen de opdrachten die de verzoekjes nodig hebben. */
export type Opslag = {
  soort: "upstash" | "redis";
  hgetall(sleutel: string): Promise<Record<string, unknown> | null>;
  /** Meerdere lijsten in één ronde. */
  hgetallVeel(sleutels: string[]): Promise<(Record<string, unknown> | null)[]>;
  hget(sleutel: string, veld: string): Promise<unknown>;
  hset(sleutel: string, velden: Record<string, string>): Promise<void>;
  hsetnx(sleutel: string, veld: string, waarde: string): Promise<void>;
  hdel(sleutel: string, veld: string): Promise<number>;
  get(sleutel: string): Promise<unknown>;
  del(sleutel: string): Promise<void>;
  set(sleutel: string, waarde: string, verloopSec?: number): Promise<void>;
  exists(sleutel: string): Promise<boolean>;
  incr(sleutel: string): Promise<number>;
  expire(sleutel: string, sec: number): Promise<void>;
};

/** Kortste naam eerst, zodat KV_REST_API_URL wint van STORAGE_KV_REST_API_URL. */
function namen(): string[] {
  return Object.keys(process.env).sort((a, b) => a.length - b.length);
}

function zoekUpstash(): { url: string; token: string } | null {
  for (const naam of namen()) {
    const passend =
      naam.match(/^(.*)KV_REST_API_URL$/) ?? naam.match(/^(.*)UPSTASH_REDIS_REST_URL$/);
    if (!passend) continue;
    const tokenNaam = naam.replace(/_URL$/, "_TOKEN");
    const url = process.env[naam];
    const token = process.env[tokenNaam];
    if (url && token) return { url, token };
  }
  return null;
}

function zoekRedisUrl(): string | null {
  for (const naam of namen()) {
    if (!/(^|_)(REDIS_URL|KV_URL)$/.test(naam)) continue;
    const waarde = process.env[naam] ?? "";
    if (/^rediss?:\/\//.test(waarde)) return waarde;
  }
  return null;
}

/**
 * De namen (nooit de waardes) van variabelen die op een database lijken. Laat
 * de booth zien als hij geen verbinding kan maken, zodat te zien is wat er
 * wél staat.
 */
export function databaseNamen(): string[] {
  return Object.keys(process.env)
    .filter((naam) => /REDIS|UPSTASH|(^|_)KV_/i.test(naam))
    .sort();
}

function maakUpstash(url: string, token: string): Opslag {
  const redis = new Upstash({ url, token });
  return {
    soort: "upstash",
    hgetall: (sleutel) => redis.hgetall<Record<string, unknown>>(sleutel),
    async hgetallVeel(sleutels) {
      if (sleutels.length === 0) return [];
      const pijp = redis.pipeline();
      for (const sleutel of sleutels) pijp.hgetall(sleutel);
      return (await pijp.exec()) as (Record<string, unknown> | null)[];
    },
    hget: (sleutel, veld) => redis.hget(sleutel, veld),
    async hset(sleutel, velden) {
      await redis.hset(sleutel, velden);
    },
    async hsetnx(sleutel, veld, waarde) {
      await redis.hsetnx(sleutel, veld, waarde);
    },
    hdel: (sleutel, veld) => redis.hdel(sleutel, veld),
    get: (sleutel) => redis.get(sleutel),
    async del(sleutel) {
      await redis.del(sleutel);
    },
    async set(sleutel, waarde, verloopSec) {
      if (verloopSec) await redis.set(sleutel, waarde, { ex: verloopSec });
      else await redis.set(sleutel, waarde);
    },
    exists: async (sleutel) => (await redis.exists(sleutel)) > 0,
    incr: (sleutel) => redis.incr(sleutel),
    async expire(sleutel, sec) {
      await redis.expire(sleutel, sec);
    },
  };
}

function maakRedis(url: string): Opslag {
  const client = createClient({ url });
  // Zonder luisteraar laat een weggevallen verbinding de hele functie omvallen.
  client.on("error", (fout) => console.error("Redis-verbinding:", fout));

  let verbinding: Promise<unknown> | null = null;
  async function klaar() {
    if (client.isReady) return client;
    verbinding ??= client.connect().catch((fout) => {
      // Volgende keer opnieuw proberen in plaats van voor altijd te falen.
      verbinding = null;
      throw fout;
    });
    await verbinding;
    return client;
  }

  return {
    soort: "redis",
    hgetall: async (sleutel) => (await klaar()).hGetAll(sleutel),
    async hgetallVeel(sleutels) {
      const c = await klaar();
      // node-redis stuurt opdrachten uit dezelfde ronde vanzelf samen op.
      return Promise.all(sleutels.map((sleutel) => c.hGetAll(sleutel)));
    },
    hget: async (sleutel, veld) => (await klaar()).hGet(sleutel, veld),
    async hset(sleutel, velden) {
      await (await klaar()).hSet(sleutel, velden);
    },
    async hsetnx(sleutel, veld, waarde) {
      await (await klaar()).hSetNX(sleutel, veld, waarde);
    },
    hdel: async (sleutel, veld) => (await klaar()).hDel(sleutel, veld),
    get: async (sleutel) => (await klaar()).get(sleutel),
    async del(sleutel) {
      await (await klaar()).del(sleutel);
    },
    async set(sleutel, waarde, verloopSec) {
      const c = await klaar();
      if (verloopSec) {
        await c.set(sleutel, waarde, { expiration: { type: "EX", value: verloopSec } });
      } else {
        await c.set(sleutel, waarde);
      }
    },
    exists: async (sleutel) => (await (await klaar()).exists(sleutel)) > 0,
    incr: async (sleutel) => (await klaar()).incr(sleutel),
    async expire(sleutel, sec) {
      await (await klaar()).expire(sleutel, sec);
    },
  };
}

let opslag: Opslag | null | undefined;

/** De database, of null als er geen gekoppeld is. Eén keer per proces opgezocht. */
export function geefOpslag(): Opslag | null {
  if (opslag === undefined) {
    const upstash = zoekUpstash();
    const redisUrl = upstash ? null : zoekRedisUrl();
    opslag = upstash
      ? maakUpstash(upstash.url, upstash.token)
      : redisUrl
        ? maakRedis(redisUrl)
        : null;

    if (!opslag) {
      console.warn(
        `Geen database gevonden voor de verzoekjes. Variabelen die erop lijken: ${
          databaseNamen().join(", ") || "geen"
        }.`
      );
    }
  }
  return opslag;
}
