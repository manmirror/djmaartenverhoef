# DJ Maarten Verhoef — maartenverhoef.nl

Next.js (App Router, TypeScript) versie van de statische promosite voor DJ Maarten Verhoef, geconverteerd vanuit het oorspronkelijke HTML/CSS/JS-prototype, met een ingebouwde Sanity CMS-koppeling om teksten, afbeeldingen en muziek zelf te kunnen wijzigen.

## Ontwikkelen

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) om de site te bekijken. Zonder verdere configuratie draait de site direct op de ingebouwde standaardcontent (identiek aan het originele prototype).

## Structuur

- `app/page.tsx` — de volledige pagina (hero, over, chat, media, muziek, contact, footer), haalt content op uit Sanity met een fallback naar standaardteksten
- `app/layout.tsx` — root layout en metadata
- `app/globals.css` — alle styling, 1-op-1 overgenomen uit het originele prototype
- `app/Effects.tsx` — client component voor de waveform-animatie en scroll-reveal effecten (voorheen inline `<script>`)
- `app/studio/[[...tool]]/` — de ingebouwde Sanity Studio op `/studio`
- `sanity/` — Sanity-configuratie: schemas (`schemaTypes/`), client + GROQ-queries + fallback-content (`lib/`)

## CMS koppelen (Sanity)

Deze omgeving kan zelf geen Vercel-account koppelen (geen netwerktoegang/interactieve login), dus voer dit eenmalig zelf uit, bv. lokaal of in een omgeving met internettoegang:

```bash
npm i -g vercel        # als de Vercel CLI nog niet geïnstalleerd is
vercel login
vercel link            # koppel dit project aan een Vercel-project
vercel integration add sanity --yes
vercel env pull --yes  # zet de env-vars in .env.local
```

Dit provisioneert een gratis Sanity-project en zet automatisch de juiste environment variables. Zie `.env.local.example` voor de benodigde variabelen als je ze liever handmatig instelt (bv. van een bestaand Sanity-project via [sanity.io/manage](https://sanity.io/manage)).

Na het instellen van de env-vars en een herstart:

- Ga naar **`/studio`** om in te loggen en teksten, afbeeldingen en muziektracks te beheren (documenttypes: **Site-teksten**, **Vaste locatie**, **Media-item**, **Muziektrack**).
- De homepage (`/`) haalt deze content automatisch op (met 30 seconden cache) en valt terug op de standaardcontent zodra een veld leeg is.

## Build

```bash
npm run build
npm run start
```
