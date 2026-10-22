import Link from "next/link";

import { siteContent } from "@/content/site";

import VerzoekForm from "./VerzoekForm";
import { datumVoluit, isOpen, nogNietBegonnen, type Feest } from "./feesten";
import type { Stand } from "./store";

type Props = {
  /** Het feest waar deze pagina bij hoort, of null als er geen feest is. */
  feest: Feest | null;
  /** Het eerstvolgende feest, om naar te verwijzen als er nu niets is. */
  volgende?: Feest | null;
  /** De schakelaar in de booth: Aan opent het feest, Uit sluit het, ook binnen de agenda. */
  stand?: Stand;
};

/** De pagina die de gasten zien, met of zonder feest eraan. */
export default function VerzoekPagina({ feest, volgende, stand = "automatisch" }: Props) {
  const teksten = siteContent.verzoekjes;
  const open =
    feest !== null && (stand === "aan" || (stand === "automatisch" && isOpen(feest)));

  return (
    <main className="vz-pagina">
      <div className="vz-blob vz-blob-1" />
      <div className="vz-blob vz-blob-2" />

      <div className="vz-inhoud">
        <Link className="vz-merk" href="/">
          DJ <span>MAARTEN</span> VERHOEF
        </Link>

        {feest && (
          <p className="vz-feest">
            {teksten.voorFeest} <strong>{feest.naam}</strong>
            <span className="vz-feest-datum">{datumVoluit(feest)}</span>
          </p>
        )}

        {open && feest ? (
          <>
            <h1 className="vz-kop">{teksten.kop}</h1>
            <p className="vz-intro">{teksten.intro}</p>
            <VerzoekForm feest={feest.slug} teksten={teksten} />
          </>
        ) : (
          <Dicht feest={feest} volgende={volgende ?? null} uit={stand === "uit"} />
        )}

        <p className="vz-voet">
          {teksten.voetTekst} <Link href="/">{teksten.voetLink}</Link>
        </p>
      </div>
    </main>
  );
}

/** Wat er staat als er niets aan te vragen valt. */
function Dicht({
  feest,
  volgende,
  uit,
}: {
  feest: Feest | null;
  volgende: Feest | null;
  uit: boolean;
}) {
  const teksten = siteContent.verzoekjes;

  if (uit) {
    return (
      <>
        <h1 className="vz-kop">{teksten.uitKop}</h1>
        <p className="vz-intro">{teksten.uitTekst}</p>
      </>
    );
  }

  if (!feest) {
    return (
      <>
        <h1 className="vz-kop">{teksten.geenFeestKop}</h1>
        <p className="vz-intro">
          {teksten.geenFeestTekst}
          {volgende && ` ${teksten.geenFeestVolgende.replace("{datum}", datumVoluit(volgende))}`}
        </p>
      </>
    );
  }

  const komtNog = nogNietBegonnen(feest);

  return (
    <>
      <h1 className="vz-kop">
        {komtNog ? teksten.tevroegKop : teksten.voorbijKop}
      </h1>
      <p className="vz-intro">
        {komtNog
          ? teksten.tevroegTekst.replace("{datum}", datumVoluit(feest))
          : teksten.voorbijTekst}
      </p>
    </>
  );
}
