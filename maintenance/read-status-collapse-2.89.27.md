# 2.89.27 — Zasunutie úspešne overených údajov

Po úspešnom overení všetkých zobrazených častí zostane zelený stav viditeľný 1,6 sekundy. Potom sa počas 280 ms zasunie nahor a uvoľní miesto obsahu. Nové načítavanie alebo chyba ho opäť zobrazí. Obsah z pamäte zostáva na obrazovke a chyba má pôvodné Satori tlačidlo na opakovanie obnovy.

Zasunutie čaká aj na zobrazené doplnkové časti. Starý údaj z predchádzajúceho prihlásenia, neoverená časť, čakajúca požiadavka ani chyba nie sú dôvodom na skrytie. Rozbalené podrobnosti alebo fokus klávesnice ho ponechajú otvorené. Obmedzenie pohybu v systémových nastaveniach vypne animáciu.

Zasunutý stav sa uchová pri prekreslení a krátkom návrate na rovnakú obrazovku, bez zmeny času overenia. Je oddelený podľa obrazovky, produktu, kolegu, účtu, línie a prihlasovacej relácie. Počet stavov je obmedzený na 80. Časovač opäť kontroluje aktuálny výsledok, otvorenú obrazovku, pripojený prvok a reláciu pred vykonaním animácie.

Obnova, cache, endpointy a oprávnenia sa touto zmenou nemenia. Apps Scripty netreba opätovne nasadzovať. Náhľad a hlavná verzia majú zhodné zdroje, číslo verzie a obsahové hashe nových balíkov.

## Overenie

- Pred opravou nový browserový test zlyhal na chýbajúcom zasunutí úspešného panelu.
- `npm test`: 34 zdrojových regresných balíkov vrátane deterministických testov času, úplnosti, chyby, fokusu, rozbalenia, prekreslenia, relácie a obmedzenia pamäte.
- Browser: skutočná animácia výšky, uvoľnenie miesta, zachovanie obsahu, zobrazenie pri obnove, stabilita spinnera, chyba/opakovanie, podrobnosti, neoverené údaje, obmedzenie pohybu a 320px rozmer.
- 63 kombinácií rolí/línií/obrazoviek pre nové zasúvanie; 489 existujúcich kombinácií stavov údajov.
- Android/iPhone emulácia: dôveryhodné dotykové gestá vrátane obnovy už zasunutého statusu, jednej novej požiadavky a opätovného zasunutia po odpovedi. Pôvodné testy krátkeho, zrušeného, vodorovného gesta, rolovania a dialógov prešli.
- 21 skutočných tokov Domova nad testovacími endpointmi: tri línie a manažérske/reprezentačné roly, aktuálne plnenie, samostatný kvartál rebríčka, žiadne zbytočné opakovanie čerstvých požiadaviek, selektívna obnova, chyba a opakovanie.
- Regresie skladov, lekární a ich detailu, návratu na Domov, paralelných požiadaviek a plynulého spinnera prešli.
- `npm run build`: obe verzie; overené hashe JS/CSS, odkazy service workerov a zhodnosť zdrojov. Nové browserové, dotykové a stavové testy opakované nad minifikovaným buildom.

Testy používajú izolované testovacie údaje. Overenie v emulácii nepredstavuje test na fyzickom telefóne ani kontrolu živých firemných dát. Publikované súbory sa kontrolujú osobitne po pushnutí.
