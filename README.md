# DJ Maarten Verhoef — djmaartenverhoef.nl

Next.js (App Router, TypeScript) versie van de statische promosite voor DJ Maarten Verhoef, geconverteerd vanuit het oorspronkelijke HTML/CSS/JS-prototype.

## Ontwikkelen

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) om de site te bekijken.

## Structuur

- `content/site.ts` — **alle teksten, afbeeldingen en muziek van de site in één bestand.** Hier pas je dingen aan.
- `public/images/` — map voor afbeeldingen; verwijs ernaar vanuit `content/site.ts` als `/images/bestandsnaam.jpg`
- `public/music/` — map voor muziekbestanden; verwijs ernaar vanuit `content/site.ts` als `/music/bestandsnaam.mp3`
- `app/page.tsx` — de volledige pagina (hero, over, chat, media, muziek, contact, footer), leest alles uit `content/site.ts`
- `app/layout.tsx` — root layout en metadata
- `app/globals.css` — alle styling, 1-op-1 overgenomen uit het originele prototype
- `app/Effects.tsx` — client component voor de waveform-animatie en scroll-reveal effecten (voorheen inline `<script>`)

## Content aanpassen

Open `content/site.ts`:

- **Teksten**: pas de tekst tussen aanhalingstekens aan (koppen, tagline, contactinfo, WhatsApp-bericht, enz.).
- **Afbeeldingen**: zet het bestand in `public/images/`, en zet het pad bij het juiste veld (bv. `aboutPhoto: "/images/optreden.jpg"`, of bij een item in `mediaItems`). Laat op `null` staan voor de kleurverloop-placeholder.
- **Muziek**: zet het bestand in `public/music/` en vul `audioFile` in bij de track (bv. `"/music/zomerset-2026.mp3"`) voor een echte afspeelbalk, of vul `externalUrl` in voor een link naar SoundCloud/Spotify.

Na het opslaan van `content/site.ts` (en het pushen naar GitHub, als de site op Vercel staat) verschijnt de wijziging automatisch live.

## Build

```bash
npm run build
npm run start
```
