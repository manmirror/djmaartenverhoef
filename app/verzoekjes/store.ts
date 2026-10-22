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

/** Hoe lang een feest op Aan blijft voordat het vanzelf terug naar Automatisch gaat. */
const AAN_SEC = 24 * 60 * 60;
const AAN_SLEUTEL = "verzoekjes:aan";
const UIT_SLEUTEL = "verzoekjes:uit";
/** Feesten die in de booth zijn aangemaakt, aangepast of verwijderd: slug → json. */
const AGENDA_SLEUTEL = "verzoekjes:agenda";

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
  schakelaar: { aan: { feest: string; tot: number } | null; uit: Set<string> };
  agenda: Map<string, Aanpassing>;
  rem: Map<string, number[]>;
  import: Map<string, number>;
};
const gedeeld = globalThis as typeof globalThis & { __verzoekjes?: Geheugen };
gedeeld.__verzoekjes ??= {
  lijsten: new Map(),
  schakelaar: { aan: null, uit: new Set() },
  agenda: new Map(),
  rem: new Map(),
  import: new Map(),
};
const geheugen = gedeeld.__verzoekjes.lijsten;
const geheugenSchakelaar = gedeeld.__verzoekjes.schakelaar;
const geheugenAgenda = gedeeld.__verzoekjes.agenda;
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

/**
 * De eigen volgorde uit de booth opslaan: `ids` van boven naar beneden. Alleen
 * wat echt van plek verandert wordt opnieuw weggeschreven, in één keer.
 */
export async function zetVolgorde(feest: string, ids: string[]): Promise<void> {
  const plek = new Map(ids.map((id, nummer) => [id, nummer]));
  const redis = geefOpslag();

  if (!redis) {
    const lijst = geheugenLijst(feest);
    for (const [id, verzoek] of lijst) {
      const positie = plek.get(id);
      if (positie !== undefined) lijst.set(id, { ...verzoek, positie });
    }
    return;
  }

  const alles = (await redis.hgetall(sleutel(feest))) ?? {};
  const velden: Record<string, string> = {};
  for (const [id, ruw] of Object.entries(alles)) {
    const verzoek = alsVerzoek(ruw);
    const positie = plek.get(id);
    if (verzoek && positie !== undefined && verzoek.positie !== positie) {
      velden[id] = JSON.stringify({ ...verzoek, positie });
    }
  }
  if (Object.keys(velden).length > 0) await redis.hset(sleutel(feest), velden);
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

// ---- de aan/uit-schakelaar per feest ----
//
// Automatisch: open volgens het agendavenster. Aan: open, ook daarbuiten, en
// de algemene QR-code wijst ernaar. Uit: dicht, ook binnen het venster.
//
// Aan staat in één sleutel met daarin het feest. Daardoor kan er vanzelf maar
// één feest tegelijk aan staan: een ander aanzetten overschrijft hem. De
// sleutel vervalt na een etmaal, zodat een vergeten schakelaar niet blijft
// openstaan terwijl de sticker overal hangt.

export type Stand = "automatisch" | "aan" | "uit";

export type Schakelaars = {
  /** Het feest dat op Aan staat, en tot wanneer (milliseconden sinds 1970). */
  aan: { feest: string; tot: number } | null;
  /** Feesten die op Uit staan. */
  uit: Set<string>;
};

function alsAan(waarde: unknown): Schakelaars["aan"] {
  let ruw = waarde;
  if (typeof ruw === "string") {
    try {
      ruw = JSON.parse(ruw);
    } catch {
      return null;
    }
  }
  if (!ruw || typeof ruw !== "object") return null;
  const { feest, tot } = ruw as { feest?: unknown; tot?: unknown };
  return typeof feest === "string" && typeof tot === "number" ? { feest, tot } : null;
}

export async function leesSchakelaars(): Promise<Schakelaars> {
  const redis = geefOpslag();
  if (!redis) {
    const aan = geheugenSchakelaar.aan;
    return {
      aan: aan && aan.tot > Date.now() ? aan : null,
      uit: new Set(geheugenSchakelaar.uit),
    };
  }
  const [aan, uit] = await Promise.all([redis.get(AAN_SLEUTEL), redis.hgetall(UIT_SLEUTEL)]);
  return { aan: alsAan(aan), uit: new Set(Object.keys(uit ?? {})) };
}

export function standVan(feest: string, schakelaars: Schakelaars): Stand {
  if (schakelaars.aan?.feest === feest) return "aan";
  if (schakelaars.uit.has(feest)) return "uit";
  return "automatisch";
}

/** Zet de schakelaar van een feest. */
export async function zetStand(feest: string, stand: Stand): Promise<void> {
  const redis = geefOpslag();
  const huidig = await leesSchakelaars();
  const wasAan = huidig.aan?.feest === feest;

  if (!redis) {
    if (stand === "aan") {
      geheugenSchakelaar.aan = { feest, tot: Date.now() + AAN_SEC * 1000 };
    } else if (wasAan) {
      geheugenSchakelaar.aan = null;
    }
    if (stand === "uit") geheugenSchakelaar.uit.add(feest);
    else geheugenSchakelaar.uit.delete(feest);
    return;
  }

  if (stand === "aan") {
    const tot = Date.now() + AAN_SEC * 1000;
    await redis.set(AAN_SLEUTEL, JSON.stringify({ feest, tot }), AAN_SEC);
  } else if (wasAan) {
    await redis.del(AAN_SLEUTEL);
  }

  if (stand === "uit") await redis.hset(UIT_SLEUTEL, { [feest]: "1" });
  else if (huidig.uit.has(feest)) await redis.hdel(UIT_SLEUTEL, feest);
}

// ---- de agenda, aangevuld vanuit de booth ----
// content/feesten.ts blijft de basis. Wat er in de booth aan de agenda
// verandert, staat hier per slug: een nieuw feest, een aangepaste naam, datum
// of plaats, of een verwijdering. De slug zelf verandert nooit, zodat geprinte
// QR-codes blijven werken.

export type Aanpassing = {
  naam?: string;
  datum?: string;
  plaats?: string | null;
  test?: boolean;
  /** In de booth aangemaakt, dus niet in content/feesten.ts. */
  nieuw?: boolean;
  /** Uit de agenda gehaald. De verzoekjes blijven bewaard. */
  verwijderd?: boolean;
};

function alsAanpassing(waarde: unknown): Aanpassing | null {
  let ruw = waarde;
  if (typeof ruw === "string") {
    try {
      ruw = JSON.parse(ruw);
    } catch {
      return null;
    }
  }
  return ruw && typeof ruw === "object" ? (ruw as Aanpassing) : null;
}

export async function leesAanpassingen(): Promise<Map<string, Aanpassing>> {
  const redis = geefOpslag();
  if (!redis) return new Map(geheugenAgenda);
  const alles = (await redis.hgetall(AGENDA_SLEUTEL)) ?? {};
  const uitkomst = new Map<string, Aanpassing>();
  for (const [slug, ruw] of Object.entries(alles)) {
    const aanpassing = alsAanpassing(ruw);
    if (aanpassing) uitkomst.set(slug, aanpassing);
  }
  return uitkomst;
}

export async function zetAanpassing(slug: string, aanpassing: Aanpassing): Promise<void> {
  const redis = geefOpslag();
  if (!redis) {
    geheugenAgenda.set(slug, aanpassing);
    return;
  }
  await redis.hset(AGENDA_SLEUTEL, { [slug]: JSON.stringify(aanpassing) });
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
