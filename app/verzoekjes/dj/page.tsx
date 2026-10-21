import type { Metadata } from "next";

import Booth from "./Booth";

export const metadata: Metadata = {
  title: "Booth — verzoekjes",
  robots: { index: false, follow: false },
};

export default function BoothPagina() {
  return (
    <main className="bt-pagina">
      <Booth />
    </main>
  );
}
