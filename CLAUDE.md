# Potenciál GP — GP Potential Calculator

## O projekte

Potenciál GP (GP = General Practitioner (všeobecný lekár)) je field tool pre medicínskych reprezentantov spoločnosti **Gedeon Richter Slovakia s.r.o.**, ktorí navštevujú všeobecných lekárov. Appka pomáha:
- Segmentovať lekárov (ABC framework)
- Plánovať frekvenciu návštev
- Zaznamenávať návštevy
- Motivovať reprezentantov cez rebríček a progres

**Owner projektu:** Ivan (Product Manager, Gedeon Richter Slovakia)
**Používatelia:** medicínski reprezentanti v teréne (primárne mobil), area manažéri, manažment

## Technický stack

- **Jeden HTML súbor** (`index.html`) — všetko v jednom (HTML + CSS + JavaScript)
  - Súbor sa volá `index.html`, pretože **GitHub Pages automaticky zobrazuje `index.html` ako úvodnú stránku** — preto sa tak volá a nemá sa premenovávať.
- **`sw.js`** — PWA service worker (offline cache, inštalovateľnosť appky na mobile)
- **`version.json`** — metadata pre auto-update. Obsahuje aktuálnu verziu appky (napr. `{"version": "2.2.56"}`). Pri štarte appky sa fetchne zo servera a porovná s `APP_VERSION` v `index.html` — ak sa líši, reprezentantovi sa zobrazí banner *"Nová verzia — ťuknúť pre update"*.
- **Backend:** Google Sheets + Google Apps Script (endpointy, napr. `getAllHistory`, `pingLogin`)
- **Hosting:** GitHub Pages (URL, ktorú používajú reprezentanti v teréne)
- **Jazyk UI:** slovenčina

## Aktuálna stabilná verzia

**2.2.57** — obsahuje:
- Pull-to-refresh (blokovaný pri otvorených overlayoch)
- Rebríček (s iOS/Android fixom)
- Dynamické načítavanie AM West/East zo Sheets
- `pingLogin` / `posledny_login` tracking
- Manažéri v admin móde
- Scroll pill pod kartou lekára
- Fix duplicitného formulára (`initTutorial` fix)
- Funkčné zatváracie tlačidlá
- Retry + batched loading reprezentantov
- `getAllHistory` endpoint
- Oprava hardcoded loginov (Lenka Mačáková + Dionýz Košč)
- Guard pri SAVE proti expirovanej session
- Vylepšenie auto-prolongácie session

---

## PRAVIDLÁ BIZNIS LOGIKY (KRITICKÉ — nikdy neporušiť)

### ABC segmentácia

Segmentácia má **2 dimenzie**:

**Dimenzia 1 — Kapitácia (počet pacientov):**
- **C** = 0–1 500 pacientov
- **B** = 1 501–1 999 pacientov
- **A** = 2 000+ pacientov

**Dimenzia 2 — Interný ročný potenciál** (len interná veličina):
- Číslo sa vypočíta interne, ale **REPREZENTANTOVI SA NIKDY NEZOBRAZUJE AKO ČÍSLO**
- Reprezentant vidí iba: **"potenciál je dostatočný"** alebo **"potenciál je nízky"**
- Toto je prísne obchodné pravidlo — nikdy sa nesmie zobraziť číselná hodnota

### Golden square (prioritní lekári)

Segmenty **A1, A2, B1, B2** = golden square. Toto sú lekári, na ktorých sa reprezentanti majú sústrediť. Appka im dáva pri týchto lekároch vyššiu frekvenciu návštev a prioritu.

### Produktová stratégia

Pri **každej návšteve** reprezentant detailuje (prezentuje) **všetky 4 produkty**:
1. **Aflamil**
2. **Suprax**
3. **Vidonorm**
4. **Cavinton Forte**

Toto pravidlo je fixné — appka nikdy nesmie navrhovať vynechanie niektorého produktu.

### Motivačný tón

Motivačné texty v appke sú v **druhej osobe (tykanie)**, po slovensky, kolegiálnym tónom. Príklady: *"Dnes môžeš navštíviť..."*, *"Tvoj rebríček..."*, *"Skvelá práca!"*.

---

## DIZAJN A UX (KRITICKÉ)

### Vizuálna kontinuita

**Aktuálna verzia 2.2.57 je vizuálny baseline appky.** Všetky nové features, úpravy a rozšírenia musia rešpektovať existujúci dizajnový jazyk:

- Farebná paleta
- Typografia (font, veľkosti, váhy)
- Odsadenia (spacing, paddings, margins)
- Štýl kariet, tlačidiel, inputov, overlayov
- Animácie a prechody (pull-to-refresh, scroll pill, otváranie kariet)
- Ikonografia a emoji použitie

**PRAVIDLO:** Claude nikdy nemení existujúci dizajn bez explicitného pokynu od Ivana. Keď pridávaš nový UI prvok, **najprv sa pozri, ako vyzerajú podobné existujúce prvky v appke, a napodobni ich štýl**. Konzistencia je dôležitejšia než "môj lepší nápad".

### UX princípy

Primárny user je **reprezentant v teréne na mobile**, často pod časovým tlakom medzi návštevami lekárov. Appku otvára na 30 sekúnd medzi autom a ordináciou. Toto definuje **3 železné pravidlá**:

**1. Intuitívne bez manuálu**
Každú novú obrazovku, tlačidlo alebo funkciu musí vedieť použiť reprezentant, ktorý **nikdy nečítal návod**. Ak niečo vyžaduje vysvetlenie v texte, je to zlý dizajn — treba to prekresliť.

**2. Jednoduché a minimalistické**
Menej je viac. Ak sa dá feature dodať s 1 tlačidlom namiesto 3, rob to s jedným. Ak sa dá všetko na jednu obrazovku, nerob z toho dve. Každý klik navyše = riziko, že reprezentant appku prestane používať.

**3. Rýchle**
Reprezentant nemá čas. Žiadne zbytočné animácie, načítavania, medzikroky. Ak niečo trvá dlho (napr. Sheets fetch), zobraziť jasný loading indikátor, nie prázdnu obrazovku.

### Praktické pravidlá pre Claude pri dizajnových rozhodnutiach

- **Najprv prieskum, potom tvorba.** Pred pridaním nového UI prvku pozri, aký existujúci prvok je podobný (tlačidlo, karta, input) a drž sa jeho štýlu.
- **Preferuj vizuálne indikátory** (farba, ikona, veľkosť) pred textovými popismi.
- **Konzistentná terminológia.** Ak sa niekde v appke píše "záznam", nepíš inde "zápis". Ak je niekde "doktor", nepoužívaj inde "lekár".
- **Slovo "reprezentant" píš vždy celé.** Skratka "rep" sa môže pliesť so zeleninou ("repa"), s GitHub repozitárom ("repo"), alebo znieť neprofesionálne. V dokumentácii, komentároch, UI textoch a commit správach vždy používať plnú formu "reprezentant", "reprezentanti", "reprezentantov", atď. Výnimky: technické konštanty v kóde (`TEST_REP`, premenné) môžu skratku používať.
- **Žiadne zbytočné popisky, tooltipy, nápovedy.** Ak potrebuješ vysvetliť, čo tlačidlo robí, tlačidlo je zle navrhnuté.
- **Test "30 sekúnd medzi autom a ordináciou":** Pri návrhu nového feature-u si predstav reprezentanta pod časovým tlakom. Ak by to bolo ťažkopádne alebo vyžadovalo premýšľanie, prekresli to.
- **Ak si neistý medzi 2 dizajnovými možnosťami, opýtaj sa Ivana.** Radšej kratšia otázka než zlé dizajnové rozhodnutie.

---

## Git workflow

### Vetvy

- **`main`** = produkčná verzia, ktorú vidia reprezentanti cez GitHub Pages URL. **Nikdy sa do nej necommituje priamo** — iba cez merge z `test` vetvy.
- **`test`** = vývojová vetva. Tu prebieha všetka práca, všetky experimenty, všetky bugfixy. Reprezentanti ju nevidia.

### Verzovanie (semantické — MAJOR.MINOR.PATCH)

- **PATCH** (napr. 2.2.56 → 2.2.57) = bugfix, malá oprava bez nového funkcionality
- **MINOR** (napr. 2.2.56 → 2.3.0) = nový feature (napr. reminder funkcia)
- **MAJOR** (napr. 2.2.56 → 3.0.0) = veľká zmena, ktorá mení ako sa appka používa

Claude sám navrhne, ktorú úroveň zdvihnúť, a Ivan potvrdí.

### Commit správy

- **Jazyk: slovenčina**
- Formát: `v[verzia]: [stručný popis zmeny]`
- Príklady:
  - `v2.2.57: oprava zatváracieho tlačidla na karte lekára`
  - `v2.3.0: pridaná funkcia reminder pri nenavštívených lekároch`
  - `v2.2.58: fix pull-to-refresh na iOS`

### Štandardný vývojový flow

1. Ivan povie, čo treba urobiť (napr. *"pridaj reminder funkciu"*)
2. Claude pracuje **priamo na `test` vetve** (ak nie je, prepne sa tam)
3. **Claude robí zmeny bez opakovaného pýtania** (Ivan si prezrie diff na konci)
4. Claude commitne na `test` vetvu so slovenskou správou
5. Claude pushne na GitHub — do `test` vetvy (reprezentanti stále vidia starú stabilnú main)
6. Ivan testuje lokálne alebo cez preview
7. Keď je Ivan spokojný, povie *"zmerguj do main"* alebo podobne
8. **Claude sa PÝTA kontrolnú otázku pred mergom do main** — viď checklist nižšie
9. Po potvrdení Claude zmerguje, vytvorí git tag verzie, pushne main
10. GitHub Pages automaticky publikuje do 1–2 minút → reprezentanti vidia novú verziu

### Pravidlo autonómie

- **Na `test` vetve:** Claude pracuje rýchlo a autonómne. Nepýta sa pri každej drobnej zmene. Ivan kontroluje cez diff panel pred mergom.
- **Pri merge do `main`:** Claude sa VŽDY pýta kontrolné otázky (checklist). Nikdy auto-merge do main.

---

## Pre-merge checklist (KRITICKÉ)

Predtým, ako Claude zmerguje `test` → `main`, MUSÍ sa Ivana opýtať a prejsť s ním tento checklist. Ak Ivan povie *"zmerguj"*, Claude odpovie: *"Pred mergom do produkcie si prejdime checklist. Potvrď mi prosím jednotlivé body:"*

### 1. Základné funkcie (smoke test)
- [ ] Appka sa načíta bez chybového hlásenia
- [ ] Login / identifikácia reprezentanta funguje
- [ ] Zoznam lekárov sa zobrazí
- [ ] Otvorenie karty lekára funguje
- [ ] Pridanie záznamu o návšteve sa uloží
- [ ] História (`getAllHistory`) sa načíta

### 2. UI interakcie
- [ ] Pull-to-refresh funguje (a je blokovaný pri otvorených overlayoch)
- [ ] Zatváracie tlačidlá fungujú
- [ ] Rebríček sa načíta (iOS aj Android, ak je prístup)
- [ ] Scroll pill sa zobrazuje správne pod kartou lekára

### 3. Admin mode (ak relevantné)
- [ ] AM West/East sa dynamicky načítajú zo Sheets
- [ ] Manažéri vidia admin funkcie

### 4. Konkrétny feature, na ktorom sa pracovalo
- [ ] Testoval som hlavný scenár (happy path)
- [ ] Testoval som aspoň 1 edge case (chyba, prázdne dáta, atď.)
- [ ] Neovplyvnilo to iné časti appky

### 5. Vizuálna kontrola
- [ ] Zobrazenie na mobile funguje (reprezentanti používajú hlavne mobil)
- [ ] Nič sa nezlomilo v layoute
- [ ] Dizajn nových prvkov je konzistentný s existujúcou appkou (farby, typografia, štýl tlačidiel)
- [ ] Nové funkcie sú použiteľné bez manuálu (intuitívne pre reprezentanta)

### 6. DEV mode stále funguje
- [ ] Appka sa dá otvoriť s `?dev=1` a beží s mock dátami
- [ ] DEV banner je viditeľný
- [ ] Ak pribudol nový fetch zo Sheets, mock dáta boli tiež aktualizované

**Ak Ivan nejaký bod nepotvrdí, Claude merge NEVYKONÁ** a navrhne doriešiť problém na test vetve.

---

## Incident response — bug v produkcii

Ak reprezentanti nahlásia bug vo verzii, ktorá je na `main`:

### 1. Okamžitý rollback main
Claude **okamžite vráti `main` na predchádzajúcu stabilnú verziu** (cez `git revert` alebo reset na predošlý tag) a pushne. Reprezentanti dostanú späť funkčnú verziu do 1–2 minút.

### 2. Registrácia bugu
Claude zapíše bug do `BUGS.md` alebo do samostatného issue v repozitári — s popisom, ktorá verzia ho obsahovala, aké sú reprodukčné kroky.

### 3. Fix na test vetve
Claude prepne na `test` vetvu a začne pracovať na oprave. Zmeny idú cez štandardný flow (fix → test → checklist → merge do main).

### Pravidlo
**Nikdy sa nepokúšať opraviť bug priamo na `main` vetve**, ani keď sa to zdá ako jednoduchý fix. Vždy rollback first, fix via test branch.

---

## Plánované funkcie (v priorite)

1. **Login cez Google Sheets** — integrácia autentifikácie
2. **Reminder ak doktor nenavštívený X týždňov** — X nastaviteľné v admin móde
3. **Trend potenciálu lekára** — vizualizácia vývoja v čase
4. **Rebríček s fotkami reprezentantov** (voliteľné, neskôr)
5. **Reporting** — automatické reporty
6. **Neaktívni reprezentanti → email manažérovi**
7. **Schválenie záznamu manažérom**
8. **CRM light** (po 3 mesiacoch v teréne)
9. **Progress bar produktov vs. kvartálny plán** (dáta zo Sheets)
10. **Výber špecializácie pri každom zázname**
11. **Rýchly brief pred návštevou** — karta lekára s poslednou návštevou, segmentom, potenciálom, poznámkou, trendom a upozornením (ak je to nový lekár alebo zmena segmentu)

### Dátová integrácia (až po login + Sheets)
- Vlastné predaje na úrovni lekárne mesačne
- Konkurencia na úrovni okresu mesačne
- Plán: (1) Sheets štruktúra, (2) login, (3) panel trhových podielov v appke (naše vs. konkurencia, balenia → pacienti), (4) automatický mesačný report
- **Prepočty balení → pacienti ešte nedodané** (treba získať od R&D / medical)

### Plnenie (Predaje vs Plán)
Vizuálna referencia uložená v samostatnom súbore `plnenie_vizual.html`. Obsahuje 4 módy (Admin, AM West, Detail reprezentanta, Mód reprezentanta). Pri implementácii do produkčnej appky čerpať celý vizuál odtiaľ. Mód reprezentanta = verná kópia produkčnej obrazovky + 💊 Plnenie tlačidlo v headri vedľa Rebríček/História. Po kliknutí: Späť → tmavá karta s % hore → Q taby → produkty s míľnikmi → trend graf. **Bez motivačného bannera.**

---

## Testovanie

Ivan testuje zmeny cez **`localhost:8000`** — Claude spustí lokálny server a Ivan otvorí appku v prehliadači. Appka tak siaha na produkčné Google Sheets endpointy normálne cez internet.

---

## Komunikačný štýl Claude

- **Tón: priateľský, kolegiálny.** Ako kolega programátor / tech partner, nie ako robot.
- **Vysvetľuj rozhodnutia.** Keď urobíš zmenu, krátko povedz, **prečo si sa rozhodol tak, a nie inak** (napr. *"Tento reminder som dal do separátnej funkcie, aby sa dala neskôr znova použiť pre iné upozornenia"*).
- **Upozorňuj na potenciálne prekvapenia.** Ak robíš zmenu, ktorá môže ovplyvniť niečo nečakané (napr. zmena v storage formáte), povedz to vopred.
- **Jazyk: slovenčina** (primárne), anglické technické pojmy môžeš zachovať (feature, commit, merge, rollback, branch, bug, fix, endpoint, atď. — to sú prirodzene anglické termíny).

---

## Dôležité poznámky pre Claude

- **Nikdy neupravuj `index.html` priamo na `main` vetve.** Vždy cez `test`.
- **Nikdy nezobrazuj reprezentantovi číselnú hodnotu interného potenciálu.** Iba "dostatočný" / "nízky".
- **Vždy detailovať všetky 4 produkty** — Aflamil, Suprax, Vidonorm, Cavinton Forte. Nenavrhuj vynechanie.
- **Pred mergom do `main` vždy pre-merge checklist** — nikdy bez neho.
- **Pri bugu v produkcii — rollback first, fix later.**
- **Commit správy v slovenčine**, semantické verzovanie.
- **Primárny user je mobil** — vždy testuj responzívne zobrazenie.
- **Dizajn v2.2.57 je baseline.** Drž sa existujúceho štýlu, nemeň ho bez explicitného pokynu. Všetko musí byť použiteľné bez manuálu.
