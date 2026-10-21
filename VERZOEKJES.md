# Verzoekjes

Gasten vragen tijdens een feest een nummer aan, jij ziet het in de booth — met
de bpm erbij als het nummer in je rekordbox-collectie staat. Elk feest heeft
zijn eigen link, QR-code en lijst, en alles wordt bewaard. Zo kun je aan het
eind van het jaar zien wat er het vaakst gevraagd is.

| Adres | Waarvoor |
| --- | --- |
| `/verzoekjes/f/<slug>` | het formulier voor de gasten van één feest |
| `/verzoekjes/qr` | alle posters op een rij, één per feest |
| `/verzoekjes/qr/<slug>` | de poster van één feest: printen, of downloaden als PNG/SVG |
| `/verzoekjes/dj` | jouw booth (achter een code): de lijst per feest en de jaarlijst |
| `/verzoekjes` | algemeen adres: wijst vanzelf naar het feest dat op dat moment bezig is |

Deze pagina's staan niet in het menu van de site en Google laat ze links
liggen.

---

## 1. Instellen in Vercel

Alles hieronder zet je bij **Project → Settings → Environment Variables**.
Na het toevoegen moet je opnieuw deployen, anders weet de site er nog niets
van.

### De database — nodig om iets te bewaren

Zonder database is er geen archief en dus ook geen jaarlijst. Vercel verdeelt
bezoekers bovendien over meerdere servers, dus zonder gedeelde opslag ziet de
booth niet alles wat de gasten insturen.

1. Ga in Vercel naar **Storage → Create Database → Upstash for Redis**.
2. Kies de gratis variant en koppel hem aan dit project.
3. Vercel zet de variabelen er zelf bij (`KV_REST_API_URL` en
   `KV_REST_API_TOKEN`, of de `UPSTASH_REDIS_REST_*`-versie — allebei werkt).
4. Deploy opnieuw.

Zolang dit er niet is, waarschuwt de booth erover, wordt **elk verzoekje per
mail doorgestuurd** zodat er niets verdwijnt, en ontbreekt de knop *Zet nu
open*.

### De code voor de booth — verplicht

| Naam | Waarde |
| --- | --- |
| `VERZOEKJES_CODE` | een zelfbedachte code, bijvoorbeeld `platendraaier2026` |

Zonder deze code gaat de booth niet open. Je vult hem één keer in op je
telefoon of laptop; daarna onthoudt die browser hem. Met **Vergrendel**
vergeet hij hem weer.

### Optioneel

| Naam | Waarde |
| --- | --- |
| `VERZOEKJES_TO` | ander mailadres voor doorgestuurde verzoekjes (standaard hetzelfde als `CALLBACK_TO`) |
| `VERZOEKJES_MAIL` | op `1` krijg je élk verzoekje óók per mail, ook mét database |

---

## 2. De agenda

De feesten staan in `content/feesten.ts`. Per feest één regel:

```ts
{
  slug: "bo-chantal-en-mitchel",   // komt in het adres en in de QR-code
  naam: "Bo Chantal & Mitchel",    // op de poster en in de booth
  datum: "2026-10-24",             // de dag waarop het feest begint
  plaats: "Uithoorn",              // optioneel, komt naast de datum op de poster
  vanafUur: 12,                    // optioneel, standaard 12
  totUur: 6,                       // optioneel, standaard 6 (de ochtend erna)
},
```

Stuur me je agenda en ik zet ze erin, of pas het bestand zelf aan en deploy.
Elk feest krijgt dan vanzelf een eigen poster op `/verzoekjes/qr`.

**Verander de slug niet meer nadat je de poster hebt geprint.** De code op
papier wijst naar dat adres.

### Wanneer staat een feest open?

Van de middag van de feestdag (12:00) tot de ochtend erna (06:00), in
Nederlandse tijd. Daarbuiten zegt de pagina *Nog even geduld* of *Dit feest is
geweest*, en neemt hij niets aan — zo kan niemand volgende maand nog iets in de
lijst van dit feest zetten.

Klopt het een keer niet — een feest dat eerder begint of uitloopt — dan zet je
het in de booth met **Zet nu open** voor twaalf uur open. Daar hoeft niets
voor gedeployd te worden.

---

## 3. Zo gaat een avond

1. Print de poster van het feest, of deel de PNG in de app-groep.
2. Open `/verzoekjes/dj`. De booth kiest vanzelf het feest van vanavond; met
   de keuzelijst bovenaan kijk je bij een ander feest.
3. Per verzoekje: **Gedraaid** of **Overslaan**. Wat je afvinkt verdwijnt uit
   de open lijst en staat onder *Toon afgehandeld*. Rommel haal je weg met
   *weghalen*.
4. **Op bpm** sorteert op tempo in plaats van op tijd.
5. Na afloop hoef je niets te doen: de lijst blijft bewaard en het volgende
   feest begint met een eigen, lege lijst.

Er is met opzet geen knop meer om een hele lijst te wissen: samen vormen die
lijsten het archief.

---

## 4. De jaarlijst

In de booth onder **Jaarlijst**: alle verzoekjes van alle feesten in een jaar
bij elkaar opgeteld, het vaakst gevraagde nummer bovenaan. Per nummer zie je
hoe vaak het gevraagd is, hoe vaak je het echt gedraaid hebt en op hoeveel
verschillende feesten. Met *Alles bij elkaar* tel je alle jaren op.

Verschillende schrijfwijzes van hetzelfde nummer tellen als één. Kiest een gast
het nummer uit de suggesties, dan staat het er altijd precies goed in.

---

## 5. Je muziek erbij: rekordbox

De bpm komt uit je eigen collectie.

1. In rekordbox: selecteer links **Collectie** (niet een playlist), dan
   **Bestand → Bibliotheek → Collectie in xml-formaat opslaan**.
2. Stuur me dat bestand, dan zet ik het om en deploy ik het.

Zelf doen kan ook:

```bash
npm run verzoekjes:collectie -- ~/Downloads/rekordbox.xml
```

Alleen titel, artiest, bpm, toonaard, genre en jaar gaan mee. Het pad naar je
muziekbestanden blijft op je eigen computer.

- Terwijl een gast typt, stelt het formulier nummers uit jóuw collectie voor.
- Typt iemand zelf een titel, dan zoeken we die alsnog op — ook zonder
  "- Radio Edit" erachter. Alleen bij een eenduidige match nemen we de bpm
  over; liever geen bpm dan de bpm van een ander nummer.
- Wat we niet vinden komt binnen met `? bpm` en *niet in collectie*.

> **Let op:** deze repository is openbaar. Je agenda (namen en datums) en je
> collectie (titels, artiesten, bpm) zijn daarmee voor iedereen leesbaar.
> Wil je dat liever niet, zet de repository dan op privé.

---

## 6. Tegen spam

- Een onzichtbaar veld dat alleen bots invullen.
- Alleen open op de avond van het feest.
- Hetzelfde nummer komt niet twee keer tegelijk op de lijst.
- Hooguit dertig verzoekjes per tien minuten per internetverbinding, en
  maximaal driehonderd per feest.

De bot-controle van Vercel, die wél op het terugbelformulier zit, staat hier
bewust uit: die leunt op een script van Vercel, en laadt dat niet (adblocker,
haperende zaal-wifi), dan komt het verzoekje niet eens de deur uit.
