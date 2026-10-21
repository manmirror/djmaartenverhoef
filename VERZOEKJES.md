# Verzoekjes

Gasten vragen tijdens een feest een nummer aan, jij ziet het in de booth — met
de bpm erbij als het nummer in je rekordbox-collectie staat.

| Adres | Waarvoor |
| --- | --- |
| `djmaartenverhoef.nl/verzoekjes` | het formulier voor de gasten |
| `djmaartenverhoef.nl/verzoekjes/dj` | jouw lijst in de booth (achter een code) |
| `djmaartenverhoef.nl/verzoekjes/qr` | de poster met de QR-code, om te printen of te delen |

Deze pagina's staan niet in het menu van de site en Google laat ze links
liggen. Je komt er alleen via de QR-code of door het adres in te typen.

---

## 1. Instellen in Vercel

Alles hieronder zet je bij **Project → Settings → Environment Variables**.
Let op: na het toevoegen moet je opnieuw deployen, anders weet de site er nog
niets van.

### De code voor de booth — verplicht

| Naam | Waarde |
| --- | --- |
| `VERZOEKJES_CODE` | een zelfbedachte code, bijvoorbeeld `platendraaier2026` |

Zonder deze code gaat `/verzoekjes/dj` niet open. Je vult hem één keer in op
je telefoon of laptop; daarna onthoudt die browser hem. Met de knop
**Vergrendel** rechtsboven vergeet hij hem weer.

### De lijst bewaren — sterk aangeraden

Vercel verdeelt bezoekers over meerdere servers. Zonder gedeelde opslag ziet de
booth dus niet alles wat de gasten insturen. Daarom hangt er een klein
Redis-geheugen aan het project:

1. Ga in Vercel naar **Storage → Create Database → Upstash for Redis**.
2. Kies de gratis variant en koppel hem aan dit project.
3. Vercel zet de variabelen er zelf bij (`KV_REST_API_URL` en
   `KV_REST_API_TOKEN`, of de `UPSTASH_REDIS_REST_*`-versie daarvan — allebei
   werkt).
4. Deploy opnieuw.

Zolang dit er niet is, waarschuwt de boothpagina erover en wordt **elk
verzoekje per mail doorgestuurd**, zodat er in elk geval niets verdwijnt.

### Optioneel

| Naam | Waarde |
| --- | --- |
| `VERZOEKJES_TO` | ander mailadres voor doorgestuurde verzoekjes (standaard hetzelfde als `CALLBACK_TO`) |
| `VERZOEKJES_MAIL` | op `1` krijg je élk verzoekje óók per mail, ook mét Redis |

---

## 2. Je muziek erbij: rekordbox

De bpm komt uit je eigen collectie. Zo lever je die aan:

1. In rekordbox: **Bestand → Bibliotheek → Collectie in xml-formaat opslaan**.
2. Stuur me dat bestand, dan zet ik het om en deploy ik het.

Wil je het zelf doen:

```bash
npm run verzoekjes:collectie -- ~/Downloads/rekordbox.xml
git add content/collection.json && git commit -m "Collectie bijgewerkt" && git push
```

Het script houdt alleen titel, artiest, bpm, toonaard, genre en jaar over. Het
pad naar je muziekbestanden blijft expres achter op je eigen computer.

Wat je ervoor terugkrijgt:

- Terwijl een gast typt, stelt het formulier nummers uit jóuw collectie voor.
  Kiest hij er één, dan staat de bpm meteen vast.
- Typt iemand zelf een titel, dan zoeken we die alsnog op. Alleen bij een
  exacte titel (en een kloppende artiest, als die is ingevuld) nemen we de bpm
  over — liever geen bpm dan de bpm van een ander nummer.
- Wat we niet terugvinden, komt in de booth binnen met `? bpm` en het label
  *niet in collectie*.

> **Let op:** deze repository is openbaar. De lijst met titels, artiesten en
> bpm's is dan voor iedereen leesbaar, en gasten zien 'm sowieso via de
> suggesties. Vind je dat vervelend, zeg het dan — we kunnen de repository op
> privé zetten of de suggesties uitzetten en de bpm alleen in de booth tonen.

---

## 3. De QR-code

Hij staat kant-en-klaar op `/verzoekjes/qr`:

- **Print deze poster** — een A4 in zwart-wit, klaar om op tafels of bij de
  booth te leggen.
- **Download PNG** — handig om in een WhatsApp-groep of op Instagram te zetten.
- **Download SVG** — voor de drukker, of om in een eigen ontwerp te plakken.

Verandert het adres ooit, dan maak je een nieuwe met:

```bash
npm run verzoekjes:qr
```

---

## 4. Zo gaat een avond

1. Leg de poster neer of deel de QR-code.
2. Open `/verzoekjes/dj` op je telefoon of laptop en vul de code in.
   De lijst ververst zichzelf elke acht seconden.
3. Per verzoekje: **Gedraaid** of **Overslaan**. Alles wat je afvinkt verdwijnt
   uit de open lijst en staat onder *Toon afgehandeld*.
4. Met **Op bpm** sorteer je op tempo in plaats van op tijd — handig als je zoekt
   wat bij de plaat past die nu draait.
5. Na afloop: **Lijst wissen**, dan begin je de volgende keer schoon.

---

## 5. Tegen spam

- Een onzichtbaar veld dat alleen bots invullen.
- Hetzelfde nummer wordt niet twee keer op de lijst gezet.
- Hooguit dertig verzoekjes per tien minuten per internetverbinding, en
  maximaal driehonderd op de lijst.

De bot-controle van Vercel, die wél op het terugbelformulier zit, staat hier
bewust uit: die leunt op een script van Vercel, en laadt dat niet (adblocker,
haperende zaal-wifi), dan komt het verzoekje niet eens de deur uit. Op een
feest is dat vervelender dan af en toe een rare regel die je met één knop
wegveegt. Loopt het ooit uit de hand, dan zetten we 'm alsnog aan.
