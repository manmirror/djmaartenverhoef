// Of een feest nu verzoekjes aanneemt, en naar welk feest de algemene QR-code
// (/verzoekjes, de sticker) wijst. Combineert de agenda met de aan/uit-
// schakelaar uit de booth.

import { isOpen, vindIn, type Feest } from "./feesten";
import { leesSchakelaars, standVan, type Schakelaars, type Stand } from "./store";

export type Openstand = {
  stand: Stand;
  /** Of het feest op dit moment verzoekjes aanneemt. */
  open: boolean;
  /** Bij Aan: tot wanneer, in milliseconden sinds 1970. */
  aanTot: number | null;
};

export function openstandVan(feest: Feest, schakelaars: Schakelaars, nu = Date.now()): Openstand {
  const stand = standVan(feest.slug, schakelaars);
  return {
    stand,
    open: stand === "aan" || (stand === "automatisch" && isOpen(feest, nu)),
    aanTot: stand === "aan" ? (schakelaars.aan?.tot ?? null) : null,
  };
}

export async function openstand(feest: Feest): Promise<Openstand> {
  return openstandVan(feest, await leesSchakelaars());
}

/**
 * Het feest achter de algemene QR-code: eerst wat op Aan staat, anders het
 * feest dat volgens de agenda open is. Staat dat laatste op Uit, dan komt het
 * toch terug, maar dicht, zodat de pagina kan zeggen dat er nu niets open staat.
 */
export function feestVoorAlgemeen(
  agenda: Feest[],
  schakelaars: Schakelaars,
  nu = Date.now()
): { feest: Feest; stand: Stand } | null {
  const aan = schakelaars.aan ? vindIn(agenda, schakelaars.aan.feest) : null;
  if (aan) return { feest: aan, stand: "aan" };

  const volgensAgenda = agenda.filter((feest) => isOpen(feest, nu));
  const open = volgensAgenda.find((feest) => !schakelaars.uit.has(feest.slug));
  if (open) return { feest: open, stand: "automatisch" };
  if (volgensAgenda[0]) return { feest: volgensAgenda[0], stand: "uit" };
  return null;
}
