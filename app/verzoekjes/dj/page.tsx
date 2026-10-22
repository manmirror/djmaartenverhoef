import type { Metadata } from "next";

import Booth from "./Booth";
import { THEMA_SCRIPT } from "./thema";

export const metadata: Metadata = {
  title: "Booth — verzoekjes",
  robots: { index: false, follow: false },
};

export default function BoothPagina() {
  return (
    <main className="bt-pagina">
      {/* Zet de lichte weergave aan voordat de pagina getekend wordt. */}
      <script dangerouslySetInnerHTML={{ __html: THEMA_SCRIPT }} />
      <Booth />
    </main>
  );
}
