# Satori 2.92.23 — nové rozhranie Garáže na ostrej aplikácii aj v náhľade

Frontend-only, ostrá aplikácia aj náhľad. Apps Script sa nemení, nasadenie backendu netreba. Táto verzia povyšuje na ostrú aplikáciu všetko, čo bolo od 2.92.17 v náhľade (2.92.18 až 2.92.22), a dopĺňa záverečnú previerku.

Čo ide naživo (podrobnosti v poznámkach `garage-layout-2.92.18.md`, `garage-menu-pending-2.92.19.md`, `garage-offers-screen-2.92.20.md`, `garage-mydays-2.92.21.md`, `garage-write-feedback-2.92.22.md`):

- Prehľad: Môj deň hore s parkovacím lístkom, zbalená karta kolegu, spodná lišta na telefónoch.
- Menu: Garáž počas overovania ako normálna položka v karte línií s indikátorom načítavania.
- Ponuky: skupiny „Čaká na teba“, „Čakáš na odpoveď“ a zbalená história, karty s avatarom a mini lístkami.
- Moje dni: týždne, dátumový blok, lístok, kompaktné akcie a nová akcia „Upraviť deň“.
- Každý zápis: banner s priebehom, výsledkom a tlačidlom „Skúsiť znova“ (rovnaký príkaz, žiadne duplicity).

Záverečná previerka (oprava slabých miest):
- **Päť kariet v spodnej lište.** Rola so Správou má päť kariet; mriežka bola pevne na štyri stĺpce, takže by sa lišta zalomila do dvoch riadkov a prekryla obsah. Lišta má teraz ľubovoľný počet kariet v jednom riadku na šírkach 390 aj 320 px.
- **Dlhé čísla miest.** Štvorciferné čísla pretekali z tabuľky lístka; zmenšia sa a vždy sa zmestia (lístok aj mini lístky).
- **Ponuky v Prehľade.** Karta „Ponuky od kolegov“ používa rovnakú kartu ako obrazovka Ponuky (meno, lístky, stav, veľké tlačidlá), takže vyzerá rovnako.
- **Klávesnica.** Spodná lišta sa počas písania do textového poľa skryje, aby nesedela na klávesnici; po dopísaní sa vráti.
- **Upraviť deň a rozpracovaný výber.** Úprava dňa zo zoznamu už potichu nezahodí rozpracovaný viacdňový výber z Prehľadu. Po zatvorení úpravy sa výber vráti, po uložení upraveného dňa sa z neho odoberie iba ten deň.

Overenie: nový test `test-garage-hardening-browser.cjs` pokrýva všetkých päť bodov (päť kariet v jednom riadku na 390 a 320 px, skrytie lišty pri písaní, štvorciferné čísla, jednotný vzhľad ponúk v Prehľade, zachovanie výberu po úprave dňa vrátane uloženia). Celá garážová prehliadačová sada a jednotkové testy prešli nad ostrou aplikáciou v koreni aj nad náhľadom (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou a testov vyžadujúcich súkromný Apps Script). Reálne zariadenie nebolo použité.
