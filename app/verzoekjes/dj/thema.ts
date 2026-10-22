// De lichte of donkere weergave van de booth. Gedeeld door de pagina (die het
// al bij het laden toepast) en de knop in de booth (die het omzet).

/** Waar de keuze per apparaat in de browser bewaard wordt. */
export const THEMA_SLEUTEL = "verzoekjes-thema";

/** Het attribuut op <html>; de css van de booth reageert daarop. */
export const THEMA_ATTRIBUUT = "data-booth-thema";

/**
 * Draait tijdens het inlezen van de pagina, nog voordat er iets getekend is:
 * zo begint een lichte booth meteen licht, zonder donkere flits.
 */
export const THEMA_SCRIPT = `(function(){try{if(localStorage.getItem(${JSON.stringify(
  THEMA_SLEUTEL
)})==="licht")document.documentElement.setAttribute(${JSON.stringify(
  THEMA_ATTRIBUUT
)},"licht")}catch(e){}})()`;
