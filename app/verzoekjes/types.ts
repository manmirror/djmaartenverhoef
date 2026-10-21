// Vorm van een verzoekje, gedeeld door de pagina's en de api-routes.

export type VerzoekStatus = "nieuw" | "gedraaid" | "overgeslagen";

/** Het nummer uit de collectie dat bij een verzoekje gevonden is. */
export type Match = {
  titel: string;
  artiest: string;
  bpm: number | null;
  toon: string | null;
  genre: string | null;
  jaar: number | null;
  /** Hoeveel versies van dit nummer er in de collectie staan, deze meegeteld. */
  versies: number;
  /** De titel klopt, maar de gast vroeg om een andere artiest (een cover, bv.). */
  andereArtiest: boolean;
  /** In de booth met de hand gekoppeld in plaats van automatisch gevonden. */
  handmatig?: boolean;
};

/** Eén nummer uit de zoekfunctie in de booth. */
export type Zoekresultaat = {
  /** Plek in de collectie; daarmee koppelt de booth het nummer. */
  nr: number;
  titel: string;
  artiest: string;
  bpm: number | null;
  toon: string | null;
  jaar: number | null;
};

export type Verzoek = {
  id: string;
  /** De slug van het feest waar dit verzoekje bij hoort. */
  feest: string;
  /** Zoals de gast het intypte. */
  titel: string;
  /** Zoals de gast het intypte; leeg als hij alleen een titel invulde. */
  artiest: string;
  /** Naam van de gast; leeg als hij die niet invulde. */
  van: string;
  /** Het nummer uit de collectie, of null als we het niet konden vinden. */
  match: Match | null;
  status: VerzoekStatus;
  /** Tijdstip van binnenkomst, in milliseconden sinds 1970. */
  tijd: number;
  /**
   * Plek in de eigen volgorde die de DJ in de booth sleept; 0 is bovenaan.
   * Ontbreekt bij verzoekjes die nog niet versleept zijn.
   */
  positie?: number;
};

/** Eén nummer uit rekordbox. Korte sleutels: de collectie kan groot zijn. */
export type CollectieTrack = {
  /** titel */
  t: string;
  /** artiest */
  a: string;
  /** bpm */
  b: number | null;
  /** toonaard, bv. "Am" */
  k: string | null;
  /** genre */
  g: string | null;
  /** jaar */
  y: number | null;
  /**
   * 1 als titel en artiest bij het inlezen uit één veld zijn gehaald. Dan is
   * niet zeker welke kant welke is, en probeert het koppelen allebei.
   */
  s?: 1;
};

export type Collectie = {
  /** Datum waarop het bestand uit rekordbox.xml is gemaakt. */
  gemaakt: string | null;
  aantal: number;
  tracks: CollectieTrack[];
};


/** Eén regel in de jaarlijst: hoe vaak een nummer gevraagd is. */
export type TopNummer = {
  titel: string;
  artiest: string;
  bpm: number | null;
  aantal: number;
  /** Hoe vaak het ook echt gedraaid is. */
  gedraaid: number;
  /** Op hoeveel verschillende feesten het gevraagd is. */
  feesten: number;
};
