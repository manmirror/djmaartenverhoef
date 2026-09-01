# DJ Maarten Verhoef — maartenverhoef.nl

Next.js (App Router, TypeScript) versie van de statische promosite voor DJ Maarten Verhoef, geconverteerd vanuit het oorspronkelijke HTML/CSS/JS-prototype.

## Ontwikkelen

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) om de site te bekijken.

## Structuur

- `app/page.tsx` — de volledige pagina (hero, over, chat, media, muziek, contact, footer)
- `app/layout.tsx` — root layout en metadata
- `app/globals.css` — alle styling, 1-op-1 overgenomen uit het originele prototype
- `app/Effects.tsx` — client component voor de waveform-animatie en scroll-reveal effecten (voorheen inline `<script>`)

## Build

```bash
npm run build
npm run start
```
