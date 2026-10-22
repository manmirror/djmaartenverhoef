import QRCode from "qrcode";

import { vindInAgenda } from "@/app/verzoekjes/agenda";
import { siteContent } from "@/content/site";

export const runtime = "nodejs";

/** De code voor het algemene adres, zonder een feest erbij. */
const ALGEMEEN = "algemeen";

// Hoge foutcorrectie: een geprinte code met een kreukel of een glas erop blijft
// dan nog leesbaar. De adressen zijn kort, dus de code blijft ruim genoeg.
const OPTIES = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#0c0a12ff", light: "#ffffffff" },
} as const;

export async function GET(
  request: Request,
  context: RouteContext<"/api/verzoekjes/qr/[slug]">
) {
  const { slug } = await context.params;

  let adres: string;
  if (slug === ALGEMEEN) {
    adres = `${siteContent.siteUrl}/verzoekjes`;
  } else {
    const feest = await vindInAgenda(slug);
    if (!feest) return new Response("Onbekend feest", { status: 404 });
    adres = `${siteContent.siteUrl}/verzoekjes/f/${feest.slug}`;
  }

  const png = new URL(request.url).searchParams.get("type") === "png";

  // De code verandert alleen als het adres verandert, dus hij mag lang blijven
  // hangen in de browser en bij Vercel.
  const bewaar = "public, max-age=3600, s-maxage=604800";

  if (png) {
    const plaatje = await QRCode.toBuffer(adres, { ...OPTIES, width: 1400 });
    return new Response(new Uint8Array(plaatje), {
      headers: { "Content-Type": "image/png", "Cache-Control": bewaar },
    });
  }

  const svg = await QRCode.toString(adres, { ...OPTIES, type: "svg" });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": bewaar },
  });
}
