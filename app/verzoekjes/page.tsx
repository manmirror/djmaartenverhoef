import type { Metadata } from "next";
import Link from "next/link";

import { siteContent } from "@/content/site";

import VerzoekForm from "./VerzoekForm";

export const metadata: Metadata = {
  title: "Verzoekje — DJ Maarten Verhoef",
  description: "Vraag een nummer aan bij DJ Maarten Verhoef.",
  // Deze pagina is voor de gasten op een feest, niet voor Google.
  robots: { index: false, follow: false },
};

export default function Verzoekjes() {
  const teksten = siteContent.verzoekjes;

  return (
    <main className="vz-pagina">
      <div className="vz-blob vz-blob-1" />
      <div className="vz-blob vz-blob-2" />

      <div className="vz-inhoud">
        <Link className="vz-merk" href="/">
          DJ <span>MAARTEN</span> VERHOEF
        </Link>

        <h1 className="vz-kop">{teksten.kop}</h1>
        <p className="vz-intro">{teksten.intro}</p>

        <VerzoekForm teksten={teksten} />

        <p className="vz-voet">
          {teksten.voetTekst} <Link href="/">{teksten.voetLink}</Link>
        </p>
      </div>
    </main>
  );
}
