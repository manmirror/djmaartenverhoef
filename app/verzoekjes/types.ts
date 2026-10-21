// Vorm van een verzoekje, gedeeld door de pagina's en de api-routes.

export type VerzoekStatus = "nieuw" | "gedraaid" | "overgeslagen";

export type Verzoek = {
  id: string;
  titel: string;
  /** Leeg als de bezoeker alleen een titel invulde. */
  artiest: string;
  /** Naam van de bezoeker; leeg als hij die niet invulde. */
  van: string;
  /** Uit de rekordbox-collectie, als het nummer daarin te vinden was. */
  bpm: number | null;
  toon: string | null;
  genre: string | null;
  jaar: number | null;
  /** True als dit nummer in de collectie van Maarten staat. */
  inCollectie: boolean;
  status: VerzoekStatus;
  /** Tijdstip van binnenkomst, in milliseconden sinds 1970. */
  tijd: number;
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
};

export type Collectie = {
  /** Datum waarop het bestand uit rekordbox.xml is gemaakt. */
  gemaakt: string | null;
  aantal: number;
  tracks: CollectieTrack[];
};

/** Wat de zoekhulp in het formulier terugkrijgt. */
export type Suggestie = {
  titel: string;
  artiest: string;
  bpm: number | null;
  toon: string | null;
  genre: string | null;
  jaar: number | null;
};
