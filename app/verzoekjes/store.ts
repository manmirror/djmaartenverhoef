// Waar de verzoekjes blijven staan. Elk feest heeft zijn eigen lijst, en die
// lijsten blijven bewaard — daar komt de jaarlijst later uit.
//
// Zodra er een Redis aan het project hangt (zie redis.ts), gaat alles daarheen.
// Zonder die opslag vallen we terug op het geheugen van de server; dat is genoeg
// om lokaal te proberen, maar op Vercel heeft elke server zijn eigen geheugen.
// De api-route mailt verzoekjes in dat geval door, zodat er niets verdwijnt.
// Zie VERZOEKJES.md.

import { databaseNamen, geefOpslag } from "./redis";
import type { Match, Verzoek, VerzoekStatus } from "./types";

const VOORVOEGSEL = "verzoekjes:feest:";
/** Zoveel verzoekjes past er per feest op de lijst. */
const MAX_PER_FEEST = 300;

/** Rem per ip-adres. Ruim, want op een feest zit iedereen op dezelfde wifi. */
const REM_VENSTER_SEC = 10 * 60;
const REM_MAX = 30;

/** Hoe lang een handmatig opengezet feest open blijft. */
const FORCEER_SEC = 12 * 60 * 60;

export function opslagActief(): boolean {
  return geefOpslag() !== null;
}

/** Voor de booth: welke database er hangt, of welke namen er wél zijn. */
export function opslagInfo(): { soort: "upstash" | "redis" | null; namen: string[] } {
  const opslag = geefOpslag();
  return { soort: opslag?.soort ?? null, namen: opslag ? [] : databaseNamen() };
}

function sleutel(feest: string): string {
  return `${VOORVOEGSEL}${feest}`;
}

// ---- terugval: het geheugen van deze server ----
// Op globalThis, omdat Next dit bestand los inlaadt voor de pagina's en voor de
// api-routes. Anders ziet de feestpagina niet dat de booth hem heeft opengezet.
type Geheugen = {
  lijsten: Map<string, Map<string, Verzoek>>;
  open: Map<string, number>;
  rem: Map<string, number[]>;
  import: Map<string, number>;
};
const gedeeld = globalThis as typeof globalThis & { __verzoekjes?: Geheugen };
gedeeld.__verzoekjes ??= {
  lijsten: new Map(),
  open: new Map(),
  rem: new Map(),
  import: new Map(),
};
const geheugen = gedeeld.__verzoekjes.lijsten;
const geheugenOpen = gedeeld.__verzoekjes.open;
const geheugenRem = gedeeld.__verzoekjes.rem;
const geheugenImport = gedeeld.__verzoekjes.import;

function geheugenLijst(feest: string): Map<string, Verzoek> {
  let lijst = geheugen.get(feest);
  if (!lijst) {
    lijst = new Map();
    geheugen.set(feest, lijst);
  }
  return lijst;
}

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

function opTijd(ruw: unknown[]): Verzoek[] {
  return ruw
    .map(alsVerzoek)
    .filter((verzoek): verzoek is Verzoek => verzoek !== null)
    .sort((a, b) => b.tijd - a.tijd);
}

export async function leesVerzoeken(feest: string): Promise<Verzoek[]> {
  const redis = geefOpslag();
  if (!redis) return opTijd([...geheugenLijst(feest).values()]);

  const alles = await redis.hgetall(sleutel(feest));
  return opTijd(Object.values(alles ?? {}));
}

/** De lijsten van meerdere feesten in één keer, voor de jaarlijst. */
export async function leesMeerdere(
  feesten: string[]
): Promise<Map<string, Verzoek[]>> {
  const uitkomst = new Map<string, Verzoek[]>();
  if (feesten.length === 0) return uitkomst;

  const redis = geefOpslag();
  if (!redis) {
    for (const feest of feesten) {
      uitkomst.set(feest, opTijd([...geheugenLijst(feest).values()]));
    }
    return uitkomst;
  }

  // Eén ronde naar de database in plaats van één per feest.
  const antwoorden = await redis.hgetallVeel(feesten.map(sleutel));

  feesten.forEach((feest, nummer) => {
    uitkomst.set(feest, opTijd(Object.values(antwoorden[nummer] ?? {})));
  });
  return uitkomst;
}

export type ToevoegResultaat = "toegevoegd" | "stond-er-al" | "vol";

/**
 * Zet een verzoekje op de lijst van zijn feest. Staat hetzelfde nummer er al
 * op als `nieuw`, dan laten we het daarbij — anders staat dezelfde plaat er
 * tien keer tussen.
 */
export async function voegVerzoekToe(
  verzoek: Verzoek,
  zelfdeAls: (ander: Verzoek) => boolean
): Promise<ToevoegResultaat> {
  const bestaand = await leesVerzoeken(verzoek.feest);
  if (bestaand.some((ander) => ander.status === "nieuw" && zelfdeAls(ander))) {
    return "stond-er-al";
  }
  if (bestaand.length >= MAX_PER_FEEST) return "vol";

  const redis = geefOpslag();
  if (redis) {
    await redis.hset(sleutel(verzoek.feest), {
      [verzoek.id]: JSON.stringify(verzoek),
    });
  } else {
    geheugenLijst(verzoek.feest).set(verzoek.id, verzoek);
  }
  return "toegevoegd";
}

/** Past één verzoekje aan; false als het niet (meer) bestaat. */
async function werkBij(
  feest: string,
  id: string,
  wijziging: Partial<Pick<Verzoek, "status" | "match">>
): Promise<boolean> {
  const redis = geefOpslag();
  if (!redis) {
    const lijst = geheugenLijst(feest);
    const verzoek = lijst.get(id);
    if (!verzoek) return false;
    lijst.set(id, { ...verzoek, ...wijziging });
    return true;
  }

  const huidig = alsVerzoek(await redis.hget(sleutel(feest), id));
  if (!huidig) return false;
  await redis.hset(sleutel(feest), {
    [id]: JSON.stringify({ ...huidig, ...wijziging }),
  });
  return true;
}

export function zetStatus(feest: string, id: string, status: VerzoekStatus) {
  return werkBij(feest, id, { status });
}

/** Een andere match kiezen, of met `null` de match weghalen. */
export function zetMatch(feest: string, id: string, match: Match | null) {
  return werkBij(feest, id, { match });
}

/** Eén verzoekje weghalen, bijvoorbeeld als er onzin tussen staat. */
export async function verwijderVerzoek(feest: string, id: string): Promise<boolean> {
  const redis = geefOpslag();
  if (!redis) return geheugenLijst(feest).delete(id);
  return (await redis.hdel(sleutel(feest), id)) > 0;
}

// ---- verzoekjes van oude feesten, uit content/feesten.ts ----

/** Hoeveel regels van dit feest al eens zijn ingelezen. */
export async function importStand(feest: string): Promise<number> {
  const redis = geefOpslag();
  if (!redis) return geheugenImport.get(feest) ?? 0;
  return Number((await redis.get(`verzoekjes:import:${feest}`)) ?? 0);
}

export async function zetImportStand(feest: string, regels: number): Promise<void> {
  const redis = geefOpslag();
  if (redis) await redis.set(`verzoekjes:import:${feest}`, String(regels));
  else geheugenImport.set(feest, regels);
}

/**
 * Zet een ingelezen verzoekje erin, maar alleen als er nog niets met dat id
 * staat. De ids van ingelezen regels liggen vast, dus lezen twee servers
 * tegelijk in, dan komt elke regel er toch maar één keer in.
 */
export async function voegToeAlsNieuw(verzoek: Verzoek): Promise<void> {
  const redis = geefOpslag();
  if (redis) {
    await redis.hsetnx(sleutel(verzoek.feest), verzoek.id, JSON.stringify(verzoek));
    return;
  }
  const lijst = geheugenLijst(verzoek.feest);
  if (!lijst.has(verzoek.id)) lijst.set(verzoek.id, verzoek);
}

/**
 * Een feest met de hand openzetten, voor als de agenda niet klopt en de gasten
 * er al zijn. Vervalt vanzelf.
 */
export async function zetOpen(feest: string): Promise<void> {
  const redis = geefOpslag();
  if (redis) {
    await redis.set(`verzoekjes:open:${feest}`, "1", FORCEER_SEC);
  } else {
    geheugenOpen.set(feest, Date.now() + FORCEER_SEC * 1000);
  }
}

export async function isHandmatigOpen(feest: string): Promise<boolean> {
  const redis = geefOpslag();
  if (redis) return redis.exists(`verzoekjes:open:${feest}`);

  const tot = geheugenOpen.get(feest);
  return tot !== undefined && tot > Date.now();
}

/**
 * Simpele rem per ip. Bedoeld tegen geautomatiseerd spammen, niet tegen een
 * enthousiaste gast: op een feest delen alle telefoons hetzelfde ip-adres.
 */
export async function teVaak(ip: string, soort: string, max = REM_MAX): Promise<boolean> {
  const rem = `verzoekjes:rem:${soort}:${ip}`;
  const redis = geefOpslag();

  if (redis) {
    const aantal = await redis.incr(rem);
    if (aantal === 1) await redis.expire(rem, REM_VENSTER_SEC);
    return aantal > max;
  }

  const nu = Date.now();
  const venster = REM_VENSTER_SEC * 1000;
  const tijden = (geheugenRem.get(rem) ?? []).filter((t) => nu - t < venster);
  tijden.push(nu);
  geheugenRem.set(rem, tijden);
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
