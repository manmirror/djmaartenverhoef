import { codeAntwoord, controleerCode } from "@/app/verzoekjes/code";
import { maakSlug, stelSamen } from "@/app/verzoekjes/agenda";
import { basisFeesten, naarInfo, venster, vindIn } from "@/app/verzoekjes/feesten";
import {
  leesAanpassingen,
  leesMeerdere,
  opslagActief,
  zetAanpassing,
  zetStand,
  type Aanpassing,
} from "@/app/verzoekjes/store";

export const runtime = "nodejs";

const MAX_NAAM = 80;
const MAX_PLAATS = 80;

/**
 * De agenda beheren vanuit de booth: alle feesten met hun verzoekjes, plus de
 * verwijderde, zodat die terug te zetten zijn. Alleen met de juiste code.
 */
export async function GET(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  const aanpassingen = await leesAanpassingen();
  const agenda = stelSamen(aanpassingen);
  const uitBestand = new Set(basisFeesten().map((feest) => feest.slug));

  // Verwijderd: zoals ze eruitzagen vlak voordat ze weg gingen.
  const zonderVerwijderingen = new Map(
    [...aanpassingen].map(([slug, aanpassing]) => [slug, { ...aanpassing, verwijderd: false }])
  );
  const verwijderd = stelSamen(zonderVerwijderingen).filter(
    (feest) => aanpassingen.get(feest.slug)?.verwijderd
  );

  const lijsten = await leesMeerdere([...agenda, ...verwijderd].map((feest) => feest.slug));
  const nu = Date.now();
  const metAantal = (feest: (typeof agenda)[number]) => {
    const aanpassing = aanpassingen.get(feest.slug);
    return {
      ...naarInfo(feest, nu),
      // Het aantal uit het agendabestand telt mee: die worden pas ingelezen
      // als het feest voor het eerst geopend wordt.
      aantal: Math.max(lijsten.get(feest.slug)?.length ?? 0, feest.verzoekjes?.length ?? 0),
      bron: uitBestand.has(feest.slug) ? "bestand" : "booth",
      geweest: venster(feest).tot <= nu,
      aangepast: Boolean(
        aanpassing &&
          !aanpassing.nieuw &&
          (aanpassing.naam !== undefined ||
            aanpassing.datum !== undefined ||
            aanpassing.plaats !== undefined ||
            aanpassing.test !== undefined)
      ),
    };
  };

  return Response.json({
    feesten: agenda.map(metAantal),
    verwijderd: verwijderd.map(metAantal),
    opslag: opslagActief(),
  });
}

type Invoer = {
  actie?: string;
  slug?: string;
  naam?: unknown;
  datum?: unknown;
  plaats?: unknown;
  test?: unknown;
};

type Velden = { naam: string; datum: string; plaats: string | null; test: boolean };

/** Controleert wat er uit het formulier komt. Geeft een foutcode of de velden. */
function leesVelden(invoer: Invoer): Velden | string {
  const naam = typeof invoer.naam === "string" ? invoer.naam.trim().replace(/\s+/g, " ") : "";
  if (!naam) return "naam-leeg";
  if (naam.length > MAX_NAAM) return "naam-te-lang";

  const datum = typeof invoer.datum === "string" ? invoer.datum.trim() : "";
  if (!geldigeDatum(datum)) return "datum-ongeldig";

  const plaats =
    typeof invoer.plaats === "string" ? invoer.plaats.trim().replace(/\s+/g, " ") : "";
  if (plaats.length > MAX_PLAATS) return "plaats-te-lang";

  return { naam, datum, plaats: plaats || null, test: invoer.test === true };
}

/** "2026-10-24", en dan ook een dag die echt bestaat. */
function geldigeDatum(datum: string): boolean {
  const delen = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datum);
  if (!delen) return false;
  const [jaar, maand, dag] = delen.slice(1).map(Number);
  const echt = new Date(Date.UTC(jaar, maand - 1, dag));
  return (
    jaar >= 2000 &&
    jaar <= 2100 &&
    echt.getUTCFullYear() === jaar &&
    echt.getUTCMonth() === maand - 1 &&
    echt.getUTCDate() === dag
  );
}

/**
 * Een feest aanmaken, wijzigen, verwijderen of terugzetten. Alleen met een
 * database: zonder database zou de wijziging maar op één server staan.
 *
 * De slug van een feest verandert nooit, ook niet als de naam verandert: die
 * staat in de QR-code, en geprinte posters moeten blijven werken.
 */
export async function POST(request: Request) {
  const uitkomst = await controleerCode(request);
  if (uitkomst !== "ok") return codeAntwoord(uitkomst);

  if (!opslagActief()) {
    return Response.json({ error: "geen-database" }, { status: 409 });
  }

  let invoer: Invoer;
  try {
    invoer = await request.json();
  } catch {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const aanpassingen = await leesAanpassingen();
  const basis = basisFeesten();

  if (invoer.actie === "nieuw") {
    const velden = leesVelden(invoer);
    if (typeof velden === "string") return Response.json({ error: velden }, { status: 400 });

    // Ook verwijderde feesten houden hun slug: daar hangen nog verzoekjes aan.
    const bezet = new Set([...basis.map((feest) => feest.slug), ...aanpassingen.keys()]);
    const slug = maakSlug(velden.naam, velden.datum, bezet);
    await zetAanpassing(slug, { ...velden, nieuw: true });
    return Response.json({ ok: true, slug });
  }

  const slug = typeof invoer.slug === "string" ? invoer.slug.trim() : "";
  const vorige = aanpassingen.get(slug);
  const bestaat = vindIn(basis, slug) !== null || Boolean(vorige?.nieuw);
  if (!slug || !bestaat) return Response.json({ error: "onbekend" }, { status: 404 });

  if (invoer.actie === "wijzig") {
    if (vorige?.verwijderd) return Response.json({ error: "onbekend" }, { status: 404 });
    const velden = leesVelden(invoer);
    if (typeof velden === "string") return Response.json({ error: velden }, { status: 400 });

    // Bij een feest uit het agendabestand bewaren we alleen wat afwijkt, zodat
    // "aangepast" klopt en een latere wijziging in het bestand gewoon doorkomt.
    const uitBestand = vindIn(basis, slug);
    const aanpassing: Aanpassing = { ...vorige, ...velden };
    if (uitBestand) {
      if (velden.naam === uitBestand.naam) delete aanpassing.naam;
      if (velden.datum === uitBestand.datum) delete aanpassing.datum;
      if (velden.plaats === (uitBestand.plaats ?? null)) delete aanpassing.plaats;
      if (velden.test === (uitBestand.test === true)) delete aanpassing.test;
    }
    await zetAanpassing(slug, aanpassing);
    return Response.json({ ok: true, slug });
  }

  if (invoer.actie === "verwijder" || invoer.actie === "terug") {
    const nieuw: Aanpassing = { ...vorige, verwijderd: invoer.actie === "verwijder" };
    await zetAanpassing(slug, nieuw);
    // Een verwijderd feest hoort niet op Aan of Uit te blijven staan: zet je
    // het terug, dan begint het gewoon weer op Automatisch.
    if (nieuw.verwijderd) await zetStand(slug, "automatisch");
    return Response.json({ ok: true, slug });
  }

  return Response.json({ error: "invalid" }, { status: 400 });
}
