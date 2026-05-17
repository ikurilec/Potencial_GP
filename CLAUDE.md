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
  - Apps Script súbor: `apps_script/kód.gs`
  - Apps Script URL: `https://script.google.com/macros/s/AKfycbziSBvq1u8Jq0u0sTMynd-hqfk39rJtQZerIxdAgLiqL4AH-pEkE6TZK1HPqhcNiZxO0A/exec`
  - Táto URL je zhodná s `SCRIPT_URL` v `index.html` — pri zmene treba aktualizovať oboje
- **Hosting:** GitHub Pages (URL, ktorú používajú reprezentanti v teréne)
- **Jazyk UI:** slovenčina

## Aktuálna stabilná verzia

### v2.21.30 — Plnenie: prirodzenejšie texty v akčnom súhrne

- Manažérsky text v akčnom súhrne už nepíše napr. **plánu Michal**, ale prirodzenejšie **celkového plánu Michala**.
- Reprezentantovi ostáva osobný text **tvojho celkového plánu**.
- Pridaný malý helper na skloňovanie najčastejších mien reprezentantov v genitíve. Verzia bumpnutá na `2.21.30`.

### v2.21.29 — Plnenie: akčný súhrn a vyhodnotenie kvartálu

- Do Plnenia reprezentanta aj manažérskeho detailu reprezentanta pribudol modrý panel s odporúčaniami.
- Aktuálny kvartál zobrazuje **Akčný súhrn** / **Na čo sa zamerať s reprezentantom**; ukončený kvartál sa prepne na **Vyhodnotenie kvartálu**.
- Riziká sa nerátajú len podľa % produktu, ale aj podľa váhy produktu v celkovom pláne a € gapu, aby malé produkty neprebíjali strategicky dôležité produkty.
- Očakávané tempo sa ráta podľa pracovných dní a podľa posledného mesiaca, za ktorý sú reálne nahraté predaje. Ak sú dáta iba za apríl, panel hodnotí `Q2 2026 · Apr`; po pridaní mája automaticky `Apr + Máj`.
- Porovnanie s minulým kvartálom používa predaj za pracovný deň v rovnakom dátovom období, napr. Apr vs Jan alebo Apr+Máj vs Jan+Feb.
- Texty sú prispôsobené kontextu: reprezentant vidí „tvojho celkového plánu“, manažér vidí konkrétne meno reprezentanta. Verzia bumpnutá na `2.21.29`.

### v2.21.28 — Plnenie: čitateľnejší prepočet na balenia

- Text prepočtu z chýbajúcich eur na balenia je prerobený z dlhej vety na kompaktný dvojriadkový blok.
- Skratka **bal.** je nahradená zrozumiteľnejším slovom **balení**.
- Pri bežných produktoch sa zobrazuje jasne: **Do splnenia plánu chýba** + suma a približný počet balení.
- Pri **Aflamil tbl. a sáčky** sa hlavný riadok drží krátky a mix je v samostatnom menšom riadku, aby sa karta na mobile nelámala chaoticky.
- Verzia bumpnutá na `2.21.28`.

### v2.21.27 — Plnenie: chýbajúce eurá prepočítané na balenia

- Produktové karty v Plnení zobrazujú pod riadkom predaj/plán aj praktický prepočet: **do splnenia plánu chýba X € ≈ Y bal.**.
- Produkty s jasnou CIP cenou používajú fixné ceny dodané Ivanom: krém, Suprax 400 mg, Cavinton Forte 90 tbl., Kogavant 90 mg 56 tbl., Vidonorm 4/5 mg 90 tbl., Telexer 150 mg 180 tbl. a Junod.
- **Aflamil tbl. a sáčky** sa rozrátavajú podľa mixu minulého kvartálu; tablety sa počítajú ako 30 ks balenia a sáčky ako samostatné balenia.
- Prepočet sa zobrazuje reprezentantom aj manažérom/adminom v detaile Plnenia. Verzia bumpnutá na `2.21.27`.

### v2.21.26 — Lekárne: výraznejšie tlačidlo oslovenia krému

- Tlačidlo pri Krém odporúčaniach je prerobené z malého pill štítku na výrazné zelené full-width CTA.
- Text zmenený na **Označiť ako oslovenú**, doplnená fajka a malý indikátor **ťukni**, aby reprezentantom bolo jasné, že ide o klikateľnú akciu.
- Stav po kliknutí ostáva **Oslovená lekáreň**, ale vizuálne je utlmený ako dokončená akcia.
- Verzia bumpnutá na `2.21.26`.

### v2.21.25 — Lekárne: fix zápisu oslovenia krému do Sheets

- Opravený zápis tlačidla **Oslovená lekáreň**: frontend už nečíta neexistujúcu globálnu premennú `session`, ale berie prihláseného reprezentanta cez `getSession()`.
- Pred fixom sa klik uložil lokálne v appke, ale backend dostal prázdny `username`, preto nevytvoril sheet `Lekarne_Krem_Oslovene`.
- Odstránené duplicitné pridávanie `token` v URL pre `setLekarenKremContact`; používa sa štandardný `scriptUrl(...)`.
- Verzia bumpnutá na `2.21.25`, aby sa po update tlačidlo znova zobrazilo a ďalší klik už prešiel do Sheets.

### v2.21.24 — Lekárne: Krém oslovenie zo Sheets + 3-mesačný odber krému

- Krém tab zobrazuje pri každej lekárni súhrn **AFL krém posledné 3 mesiace** po jednotlivých mesiacoch, aby rep videl kedy a koľko krému lekáreň brala.
- Tlačidlo **Oslovená lekáreň** ostáva iba reprezentantom. Po kliknutí sa stav zapíše do backendu aj lokálne a karta sa v aktuálnom mesiaci posunie naspodok Krém tabu.
- Manažér/admin pri detaile reprezentanta nevidí tlačidlo, iba stav **Reprezentant už oslovil túto lekáreň** alebo **Reprezentant ešte neoslovil túto lekáreň** podľa zápisu daného reprezentanta.
- Backend `apps_script/kód.gs` má nový endpoint `setLekarenKremContact` a automaticky vytvára/číta sheet `Lekarne_Krem_Oslovene` (`month`, `login`, `key`, `okres`, `mesto`, `lekaren`, `contacted_at`).
- Cache lekární posunutá na `lekarne_cache_v5_*`, aby sa načítali aj nové stavy oslovenia. Verzia bumpnutá na `2.21.24`.

### v2.21.23 — Lekárne: oslovený Krém + dobropis wording

- Krém tab má pri každej odporúčanej lekárni zelené tlačidlo **Oslovená lekáreň**.
- Po stlačení sa lekáreň uloží ako oslovená pre aktuálny mesiac a v Krém tabu sa presunie naspodok; ďalší mesiac sa stav automaticky resetuje cez mesačný `localStorage` kľúč.
- Dobropis text **Všetky 3** je zmenený na prirodzenejší výraz **všetky tri produkty** v kartách aj detaile.
- Odporúčané vety pre Dobropis sú upravené prakticky: pri všetkých troch produktoch sa rieši konkurencia a dobropis, pri chýbajúcich produktoch možnosti dobropisu cez konkurenciu.
- Verzia bumpnutá na `2.21.23`, aby prebehol update aplikácie cez `version.json`.

### v2.21.22 — Lekárne: priorita, dôvod a odporúčaný argument

- Karty lekární v režime reprezentanta aj manažéra zobrazujú krátky odporúčací blok: priorita, dôvod odporúčania a praktická veta/krok pre rozhovor v lekárni.
- Krém rozlišuje reaktiváciu AFL krému a potenciál z AFL tbl./sáč.; Dobropis používa kombináciu produktov za posledné 3 mesiace; Spiace/Nové/Všetky dostali vlastný praktický dôvod.
- Rovnaký odporúčací blok je doplnený aj v detaile konkrétnej lekárne.
- Verzia bumpnutá na `2.21.22`, aby prebehol update aplikácie cez `version.json`.

### v2.21.21 — Globálne vrstvené späť gesto

- Centrálny `_handleAndroidBack()` teraz najprv zatvára najvrchnejšie modálne vrstvy (`avatar confirm`, avatar editor, edit record, detail record, Satori/What's New) a až potom obrazovkové detaily.
- Edge swipe je doplnený aj na `mgr-detail` a `mgr-plnenie-detail`, aby potiahnutie zľava doprava v manažérskej časti vracalo o jednu úroveň dozadu.
- Cieľ: iPhone edge swipe, Android back aj app swipe-back majú konzistentne zavrieť najvnútornejšiu otvorenú vrstvu, nie preskočiť na prvú obrazovku.

### v2.21.20 — Lekárne: history back poradie pre detail lekárne

- `_handleAndroidBack()` kontroluje `lk-detail` pred `mgr-plnenie-detail-open`.
- Rieši iPhone edge-back v manažérskom detaile: keď je otvorená konkrétna lekáreň, systémové späť gesto zavrie najprv detail lekárne a nevráti používateľa až na prvú obrazovku/detail reprezentantov.

### v2.21.19 — Lekárne: iOS edge swipe fix v detaile

- Detail lekárne má špeciálny edge-swipe handler pre iPhone: ak gesto začne úplne zľava a ide doprava, handler zamkne horizontálny pohyb a zavrie detail.
- Pridané `touch-action: pan-y` na `lk-detail`, aby vertikálny scroll ostal prirodzený a horizontálny back swipe mal vyššiu prioritu.
- Oprava mieri na prípad, keď iOS/Safari zachytil úplne ľavý edge swipe skôr než bežný app swipe helper.

### v2.21.18 — Lekárne: swipe späť z detailu lekárne

- Detail lekárne (`lk-detail`) má vlastný horizontálny swipe doprava, ktorý zavrie detail a vráti používateľa späť na zoznam lekární.
- Zoznam lekární (`lk-overlay`) je pridaný do edge-swipe-back overlayov, takže potiahnutie z ľavej hrany zatvorí aj celý Lekárne overlay.
- Rieši iPhone UX: po otvorení lekárne sa dá prstom vrátiť späť na zoznam bez nutnosti trafiť tlačidlo „Späť“.

### v2.21.17 — Lekárne: príležitosti podľa 3+ mesiacov bez nákupu

- Detail lekárne v sekcii **Príležitosti — ešte nekupujú** už nezobrazuje iba produkty, ktoré lekáreň nikdy nekúpila.
- Pre každý produkt z portfólia (`AFL tbl.`, `AFL krém`, `Suprax`, `Vidonorm`, `CAV Forte`, `Globifer`, `Kogavant`) sa hľadá posledný nákup.
- Ak produkt nebol kúpený nikdy, zobrazí sa text „ešte nenakúpili vôbec“.
- Ak bol posledný nákup 3+ mesiace dozadu, zobrazí sa mesiac posledného nákupu a počet balení, napr. „Suprax — nekúpili od Jan 2026 · naposledy 4 bal.“

### v2.21.16 — Lekárne: animovaný loading stav

- Stav **Načítavam lekárne** v manažér/admin detaile má pulzujúcu lupu s rotujúcim prstencom a animované bodky za textom.
- Cieľ je jasne ukázať, že dáta sa ešte načítavajú a používateľ má chvíľu počkať.

### v2.21.15 — Lekárne: plné pozadie manager sticky filtrov

- Manager/admin sticky blok Lekárne má plné sivé pozadie aj v medzerách medzi kategóriami Krém/Dobropis/Spiace/Nové/Všetky.
- Spodná deliaca linka už nepresahuje do strán; končí v šírke sticky bloku.

### v2.21.14 — Lekárne: zjednotený spodný okraj sticky filtra

- Manager/admin detail reprezentanta má pod sticky blokom Lekárne rovnakú jemnú sivú deliacu linku ako reprezentantský Lekárne overlay.
- Ide iba o vizuálne zjednotenie sticky search + kategórie bloku pri scrollovaní.

### v2.21.13 — Lekárne: loading stav pri manažérskom detaile

- Pri manažér/admin detaile reprezentanta už počas hromadného načítania lekární nesvieti prázdny výsledok typu "Žiadne lekárne na Krém".
- Kým sa dokončí `getLekarneAll` alebo fallback `getLekarne`, detail zobrazí stav **Načítavam lekárne… Prosím počkajte pár sekúnd.**
- Cache kľúč lekární je posunutý na `lekarne_cache_v4_*`, aby sa ignorovala prípadná stará prázdna cache z predošlého medzistavu.

### v2.21.12 — Lekárne: rýchlejší load + persistent cache

- Frontend Lekárne už po prihlásení nepreloaduje každého reprezentanta samostatným requestom. Manažér/admin používa hromadný endpoint `getLekarneAll`, ktorý vie naplniť cache pre všetkých repov naraz.
- Reprezentant má lekárne uložené v `localStorage` cache. Pri otvorení Lekární sa najprv ukážu naposledy načítané dáta a na pozadí sa urobí fresh refresh.
- Cache sa prekreslí iba vtedy, keď sa zmení hash riadkov lekární pre daného repa; bez zmeny sa UI zbytočne neprepočítava.
- Backend pridaný endpoint `getLekarneAll` v `apps_script/kód.gs`; pre produkciu treba redeploy Google Apps Script, inak frontend použije fallback na pôvodný `getLekarne` pri konkrétnom repovi.

### WIP — Lekárne: detail parity + Krém sorting

- Manager/admin lekárne teraz otvárajú ten istý detail overlay ako reprezentant.
- Krém tab radí najprv čerstvé reaktivácie, potom krémové potenciály z tbl/sáčok a lekárne s posledným nákupom 6+ mesiacov posúva naspodok.
- Dobropis zostáva viazaný na posledné 3 mesiace a používa spoločný detail lekárne.

### Tooling/backend update — Gyn predaje korekcie cez `Predaje_korekcie`

#### Problem
- IQVIA gyn predaje prichadzaju najprv ako klasicke mesacne predaje, ktore sa importuju cez `gyn_predaje_konverter.html` do tabu `Predaje`.
- Pri vybranych produktoch prichadzaju nasledne prepocitane hodnoty; kedze sa rozdiely mozu objavit aj pri dalsich produktoch, korekcny export berie vsetky podporovane produktove bloky z pracovneho suboru.
- Ivan potrebuje opravit iba dotknute produkty a iba dotknute mesiace, bez zasahu do ostatnych hodnot v Google Sheets.
- Detail reprezentanta musi sediet rovnako ako manazersky sumarny pohlad.

#### Oprava
- `gyn_predaje_konverter.html` ma novu sekciu **Korekcie prepocitanych gyn produktov**.
- Vstup: `Plnenie_gyn_2026.xlsx`, pracovne harky `Plnenie 1.Q` a `Plnenie 2.Q.2026`.
- Export: TSV/CSV pre novy Google Sheets tab `Predaje_korekcie`.
- Format korekcii: `login | meno | rok | mesiac | produkt | hodnota | zdroj`.
- Parser mapuje pracovne bloky na app produkty:
  - `GLOBIFER` -> `Globifer`
  - `LIDBREE` -> `Lidbree`
  - `LEVOSERT` -> `Levosert`
  - `OVOSICARE` -> `Ovosicare`
  - `RYEQO` -> `Ryeqo`
  - `DROVELIS` -> `Drovelis`
  - `EVRA` -> `Evra`
  - `BELARA` -> `Belara`
  - `DAYLETTE` -> `Daylette`
  - `DAYLLA` -> `Daylla`
  - `MAITALON` -> `Maitalon`
  - `MISTRA` -> `Mistra`
  - `H - GEL` -> `Papilocare Hgel`
  - `IMMUNO` -> `Immunocaps`
  - `ESCAPELLE` -> `Escapelle`
  - `AZALIA` (aj ked je v XLSX s diakritikou) -> `Azalia`
- Regiony/oblasti sa mapuju spat na login repa, aby fungoval aj detail reprezentanta.
- `apps_script/kód_gyn.gs` endpoint `getPlnenieAll` po nacitani tabu `Predaje` nacita aj `Predaje_korekcie`.
- Ak existuje korekcia pre rovnaky `login + rok + mesiac + produkt`, prepise iba tuto jednu hodnotu v `predajeByRep`; ostatne produkty a mesiace ostavaju z povodneho tabu `Predaje`.
- Duplicitne korekcne riadky su osetrene defensivne: prva korekcia pre `login + rok + mesiac + produkt` vyhrava, neskorsie duplicity sa ignoruju. Toto chrani pripad, ked novy 70-riadkovy export bol vlozeny nad starsi 210-riadkovy chybny export a stare riadky ostali nizsie v tabe.
- Q1 Globifer/Ovosicare/H-Gel/Immuno maju v pracovnom subore niektore mesiace prazdne, ale ich vyznam je 0, nie "nechaj povodne Predaje". Parser preto pri korekcnom riadku exportuje prazdne mesiace pred poslednym vyplnenym mesiacom ako `0`; prazdne buduce mesiace po poslednom vyplnenom mesiaci preskakuje.

#### Nasadenie
- V Gyn Google Sheets vytvorit tab `Predaje_korekcie` s hlavickou z konvertera.
- Po vlozeni korekcii treba redeploynut Gyn Apps Script (`apps_script/kód_gyn.gs`).
- Hlavna PWA verzia sa tymto nemenila, kedze `index.html`, `sw.js` a `version.json` neboli upravene.

#### Overenie
- `node tests/gyn_corrections_parser_test.js` -> pass
- `node tests/gyn_corrections_overlay_test.js` -> pass
- Na dodanom `Plnenie_gyn_2026.xlsx` vzniklo 260 korekcnych riadkov pre Q1/Q2 pracovne zalozky (13 produktov x 20 rep/mesiac riadkov podla dostupnych hodnot).

---

**2.20.11** (na `main` aj `test` vetve) — **fix gyn chart: konkurenti aj cez predošlý Q (cache hit obchádzal okresy_prev fetch)**: trend graf v gyn Trhový podiel zobrazoval konkurentov len pre aktuálny Q napriek tomu, že v2.20.4 mal robiť paralelný fetch oboch quartalov. Príčina: `gynPreloadAllPharma()` na pozadí fetchol len aktuálny Q a uložil do cache bez `okresy_prev` poľa. Pri otvorení chartu `gynPharmaLoad` videl cache hit a vrátil staré dáta bez prev Q. Fix: cache hit sa teraz akceptuje iba ak `cached.okresy_prev !== undefined` (alebo nie je prev Q). Inak sa doplní prev Q fetch + merge. Optimalizácia: ak je current Q v cache, nesťahuje sa znova.

### v2.20.11 — Fix gyn chart konkurenti — cache hit obchádzal prev Q fetch

#### Problém
- Trend graf v gyn Trhový podiel pre Belaru zobrazoval konkurenčné čiary (MAITALON, MISTRA, DROVELIS) iba pre Jan-Mar 2026
- Naše dáta (Belara) + Slovensko ✅ celých 6 mesiacov (Oct-Mar)
- Konkurenti ❌ len pre aktuálny Q
- V Sheets PharmaData_Okresy reálne EXISTUJÚ riadky pre Q4 2025 (2504) — overené cez API curl test

#### Príčina
- `gynPreloadAllPharma()` pri prihlásení robil 500+ fetchov **iba pre aktuálny Q** (každý product × region × current Q)
- Cachoval response do `GYN_PHARMA_STATE.cache[key]` bez `okresy_prev` poľa
- Pri otvorení chartu užívateľom: `gynPharmaLoad` videl `cache[key]` → render → bez konkurentov z prev Q
- Logika v `gynPharmaLoad` z v2.20.4 (paralelný fetch current + prev) **nikdy nezbehla** lebo cache už mala záznam

#### Oprava
- **`gynPharmaLoad`** rozšírený o detekciu kompletnosti cache:
  ```js
  if (cached && (cached.okresy_prev !== undefined || !kvartalPrev)) {
    gynPharmaRender(cached); return;
  }
  ```
- Ak cache má `okresy_prev` → use cache
- Ak cache nemá `okresy_prev` ale existuje prev Q na fetch → re-use cached current Q, fetchni iba prev Q a merge
- Optimalizácia: `fetchCurrent` je `Promise.resolve(cached)` ak cache hit → 1 request namiesto 2

#### Štatistika
- **Verzia 2.20.10 → 2.20.11** (PATCH — bug fix)
- ~15 insertions / 5 deletions v `index.html`
- 0 backend zmien (žiadny Apps Script redeploy)

---

### v2.20.10 — Header redesign: výrazný avatar + výrazný logout + onboarding hint

**2.20.10** — **header redesign: výrazný avatar + výrazný logout + onboarding hint**: 5 zmien pre lepšiu discoverabilitu header avatara aj logout tlačidla — (1) **swap pozícií**: avatar je teraz na pravej hrane (predtým medzi nadpisom a Odhlásiť), Odhlásiť tlačidlo je naľavo od neho; (2) **zväčšený avatar**: 38 → 60px (58% bigger, oveľa viac viditeľný); (3) **väčšia kontrastná ceruzka**: 14 → 22px s bielym pozadím a modrou ceruzkou; (4) **pulzujúce žlté halo + bouncing ceruzka** keď avatar nie je nastavený + **one-time žltý onboarding tooltip** ktorý sa zobrazí 4s po prihlásení; (5) **Odhlásiť tlačidlo redesignované**: pill s SVG door-exit ikonou + textom "Odhlásiť" v sýtej červenej (gradient `#DC2626 → #B91C1C`, biely text, red glow shadow, inset highlight). Ikona aj text aby bolo jednoznačné že tlačidlo odhlasuje.

### v2.20.10 — Avatar discoverability — swap + bigger avatar + pulse halo + onboarding tooltip

#### Problém (feedback od Ivana)
- Edit badge (modrá bodka s ceruzkou ✎) v rohu header avatara bol **14×14px**, tmavomodrý na navy background
- Avatar samotný 38×38px medzi nadpisom a Odhlásiť tlačidlom — vizuálne medzi obsahom
- "to co je v kruzku a ta malá ceruzka je to nevýrazne a malo kto zisti ze sa tam da kliknut a nastavovať"
- "bolo by mozne toho avatara vymenit s tlacitkom odhlasiť ich pozicie a tým padom by avatar mohol byt vacsi kruh"
- Reprezentanti/manažéri nevedeli že header avatar je clickable → never customized

#### Feedback od Ivana (logout button) — 3 iterácie
- Iter 1: "to tlačítko na odhlasiť by mohlo byť tiež tak aby viac intuitivne vedeli ze týmto tlacitkom sa odhlasia teraz je take nevýrazné a vacsinou tlacitka na odhlasit su v kruzku ne elipse"
- Iter 2 (po icon-only kruh): "neviem či to tlačítko bude evokovať že sa majú odhlásiť"
- Iter 3 (po pill s textom): "to je priliš veľké take ako to bolo gulate to bolo fajn len treba porozmyšľať ako by sa tam do toho napisalo ze odhlásiŤ aby to vedeli ze tymto sa odhlasia"
- Finálne: **kruh 44px s icon-only + malý uppercase label "ODHLÁSIŤ" pod tlačidlom**

#### Oprava — 5 vrstiev
-1. **Logout tlačidlo — kruh s ikonou + malý label pod ním**:
   - Pôvodne: pill `border-radius:20px`, padding 5px 10px, text "⎋ Odhlásiť" v slabšej červenej — nevýrazné
   - Iter 1 (icon-only 48px kruh): ambiguózne bez textu
   - Iter 2 (pill 48px height s ikonou + textom v ňom): príliš široké, vizuálne dominantné
   - **Finálne**: `.logout-wrap` flex column container so 2 deťmi:
     - **`.logout-btn`** — 44×44px kruh (`border-radius:50%`), sýta červená gradient `#DC2626 → #B91C1C`, biely SVG door-exit icon 20×20, biely 2px border (.85 opacity), box-shadow `0 4px 12px rgba(220,38,38,.40)` + inset white highlight
     - **`.logout-btn-lbl`** — `<span>Odhlásiť</span>` pod tlačidlom, 9.5px font-weight 700, uppercase, letter-spacing .06em, color `#FCA5A5` (svetlo-červený text na navy header), font Outfit display
   - Gap 3px medzi tlačidlom a labelom
   - Total výška ~57px (~44 + 3 + 10) — porovnateľná s 52px avatarom
   - `aria-label="Odhlásiť"` pre screen readery
   - Hover: brighter gradient + biely border (1.0 opacity) + zosilnený glow
   - Active: scale(.94)
0. **Swap pozícií + zväčšený avatar**:
   - HTML poradie zmenené: `[Logout button] [Avatar wrap]` namiesto `[Avatar wrap] [Logout button]`
   - Avatar je teraz na pravej hrane headera (najvýraznejšia pozícia)
   - Avatar size: 38 → **60px** (58% bigger), font-size 13 → 19px
   - Border 2 → 3px (proporcionálne), shadow zosilnený (`0 2px 8px` → `0 5px 16px`)
   - Gap medzi logout a avatar: 8 → 10px
1. **Väčší kontrastný edit badge**:
   - 14×14 → **22×22px**, font-size 8 → 13px (bold)
   - Tmavomodré pozadie → **biele pozadie + modrá ceruzka** (#1E40AF)
   - Pridaný white-inset shadow + outer shadow → "vznáša" sa nad avatarom
2. **Pulse hint pre užívateľov bez avatara** — class `.avatar-unset` na `.hdr-avatar-wrap`:
   - **Bouncing ceruzka** (`hdrEditBounce` 1.8s ease-in-out) — pulzuje scale .85 ↔ 1.18, s žltým ringom v peaku
   - **Žlté halo** okolo celého avatara (`hdrAvatarHalo` 2.2s) — pulzujúci box-shadow ring s opacity .55 → 0
   - Rešpektuje `prefers-reduced-motion`
   - Auto-stop po nastavení avatara (`hdrAvatarUpdateHint` removed `.avatar-unset` class)
3. **One-time žltý onboarding tooltip** (mnoho iterácií ladenia):
   - Floating chip pod avatarom: "✎ Ťukni si na svoj avatar — môžeš si ho upraviť"
   - Žltý gradient (#FBBF24 → #F59E0B), biely okraj, šípka smerom hore na avatar
   - Spring-in animation (cubic-bezier(.34,1.56,.64,1))
   - **Smart wait — 3 vrstvy ochrany pred predčasným zobrazením**:
     1. **Blocker check** — iteruje 20 ID-čok overlayov (`wn-overlay`, `satori-overlay`, `milestone-overlay`, `tutorial-overlay`, `av-overlay`, `av-confirm-overlay`, `logout-overlay`, `send-popup`, `confirm-overlay`, `detail-overlay`, `edit-overlay`, `restore-overlay`, `hist-overlay`, `lb-overlay`, `rep-plnenie-overlay`, `pharma-ms-overlay`, `pharma-okres-overlay`, `session-expired-overlay`, `rpt-progress-overlay`, `thankyou`) a kontroluje `.show` class na nich
     2. **`_milestonePending` flag** — nastavený v `checkMilestone()` keď začne fetchovať stats, uvolnený v `closeMilestone()` alebo keď stats < 200; pokrýva 500-1400ms gap medzi `checkMilestone()` start a `showMilestone()` open
     3. **Stability check** — po prejdení blocker checkom potrebuje 3 po sebe idúce tickety (900ms) bez modalov; pokrýva gap medzi `satori-close` (350ms) a `wn-show`/`milestone-show`
   - **Trigger v 3 bodoch**:
     1. Z `wnClose()` — keď zatvorí posledný WN modal (immediate trigger 250ms po close + smart-wait)
     2. Z `gynEnter` / `loginSuccess` / `initLogin` — 1500ms fallback timeout (pre prípady kedy user nemá žiadne WN)
     3. Smart wait všetko skoordinuje — ak pri triggeri (1500ms) ešte modal nezatvoril, počká
   - **Dynamická pozícia** — tooltip sa najprv pridá skrytý aby sa zmerala šírka, potom centruje pod avatarom; ak by pretiekol viewport, posúva sa doľava ale **šípka ostane mieriť na avatara** cez CSS variable `--arrow-x`
   - **Scroll-anchored** — pri scrollovaní `requestAnimationFrame` recalculates `getBoundingClientRect()` na avatare a updatuje tooltip pozíciu → tooltip "sleduje" avatara nahor/nadol. Auto-hide ak avatar úplne mimo viewport. Cleanup pri dismissi
   - **Výber viditeľného wrapu** — `isVis(el)` cez `offsetWidth/Height > 0`, v gyn móde preferuje `gyn-hdr-avatar-wrap`, v Golem `hdr-avatar-wrap`
   - Auto-dismiss po 6s alebo prvom tap-e kdekoľvek
   - Persistovaný v localStorage `hdr_avatar_tip_seen_<gp|gyn>_<username>` — **line-specific** kľúč aby tip vyskočil zvlášť v Golem a zvlášť v gyn pre rovnaký username (admin/manažér môže byť v oboch linkach)
   - Iba pre užívateľov ktorí ešte nemajú custom avatar (kontrola cez `.avatar-unset` class)

#### Implementácia
- **CSS** (~22 riadkov v `<style>`): `.hdr-avatar-edit` rozšírený, nové keyframes `hdrEditBounce` + `hdrAvatarHalo`, trieda `.hdr-avatar-tip` + `::before` šípka
- **JS** (~80 riadkov):
  - `hdrAvatarUpdateHint()` — pridá/odstráni `.avatar-unset` na obidva headery (gp + gyn)
  - `hdrAvatarShowTipIfNeeded()` — vytvorí tooltip, pozícia, dismiss logika, localStorage flag
  - `hdrAvatarDismissTip()` — zavrie tooltip ihneď (volá ho `avatarOpenCustomizer`)
- **Volania**:
  - `updateHdrAvatar()` → po Golem header rendere
  - `gynRenderShell()` → po gyn header rendere
  - `buildRepData()` → po prijatí dát zo Sheets
  - `avatar-changed` event → po zmene avatara
  - `loginSuccess` + `initLogin` + `gynEnter` → 4s delay pre tooltip

#### Štatistika
- **Verzia 2.20.9 → 2.20.10** (PATCH — UX vylepšenie)
- ~100 insertions v `index.html`
- 0 backend zmien (žiadny Apps Script redeploy)

---

### v2.20.9 — Post-fetch avatar re-fill (Plnenie zoznam reps na Androide)

**2.20.9** — **post-fetch avatar re-fill**: pri prihlásení admina sa Plnenie zoznam renderoval PRED tým ako `getInitData` doručil avatar config do `USERS_LOCAL`. Avatary sa preto nezobrazili v už vyrenderovaných paneloch (Plnenie zoznam reps, manažér zoznam) — fungovali iba v Rebríčku ktorý sa renderuje na klik (po prijatí dát). Fix: `avatarRefreshAllInDom()` helper sa zavolá na konci `buildRepData()` — iteruje všetky `[class*=avatar][data-username]` containery v DOM a refilluje ich aktuálnym configom.

### v2.20.9 — Post-fetch avatar re-fill (Plnenie zoznam reps na Androide)

#### Problém
- Admin sa prihlási na Android telefóne
- **Plnenie obrazovka** (default tab) → reprezentanti v zozname **nemajú avatary** (len farebné iniciály)
- **Rebríček** (po kliknutí) → avatary sú viditeľné ✅
- **Hlavička admin avatara** → viditeľný ✅
- Príčina: Plnenie sa renderuje synchronne v `mgrEnter()` PRED tým ako `loadInitData()` doručí `repList` s `avatar` poliami do `USERS_LOCAL`. Rebríček sa renderuje až na klik — vtedy už USERS_LOCAL obsahuje avatar config

#### Oprava
- **Nová funkcia `avatarRefreshAllInDom()`** — iteruje všetky avatar containery (`.lb-p-avatar`, `.lb-avatar`, `.mgr-avatar`, `.mgr-davatar`, `.dhdr-avatar`, `.pl-ps-avatar`, `.pl-rep-avatar`, `.gyn-rep-avatar`, `.hdr-avatar`) s `data-username` v DOM a refilluje ich cez `avatarFillElement` aktuálnym configom z `LB_REP_INFO` / `USERS_LOCAL`
- **Volaná na konci `buildRepData()`** — keď prídu dáta zo Sheets (cez `getInitData` alebo fallback `getRepList`), avatary sa okamžite premietnu do už vyrenderovaných paneloch bez potreby re-renderovať celé view-y

#### Štatistika
- **Verzia 2.20.8 → 2.20.9** (PATCH — bug fix)
- ~30 insertions v `index.html`
- 0 backend zmien (žiadny Apps Script redeploy)

---

### v2.20.8 — Avatar fallback + auto-retry (Android flaky network fix)

**2.20.8** — **avatar fallback + auto-retry pri Android flaky network**: keď DiceBear `<img>` zlyhá (timeout, 503, transient CORS), globálny delegated error listener prepne na farebné iniciály a po 4 sekundách skúsi obrázok znova nahrať. Žiadne ďalšie zmeny call-sites — listener funguje pre VŠETKY `.avatar-img` (rebríček, plnenie, manažér, gyn, header). Rieši reportovaný issue na Androide: niekedy sa avatar v rebríčku nezobrazí napriek tomu, že v hlavičke je viditeľný.

### v2.20.8 — Avatar fallback + auto-retry (Android flaky network fix)

#### Problém
- Android Chrome má občas slabú/nestabilnú sieť (mobile data switching, prerušenia)
- DiceBear API request môže zlyhať (timeout, 503, transient CORS error)
- `<img class="avatar-img">` predtým nemal `onerror` handler → broken image silently → kruh ostal s farebným pozadím bez obsahu
- Symptóm: reprezentant vidí svoj avatar v hlavičke (cached/loaded skôr), ale v rebríčku má prázdny kruh — nezobrazia sa ani iniciály

#### Oprava
- **Nová funkcia `avatarImgErr(img)`** — keď zlyhá `<img class="avatar-img">`:
  1. Vyhľadá meno z `LB_REP_INFO` / `USERS_LOCAL` / `MGR_REP_NAMES` / `session` (cez `data-username` atribút)
  2. Vypočíta iniciály (`lbInitials` / `mgrInitials` fallback)
  3. Odstráni broken img, nastaví iniciály do parent elementu, odstráni `has-avatar` class
  4. Po 4 sekundách skúsi avatar znova vykresliť cez `avatarFillElement` — ak bol výpadok transient, používateľ dostane svoj avatar
  5. `data-err-once` guard zabráni nekonečnému loopu retry-error
- **Globálny delegated listener na document** (capture phase, lebo `error` event sa nebubluje z `<img>`)
- **Zero call-site changes** — funguje automaticky pre VŠETKY emitácie `<img class="avatar-img">` (rebríček podium + zoznam, manažér zoznam + detail, plnenie sheet + zoznam, gyn render funkcie, header avatar)

#### Štatistika
- **Verzia 2.20.7 → 2.20.8** (PATCH — bug fix)
- ~60 insertions v `index.html`
- 0 backend zmien (žiadny Apps Script redeploy)

---

### v2.20.4 — Gyn chart paralelný fetch okresov pre 6-mesačný trend

#### Problém
- Trend graf v gyn Trhový podiel zobrazuje 6 mesiacov (`summary.slice(-6)`)
- Náš produkt (Ryeqo) + Slovensko MS (zo `summary` v jednom fetchu) — full 6 mesiacov ✅
- Konkurenti (ZOLADEX, RESELIGO, VISANNE) z `okresy` — iba pre aktuálny Q ❌
- Vizuálne: konkurenčné čiary len Jan-Mar, prázdne Okt-Dec

#### Oprava
- **`gynPharmaLoad`** robí **paralelný fetch**: aktuálny Q + predošlý Q (`gynPharmaKvartalPrev`)
- Predošlý Q response uložený ako `resp.okresy_prev` + `resp.kvartal_prev`
- **`gynPharmaRender`** aggreguje konkurentov **z oboch quartalov** — mapuje m1/m2/m3 na správne yymm pre každý Q
- Top 3 konkurenti vyberané z **kombinovaného total MS** (aktuálny + predošlý Q)

#### Dôsledok
- Trend graf teraz zobrazuje konkurenčné čiary **cez celý 6-mesačný timeline**
- Vyžaduje že `PharmaData_Okresy` má dáta pre **oba kvartály** (aktuálny + predošlý)
- Pre Q1 2026 → fetchne Q1 + Q4 2025

---

### v2.20.3 — Bug fix: gyn chart nezobrazoval konkurentov s 1 dátovým bodom

### v2.20.3 — Bug fix: gyn chart nezobrazoval konkurentov s 1 dátovým bodom

#### Problém
- Trhový podiel chart pre Q1 2026 ukázal Ryeqo (náš produkt) ako spike pri Mar (36.19%)
- Konkurenti (ZOLADEX, RESELIGO, VISANNE) sú v legende s % hodnotami, ale **na grafe ich nebolo vidno**
- Príčina: konkurenčné dáta sú z `okresy` (Q1 2026), kde má hodnoty iba Mar (Jan/Feb empty)
- Priemer pre konkurenta cez okresy → 1 dátový bod
- SVG `<polyline>` potrebuje **2+ body** aby bola viditeľná → invisible single-point line

#### Oprava
- Konkurenti s 1 bodom renderovaní ako `<circle>` (r=5)
- Konkurenti s 2+ bodmi renderovaní ako `<polyline>` + `<circle>` na koncoch
- Vďaka tomu sú viditeľní vždy keď majú dáta (1 alebo viac mesiacov)

#### Poznámka — dátový stav
- Okresy len pre aktuálny Q (Q1 2026) → konkurenti max 3 body (Jan, Feb, Mar)
- Pre rozšírenie chartu o predchádzajúce Q (Oct-Dec 2025) by sa muselo dotahovať okresy aj z Q4 2025
- TODO budúca verzia: paralelný fetch okresy z `kvartal` aj `kvartal - 1` pre 6-mesačný timeline

---

### v2.20.2 — Bug fix: gyn linka nezobrazovala avatary

### v2.20.2 — Bug fix: gyn linka nezobrazovala avatary

#### Problém
- v2.20.1 opravil GP linku, ale gyn render funkcie boli stále staré
- 3 miesta v gyn použili `gynInitials(name)` priamo namiesto `avatarGetConfig`:
  - `gynProdSheetRenderRepList` (zoznam reps v Trhový podiel)
  - `gynRenderRepDetail` (detail reprezentanta — header)
  - `gynPlnenieRender` (Plnenie zoznam reprezentantov)
- Aj keď gyn rep si avatar uložil, ostatní (manažéri, reps) ho nevideli
- **Plus:** `gynLoadRepList` nepopulvalo `USERS_LOCAL` → `avatarGetConfig` nemal kde hľadať

#### Oprava
- **`gynLoadRepList`** rozšírené — pre každého rep parsuje pohlavie + avatar JSON a uloží do `USERS_LOCAL[login]`
- **Nový helper `gynAvatarContent(login, name)`** — vracia `{html, hasAvatar}`, použité na 3 render miestach
- **3 render miesta aktualizované** — pridaný `has-avatar` class + `data-username` atribút pre re-render pri `avatar-changed` event-e

#### Nasadenie
- **NEPOTREBUJE redeploy Apps Script** — gyn `kód_gyn.gs` neobsahuje `getInitData`, `getRepList` už vracal pohlavie + avatar správne
- Iba frontend zmena → GitHub Pages publikuje automaticky

---

### v2.20.1 — Bug fix: getInitData repList chýbal pohlavie + avatar

### v2.20.1 — Bug fix: getInitData repList chýbal pohlavie + avatar

#### Problém
- v2.20.0 pridal `pohlavie` + `avatar` do `getRepList` endpointu
- Login flow ale používa `getInitData` (kombinuje history + repList + milestoneStats do 1 fetch-u pre rýchlejší load)
- `getInitData` repList čítal **iba** login/meno/rola/region — bez pohlavia a avatara
- **Symptom:** Admin/manažér/iný rep sa prihlási → nevidí avatary kolegov ktoré sa uložili po nejakom čase

#### Oprava
- `kód.gs` `getInitData` repList rozšírený o header-based detekciu `pohlavie` + `avatar`
- Identický pattern ako `getRepList` (case-insensitive lookup hlavičiek)
- Po redeploy → admin pri prihlásení dostane všetky avatary kolegov

#### Nasadenie
- **VYŽADUJE redeploy `kód.gs` v Apps Script** (Golem) — nová verzia
- Gyn nemá `getInitData`, žiadna zmena tam nepotrebná

---

### v2.20.0 — Vlastný avatar (DiceBear Adventurer) + Muž/Žena (zo Sheets) + sekvenčný WN modal

Reprezentanti si môžu cez header avatar otvoriť customizer s 4 tabmi (Vlasy, Tvár, Pleť, Doplnky), prepnúť pohlavie ktoré automaticky filtruje vlasy + skrýva mustache pre ženy. Avatar je sync-ovaný cez Google Sheets (`Pouzivatelia.avatar` JSON). Pohlavie sa číta zo Sheets stĺpca `pohlavie`. **WN modal** prerobený na **frontu nevidiet** — ak rep zameškal viacero verzií, postupne si ich preklikne od najstaršej.

#### Sheets — nové stĺpce v `Pouzivatelia`
- **Golem** (G+H): `pohlavie` (`M`/`Z`/`m`/`z`/`muz`/`muž`/`zena`/`žena`/`male`/`female`/`F`) + `avatar` (JSON string, prázdny pri inicializácii)
- **Gyn** (H+I): rovnaké
- Header-based detekcia (case-insensitive) — záleží na **názve hlavičky**, nie na pozícii stĺpca

#### Apps Script (`kód.gs` + `kód_gyn.gs`)
- **`login` endpoint** rozšírený: vracia aj `pohlavie` + `avatar` z riadku prihláseného usera
- **`getRepList`** vracia `pohlavie` + `avatar` polia pre každého repa
- **Nový endpoint `setAvatar`**: parametre `username` + `config` (JSON) + `token`. Validuje JSON (max 2000 znakov), nájde riadok podľa loginu, zapíše do `avatar` stĺpca. Vráti `{ok:true}` alebo `{ok:false, error}`.

#### Avatar customizer (UI)
- **DiceBear Adventurer** štýl (cartoon-y, prijateľné pre prof. kontext)
- **Header avatar** klikateľný (38px kruh s ceruzkou) — otvorí customizer modal
- **4 taby:** Vlasy / Tvár / Pleť / Doplnky
- **🎲 Náhodne** tlačidlo — re-roll všetkých parametrov, **zachová aktuálne pohlavie**
- **🗑 Odstrániť avatar** — custom confirm modal v štýle appky (nie browser default), červený CTA + ghost Zrušiť
- **Pozadie vždy biele** (`backgroundColor=ffffff` force-injected v `avatarUrl()`)

#### Pohlavie picker (`👩 Žena | 👨 Muž`)
- Segmented control nad preview (modrý active stav)
- Default pri prvom otvorení: zo Sheets `pohlavie` → fallback zo session → fallback random
- **Prepnutie Žena ↔ Muž:** auto-fix vlasov (`long*` ↔ `short*`), auto-vypnutie mustache pri Muž → Žena
- **Mustache skrytá pre Ženu** v Doplnky tabe (`genderExclude: { female: ['mustache'] }`)
- **Random tlačidlo zachováva pohlavie** — fix bug-u (predtým 50/50 random gender pri každom roll-i)

#### Customizer parametre (Adventurer)
- **Vlasy:** 45 štýlov (26 `long*` + 19 `short*`) + **33 hex farieb** vrátane ryšavej škály (`b85820`, `c25e25`, `cb6820`, `d97e3f`, `e8a05c`)
- **Tvár:** 26 očí + 15 obočí + 30 úst
- **Pleť:** 4 hex odtiene
- **Doplnky:** Okuliare (5) + Náušnice (6) + Detaily (birthmark/blush/freckles/mustache)

#### Render avatara na 9 miestach
1. Header (klikateľný)
2-3. Rebríček podium + zoznam
4-5. Manažér zoznam + detail
6-7. Plnenie zoznam + detail
8. Plnenie sheet (Trhový podiel) — zoznam reprezentantov
9. Gyn equivalents

**Fallback iniciály**: ak rep nemá nastavený avatar, zobrazí sa pôvodný farebný kruh.

#### Storage flow
- **`USERS_LOCAL[u].avatar` + `LB_REP_INFO[u].avatar`** — in-memory kopia zo Sheets (cez `buildRepData`)
- **`session.avatar`** — pre prihláseného usera z login response
- **`localStorage['avatar_cfg_<username>']`** — offline cache
- **`avatarGetConfig`** priorita: USERS_LOCAL → LB_REP_INFO → session → localStorage
- **`avatarSetConfig`** — sync in-memory + localStorage + async POST na backend (golem/gyn podľa `session.line`)

#### Session enrichment
- `loginSuccess(username, name, role, region, extra)` — pridaný `extra` parameter pre pohlavie + avatar
- Normalizácia: `M/m/muz/muž/male` → `male`, `Z/z/F/f/zena/žena/female` → `female`
- Avatar JSON string z login response sa parsuje a validuje (style musí existovať v `AVATAR_SCHEMAS`)

#### WN modal — nový sekvenčný systém
- **`WN_HISTORY`** array — chronologický zoznam všetkých verzií
- Pri otvorení appky sa zobrazí PRVÝ nevidet → klik "Ďalej →" → označí ako videný + re-render s ďalším
- **Posledný** v sekvencii má tlačidlo "Rozumiem, ďakujem! ✓"
- **Progress indikátor "1 z N"** len keď je v queue 2+ items
- **Fade transition** medzi modalmi
- **Bug fix:** `wnClose()` guard — nesmie označovať seen ak modal nie je otvorený (predtým `satoriShow()` volal preventívne)

#### Custom confirm modal pre Odstrániť avatar
- Nahradzuje native `confirm()` — modal v štýle appky
- Z-index 6000 (nad customizerom 5000)
- Backdrop blur + 🗑 ikona v červenom gradient kruhu + ghost/červený CTA

#### Service Worker (`sw.js`)
- Cache version bump: `potencial-vl-v5` → `potencial-vl-v6-avatars`
- **DiceBear cache-first** — explicit handler pre `api.dicebear.com` (SVG immutable per parameter set)

#### Štatistika
- **Verzia 2.19.5 → 2.20.0** (MINOR — nová feature)
- **~1200 insertions / ~150 deletions** v `index.html`
- **~80 insertions** v oboch Apps Scriptoch
- 0 JS errors v Playwright smoke testoch
- Apps Script redeploy required (oba: Golem + Gyn) — **HOTOVO**

---

### v2.19.5 — Plný DOM carousel peek (stabilný) + future Q block + tab animation pri swipe

#### Fix #1 — Plný DOM peek bez state corruption
**Problém v v2.19.3:** state-swap snapshot count rozbil `PL_STATE.q`, hneď po prihlásení skok na Q3.
**Príčina:** `plnenieEnsureCachedQDom` prerenderoval Q+1 do hlavného DOM-u, ale po `cloneNode` sa state restore + DOM re-render len niekedy stihol pred ďalším touch event-om.

**Oprava:**
- **`try/finally` guard** v `plnenieEnsureCachedQDom` a `repPlnenieEnsureCachedQDom` — state restore + DOM re-render **VŽDY** sa zavolá, aj pri exception
- **Pre-cache na pozadí** v `plnenieRenderAll` po prvotnom render-e (timer-y 700ms a 1300ms aby UI nelagovalo):
  - 700ms: cache `PL_STATE.q - 1` (predošlý Q)
  - 1300ms: cache `PL_STATE.q + 1` (nasledujúci Q ak ≤ current)
- **Safety net v `onDragStart`** — ak race podmienka spôsobí že cache ešte nie je naplnená, urobí sa synchronne v tom moment
- Suppress count-up animation počas snapshotu (override `plnenieCountUp` + `plnenieCountUpEUR` cez window. + restore cez `finally`)

#### Fix #2 — Future Q3/Q4 zablokované
**Cieľ:** v máji 2026 je Q2 aktuálny — Q3/Q4 nemajú plán a nie sú ukončené. Užívateľ by sa nemal dostať na ne.

**Implementácia:**
- **`plnenieUpdateQTabs` + `repPlnenieUpdateQTabs`** — future Q taby (`q > plnenieCurrentQ()`) dostanú `disabled = true` + `opacity:.4` + `cursor:not-allowed`
- **`plnenieSwitchQ` + `repPlnenieSwitchQ`** — guard `if (q > plnenieCurrentQ()) return;` (klik aj programatický switch)
- **`canNext` v drag switcheri**: `PL_STATE.q < plnenieCurrentQ()` namiesto `PL_STATE.q < 4` — rubber band efekt na Q2 → Q3 swipe (nedá sa)

#### Fix #3 — Q taby reagujú animáciou pri swipe
**Cieľ:** keď ťahám medzi Q1 a Q2, taby hore by sa mali predznamenenie meniť (vidno kam ide).

**Implementácia:**
- Nová **`onMove(dx, w)` callback** v `attachDragSwitcher` — fire-uje pri každom touchmove počas drag-u
- V `plnenieInitQSwipe.onMove` — ak `Math.abs(dx/w) > 0.20`, predznamená sa `active` class na cieľový Q tab (Q-1 ak dx > 0, Q+1 ak dx < 0). Boundary check: nie pod Q1 alebo nad current Q.
- V `onDragEnd` → `plnenieUpdateQTabs()` re-aplikuje correct state (po snap-back)
- Pri snap-forward → `plnenieSwitchQ()` urobí real switch + tabs sa updatujú

#### Carousel flow (finálne)
```
1. Otvor Plnenie → render Q2
2. 200ms → cache_DOM[2] = clone(pl-q-content)
3. 700ms → state swap Q1 → render → clone → cache_DOM[1] → state restore Q2 → render
4. 1300ms → state swap Q3 (ak ≤ current) → ... (v máji preskočené)

5. User drag Q2 → vpravo:
   - onDragStart: peekPrev.appendChild(cache_DOM[1].clone) — vidí plný Q1
   - onMove dx = +60px (15%): tabs ostanú Q2 active
   - onMove dx = +120px (30%): tabs predznamenia na Q1 active
   - Release pri 30%: snap-forward animácia + plnenieSwitchQ(1)
6. User drag Q2 → vľavo (na Q3):
   - canNext: PL_STATE.q < plnenieCurrentQ() = false → rubber band 0.3× stiffness
   - peekNext zostane prázdny (nextQ > maxQ)
```

#### Štatistika
- **Verzia 2.19.4 → 2.19.5** (PATCH — bug fix + UX improvement)
- **363 insertions / 4 deletions** v `index.html`
- 0 JavaScript errors v Playwright smoke teste
- WN modal nezmenený (gestá ohlásené v WN_v2_19)

#### Lessons learned applied
Predchádzajúce zlyhanie state-swap snapshotu (v2.19.3) bolo opravené **3 systematickými zmenami**:
1. **`try/finally`** garantuje state restore aj pri exception
2. **Pre-cache na pozadí** s timer-mi — žiadne synchronous render-y počas drag-u (okrem safety net)
3. **`onDragStart` fire iba pri direction lock na 'h'** (z v2.19.4) — žiadny snapshot pri tap-e

Toto kombinácia robí carousel stabilný aj pre real-world DOM s globálnymi ID-čkami a render side-effectmi.

---

### v2.19.4 — Rollback carousel peeks (state corruption fix)

#### Problém v v2.19.3
- `snapshotPlnenieDom` robil **state swap** + render → clone → restore. Po snapshotovaní DOM-u bol DOM-content **na targetQ**, ale `PL_STATE.q` bol restore-ovaný na origQ.
- Render funkcie majú vedľajšie efekty (`plnenieRenderRegions` atd. modifikujú DOM elementy, ID-čka, počítadlá animácií). Po restore neprerenderovalo ihneď DOM na origQ → mismatch
- `onDragStart` callback fire-oval pri každom touchstart-e (dokonca pred direction lock) → snapshot bežal aj pri obyčajnom tap-e
- Príznak: hneď po prihlásení sa Plnenie zobrazilo na Q3 namiesto current Q (Q2)

#### Oprava — rollback na simple drag (v2.19.0/v2.19.1 pattern)
- Odstránené `snapshotPlnenieDom` + `snapshotRepPlnenieDom` (úplne)
- Odstránené `onDragStart`/`onDragEnd` callbacky v Plnenie + Rep Plnenie + Trhový podiel sheet attachDragSwitcher volaniach
- `buildCarouselPeeks` helper ostáva (môže sa hodiť pre iné komponenty), ale nie je volaný
- Plain drag swipe ostáva: content sa pohybuje s prstom (rubber band na boundaries), pri release nad threshold-om snap-forward + switch, inak snap-back
- 35 insertions / 181 deletions — celá snapshot logika odstránená

#### Štatistika
- **Verzia 2.19.3 → 2.19.4** (PATCH — bug fix)
- 35 insertions / 181 deletions v `index.html`
- WN modal nezmenený
- Carousel peek panels mŕtvy CSS ostáva (nemá negative dopad), ale nie je použitý nikde

#### Lessons learned
Full DOM snapshot cez state-swap je **veľmi krehký** v JS appkách bez framework state management (React/Vue). Render funkcie majú implicit dependencies na global state ktoré nie sú vždy zjavné. Pre future implementácie peek/preview features bez frameworku → lepšie použiť **lightweight peek karty** (čistý template) než pokusy o full DOM clone.

---

### v2.19.3 — Full DOM snapshot peek-y (plný náhľad ďalšieho Q)

#### Nové helpery `snapshotPlnenieDom` a `snapshotRepPlnenieDom`
Pri `onDragStart` callbacku:
1. **Save** current `PL_STATE.q`, `data`, `aggregates`
2. **Suppress count-up animations** počas snapshotu (override `plnenieCountUp` aby okamžite zapísal final hodnotu, nie animoval)
3. **Switch state** na targetQ (Q-1 alebo Q+1)
4. **Render** cez `plnenieRenderSummary()` + `plnenieRenderRegions()` + `plnenieRenderRepList()` — DOM v `pl-q-content` sa naplní obsahom targetQ
5. **`cloneNode(true)`** výsledný DOM
6. **Strip ID-čka** (`removeAttribute('id')` na všetkých descendants) — aby nedošlo k duplikátom v dokumente (`getElementById` would return wrong element)
7. **Restore** original state + render → DOM v `pl-q-content` je opäť na current Q
8. Vráti clone

#### Plnenie sumár carousel flow
- Pri prvom render-e Plnenie modulu sa spustí `plnenieInitQSwipe()` ktorý wrap-uje `pl-q-content` do `carousel-wrap` s 2 peek panel-mi (`peekPrev` vľavo, `peekNext` vpravo)
- Pri **drag start** sa snapshot Q-1 a Q+1 do peek panel-ov (10 KB+ DOM cez `cloneNode(true)`)
- Drag move posúva celý `wrap` cez `transform: translate3d` — **content + peeks sa pohybujú spolu**
- Pri release nad threshold-om → snap-forward (full width translate) → callback `plnenieSwitchQ(newQ)` → real switch + render
- Pri release pod threshold-om → snap-back, peeks fade-out, clone-y odstránené z DOM-u

#### Rep Plnenie snapshot
Identický pattern, ale snapshot funkcia volá `repPlnenieRender()` a swap-uje `REP_PL_STATE` namiesto `PL_STATE`.

#### Bezpečnostné mechanizmy
- **`canPrev`/`canNext`** kontrolujú `qCache[targetQ]` — peek nie je zobrazený ak dáta v cache nie sú (nezavolá sa snapshot)
- **State restore** je v `try/finally` semantike — aj pri chybe v render funkcii sa state vráti
- **Count-up suppression** — ďalšie volanie render-u neaktivuje animácie ktoré by inde pokazili counter
- **ID strip** — `removeAttribute('id')` na všetky elementy v clone subtree, vrátane root-u

#### Performance
- Snapshot trvá ~30–80ms na render (1× pre Q-1 + 1× pre Q+1) + ~10ms cloneNode
- Spustí sa **iba pri drag start** (raz na drag, nie na move)
- Po `onDragEnd` sa clone-y vyhadzujú z DOM-u (200ms delay aby fade-out animácia skončila)

#### Štatistika
- **Verzia 2.19.2 → 2.19.3** (PATCH — refinement gesture animácie)
- **123 insertions / 69 deletions** v `index.html`
- 0 JavaScript errors v Playwright smoke teste; snapshot vracia 10141-byte DOM string + state správne restored
- WN modal nezmenený

#### Predtým vs teraz
**v2.19.2:** peek bola **malá kartička** s % číslom a EUR sumár — minimálny náhľad.

**v2.19.3:** peek je **kompletný náhľad obrazovky Q-u** — sumár Slovensko/West/East, predikcia, všetky 8 produktov s % a EUR, zoznam všetkých reprezentantov s ich plneniami. Plne identický s tým čo uvidíš po skutočnom switch-i. Pri ťahaní prstom **plynule vidíš ako sa Q1 obrazovka približuje sprava** — nie placeholder, ale skutočný dataset.

---

### v2.19.2 — Carousel peek panels (vidno ďalší Q ako sa približuje)

#### Nový helper `buildCarouselPeeks(el)`
- Wraps target element do `carousel-wrap` + pridáva 2 sibling **peek panely** (peekPrev vľavo, peekNext vpravo)
- Peeks majú `position:absolute` + `right:100%` (prev) alebo `left:100%` (next) — **nalepené** na strany current content-u
- Pri `transform` na `wrap` sa pohybujú spolu s content-om (ako carousel)
- Parent `pl-q-content`-u dostane `overflow-x:hidden` aby peeks nepretiekli mimo Plnenia
- Idempotent — pri opätovnom volaní vracia existujúce ctx

#### `attachDragSwitcher` rozšírenie
- Nová option `transformTarget` — element ktorý dostane `transform` (default: el)
- Pri carousel mode sa transformuje `wrap`, nie `el` → peeks sa pohybujú spolu
- Nové options `onDragStart` + `onDragEnd` callbacky (pre pre-fill + hide peek content)
- Snap-forward animácia teraz ide na **full width** (`-w`/`+w` namiesto `0.6w`) — peek karta plynule "nahradí" current viewport
- Easing zmenený z `.26s` na `.28s` cubic-bezier(.22, .9, .34, 1)

#### Plnenie sumár (manažér view) — peek content
Peek panel obsahuje:
- **Label**: napr. "Slovensko · Q1 2026"
- **% plnenia** v Outfit 34px, farebne (zelená ≥100%, oranžová 95-99%, červená <95%, sivá keď žiadne dáta)
- **EUR sumár**: "12 345 € / 50 000 €" (predaje / plán)
- Render z `PL_STATE.qCache[Q]` — okamžite k dispozícii lebo dáta sa preloadujú pri vstupe do Plnenia

Ak Q-1 alebo Q+1 dáta v cache nie sú: zobrazí "‹ Q1 2026 ›" + "posuň ďalej" placeholder.

#### Rep Plnenie overlay — peek content
Rovnaký pattern ale pre **vlastné dáta reprezentanta**:
- Label: "Môj plán · Q3 2026"
- % plnenia + EUR sumár jeho personal performance v danom Q

Render z `REP_PL_STATE.qCache[Q].aggregates.reps` filter cez `session.username`.

#### Trhový podiel sheet — subtab peeks
Peek pre Tablety/Sáčky/Krém:
- Label vyrendrený z `PHARMA_SUBTAB_LABELS` mapy
- Static placeholder ("posuň pre prepnutie") — subtab dáta sa renderujú až po reálnom switch-i

#### CSS pre peek panely (`.carousel-peek*`)
- `.carousel-peek` — opacity:0 default, `.show` → opacity:1 (15ms fade in pri drag start)
- `.carousel-peek-card` — biela karta s modrým borderom + soft shadow (rovnaký dizajn ako Plnenie summary)
- `.carousel-peek-lbl` — modrý uppercase 11px label so šípkou na boku
- `.carousel-peek-pct` — 34px Outfit weight 800 % číslo s farbou podľa stavu (`pl-g/o/r/none`)
- `.carousel-peek-eur` — 11px sivý sumár predajov / plánu

#### Štatistika
- **Verzia 2.19.1 → 2.19.2** (PATCH — refinement gesture animácie)
- **195 insertions / 25 deletions** v `index.html`
- 0 JavaScript errors v Playwright smoke teste
- WN modal nezmenený (gestá ohlásené v WN_v2_19, peek je vizuálne vylepšenie)

#### Predtým vs teraz
**v2.19.1:** content sa pohybuje s prstom, ale **vidíš len jeden frame**. Pri ťahaní vyzerá akoby content miznul na prázdnom pozadí. Po snap-forward sa stratil + nový sa zjavil cez slide-in (gap).

**v2.19.2:** **vidíš ďalší Q** ako sa približuje z opačnej strany — peek karta zobrazuje Q-label, % plnenia, EUR. Pôsobí ako natívny **iOS Photos / Android Gallery** carousel kde **vidno čo prichádza ešte počas pohybu**.

#### Performance
- Peeks sú render-ované len pri `onDragStart` callbacku (nie permanentne v DOM-e počas idle)
- Po `onDragEnd` sa cez `.show` class fade-out + obsah ostane (re-use pri ďalšom dragu)
- `position:absolute` siblings — žiadny reflow main content-u
- Transform na wrapper-i, GPU compositor sa stará o všetky 3 layery

---

### v2.19.1 — Drag-driven swipe animácia (gesture follows finger)

#### Nový helper `attachDragSwitcher(el, options)`
- **`canPrev`/`canNext`** callbacky určujú boundaries (rubber-band 0.3× stiffness keď nie je možný switch)
- **Direction lock** — po 8px horizontálneho pohybu lock na `'h'` axis. Vertikálny pohyb >8px lock na `'v'` (dragging cancel, native scroll funguje)
- **Threshold 25% šírky** elementu pre trigger switch
- **`translate3d(x, 0, 0)`** pre GPU-accelerated render
- **`will-change: transform`** počas dragu, vyčistené po ukončení
- **Snap behavior:**
  - Pred threshold → snap back (`transform = ''` s `.26s cubic-bezier(.22,.9,.34,1)` easing)
  - Za threshold → animuj von do 60% šírky, potom callback `onPrev/onNext` (ktorý spraví switch + následný `_animPlQ` slide-in nového obsahu)
- Touchcancel cleanup, žiadne memory leaky

#### Aplikované na 3 miesta
1. **`pl-q-content`** (manažér Plnenie sumár)
2. **`rep-pl-q-content`** (rep Plnenie overlay)
3. **`pl-ps-body`** (Trhový podiel sheet — subtaby Tablety/Sáčky/Krém)

#### Predtým vs teraz
**Predtým (v2.19.0):**
- Swipe = "skok" — prst sa pohne, content statický, po release → switch + slide-in
- Pôsobí ako "klik s gestom"

**Teraz (v2.19.1):**
- Drag = content **fyzicky sleduje prst** — môžeš ho ťahať pomaly, vidieť kam sa pohne
- Rubber band ti ukáže že na boundary nemôžeš ďalej (Q4 doľava nepôjde)
- Snap back ak nedotiahneš → "vrátenie" späť s easing
- Snap forward ak prejdeš threshold → "doletí" do strany + switch
- Pôsobí ako natívny iOS Photos / Android Gallery swipe

#### Štatistika
- **Verzia 2.19.0 → 2.19.1** (PATCH — refinement existujúcich gest)
- **120 insertions / 40 deletions** v `index.html`
- 0 JavaScript errors v Playwright smoke teste
- WN modal nezmenený — gestá sú už ohlásené v WN_v2_19

#### Performance
- Touch event-y `passive: true` — žiadne preventDefault, browser scroll fungujú
- `translate3d(x, 0, 0)` namiesto `translateX(x)` — promote layer na compositor (GPU)
- `will-change: transform` len počas dragu (nie permanentne)
- Žiadny layout recompute, žiadny paint per touchmove — len composite step

---

### v2.19.0 — Mobilné gestá: swipe + long-press + haptic feedback

#### Globálne gesture helpery
Pridané 3 reusable utility funkcie:

- **`attachSwipe(el, opts)`** — generic swipe detector
  - Options: `onSwipeLeft/Right/Up/Down`, `threshold` (default 50px), `maxOffAxis` (60px), `edgeOnly` (start <24px od ľavej hrany), `onlyHorizontal`/`onlyVertical`
  - Vracia `detach()` cleanup function
  - Rozlišuje skutočný swipe vs. accidental scroll (timing < 800ms, threshold + maxOffAxis filter)
  - Auto-haptic `selection` po každom úspešnom swipe
- **`attachEdgeSwipeBack(el, closeFn)`** — wrapper pre iOS-like back gesture (od ľavej hrany doprava)
- **`attachLongPress(el, callback, ms)`** — long-press detector (default 500ms, cancel pri pohybe >10px), auto-haptic `light` keď trigger

Reuse existujúcej `haptic()` funkcie (definovaná pri rep utilities) — žiadna duplicitná logika.

#### #1 Swipe medzi Q tabmi v Plnení
- **Manažér view** (`pl-q-content`): swipe doľava → next Q, doprava → prev Q (Q1↔Q4, no wrap)
- **Rep view** (`rep-pl-q-content`): rovnaká logika
- Detail reprezentanta v manažér mode má vlastný flow — swipe v sumáre nezasahuje keď je detail otvorený
- Funkcie `plnenieInitQSwipe()` + `repPlnenieInitQSwipe()` s `_*SwipeAttached` flag aby sa attach nestal viackrát

#### #2 Swipe medzi subtab-mi v Trhový podiel sheet
- `pl-ps-body` (telo sheet-u) → swipe doľava/doprava medzi Tablety / Sáčky / Krém
- Funguje pre Aflamil family (3 subtaby) aj pre `aflamil_tablety_sacky` (2 subtaby)
- Pre produkty s 1 pharma kódom (Suprax, Vidonorm, etc.) — swipe je no-op (žiadne ďalšie subtaby)

#### #3 Swipe-back z ľavej hrany v plnoobrazovkových overlayoch
- **iOS pattern**: prst od ľavej hrany (do 24px) doprava → zatvorí overlay
- Aplikované na: `hist-overlay`, `lb-overlay`, `rep-plnenie-overlay`, `pharma-ms-overlay`, `pharma-okres-overlay`, `detail-overlay`, `edit-overlay`
- Setup v `initEdgeSwipeBack()` — volaný raz pri DOMContentLoaded

#### #4 Swipe-down na zatvorenie modal-ov
- Bonus — pre tých čo preferujú "shoo away" pattern: vertikálny swipe nadol (threshold 80px)
- Aplikované na: `wn-overlay`, `milestone-overlay`, `detail-overlay`
- `prodSheetInitSwipe()` (existujúca) má vlastný swipe-down flow s percentage-based opacity

#### #5 Swipe-left v Histórii — quick action hint
- Swipe-left na riadku v Histórii: subtle vizuálny hint (translateX -12px na 200ms a späť)
- Pre admin-a otvorí detail záznamu po 300ms (kde je tlačidlo Upraviť/Zmazať)
- Pre bežných reps len visual feedback (žiadne dáta nemažú)

#### #6 Haptic feedback na key actions
Použitá existujúca `haptic(type)` funkcia (4 patterny: success / error / selection / light):
- **`haptic('selection')`** — swipe transitions, Q switches, subtab switches, prod sheet open
- **`haptic('success')`** — submit záznamu (existujúce)
- **`haptic('error')`** — duplikát, validácia (existujúce)
- **`haptic('light')`** — long-press, button press (existujúce + rozšírené)
- iOS Safari **nepodporuje** Vibration API → no-op (silent fail)
- Rešpektuje `prefers-reduced-motion` v swipe detektore

#### #7 Long-press v Histórii — context menu
- 500ms long-press na zázname → otvorí detail záznamu
- Admin v detail-e vidí tlačidlo "Upraviť záznam" (existujúce)
- Cancel-luje sa pri pohybe (>10px) alebo zdvihnutí prsta predtým ako uplynie 500ms
- Auto-haptic `light` na trigger

#### Štatistika
- **Verzia 2.18.5 → 2.19.0** (MINOR — nové user-facing features)
- **252 insertions / ~30 deletions** v `index.html`
- **CSS balanced**, JS hoisting funguje správne (helper fn definované hore, volané neskôr)
- 0 JavaScript errors v Playwright smoke teste
- WN modal nový kľúč `WN_KEY = 'potencial_vl_wn_v2_19'` — všetci uvideli novú "Posúvaj prstom" oznámku (4 položky pre rep, 5 pre mgr) s instrukciami čo nové gestá robia

#### Cieľ
Reprezentanti aj manažéri (na mobilných zariadeniach hlavne) získali **natívny mobile feel** — appka reaguje na intuitívne gesturá ktoré používajú v iOS Mail, Photos, Messages, Android Chrome. Šetrí "tap targety" na malé ← Späť tlačidlá, prepínanie Q je rýchlejšie, modal-y sa zatvárajú prirodzene. **Funguje ako natívna appka, nie web stránka.**

---

### v2.18.5 — design-critique audit polish + Trhový podiel sheet bug fixes

#### Design-critique skill audit — top 7 vylepšení
Skill `design:design-critique` identifikoval 7 oblastí. Implementované 5 (4 a 5 vynechané — onboarding tour už existuje, empty state CTAs preskočené per pokyn).

#### #1 Hlavná obrazovka — typografická hierarchia rep formulára
- `.info-accent` (top stripe) výška 4 → 5px (silnejší accent)
- `.info-title` font-size 14 → **16px**, weight 600 → **800**, color `#1A2A3A` → `#0C1E35`, font-family `var(--font-display)` (Outfit), `letter-spacing:-.01em` — premium hero feel pre "Identifikácia návštevy"

#### #2 Detail záznamu lekára — 4-produktový mini-scoreboard
Nový blok (`.detail-prod-score`) v hero `detail-result` pod ABC chip + kapitácia. 4 mini kartičky:
- Aflamil (modrá bodka), Suprax (fialová), Vidonorm (zelená), Cavinton (žltá)
- Každá: uppercase label 9px + farebná bodka + **18px Outfit weight 800 number** (tabular-nums)
- Hodnota 0 alebo `—` má `opacity:.45` (dim — nezadávané)
- Renderuje sa iba ak rep zadal aspoň jednu hodnotu (`hasScore`)
- Reprezentant uvidí okamžite čo zaznamenal pri otvorení starého záznamu — bez scroll-u

#### #3 Loading skeletons konzistencia — pharma overlay
- Nový helper `skelPharma()`: tmavá total card skeleton (s blank gradient bars vnútri) + 2 district card skeletons s 4 row placeholders každá
- Nahradený text `'<div class="pharma-ms-loading">Načítavam dáta…</div>'` cez `replace_all` na 4 miestach v kóde za `skelPharma()` call
- Pridané CSS `.pharma-ms-loading .skel-pharma-card`, `.skel-pharma-row`

#### #6 Manažérska typografia konzistencia
- `.mgr-stat-num` 20 → **22px**, weight 700 → **800**, color `#1A2A3A` → `#0C1E35`, `letter-spacing:-.01em`
- `.mgr-dstat-num` 18 → 20px, weight 800
- `.mgr-name` 14 → 14.5px, color `#0F172A`, `letter-spacing:-.005em`
- `.mgr-dname` weight 700 → 800, `letter-spacing:-.01em`
- `.mgr-plnenie-detail .dhdr-name` 15 → 16px, weight 800, `letter-spacing:-.01em`
- Konzistentný "executive dashboard" feel naprieč všetkými admin/AM views

#### #4 Onboarding tour — už existuje (skip)
Tutorial overlay (`tutorial-overlay` + `initTutorial()`) je v kóde od v2.5.x. 4 kroky pri prvom logine. Bod auditu nepotreboval implementáciu.

#### #5 Empty state actionable CTAs — preskočené
Per pokyn — empty states ostávajú s informatívnym popisom bez akčného tlačidla.

#### #7 Last-updated indikátor — pridaný a odstránený
Pôvodne pridaný subtle text "aktualizované pred X min" v `pl-sum-lbl`, neskôr odstránený per pokyn (príliš veľa info v hlavičke). Helper `plnenieAgoFromTs` aj `PL_STATE.lastFetchAt` removed úplne.

#### Bug fix: WN modal scroll keď je položiek viac
- `.wn-box` dostal `max-height:calc(100vh - 40px)` + `display:flex; flex-direction:column`
- `.wn-hdr` má `flex-shrink:0` (header zostane statický)
- `.wn-body` má `flex:1 1 auto; min-height:0; overflow-y:auto; overscroll-behavior:contain`
- Pri 5+ položkách sa scroluje vo vnútri body, tlačidlo "Pokračovať" je vždy dosiahnuteľné

#### Bug fix: Trhový podiel sheet — fallback na predchádzajúci Q
**Problém:** Sheet pre konkrétny produkt zobrazoval "Terit. MS: —" pri reprezentantoch, lebo pre Q2 ešte nie sú IQVIA dáta. Pharma overlay má fallback na Q-1, sheet nie.

**Oprava** v 3 miestach:
1. `prodSheetRenderRepList` → `getTeritMs` skúša `[kvartal, pharmaKvartalPrev(kvartal)]` (loop)
2. `prodSheetUpdateMsCells` → rovnaký fallback v `getTeritMs`
3. `loadPharmaData` → ok:false aj !hasData branchy spúšťajú rekurzívny re-fetch na prev Q **aj keď je otvorený product sheet** (predtým len pharma overlay)

#### Bug fix: getTeritMs prijíma aj 0% hodnoty
**Problém:** Ak má rep skutočne 0% market share v danej oblasti, filter `v > 0` vyhodil aj 0 → vrátil null → "—". Reprezentant nevedel rozlíšiť "0% MS" vs "žiadne dáta".

**Oprava:** Filter `v > 0` → `v >= 0` (akceptuje validnú nulu). 0,00% sa zobrazí ako informácia, "—" len ak naozaj neexistujú dáta.

#### Bug fix: Trhový podiel sheet — proaktívny fetch + polling + loading state
1. **Proaktívny fetch oboch Q** v `openProdSheet`: pri otvorení paralelne fetchne **Q + Q-1** pre všetky needed pharma codes × oblasti. Predtým sa Q-1 fetchol len rekurzívne až po zlyhaní Q.
2. **Polling** kým sheet otvorený: `setInterval(prodSheetUpdateMsCells, 800)` — každé fetchy ktoré dobehnú sa okamžite premietnu do DOM. Auto-stop po 16s alebo pri zatvorení sheetu (`PL_PROD_SHEET_STATE.msPollTimer` cleared v `closeProdSheet`).
3. **Loading state s wave dots animáciou** namiesto plain "—": kým fetch beží alebo nikdy neprebehol, MS bunka zobrazí 3 modré wave bodky (`.ms-dots`). Až po dokončení fetchov bez dát sa zobrazí statické "—".

#### Wave dots animácia (`.ms-dots`)
- 3 × 4×4px bodky s `border-radius:50%`
- `msDotWave` keyframe 1.2s ease-in-out infinite — opacity `.30 → 1`, scale `.85 → 1.0`, `translateY(0 → -3px)`, color `#94A3B8 → #2563EB`
- Stagger `0.15s` medzi bodkami — wave efekt zľava doprava
- Reduced-motion rešpektované

#### Štatistika
- **193 insertions / 57 deletions** v `index.html`
- **CSS braces balanced**
- Žiadna zmena Apps Scriptu
- WN modal nezmenený (subtle polish + bug fixes, žiadne nové features)

---

### v2.18.4 — Plnenie sumár redesign + Aflamil family

#### Aflamil family — synthetic agregátna karta
- **`PHARMA_CODES['aflamil_family'] = ['AFLtbl', 'AFLsach', 'AFLcrm']`** — pre 3-subtab sheet
- **`plnenieBuildAggregates`** pridáva synthetic `aflamil_family` produkt na vrch `productsToShow` keď existujú aj `aflamil_kr` aj `aflamil_tablety_sacky` (planEUR + predajeEUR + predajeEURDone agregované)
- **`openProdSheet`** zachováva `aflamil_family` ako prodKey (predtým sme redirektovali na `aflamil_tablety_sacky`)
- **`prodSheetRenderRepList`** mapuje aktívny pharma code na správny `planKey`: AFLcrm → `aflamil_kr`, AFLtbl/AFLsach → `aflamil_tablety_sacky`
- **Sheet header** zobrazuje "Aflamil family" + 3 subtaby (Tablety/Sáčky/Krém)

#### Vizuálne odlíšenie family karty
- **Border**: `2px dashed #3B82F6` (čiarkovaný namiesto solid)
- **Pozadie**: `linear-gradient(180deg, #EAF2FF 0%, #F8FAFF 80%)` — sviežejší modrý než default
- **Box-shadow**: `0 2px 10px rgba(37,99,235,.12)` (modrý glow)
- **Name**: 15.5px font-weight:800, `letter-spacing:-.01em`
- Hover: gradient prejde na `#DBEAFE → #EFF6FF` + tmavšia border `#2563EB`

#### Plnenie sumár — 1-stĺpcový layout
- **`grid-template-columns: 1fr 1fr → 1fr`** — každá karta má celú šírku
- **Padding karty 7px 10px → 11px 14px** — viac dýchania
- **Markup zmenený z `flex-direction:column` na `flex-direction:row align-items:center`** — name + predikcia v ľavom stĺpci, % a chev vertikálne stredované cez celú výšku napravo

#### Typografia v produktových kartách
- **Name**: 12px → 14.5px, font-weight 700, color `#0F172A`, `letter-spacing:-.005em`
- **% číslo**: 12px → **22px Outfit** font-weight:800, `letter-spacing:-.01em`, tabular-nums (premium dashboard look)
- **Predikcia**: 9.5px → 11.5px, color `#64748B` + číslo `#334155` bold
- **Chevron**: 20px → 22px (modrý kruh 26×26px)

#### Default karty štýl (nie family)
- **Border**: `1.5px solid #BFDBFE` (predtým 1px)
- **Pozadie**: `linear-gradient(180deg, #F5F9FF 0%, #fff 70%)` — všetky karty modré
- Hover: gradient prejde na `#EFF6FF → #F8FAFC` + `#3B82F6` border
- Active: scale(.99) + tmavší modrý gradient

#### Aplikované v Golem aj gyn linke
- Markup zmenený v oboch render funkciách (`plnenieRenderSummary` pre golem aj gyn variant)
- Štýly v default scope (pôsobia na obidva)

#### Štatistika
- **80+ insertions / 30+ deletions** v `index.html`
- **CSS braces balanced**
- Žiadna zmena Apps Scriptu

#### Bug fixy v priebehu vlny
- **`pl-sum-prod-name` inline override** `style="-webkit-line-clamp:unset;overflow:visible"` v Golem markup-e (predtým preteklo cez % a chev) — odstránený
- **`min-width:0` na `.pl-sum-prod-c`** + `overflow:hidden` — grid items sa nedostanú za svoju gridovú šírku
- **Predikcia má `text-overflow:ellipsis` + `flex:1 1 auto`** — dlhý text predikcie sa skráti namiesto prelievania
- Keď nie je predikcia, použije sa empty `<span style="flex:1 1 auto">` placeholder pre zachovanie layoutu

#### What's New modal aktualizácia
- Zachovaný `WN_KEY = 'potencial_vl_wn_v2_18'` (per pravidlo subtle changes)
- **Pridané položky**:
  - Pre rep: 👨‍👩‍👧 "Aflamil family v Plnení" — nová karta hore + detail po reprezentantoch
  - Pre mgr: 👨‍👩‍👧 "Aflamil family + 1-stĺpcový sumár" — popisuje aj zmenu layoutu

---

### v2.18.3 — Mobile design polish + Playwright smoke test verifikácia

#### Mobile-design skill audit
- **Safe-area insets** pre iPhone X+ zariadenia (home indicator nezakryje obsah):
  - `body{padding-bottom:calc(48px + env(safe-area-inset-bottom))}` + max(16px, inset-left/right) pre landscape
  - `.submit-wrap{padding-bottom:env(safe-area-inset-bottom)}` — sticky Potvrdiť tlačidlo nezakryté home indikátorom
- **Globálny tap highlight cleanup**: `button,a,input,select,textarea,[role="button"]{...;-webkit-tap-highlight-color:transparent}` — žiadny ošklivý sivý highlight pri tap-e (nahradené vlastnými `:active` states naprieč appkou)
- **Overscroll behavior**: `body{overscroll-behavior-y:contain}` — pri pull-down v overlayoch sa hlavná stránka neťahá za sebou (rubber-band cancel)
- **Touch target floor 44×44px** pre tri konkrétne tlačidlá ktoré boli pod minimum:
  - `.login-eye` (eye toggle pri hesle): z 18px ikony bez box-u na 44×44px tlačidlo s hover/active background
  - `.pharma-okres-close` (zatvárací krížik v district chart overlay): z 32×32px na 44×44px + hover/active states
  - `.gyn-hdr-logout` (logout v gyn header): padding 6px 10px → 10px 14px + min-height 36px + bold font + lepší kontrast (`color:#94A3B8 → #fff`) + hover state

#### Webapp-testing skill (Playwright smoke test)
- Nainštalovaný Playwright + Chromium
- Vytvorený `smoke_test.py` (následne odstránený, neagentárny artifact) ktorý:
  - Naviguje cez 3 viewporty: mobile rep (390×844), mobile admin (390×844), desktop (1280×800)
  - Sleduje `pageerror` + `console error` events
  - Robí screenshot kľúčových obrazoviek (login, main, leaderboard, plnenie, admin)
- **Výsledok:** 0 JavaScript errorov naprieč všetkými 3 módmi, vizuálne rendering kompletný (login screen, Satori onboarding overlay, admin mód)
- Smoke test slúžil ako **regression check** že CSS zmeny v2.18.0–v2.18.2 nepoškodili JS logiku

#### Štatistika
- **14 insertions / 7 deletions** v `index.html` (najmenšia vlna, fokus na mobile-only fixes)
- **CSS braces balanced** (1285:1285)
- **Žiadna zmena JS logiky ani Apps Scriptu**
- **WN modal nezmenený** (subtle mobile-only polish, bez user-facing oznámenia)

#### Cieľ
Reprezentant používa appku **jednou rukou v aute**, často na **iPhone s home indicator** + Android s gesture navigation. Mobile-specific issues (safe area, tap highlight, overscroll) sú často "neviditeľné" kým sa nestretne s daným zariadením. Táto vlna ich systematicky pokrýva pre lepší pocit nativitnej appky.

---

### v2.18.2 — Skill-based polish (refactoring-ui + a11y + design-system audit)

#### Refactoring-UI skill: typography + interactive depth
- **Tabular-nums** (`font-variant-numeric:tabular-nums; font-feature-settings:"tnum" 1,"lnum" 1`) na **15+ tried**: `.total-val`, `.lb-count`, `.lb-count-pct`, `.lb-p-count`, `.mgr-stat-num`, `.mgr-dstat-num`, `.prod-adv-pct`, `.prod-kap-val`, `.prod-total-val`, `.gyn-prod-pct`, `.gyn-rep-pl-pct`, `.pharma-ms-card-val`, `.pharma-ms-trend-val`, `.gyn-tc-pct`, `.mrow-val`, `.mrow-plan`, `.pharma-ms-tbl td`, `.pharma-okres-legend-val`, `.pharma-ms-trend-chart-legend-item b`, `.lb-rank`. Cifry rovnako široké → tabuľky a stĺpce sa zarovnávajú, vyzerá ako finančný dashboard
- **Card hover lift** (`.card`, `.mgr-vitem`, `.gyn-rep-row`, `.gyn-rep-pl-clickable`): pri hover karta dostane `transform:translateY(-1px)` + posilnený shadow s `rgba(37,99,235,.10)` modrým ringom. `:active` resetuje translateY na 0 (so scale .99) — natural press feedback
- **`.card:focus-within`**: keď je input v karte focused, celá karta sa nadvihne (predtým len box-shadow change)

#### Accessibility skill: WCAG 2.1 AA contrast opravy
Všetky opravy — text size 10-13px, weight < 700, na bielom/svetlom pozadí — z `#94A3B8` (~3.3:1, fail) na `#64748B` (~4.6:1, pass):
- `.lb-rank` (12px číslo poradia) + pridané tabular-nums
- `.lb-region` (10px KE/BA) + `font-weight:600` (boost)
- `.lb-empty` (13px), `.lb-loading` (14px)
- `.empty-state-sub` (12.5px) — token zmenený z `--color-text-faint` na `--color-text-muted`
- `.hist-empty-sub` (12px)
- `.gyn-rep-region` (11px), `.gyn-prod-foot` (10px) + bold, `.gyn-rep-pl-meta` (10px)

#### Design-system skill: chýbajúce stavy doplnené
- **Globálny `:disabled` state** pre všetky `<button>` elementy: `opacity:.5; cursor:not-allowed; pointer-events:none` — predtým rôzne disabled stavy ad-hoc, teraz konzistentne
- **Hover state na inactive tabs** (chýbajúce feedback): pri prejdení myšou nad neaktívnym tabom dostane subtle visual response:
  - `.lb-tab:hover:not(.active)`, `.lb-mode-tab:hover:not(.active)` — text stmavne na `#475569`
  - `.mgr-tb-btn:hover:not(.active)`, `.panel-nav-btn:hover:not(.active)`, `.gyn-nav-btn:hover:not(.active)`, `.pharma-ms-subtab:hover:not(.active)` — `background:#F1F5F9` + `color:#0F172A`
  - `.gyn-q-btn:hover:not(.active)` — `background:#CBD5E1`
  - `.panel-nav-btn:hover:not(.active)` — `background:#E2E8F0` (od F1F5F9 lebo default je už F1F5F9)

#### Štatistika
- **36 insertions / 16 deletions** v `index.html`
- **CSS braces balanced** (1279:1279) — žiadny syntax error
- **Žiadna zmena JS logiky** — len CSS
- **Apps Script `kód.gs` nemenený** — netreba redeploy
- **WN modal nezmenený** — toto je micro-polish vlna, nie nová feature, používateľ nepotrebuje nový oznam

#### Cieľ podľa Ivana
"chcem aby aplikácia ľudí ktorí ju používajú bavila a bola príjemná na používanie a prostredie bolo príjemné" — táto vlna je presne o tom: **citeľnejšie reagovanie** (hover lift, hover na tabs), **profesionálnejší vzhľad** (tabular-nums), **lepšia čitateľnosť** (kontrast). Reprezentant by mal cítiť že **appka reaguje**, **vyzerá premium** a **dobre sa číta** aj v aute pri slnku.

---

### v2.18.1 — Polish frekventovaných oblastí (Trhový podiel, Plnenie, História, Success popup)

#### Trhový podiel overlay (`.pharma-ms-*`)
- **Total card** (`.pharma-ms-card`): premium 3-stop gradient `135deg, #0C1E35 → #13294B → #0C1E35` + 2 radial blobs (`::before` modrý vpravo hore, `::after` svetlomodrý vľavo dole) + premium shadow `0 12px 32px rgba(12,30,53,.30), 0 4px 12px rgba(37,99,235,.15), inset 0 1px 0 rgba(255,255,255,.08)`. `.pharma-ms-card > *` má `position:relative; z-index:1` aby blobs boli pod obsahom
- **Sub-tabs** (`.pharma-ms-subtabs/subtab`): kontainer dostal ring border (`0 0 0 1px rgba(15,23,42,.04)`), aktívny subtab gradient pill `135deg, #0C1E35 → #13294B` + box-shadow s inset highlight (rovnaký pattern ako `mgr-tb-btn.active`)
- **Trend chart** (`.pharma-ms-trend-chart`): 3-layered shadow + ring border. Title má modrú bodku prefix s halo (`::before` 4px circle + `0 0 0 2px rgba(37,99,235,.15)`)
- **Section title** (`.pharma-ms-section-title`): bodka prefix + `letter-spacing:.06em`
- **District karty** (`.pharma-ms-district`): 3-layered shadow + transition + **hover state** (`box-shadow:0 8px 20px rgba(15,23,42,.08), 0 0 0 1px rgba(37,99,235,.10)`) — modrý glow ring pri prejdení
- **District header** (`.pharma-ms-district-hdr`): gradient `135deg, #0C1E35 → #13294B` namiesto flat navy + `inset 0 -1px 0 rgba(255,255,255,.06)` separator
- **Tabuľka** (`.pharma-ms-tbl`): th `letter-spacing` z `.04em` na `.06em`, td font-family teraz `var(--font-display)` (Outfit), `font-weight:600`, **hover state** `tr:hover td{background:#F8FAFC}` so smooth transition
- **Náš produkt riadok** (`tr.ours`): subtle gradient pozadie `linear-gradient(90deg, #EFF6FF 0%, #fff 100%)` namiesto plain text color, hover prehlbené na `#DBEAFE → #EFF6FF`. Font-weight 800 (predtým 700)
- **District chart tlačidlo** (`.pharma-okres-chart-btn`): premium gradient `180deg, #3B82F6 → #2563EB → #1E40AF` + inset highlight + farebný outer shadow (predtým plain solid `#2563EB`). Active stav scale(.96) + zoslabený shadow
- **`prod-ms-link`** ("📊 Trhový podiel" tlačidlo na produkte): subtle gradient pozadie `180deg, #EFF6FF 0%, #DBEAFE 100%` + box-shadow + **hover translateY(-1px)** s deeper shadow

#### Plnenie detail (`.mgr-plnenie-detail`, `.rep-pl-inner`)
- **Total card** (`.total-card`) cez `replace_all`: gradient + premium shadow + `padding:18px 18px 16px` (predtým `16px 18px`) + `position:relative; overflow:hidden` (pripravené pre blobs ak ich neskôr pridáme)
- **Total val** cez `replace_all`: `font-size:38px` (predtým 34px) + `letter-spacing:-.02em` + `text-shadow:0 2px 8px rgba(0,0,0,.25)` — typografia executive dashboardu
- **Prod-item-adv** cez `replace_all`: 3-layered shadow + `transition:box-shadow var(--t-base), transform var(--t-fast)` + **hover state** `box-shadow:0 8px 20px rgba(15,23,42,.08), 0 0 0 1px rgba(37,99,235,.10)` — karty reagujú na prejdenie myšou

#### História panel (`.hist-*`)
- **Search wrap** (`.hist-search-wrap`): `position:sticky; top:0; z-index:5` + box-shadow pri scrollovaní — search ostane viditeľný
- **Search input**: height z 38px na 40px, radius 9 → 10, posilnený focus state (4px modrý ring + inset shadow)
- **Search ikona**: zmení farbu na `var(--color-primary)` pri focus inputu (`focus-within` selector)
- **Date group** (`.hist-date-group`): `position:sticky; top:60px; z-index:4` (pod search barom) + modrá bodka prefix + `letter-spacing:.06em` + `padding:8px 16px 5px`
- **Hist item**: nový **slide-in hover** — pri prejdení sa item posunie o 4px doprava (`padding-left:24px`) a zľava sa objaví 3px farebný indikátor `linear-gradient(180deg, #3B82F6, #1E40AF)`. Border-bottom z 2px na 1px (jemnejší). `:active` má scale(.998)
- **Hist item-name**: `font-weight:600 → 700` + `letter-spacing:-.005em`
- **Hist item-rec** (recommendation chip): pill (radius 12 → 20) + farebná bodka prefix (`::before` 5px circle s `currentColor`) + `letter-spacing:.03em` + `text-transform:uppercase` + box-shadow

#### Submit success popup (`.send-popup`, `.send-box`)
- **Popup backdrop**: `backdrop-filter:blur(4px)` + tmavšie pozadie `rgba(15,23,42,.55)` (predtým plain `rgba(0,0,0,.45)`)
- **Send-box**: radius 16 → 18, padding 28px 24px → 32px 28px 26px, premium 3-layered shadow `0 24px 64px rgba(15,23,42,.30), 0 8px 24px rgba(15,23,42,.15), 0 0 0 1px rgba(15,23,42,.04)`, max-width 300 → 320px. Animation easing zmenený na `cubic-bezier(.16,1,.3,1)` (smoother)
- **Send-box title**: font-size 16 → 17, weight 700 → 800, **font-family teraz `var(--font-display)`** (Outfit), `letter-spacing:-.01em`
- **Send-spinner**: 52 → 56px + `box-shadow:0 4px 16px rgba(245,158,11,.20)` (oranžový glow pri loading)
- **Send-check-wrap**: pridaný **animovaný halo glow** za checkmarkom (`::before` 88×88px radial gradient `rgba(16,185,129,.18)`, animácia `successHalo` 1.4s — scale .5 → 1.6, fade out)
- **Send-check-svg**: 64 → 68px + `filter:drop-shadow(0 4px 12px rgba(16,185,129,.30))` (zelený glow pod checkmarkom)
- Reduced-motion rešpektované

#### Foundation — Micro-interactions tokens
- **Pridané transition tokens**: `--t-fastest:.1s ease`, `--t-slowest:.4s ease` (k existujúcim `--t-fast`, `--t-base`, `--t-slow`)
- **Pridané easing tokens**: `--ease-spring:cubic-bezier(.34,1.56,.64,1)`, `--ease-out-expo:cubic-bezier(.16,1,.3,1)` — pre konzistentné spring/ease-out animácie
- **Z-index scale tokens**: `--z-base:1`, `--z-sticky:100`, `--z-dropdown:1000`, `--z-overlay:2000`, `--z-modal:3000`, `--z-popup:4000`, `--z-toast:9000`, `--z-top:9999` — pre konzistentnú hierarchiu overlayov v budúcnosti
- **Globálny `:focus-visible` outline**: `button:focus-visible, a:focus-visible, [role="button"]:focus-visible` dostali `outline:2px solid var(--color-primary); outline-offset:2px; border-radius:6px` — keyboard accessibility win pre Tab navigáciu
- **Inputs/selects/textareas** majú `outline:none` na `:focus-visible` (používajú vlastný box-shadow ring)

#### Štatistika
- **78 insertions / 42 deletions** v `index.html` (kompaktnejšia ako prvá vlna v2.18.0)
- **CSS braces balanced** (1267:1267) — žiadny syntax error
- **Žiadna zmena JS logiky** — len CSS
- **Apps Script `kód.gs` nemenený** — netreba redeploy

#### Odložené (na samostatnú session)
- **CSS deduplikácia GP ↔ gyn linka** — zlúčenie duplicitných definícií (napr. `.mgr-plnenie-detail` + `.rep-pl-inner` scope-y majú totožné CSS pre `.total-card`, `.bar-fill`, `.prod-item-adv`, `.month-rows`, `.mrow-*`). Refactor by zníšil CSS o stovky riadkov ale vyžaduje vlastný checklist (riziko rozbitia dvojich scope-ov). Foundation tokens (`--t-*`, `--ease-*`, `--z-*`) sú pripravené pre tento refactor

#### What's New modal (zachovaný `WN_KEY = 'potencial_vl_wn_v2_18'`)
- **Pravidlo:** keď používateľ ešte nevidel v2.18.0 modal, dostane kombinovaný obsah v2.18.0 + v2.18.1 v jednom modal
- **Pridané položky pre rep**: 📊 Krajší Trhový podiel, 📋 História záznamov (sticky search, hover indikátor)
- **Pridané položky pre mgr**: 📊 Trhový podiel — premium look, 🎯 Plnenie detail — väčšia hierarchia
- WN_KEY zachovaný úmyselne — používatelia ktorí už videli v2.18.0 modal v krátkom okne medzi releasmi nedostanú nový modal (per pokyn)

---

### v2.18.0 — Premium dizajnový upgrade (GP + gyn linka)

#### Foundation — Design tokens
- **`:root` CSS custom properties** v hornej časti `<style>` bloku (riadky 16–73): `--font-display`, `--font-body`, brand farby (`--color-navy`, `--color-primary`, semantic colors), surface farby, text farby, borders, radii (8/10/12/14/18/24px scale), spacing (4px base: `--space-1` až `--space-8`), shadows (`--shadow-sm/md/lg/xl`), motion (`--t-fast/base/slow`)
- **43× nahradený Outfit font stack** doslovne na `var(--font-display)` cez celý CSS — žiadne ďalšie duplicity
- `html,body` používa `var(--color-bg)`, `var(--font-body)`, `var(--color-text)`
- Tokens sú scaffolding pre budúce zmeny — appka môže postupne migrovať ďalšie hardcoded hodnoty

#### Hlavný header (`.hdr`)
- Gradient pozadie `135deg, #0C1E35 → #13294B → #0C1E35` (jemný shimmer) namiesto flat navy
- **Dva radial blobs**: `::before` modrý halo vpravo hore (`rgba(59,130,246,.18)`), `::after` svetlomodrý vľavo dole (`rgba(91,141,184,.10)`)
- **Premium shadow**: `0 12px 32px rgba(12,30,53,.35), 0 4px 12px rgba(37,99,235,.18), inset 0 1px 0 rgba(255,255,255,.08)`
- Title má `text-shadow:0 1px 2px rgba(0,0,0,.25)`
- Subtitle kontrastnejšia (`#7AABCC` namiesto `#5B8DB8`), `letter-spacing:.04em`, `font-weight:500`

#### CTA tlačidlá (modré: `.wn-btn`, `.satori-btn`, `.send-bar`, `.login-btn`)
- **3-stop vertikálny gradient** `180deg, #3B82F6 0% → #2563EB 50% → #1E40AF 100%` namiesto generického 2-stop `135deg`
- **Inset highlight** `inset 0 1px 0 rgba(255,255,255,.18)` — biela poltón na vrchu
- **Outer glow** s farebným tintom: `0 6px 18px rgba(37,99,235,.30)`
- Active state: `transform:scale(.985)` + zoslabený shadow
- Login btn má vlastný gradient `#1D4ED8 → #1E40AF → #0C1E35` (zachováva navy character)

#### Submit tlačidlo "Potvrdiť"
- **Vertikálny zelený gradient** `180deg, #22C55E → #16A34A → #15803D` namiesto flat `#16A34A`
- **Silnejší pulzujúci glow**: `submitGlow` keyframe sa zvýšil z 28px na 32px shadow + `0 0 0 8px rgba(22,163,74,.10)` ring (predtým 6px)
- Inset highlight: `inset 0 1px 0 rgba(255,255,255,.20)`
- Hover: `translateY(-1px)` + tmavší gradient `#16A34A → #15803D → #166534`
- Active: `scale(.985)` + zoslabený shadow

#### Karty (`.card`, `.info-card`)
- **3 vrstvy shadow** namiesto 2: `0 4px 16px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04), 0 0 0 1px rgba(15,23,42,.04)` (border ako shadow ring)
- **`focus-within` glow**: keď je input v karte focused, celá karta dostane modrý glow (delight detail)
- `.card-accent` má default `linear-gradient(90deg, var(--color-navy), var(--color-navy-2))` (predtým prázdny)
- `.info-accent` (top stripe) má **animovaný shine** (6s ease-in-out) prebiehajúci cez bar — `infoAccentShine` keyframe
- **`.info-card` má `overflow:visible`** (kvôli autocomplete dropdownu) — shine je obmedzený `overflow:hidden` na `.info-accent` samotnom

#### Login screen
- **Hero pozadie**: `radial-gradient(ellipse at 50% 25%, #1A3A5C 0%, #13294B 50%, #0C1E35 100%)` namiesto flat
- **Dva animované glow blobs** (`::before` modrý 340px, `::after` svetlomodrý 380px) — pomalý 8s/10s breathe pulse animácie
- `loginGlow1`/`loginGlow2` keyframy s `transform: translate + scale`, oba rešpektujú `prefers-reduced-motion`
- **Posilnený focus state**: `border-color:var(--color-primary)` + `box-shadow:0 0 0 4px rgba(37,99,235,.15), 0 1px 3px rgba(37,99,235,.10)` (predtým slabý 0.08 alpha)
- **WCAG kontrast opravený**: `.login-divider-text`, `.login-footer-text`, `.login-version`, `.login-footer-logo` — z `#CBD5E1` (~1.7:1, fail) na `#94A3B8`/`#64748B` (~3-4:1)

#### Form inputs (`select`, `input[type=number]`)
- **Silnejší focus**: `border-color:var(--color-primary)` + `box-shadow:0 0 0 4px rgba(37,99,235,.14), inset 0 1px 2px rgba(37,99,235,.04)` + `background:#fff`
- **Hover state** (predtým len border-color): pridaný `box-shadow:inset 0 1px 3px rgba(15,23,42,.04), 0 1px 3px rgba(15,23,42,.05)` + tmavší border `#94A3B8`
- **`.input-err` trieda** s shake animáciou (`inputShake` keyframe, 0.35s) — pripravené pre JS validáciu, rešpektuje `prefers-reduced-motion`

#### Rebríček podium
- **Pulzujúce zlaté halo** na 1. mieste (`goldHalo` keyframe, 2.4s) — striedanie shadow ring 6px/9px s glow 24px/32px
- **Animovaná korunka** (`crownFloat`, 3s) — float up/down + rotate -3deg
- **3-stop metallic gradients** na blokoch: 1. `#FBBF24 → #F59E0B → #D97706`, 2. `#CBD5E1 → #94A3B8 → #64748B`, 3. `#D97706 → #B45309 → #92400E`
- **Shimmer overlay** na blokoch (`::after` linear-gradient white 20% top → transparent)
- **Väčší 1. miesto avatar**: 64px → 68px, font 20px → 21px
- 2./3. miesto avatary majú nový `box-shadow:0 4px 12px rgba(15,23,42,.15)`
- Podium pozadie: `radial-gradient(ellipse at 50% 80%, #FFF8E7 0%, #F8FAFC 35%, #fff 70%)` — jemný teplý glow

#### Manažérske medaile (`.mgr-vseg.*`)
- Modernizovaná Tailwind paleta (sviežejšie farby ladiace s appkou)
- **3-stop metallic gradient** pre lepší shimmer feel: top (Platinum) `#94A3B8 → #64748B → #475569`, udrzat (Gold) `#FCD34D → #F59E0B → #B45309`, frekvencia (Bronze) `#D97706 → #B45309 → #7C2D12`
- Pridaný `border-radius:0 2px 2px 0` na pravej strane segmentu

#### Manažérske chips (`.mgr-chip`)
- **Pill shape** (radius 20px namiesto 9px)
- **Farebná bodka prefix** (`::before` 5px circle s `currentColor`, opacity .7)
- `letter-spacing:.04em` + `text-transform:uppercase`
- `box-shadow:0 1px 2px rgba(15,23,42,.05)` — subtle depth

#### Progress bary
- **`.progress-track`** (login): `box-shadow:inset 0 1px 2px rgba(15,23,42,.08)` (track má teraz hĺbku)
- **`.progress-fill`**: pridaný **shimmer effect** (`progressShine` keyframe, 2.4s) — biela poltón prejde cez fill
- **`.bar-fill.g/o/r`** (Plnenie): inset highlight + farebný glow shadow podľa stavu (zelený/oranžový/červený)
- Transition zmenený z `width .8s ease` na `width .9s cubic-bezier(.16,1,.3,1)` (smoother)

#### Section labels (`.flbl`, `.prod-type`, gyn variants)
- **Modrá bodka prefix** (`::before` 4px circle s halo `0 0 0 2px rgba(37,99,235,.15)`)
- `letter-spacing` posilnené z `.03em` na `.06em`
- `font-weight:600 → 700` na `.flbl`
- `.prod-type` doplnené `text-transform:uppercase` + `font-weight:600` + `letter-spacing:.05em`

#### Tabs
- **`.lb-tab`, `.lb-mode-tab`**: aktívny tab dostal **gradient underline indicator** (3px height, `linear-gradient(90deg, #1E40AF, #2563EB, #3B82F6)`) + `box-shadow:0 -2px 8px rgba(37,99,235,.30)` glow + `tabIndicatorIn` animácia (.25s scaleX from .4)
- **`.mgr-tb-btn`, `.panel-nav-btn`**: aktívny dostal **gradient pill** `135deg, #0C1E35 → #13294B` + `box-shadow:0 4px 12px rgba(12,30,53,.25), inset 0 1px 0 rgba(255,255,255,.10)` + `font-weight:700`

#### Empty states
- **Fade-in animácia** (`emptyFadeIn`, 500ms cubic-bezier)
- **Icon scale-in** so spring overshoot (`emptyIconIn`, 700ms `cubic-bezier(.34,1.7,.64,1)`) — štart 0.5, prejde cez 1.06, do 1.0
- **Drop-shadow** pod SVG: `filter:drop-shadow(0 4px 12px rgba(15,23,42,.08))`
- **Title + sub waterfall reveal**: title delay 250ms, sub delay 320ms (`emptyTextIn` keyframe)
- SVG väčšie (88px → 96px)
- Všetko rešpektuje `prefers-reduced-motion`

#### Gyn linka — všetky zmeny aplikované zrkadlovo
- **`.gyn-mgr-hdr`, `.gyn-hdr`, `.gyn-tc`** — gradient pozadie + `::before`/`::after` radial blobs + premium shadow + text-shadow na title
- **`.gyn-card`, `.gyn-rep-row`, `.gyn-rep-pl`, `.gyn-prod`** — 3 layered shadows + ring border, transitions
- **`.gyn-nav-btn`, `.gyn-q-btn`** — aktívny stav gradient pill + box-shadow + inset highlight (rovnako ako GP `.mgr-tb-btn`)
- **`.gyn-prod-track/fill`** — inset shadow track + glow podľa stavu (g/o/r), height z 8px na 9px, radius 4px → 5px, smoother transition
- **`.gyn-card-title`, `.gyn-team-label`, `.gyn-section-lbl`** — modrá bodka prefix + halo, posilnené `letter-spacing:.06em`
- **`.gyn-empty`** — fade-in + icon bounce (42px) + waterfall text reveal + drop-shadow

#### Štatistika zmeny
- **265 insertions / 167 deletions** v `index.html`
- **CSS braces balanced** (1241:1241) — žiadny syntax error
- **Žiadna zmena JS logiky** — len CSS
- **Apps Script `kód.gs` nemenený** — netreba redeploy

#### Bug fix počas session
- **Autocomplete dropdown orezanie**: pri pridaní `infoAccentShine` animácie som zmenil `.info-card` z `overflow:visible` na `overflow:hidden`, čo orezalo dropdown "Okres pracoviska lekára". Opravené: `.info-card` má opäť `overflow:visible`, `.info-accent` má svoj vlastný `overflow:hidden` (shine animácia ostáva v rámci 4px stripe lebo `.info-accent` má `border-radius:14px 14px 0 0`).

---

### v2.13.59 — Trhový podiel Q2 fallback — finálna oprava (3 bugy)

Oprava série bugov v automatickom fallbacku na predchádzajúci Q keď IQVIA dáta pre aktuálny Q ešte nie sú nahrané:

**Bug 1 — `pharmaKvartalPrev` zero-padding:**
- `pharmaKvartalPrev('2602')` vracal `'261'` namiesto `'2601'` — chýbal `'0'` pred číslom kvartálu
- Oprava: `return (yy < 10 ? '0'+yy : ''+yy) + (qq < 10 ? '0'+qq : ''+qq)`
- Dôsledok bugu: server dostal nesprávny kvartal kód → vrátil prázdne `okresy` → "Žiadne dáta po okresoch"

**Bug 2 — filter reálnych dát podľa mesiacov aktuálneho Q:**
- `summArr` obsahuje historické dáta (posledných 12 mesiacov) bez filtrovania podľa kvartálu
- Predchádzajúci check `hasRealSummData` kontroloval všetky riadky vrátane starých Q1 mesiacov → vrátil `true` → fallback sa nespustil
- Oprava: `summArr.some()` teraz kontroluje iba riadky kde `months.indexOf(s.mesiac) >= 0` (len mesiace aktuálneho Q)

**Bug 3 — fallback v `pharmaRender` namiesto len `loadPharmaData`:**
- Pôvodný fallback v `loadPharmaData` bol podmienený na `PHARMA_STATE.activeCode === code` — pri preloade po prihlásení (overlay zavretý) sa nespustil, prázdne Q2 dáta sa cachovali
- Doplnený fallback priamo v `pharmaRender` zachytí všetky prípady vrátane cache hitov

**Správanie po oprave:**
- Keď Q2 IQVIA dáta nie sú nahrané, overlay automaticky zobrazí Q1 dáta (MS hodnoty aj okresy)
- Keď prídu Q2 dáta (napr. apríl '2604' s reálnymi hodnotami), `hasRealSummData = true` → Q2 sa zobrazí priamo bez fallbacku
- Žiadna zmena kódu nie je potrebná pri nahrávaní nových dát

### v2.13.54–56 — Trhový podiel — prvé pokusy o fallback (nahradené v2.13.59)

Pomocná funkcia `pharmaKvartalPrev(kvartal)` pridaná v v2.13.54 — vypočíta kód predchádzajúceho kvartálu (`'2602'` → `'2601'`, `'2601'` → `'2504'`). Fallback logika bola postupne dopĺňaná v v2.13.54 (ok:true+empty), v2.13.55 (ok:false), v2.13.56 (pharmaRender level) — finálna oprava je v2.13.59.

### v2.13.53 — Predikcia per produkt v manažérskom Plnení

Produktové karty v sumári Slovensko/West/East majú nový layout:
- **Hore:** názov produktu vľavo, aktuálne % plnenia + šípka vpravo
- **Dole:** `predikcia XX,XX%` sivým písmom (iba pre aktuálny Q, iba ak sú dokončené mesiace)

Predikcia sa počíta cez `plnenieCalcPredikciaSummary(p.planEUR, p.predajeEUR, q, year)` — rovnaká logika ako celkový Slovensko sumár.

### v2.13.52 — Oprava % plnenia v reportoch + Aflamil/Krém pravidlo plánu

#### Oprava nesúladu % plnenia (rptPlnenieForRep)
- `rptPlnenieForRep()` kompletne prepísaná aby zrkadlila `plnenieBuildAggregates` presne:
  - Používa `planProducts` (nie `Object.keys(plan[username])`) pre správny zoznam produktov
  - Používa `predaje[rep].total` (nie súčet `byMonth`) ako autoritatívnu hodnotu predajov
  - Zahŕňa do súčtu iba produkty kde `plan > 0` — eliminovalo nesúlad napr. 35% vs 29.84%
- `rptFmtPct(val)` — nový helper: všetky % hodnoty v reportoch na 2 desatinné miesta (`"29.84%"` nie `"30%"`)
- Oprava `ReferenceError: cumActual` — premenná bola zmazaná ale stále referencovaná → záložky reprezentantov v hub page ticho zmizali; opravené na `pd.predaje`

#### Aflamil / Krém — Pravidlo plánu (rep report)
Nová sekcia v reporte každého reprezentanta (zobrazí sa iba ak má v pláne oba produkty `aflamil_tablety_sacky` aj `aflamil_kr` s plánom > 0):

**Ľavá karta — ✓ MS NEKLESNE** (modrá):
- "Krém ti pomáha" — predaje krému sa zarátajú do plnenia Aflamil
- Zobrazuje kombinované % = `(tbl_predaje + kr_predaje) / (tbl_plan + kr_plan)`

**Pravá karta — ⚠ MS KLESNE** (jantárová):
- "Krém sa nezaráta" — každý produkt má vlastný plán
- Zobrazuje `tbl+sáčky %` a `krém %` osobitne pod sebou, vrátane EUR hodnôt krému

Sekcia je informatívna — ukazuje oba scenáre vždy, nie len ten aktuálny.

### v2.10.2 — Android back button pre PWA standalone mód

**Čo robí:**
- Tlačidlo Späť na Androide zatvára otvorené overlaye namiesto ukončenia appky
- Funguje iba v PWA standalone móde (pridané na home screen)

**Technické detaily:**
- `initAndroidBack()` — volá sa pri `DOMContentLoaded`, nastaví `history.replaceState({pgApp:true})`
- `_handleAndroidBack()` — prechádza overlaye od najvnútornejšieho po najvonkajší a zatvára prvý otvorený
- Po každom zatvorení sa pushne nový stav (`history.pushState`) aby ďalší stisk opäť fungoval
- Poradie overlay priorít: `pharma-okres-overlay` → `pharma-ms-overlay` → `milestone-overlay` → `thankyou` → `logout-overlay` → panely (História/Rebríček/Plnenie)
- Keď nie je otvorený žiadny overlay → appka sa minimalizuje (štandardné Android správanie)

### v2.10.1 — PWA manifest pre Android standalone mód

**Čo robí:**
- Na Androide po pridaní na home screen sa appka otvára bez URL baru (ako natívna appka)
- Predtým fungovalo len na iPhone (Apple meta tagy), Android potreboval `manifest.json`

**Súbory:**
- `manifest.json` — nový súbor s `"display": "standalone"`, `"theme_color": "#0C1E35"`, ikony
- `icon-192.png`, `icon-512.png` — ikony extrahované z base64 v HTML (pre Android home screen)
- `index.html` — pridané `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="mobile-web-app-capable">`

### v2.10.0 — Milestone celebrácia: 200 lekárov

**Čo robí:**
- Po prihlásení (s 3-sekundovým oneskorením) appka zavolá `getMilestoneStats` endpoint
- Ak celkový počet unikátnych lekárov v systéme ≥ 200 a overlay ešte nebol zobrazený (localStorage `milestone_200_shown`), zobrazí sa celoobrazovkový overlay s ohňostrojmi
- Overlay sa zobrazí raz — po kliknutí „Super, ďakujem!" sa uloží flag a viac sa nezobrazí
- Funguje pre všetkých používateľov — bežných reprezentantov aj manažérov

**Obsah overlay:**
- 🎉 emoji s animáciou (bounce)
- „Gratulujem, tím Golem!"
- „Spoločne ste úspešne nahrali 200 lekárov s potenciálom"
- Dve štatistiky v kartičkách:
  - X% lekárov, ktorých chceme navštevovať (rocny_potential ≥ 3700 €)
  - X% navrhnutých na vyradenie z targetu (scenar = 'vyradit')
- „Good job! Len tak ďalej. 💪"
- Tlačidlo „Super, ďakujem!"

**Technické detaily:**
- Nový endpoint `getMilestoneStats` v Apps Script — bez tokenu (verejné)
- Vracia `{total: N, highPotentialPct: X, vyraditPct: Y}`
- `startFireworks()` refaktorovaný: teraz volá `startFireworksOnCanvas(canvas)` → reuse pre oba canvasy (thankyou screen aj milestone overlay)
- DEV mode: mock stats `{total: 200, highPotentialPct: 68, vyraditPct: 14}`
- Fireworks sa auto-zastavia po 9 sekundách
- localStorage key: `milestone_200_shown`

### v2.9.1 — Interaktívne zvýrazňovanie čiar v pharma grafoch + oprava legendy

**Legenda — kontrast textu:**
- Meno produktu/konkurenta: `#64748B` (strednošedé) — ustúpi do pozadia
- % hodnota: `#0F172A`, `font-weight:700`, `font-size:10.5px` — jasne viditeľná
- Náš produkt: modrý chip (`#EFF6FF` bg, `#BFDBFE` border, `#1E40AF` text) — odlíšený od konkurentov

**Zvýrazňovanie čiar (klik na legend chip):**
- Klik na ľubovoľnú položku legendy → čiara sa rozbehne draw animáciou, ostatné sa stlmia na `0.08` opacity, chip smodrie (`#2563EB`)
- Funguje v **hlavnom pharma grafe** (`pharmaReplayLine`) aj v **district overlay grafe** (`pharmaOkresReplayLine`)
- Persistentný výber — čiara ostane zvýraznená po skončení animácie

**Zrušenie zvýraznenia — 2 spôsoby:**
- Červené tlačidlo **„× Všetky"** sa objaví v legende hneď po výbere → jedno ťuknutie vráti všetko
- Opätovný klik na aktívny (modrý) chip → rovnaký efekt

**Technické detaily:**
- `_pharmaSelectedKey` / `_pharmaOkresSelectedKey` — module-level premenné sledujúce výber
- `pharmaResetLine()` / `pharmaOkresResetLine()` — funkcie na reset výberu
- `data-line-key` atribút na každom legend chipe — identifikácia pri toggle
- `closePharmaOkresChart()` resetuje `_pharmaOkresSelectedKey`

**Oprava bugu — nested grid v district legende:**
- Statický `<div class="pharma-okres-legend" id="pharma-okres-legend">` mal CSS grid
- `buildOkresLegend()` vkladal dovnútra ďalší `<div class="pharma-okres-legend">` → nested grid rozbil layout
- Oprava: statický kontajner je teraz neutrálny `<div id="pharma-okres-legend">` bez grid CSS

### v2.9.0 — District chart overlay (fullscreen graf po okresoch)

**Nová funkcia:** Po kliknutí na tlačidlo "Graf" pri názve okresu v sekcii "Rozpad po okresoch" sa otvorí fullscreen overlay s historickým grafom trhového podielu pre daný okres (posledné 2 kvartály = 6 mesiacov).

**Overlay:**
- Zobrazuje sa v landscape orientácii (CSS `transform: translate(-50%,-50%) rotate(90deg)`) aj keď je telefón v portrait móde
- Biele pozadie, `display:none/flex` (nie `opacity`) — vyhýba sa compositing bug
- Portrait: `top:50%;left:50%;width:100vh;height:100vw;transform-origin:center center`
- Landscape: `inset:0`

**Graf (`buildOkresChartSvg`):**
- SVG viewBox `620×195`, gradient fill pod čiarou nášho produktu
- 5 horizontálnych gridlines, zvislý oddelovač kvartálov (pri 6 mesiacoch)
- Konkurenti slabnú v opacite podľa poradia (vizuálna hierarchia)
- Subtitle zobrazuje konkrétne kvartály: napr. `Q1/2026 + Q4/2025`

**Legenda:**
- 4-stĺpcový CSS grid, všetci konkurenti viditeľní bez scrollovania
- Pill chip štýl (background `#F8FAFC`, border `#E2E8F0`, `border-radius:20px`) — rovnaký štýl aj v legende hlavného grafu (`pharma-ms-trend-chart-legend-item`)
- Vlastný produkt: tučný, väčšia bodka

**Tlačidlo "Graf" na district headeri:**
- Modrý CTA button (`#2563EB`) s ikonkou čiarového grafu + text "Graf"
- Class `pharma-okres-chart-btn pharma-okres-btn`, `data-okr-idx` atribút
- Click handlery pridávané priamo po `bodyEl.innerHTML = html` (nie delegované)

**`pharma_converter.html`:**
- `MAX_KOMP_GRAF`: 8 → **15** (exportuje top 15 konkurentov do `PharmaData_OkresyGraf`)
- Tabuľka a TSV export rozšírené na stĺpce k1–k15

**`kód.gs`:**
- Endpoint `getPharmaOkresGraf` — číta `PharmaData_OkresyGraf` tab dynamicky (všetky `k*_nazov`/`k*_ms` stĺpce)
- Vracia pole `rows` so štruktúrou `{mesiac, nas_ms, komp:[{name, ms}]}`

**Mock dáta (`MOCK_PHARMA_OKRES_GRAF`):**
- AFL produkty: 12 realistických konkurentov (FLECTOR EP, DOLGIT, INDOMETHACIN, IBALGIN DUO EFFECT, IBALGIN, FASTUM, VERAL NEO, EMOXEN, AULIN, ALMIRAL, ALGESAL, VOLTAREN)
- SUP/KOGGOL: 5 konkurentov, VID/CAV: 4 konkurenti

**`OKGRAF_COLORS`:** rozšírené z 8 na 15 farieb

### v2.7.22 — Admin schvaľovanie Q v rebríčku (len pre rolu admin)

Tlačidlo "Schváliť Q{X} v rebríčku" je viditeľné **iba pre používateľa s rolou `admin`** (`MGR_STATE.role === 'admin'`). BUM, AM West, AM East ho nevidia.

---

### v2.7.21 — Admin manuálne schvaľovanie Q v rebríčku

Nová funkcionalita: admin môže manuálne schváliť, ktorý Q sa zobrazuje v rebríčku (Plnenie), namiesto automatického prepínania podľa dátumu.

**Apps Script (`kód.gs`):**
- Nový endpoint `action=getConfig&key=xxx` — číta hodnotu z tabu "Config" (Key|Value)
- Nový endpoint `action=setConfig&key=xxx&value=yyy` — zapisuje hodnotu (vyžaduje token)
- Tab "Config" sa vytvorí automaticky pri prvom `setConfig` ak neexistuje

**App (`index.html`):**
- `var LB_APPROVED_Q = null` — admin-schválený Q, `null` = auto (currentQ-1)
- `lbLastCompletedQ()` vracia `LB_APPROVED_Q` ak je nastavený, inak `plnenieCurrentQ() - 1`
- `lbFetchApprovedQ(callback)` — fetchuje `getConfig?key=lb_approved_q` pri prihlásení (pred `lbLoadData`)
- `lbApproveQ(q)` — zapisuje cez `setConfig`, resetuje cache, re-renderuje rebríček
- Admin vidí tlačidlo "Schváliť Q{X} v rebríčku" pod nadpisom Q v rebríčku (Plnenie mode)
- Všetky 4 login pathy volajú `lbFetchApprovedQ()` pri 2s preloade

---

### v2.7.20 — Oprava zaseknutého Plnenia v manager mode (ReferenceError)

Chyba: Python nahradil prvý výskyt `var prods = document.getElementById('pl-sum-prods')` — ten bol v `plnenieRenderSummaryEmpty()` kde `sk` nie je definované → `ReferenceError: sk is not defined` → celý render sa zasekol na skelete.

Oprava:
- `plnenieRenderSummaryEmpty` — notice sa vždy iba skryje (sk tam nie je k dispozícii)
- `plnenieRenderSummary` — notice sa zobrazí/skryje podľa `sk.planEUR === 0` (sk je definované)

---

### v2.7.19 — Správa pri chýbajúcom pláne v manažérskom Plnení

Keď `sk.planEUR === 0` (plán ešte nie je zadaný v Sheets), zobrazí sa pod sumárnou kartou správa:
*"Údaje sa aktualizujú po schválení teritoriálnych plánov na Q{X}"*
Q číslo je dynamické podľa aktívneho tabu. Správa zmizne automaticky keď prídu dáta zo Sheets.

---

### v2.7.18 — Ohňostroje aj pri prepnutí na Plnenie Q v rebríčku

`lbSetMode('plnenie')` nastavuje `LB_STATE.showConfetti = true` → ohňostroje sa spustia aj pri kliknutí na tab Plnenie Q, nielen pri otvorení rebríčka.

---

### v2.7.17 — lbPreloadPlnenie() aj v manager login pathoch

Oprava: `lbPreloadPlnenie()` sa volalo iba v rep login pathoch, nie v manažérskych. Manager videl Plnenie Q v rebríčku stále ako načítavanie.

---

### v2.7.16 — Rýchly preload Plnenie Q v rebríčku

Oprava: Plnenie Q v rebríčku sa stále načítavalo aj keď bola appka otvorená dlhšiu dobu.

**Príčina:** Starý kód čakal na `REP_PL_STATE.loading === false` — čo nastalo až keď dokončili **všetky 4 Q fetche** naraz. Aj keď Q1 bol hotový ako prvý, timer čakal na Q2/Q3/Q4.

**Riešenie:** Dedikovaný `LB_PLNENIE_CACHE` + `lbPreloadPlnenie()`:
- `lbPreloadPlnenie()` fetchuje **iba posledný ukončený Q** (1 request, nie 4)
- Výsledok ide do `LB_PLNENIE_CACHE` — nezávislý od `REP_PL_STATE`
- Volá sa **paralelne s `lbLoadData()`** hneď po 2s od prihlásenia
- `lbRenderPlnenie()` teraz kontroluje `LB_PLNENIE_CACHE` (nie `REP_PL_STATE.qCache[lastQ]`)
- Polling timer čaká na `LB_PLNENIE_LOADING` (rýchlejší — 1 request) namiesto `REP_PL_STATE.loading`
- Ak je leaderboard otvorený keď `lbPreloadPlnenie()` dokončí, automaticky re-renderuje

---

### v2.7.15 — Preload Plnenie Q pri prihlásení (čiastočný fix)

Prechodná verzia — `repPlnenieLoad()` sa volal po 2s, ale timer čakal na všetky 4 Q. Nahradená v 2.7.16.

---

### v2.7.14 — Rebríček Plnenie Q

Rebríček rozdelený na dva režimy prepínačom v záhlaví:

#### Režim "📋 Návštevy" (pôvodné správanie)
- Zoradiť podľa počtu návštev lekárov
- Zobrazí sub-taby: Mesiac / Kvartál / Celkové (nezmenené)

#### Režim "💊 Plnenie Q{X}" (nový)
- Zoradiť podľa % plnenia plánu posledného ukončeného kvartálu
- Dáta z `REP_PL_STATE.qCache[lastQ]` — ten istý `getPlnenieAll` endpoint, žiadny nový backend
- % s farbami: zelená ≥100%, oranžová ≥70%, červená <70%, šedá = bez plánu
- Podium (top 3) + zoznam (4+) rovnakého dizajnu ako návštevy
- `lbLastCompletedQ()` = `plnenieCurrentQ() - 1` (ak Q1, zobrazí "žiadny ukončený Q")
- Ak dáta nie sú v cache: spustí `repPlnenieLoad()` + zobrazí skeleton
- Po načítaní: render s podiumom a `%` hodnotami
- Ak načítanie zlyhá (napr. offline): zobrazí chybovú správu

#### Technické detaily
- `LB_STATE.mode`: `'navstevy'` | `'plnenie'` (default `'navstevy'`)
- `lbSetMode(mode, el)` — prepne režim, skryje/zobrazí period tabs, zavolá `lbRender()`
- `lbSyncTabs()` rozšírená: synchronizuje aj mode tabs + dynamicky nastaví label "💊 Plnenie Q{X}"
- `lbRender()` sa rozvetvuje podľa `LB_STATE.mode`
- CSS: `.lb-mode-tabs`, `.lb-mode-tab`, `.lb-count-pct.g/o/r/n`, `.lb-pl-q-header`
- Period tabs obalené v `.lb-period-wrap` — `hidden` class ich skryje v plnenie móde

---

### v2.7.13 — Statický panel nav + oprava rohov a medzery

#### 1. Statický panel nav pri prechode medzi panelmi
- **Problém:** pri prepínaní História/Rebríček/Plnenie sa animoval celý overlay vrátane nav tabov — nepôsobilo to dobre
- **Riešenie:** panel nav vytiahnutý z každého overlaya do jedného zdieľaného fixného elementu `#shared-panel-nav`
- `#shared-panel-nav`: `position:fixed; top:0; left:0; right:0; z-index:2100; background:#EAECF2; padding:20px 16px 12px`
- Nav zostáva statický, animuje sa iba obsah pod ním
- `_panelShow()` aktualizuje active stav tlačidiel pri každom prechode
- `closeAllPanels()` skrýva shared nav
- V manager móde: `display:none !important`
- Inner containery dostali `padding-top:82px` (z pôvodných 24px) aby obsah začínal pod fixným navom:
  - `.hist-inner`, `.lb-inner`, `.rep-pl-inner`: `padding:24px 16px 48px → 82px 16px 48px`

#### 2. Zaoblené rohy `.info-card` (karta "Identifikácia návštevy")
- **Problém:** `.info-card` malo `overflow:visible` → `border-radius` neorezával `.info-accent` pruh navrchu → ostré rohy
- **Riešenie:** `overflow:visible → overflow:hidden` — border-radius teraz správne orezáva obsah
- Vizuálne identické s ostatnými kartami (`.card` trieda, ktorá vždy mala `overflow:hidden`)

#### 3. Oprava veľkej medzery pred "Identifikácia návštevy"
- **Problém:** `margin-bottom:32px` na `.info-card` + `style="margin-top:20px"` inline na Kapitácia karte = 52px medzera
- **Riešenie:** `.info-card margin-bottom:32px → 12px` + odstránený inline `style="margin-top:20px"` z Kapitácia karty

---

### v2.7.12 — touch-action:manipulation

Odstránenie 300ms tap delay na mobile — štandardný fix pre PWA:
- Pridaný CSS rule: `button,a,input,select,textarea,[role="button"]{touch-action:manipulation}`
- Prehliadač už nečaká 300ms po každom ťuknutí (čakanie na double-tap zoom)
- Appka reaguje okamžite — pocit natívnej aplikácie
- Scrollovanie, pull-to-refresh ani žiadne iné gesta nie sú ovplyvnené

---

### v2.7.11 — Fix X tlačidla v panel-nav

`.panel-nav-close` — zatváracie tlačidlo Historia/Rebríček/Plnenie:
- **Predtým**: `background:none`, `color:#94A3B8` — X sa strácalo v rohu, nebolo viditeľné
- **Teraz**: `background:#E2E8F0`, `color:#475569`, `font-weight:700` — viditeľné sivé pozadie, tmavší X symbol
- Active stav: `#CBD5E1` + `#1E293B` (stmavne pri tapnutí)
- Vizuálne odlíšené od tabov (taby majú `#F1F5F9`, X má `#E2E8F0`)

---

### v2.7.10 — UI/UX design audit (Refactoring UI)

Design audit podľa Refactoring UI frameworku — 5 implementovaných vylepšení:

#### 1. Progress bar — viditeľný track
- `.progress-track`: `height:8px → 10px`, `background:#E2E8F0 → #CBD5E1`
- Track je teraz viditeľný aj pri 0% — reprezentant vidí kde bar porastie
- `border-radius:4px → 5px` (konzistentné s novou výškou)

#### 2. Tlačidlo "Trhový podiel" — outlined štýl
- `.prod-ms-link`: svetlosivé disabled-vyzerajúce pozadie nahradené outlined modrým štýlom
- `background:#E2E8F0 → #EFF6FF`, `border:1px solid #CBD5E1 → 1.5px solid #3B82F6`, `color:#334155 → #1D4ED8`
- Active stav: `#DBEAFE` pozadie + `#2563EB` okraj
- Modrá konzistentná s percentom v progress bare

#### 3. Formulárové karty — kompaktnejší layout
- `.card-inner`: `padding:18px 20px 20px → 12px 16px 14px` (-12px per karte)
- `.prod-type`: `margin-bottom:14px → 8px` (-6px per karte)
- `.row` + `.row-x`: `padding:12px 14px → 9px 14px`, `margin-bottom:8px → 6px`
- Celková úspora: ~114px — formulár je o ~1 kartu kratší pri scrollovaní

#### 4. Fixný button "Potvrdiť" — vizuálna separácia
- `.submit-inner`: `background:transparent → linear-gradient(to bottom, transparent, rgba(234,236,242,.97) 44%)` — obsah pekne vyplynie za button
- Padding zóna navýšená: `10px → 18px` (väčší fade priestor)
- `.submit-inner-content`: `border-top: white (neviditeľný) → rgba(15,23,42,.07)` + `box-shadow:0 -4px 16px rgba(15,23,42,.08)` (upward shadow)

#### 5. Panel nav taby — viditeľná tab affordance
- `.panel-nav-btn`: `background:none → #F1F5F9`, `color:#94A3B8 → #64748B`
- Neaktívne taby majú teraz viditeľný pill tvar — jasne vyzerajú klikateľne
- Aktívny stav (`#0C1E35` + biely text) nezmenený

---

### v2.7.9 — Prevencia duplicitných lekárov

#### Problém
`dupCheckLekar()` a `_dupWarningActive` (blokovanie odoslania) existovali, ale `_histAllItems` sa naplnili **až keď reprezentant otvoril História panel**. Ak reprezentant nikdy históriu neotvoril (nový deň, prvé spustenie), duplicitná kontrola nemala žiadne dáta → lekár mohol byť zadaný znova.

#### Riešenie
Nová funkcia `loadHistoryItems(username)` — extrakcia fetch+parse logiky z `openHistory()` do samostatného Promise-returning helpera:
- Fetchne `action=getHistory` zo Sheets, sparsuje záznamy (rovnaká normalizácia dátumov/časov ako predtým)
- Uloží do `_histAllItems`, aktualizuje badge
- Pri chybe: fallback na `localStorage` (zachovaná pôvodná logika)

`refreshBadgeFromSheets(username)` teraz deleguje na `loadHistoryItems()` — funkcia sa volá pri každom prihlásení (`loginSuccess()` aj `initLogin()`, non-manager cesta), čo znamená že `_histAllItems` sú vždy naplnené skôr, ako reprezentant otvorí formulár.

`openHistory()` zjednodušené — volá `loadHistoryItems().then(renderHistItems)`.

#### Zmena správy pri duplikáte
- **Predtým**: "bol už zadaný dňa X — každý lekár sa zadáva iba raz za návštevu" (implicitne same-day)
- **Teraz**: "je už v tvojej databáze — zadaný dňa X. Každý lekár sa zadáva iba raz." (permanentný per-rep blok)

---

### v2.7.8 — Dokončenie exit animácií

#### Trhový podiel overlay (`.pharma-ms-overlay`)
- **Vstup**: vklznie sprava (`panel-anim-r`) — predtým žiadna animácia
- **Výstup**: vyklznie doprava (`pl-detail-exit-r`, 230ms delay) — predtým žiadna animácia
- Implementácia v `openPharmaMs()` a `closePharmaMs()`

#### Tablety / Sáčky subtaby v Trhový podiel
- Prepínanie medzi subtabmi animuje `#pharma-ms-body` directional slideom (Tablety→Sáčky = doprava, Sáčky→Tablety = doľava)
- Smer určuje poradie v `PHARMA_STATE.codes` — porovnanie `oldIdx` vs `newIdx`
- Implementácia v `pharmaSwitchTab()` — reuse `_animPlQ('pharma-ms-body', dir)`

#### Manažér detail reprezentanta (`.mgr-detail`) — Návštevy záložka
- **Predtým**: nespoľahlivá CSS-only animácia (`animation:mgrSlide` priamo na triede, nie pri `.show`) — prehliadač nemusel reštartovať animáciu pri `display:none → block`
- **Oprava vstupu**: JS-riadená animácia `panel-anim-r` s `void el.offsetWidth` reflow trikom v `mgrOpenRep()`
- **Exit**: `pl-detail-exit-r` v `mgrCloseRep()` — zoznam reprezentantov sa objaví až po dokončení exit animácie (230ms)
- CSS: odstránená `animation:mgrSlide` z `.mgr-detail` (zachovaný `@keyframes mgrSlide` pre prípadné budúce použitie)

#### Karta lekára (`.detail-overlay`) — exit animácia
- **Predtým**: zatvorenie okamžité bez animácie (`overlay.className = 'detail-overlay'`)
- **Oprava**: pri zatváraní sa pridá trieda `closing` → `.detail-overlay.closing .confirm-box{animation:slideDown .18s ease both}` → karta skĺzne nadol a zmizne → po 190ms sa overlay skryje
- `@keyframes slideDown{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(24px)}}`
- Poznámka: CSS rule `.detail-overlay.show .info-card` bola mŕtvy kód — vo vnútri overlaya nie je `.info-card` ale `.confirm-box`; skutočná vstupná animácia je `slideUp` na `.confirm-box` priamo

### v2.7.7 — Animácie navigácie + fix rebríčka (intermittent)

#### Slide animácie overlayov v rep móde (História / Rebríček / Plnenie)
- **Prvé otvorenie** (žiadny overlay nie je otvorený): panel sa vysunie zo spodu (`panel-anim-up` = `translateY(100%)→0`)
- **Prepínanie medzi panelmi**: directional slide podľa logického poradia `{ 'hist-overlay':0, 'lb-overlay':1, 'rep-plnenie-overlay':2 }` — klik doprava vsunie nový panel sprava, klik doľava zľava
- **`_panelShow(newId)`** — centrálna funkcia; sleduje `_panelCurrent`, počíta smer animácie, zobrazuje nový panel s `z-index:1600` nad starým (ten zmizne až po dokončení animácie) → eliminuje flash prázdneho pozadia
- **CSS**: `@keyframes panelSlideUp`, `.panel-anim-up` (0.32s), `.panel-anim-l/.panel-anim-r` (0.22s, reuse `mgrSlideL/R` keyframy)

#### Login animácia — slide up z dola
- Po úspešnom prihlásení (akýkoľvek mód — reprezentant aj manažér) sa `.app` element vysunutie zdola: `translateY(100vh)→0` za 0.38s
- **`@keyframes appEnter`** + trieda `.app-enter` (s `fill-mode:both`)
- Implementácia v `loginSuccess()`: pred skrytím login screenu sa pridá `.app-enter`, po 500ms sa trieda odstráni

#### Q tab animácie v Plnení (manažér aj reprezentant)
- Prepínanie Q1/Q2/Q3/Q4 tabov animuje obsah pod tabmi (nie taby samotné) directional slideom
- **`_animPlQ(elId, dir)`** — helper; reštartuje animáciu cez `void el.offsetWidth` reflow
- **Manažér Plnenie** (hlavný zoznam): obsah obálený do `<div id="pl-q-content">`, animuje `plnenieSwitchQ()`
- **Rep Plnenie overlay**: obsah obálený do `<div id="rep-pl-q-content">`, animuje `repPlnenieSwitchQ()`

#### Manažér Plnenie — prechod na detail reprezentanta
- **Klik na reprezentanta** (`plnenieOpenDetail`): detail panel (`#mgr-plnenie-detail`) vsunie sa sprava (`panel-anim-r`)
- **Späť na zoznam** (`plnenieCloseDetail`): detail panel vysunie sa doprava (`pl-detail-exit-r`), po 230ms sa skryje; zoznam sa objaví bez animácie pod ním
- **CSS**: `@keyframes plDetailExitR{from{translateX(0);opacity:1}to{translateX(28px);opacity:0}}`, `.pl-detail-exit-r`

#### Q tab animácie v detaile reprezentanta (manažér)
- Obsah pod Q tabmi v detaile (`#pl-detail-q-content`) animuje directional slide pri prepínaní Q — rovnako ako v hlavnom zozname
- **Len produkt sekcia** (`#pl-detail-prods-lbl` + `#pl-detail-prods` + `#pl-detail-trend`) je v wrapperi — tmavá súhrnná karta (`#pl-detail-total-card`) ostáva statická
- `plnenieSwitchQ()` detekuje `PL_STATE.detailRep` a animuje buď `pl-q-content` (zoznam) alebo `pl-detail-q-content` (detail)

#### Fix rebríček — intermittent "Žiadne dáta" (race condition)
- **Root cause**: `lbLoadData()` bežal s 2-sekundovým delay po logine; ak `getAllHistory` fetch zlyhal a fallback individuálne requesty tiež vrátili prázdne polia, `LB_STATE.data` bol nastavený na `{rep1:[], rep2:[], ...}` — non-null ale bez dát → `lbRender()` zobrazil "Žiadne dáta" a pri ďalšom otvorení rebríčka sa cachované prázdne dáta renderovali znovu
- **`lbDataHasVisits()`** — nová helper funkcia; vracia `true` ak aspoň jeden rep v `LB_ALL_REPS` má neprázdne pole v `LB_STATE.data`
- **`lbSyncTabs()`** — nová helper funkcia; syncuje `.active` triedu na `.lb-tab` tlačidlách podľa aktuálneho `LB_STATE.period` (oproti predchádzajúcemu stavu keď sa tabs desynchronizovali)
- **Logika pri otvorení rebríčka** (oboje `mgrSwitchSubtab('leaderboard')` aj `openLeaderboard()`): ak `LB_STATE.data` existuje ale `lbDataHasVisits()` vracia `false` → `lbLoadData(true)` (force reload) namiesto renderingu prázdnych dát

### v2.7.6 — Slide-in animácie + fix rebríčka

#### Slide-in animácie pri otváraní overlayov
- `.hist-overlay`, `.lb-overlay`, `.rep-plnenie-overlay` — pôvodná CSS animácia `slideRight` nahradená JS-riadenou `_panelShow()` architektúrou (pozri v2.7.7)
- `@keyframes slideRight` ostáva v kóde (referencovaný fallback)

#### Directional slide pri prepínaní manažérskych subtabov
- Pri prepínaní Plnenie ↔ Návštevy ↔ Rebríček sa aktívny panel vsúva z príslušnej strany
- `MGR_TAB_ORDER = { plnenie:0, visits:1, leaderboard:2 }` — poradie určuje smer
- Prepínanie doprava (Plnenie → Návštevy → Rebríček): animácia `mgrSlideR` (vpravo)
- Prepínanie doľava: animácia `mgrSlideL` (vľavo)
- `mgrAnimateSubtab(tab, dir)` — pridá/odstráni CSS triedu, `void el.offsetWidth` reštartuje animáciu
- CSS: `.mgr-anim-l{animation:mgrSlideL .2s ...}`, `.mgr-anim-r{animation:mgrSlideR .2s ...}`

#### Fix rebríčka — default period 'all' namiesto 'month'
- `LB_STATE.period` zmenené z `'month'` na `'all'` — rebríček vždy ukazuje celkové dáta pri prvom otvorení
- Predtým: ak v aktuálnom mesiaci neboli záznamy, rebríček ukázal "Žiadne dáta" napriek tomu, že historické dáta existujú
- Aktívne tlačidlo v `.lb-tabs` zmenené z "Mesiac" na "Celkové" (v oboch výskytoch — manager aj rep overlay)
- Manažér/reprezentant môže prepnúť na "Mesiac" alebo "Kvartál" podľa potreby

### v2.7.5 — Konzistentné farby avatárov

- Predtým: farba priradená podľa `idx` (poradia v poli zo Sheets) → pri zmene poradia alebo pridaní nového reprezentanta sa farby zmenili pre všetkých
- Oprava: funkcia `strHash(login)` — deterministický hash z loginu → vždy rovnaká farba pre toho istého reprezentanta bez ohľadu na poradie

### v2.7.4 — Empty state ilustrácie

- Nahradené všetky holé texty a emoji prázdnych stavov konzistentnými SVG ilustráciami
- CSS: nová trieda `.empty-state` s `flex` layoutom, `.empty-state-title`, `.empty-state-sub`
- JS: objekt `_ES` s 5 inline SVG ikonami + helper funkcia `mkEmpty(icon, title, sub)`
- 5 variant ikon podľa kontextu:
  - `clipboard` (modrá) — žiadne záznamy, história
  - `podium` (žltá) — žiadne dáta v rebríčku alebo plnení
  - `search` (sivá) — žiadne zhody vyhľadávania
  - `people` (modrá + zelená) — žiadni reprezentanti
  - `warning` (červená) — chyba načítania
- Nahradených 7 miest: história (2×), rebríček, plnenie (2×), manažér zoznam, manažér história

### v2.7.3 — Automatická aktualizácia cez Service Worker

#### Čo sa zmenilo
- SW bol predtým deaktivovaný (unregister pri každom načítaní) — teraz je znova aktívny (`sw.js` sa registruje)
- Stratégia SW: network-first pre HTML (vždy sviežie keď online), cache-first pre ostatné assety (rýchly offline štart)
- Nový malý tmavý toast (`#sw-toast`) dole na obrazovke nahrádza veľký zelený banner pre tichý update

#### Logika auto-updatu
- Keď nový SW prevezme kontrolu (`controllerchange`) alebo `version.json` detekuje novú verziu:
  - **App idle** (žiaden overlay/formulár otvorený) → okamžite toast *"Aktualizujem appku…"* + `location.reload()` po 900ms
  - **Formulár otvorený** → nastaví sa flag `_swUpdatePending = true`, reprezentant nič nevidí, dopíše záznam
  - Po zatvorení formulára interval (každé 2s) zachytí flag → toast + reload

#### Zelený banner
Zostáva v kóde ako fallback — zobrazí sa ak by `_applySwUpdate` z nejakého dôvodu nezafungoval.

#### Dôležité pre testovanie
V Chrome DevTools → Application → Service Workers možno manuálne triggernúť update: klik "Update" → zobrazí sa waiting worker → klik "skipWaiting" → mal by sa objaviť toast a auto-reload.

### v2.7.2 — UX zoznam reprezentantov v plnení

- Každý riadok reprezentanta je teraz samostatná kartička s `gap:6px` medzerou (predtým: jeden blok s tenkými deličmi)
- Medaily 🥇🥈🥉 pri prvej trojke sú väčšie (`font-size:26px` vs. `17px` pre ostatné pozície) — trieda `.pl-rep-medal.pl-top`

### v2.7.1 — Skeleton screens + opravy rebríčka

#### Skeleton screens (shimmer efekt)
- Nahradili všetky spinnery a loading texty (`lb-loading`, `pl-loading`, `hist-empty`, `mgr-list` placeholdery) responzívnymi shimmer skeletonmi
- CSS: shimmer animácia cez `background: linear-gradient` + `background-size:200%` + `@keyframes shimmer` — triedy `.skel-line`, `.skel-circle`, `.skel-card`
- 5 JS funkcie generujú skeleton HTML: `skelLb()`, `skelHist()`, `skelPl()`, `skelRepPl()`, `skelMgrList()`
- Statické HTML templaty (`mgr-list`, `pl-rep-list`, `mgr-lb-body`, `lb-body`) tiež nahradené inline skeleton HTML pre stav pred prvým načítaním

#### Oprava `parseLbDatum()` — formát dátumu D.M.YYYY
- `new Date('26.4.2026')` vracia Invalid Date vo všetkých prehliadačoch (slovenský formát nie je štandardný ISO)
- Pridaná funkcia `parseLbDatum(str)`: najprv skúsi ISO parse, ak neuspeje, rozloží cez `split('.')` na deň/mesiac/rok
- Rebríček mesačný/kvartálny filter teraz korektne filtruje záznamy zo Sheets

#### Oprava `allHist.ok !== false` — chyba pri neoprávnenom prístupe
- `getAllHistory` API vracalo `{ok:false}` pre neoprávnený prístup
- Tento response bol chápaný ako validný objekt s prázdnymi poľami reprezentantov → rebríček zobrazoval "Žiadne dáta"
- Pridaná explicitná kontrola `allHist.ok !== false` → ak false, padne do catch a spustí sa fallback (individuálne `getHistory` volania)

#### Oprava timing bugu v rebríčku (skeleton pri background loade)
- Pri kliknutí na Rebríček hneď po prihlásení: `mgrSwitchSubtab` volal `lbLoadData()` ktorý okamžite vrátil (guard `LB_STATE.loading === true`) — žiadny skeleton, žiadny obsah
- Oprava: explicitná kontrola `if (LB_STATE.loading)` v `mgrSwitchSubtab` → zobrazí skeleton ihneď, kým background fetch dobehne

### v2.7.0 — Animovaný checkmark + confirm UX

#### Animovaný checkmark v success popupe
- Pri odoslaní záznamu sa zobrazí žltý CSS spinner počas čakania
- Po odoslaní (2500ms): spinner zmizne, zelený SVG kruh sa nakreslí (500ms ease), potom sa vpíše checkmark (300ms ease), nasleduje bounce efekt celého SVG
- Implementácia: Web Animations API (`element.animate()`) na `stroke-dashoffset` SVG vlastnostiach — spoľahlivejšie ako CSS transitions pre SVG elementy

#### Zjednodušená confirm obrazovka
- Odstránená otázka "Chceš zadať ďalšieho lekára?" a dva tlačidlá (Nie, končím / Áno, ďalší)
- Nahradené jedným tlačidlom **"Pokračovať"** ktoré zatvorí overlay a vráti prázdny formulár

### v2.6.9 — Fix preloadu trhových podielov (race condition)

#### Problém
`preloadAllPharmaData()` bola volaná po 2500ms od prihlásenia, ešte pred tým ako `loadRepList()` dokončilo fetch zo Sheets a aktualizovalo `USERS_LOCAL`. Výsledok: preload prebehol so starými/hardkódovanými hodnotami oblastí → iné cache kľúče → pri kliknutí na trhový podiel vždy cache miss → načítavalo sa odznova.

#### Oprava
`preloadAllPharmaData()` sa teraz volá aj na konci `loadRepList()` (po úspešnom `buildRepData()`), teda vždy so zaručene čerstvými hodnotami oblastí zo Sheets. Tým je garantované, že cache kľúče sedia a pri otvorení trhového podielu sú dáta okamžite dostupné.

### v2.6.8 — Animácie rebríček + plnenie

#### Podium bloky v rebríčku
- Stĺpce pod avatarmi (`.lb-p-block`) vyrastú zdola nahor pri načítaní rebríčka — `scaleY(0→1)` s `cubic-bezier(0.34,1.56,0.64,1)` (mierne elastic efekt), každý stĺpec s 80ms oneskorením za sebou.

#### Count-up animácia celkového % plnenia
- Pri načítaní plnenia (admin detail aj rep mód) sa veľké % číslo animovane počíta od `0,00%` po finálnu hodnotu za ~0.9s s ease-out cubic easing.
- Funkcia `plnenieCountUp(el, targetPct)` — zdieľaná pre oba módy.

**2.6.7** — obsahuje všetko z 2.6.6 plus: UX vylepšenia floating tlačidla Potvrdiť.

### v2.6.7 — Floating tlačidlo Potvrdiť — UX vylepšenia
- Bočné sivé oblasti vedľa tlačidla sú priesvitné — pozadie (blur) je len priamo za tlačidlom (`.submit-inner` je transparent, blur presunutý na `.submit-inner-content`).
- Tlačidlo sedí na samom spodku obrazovky bez medzery — odstránený `padding:0 0 8px` zo `.submit-wrap` a spodný padding zo `.submit-inner`.
- Tvar (border-radius 50px pill) je jednotný v oboch stavoch — pri scrollovaní aj na spodku formulára.

### v2.6.6 — Vycentrovaný header rebríčka
- `.lb-hdr` má `text-align:center` — nadpis „Rebríček tímu" aj podtitul sú vycentrované.

**2.6.5** — obsahuje všetko z 2.6.4 plus: trend graf trhového podielu, animácie progress barov.

### v2.7.41 — Graf trhového podielu s konkurentmi (PharmaData_Graf)

#### Nový trend graf v overlay Trhový podiel
- **Čo sa zmenilo:** Starý kvartálny graf (Teritoriálny MS + Slovenský MS) nahradený novým mesačným grafom s konkurentmi
- **Zobrazuje:** Náš produkt (výrazná čiara, zelená = rast / červená = pokles) + top 3 konkurenti (tenšie, 55% opacity)
- **Rozsah:** Posledných 6 mesiacov z `PharmaData_Graf`
- **Animácia:** `stroke-dashoffset` draw animácia pri otvorení; kliknutie na položku v legende prehrá animáciu danej čiary + stlmí ostatné
- **Legenda:** 2×2 grid, každá položka zobrazuje meno + poslednú hodnotu tučne (napr. `SUPRAX · 19.6%`)
- **Label poslednej hodnoty:** Vždy nad posledným bodom nášho produktu, s bielym pozadím pre čitateľnosť
- **Asynchrónne načítanie:** `PHARMA_GRAF_STATE` cache oddelená od `PHARMA_STATE`; placeholder div `#pharma-graf-chart` sa vyplní keď prídu dáta; ak 0 riadkov → placeholder sa po 6s skryje
- **Preloading:** `preloadAllPharmaData()` teraz načítava aj `getPharmaGraf` dáta simultánne s `getPharmaData`
- **DEV mock:** `MOCK_PHARMA_GRAF` objekt s 12 mesiacmi pre VID, SUP, CAV, KOGGOL, AFL varianty

#### Nové funkcie v index.html
- `loadPharmaGrafData(code, oblast, callback)` — fetch na `getPharmaGraf` s DEV mock fallback
- `fillGrafChart(code, oblast)` — asynchrónne vyplní `#pharma-graf-chart` div
- `buildGrafChartHtml(code, oblast)` — renderuje SVG graf zo `PHARMA_GRAF_STATE` cache
- `pharmaReplayLine(key)` — animácia jednej čiary pri kliknutí na legendu
- `calcLinearTrend(vals)` — lineárna regresia (definovaná ale nepoužívaná — trendová línia vypnutá)

#### graf_konverter.html (nový súbor)
- Samostatný konvertor pre záložku `MS_ChartTab` z IQVIA Excel súborov
- Výstup: TSV s top 3 konkurentmi pre záložku `PharmaData_Graf` v Google Sheets
- **NEKONFUZNUŤ** s `pharma_converter.html` — ten je na Summary/Okresy dáta

#### kód.gs — nový endpoint `getPharmaGraf`
- Číta z `PharmaData_Graf`, filtruje podľa `produkt` + `oblast`, zoradí podľa `mesiac`

---

### v2.6.5 — Trend graf trhového podielu + animácie

#### Trend graf v overlay Trhový podiel
- **Čo:** Po kliknutí na „📊 Trhový podiel" sa zobrazí čiarový SVG graf vývoja MS po kvartáloch (od najstaršieho dostupného Q po aktuálny).
- **Dáta:** Žiadny extra fetch — dáta sú už v `summArr` (endpoint `getPharmaData` vracia summary pre všetky mesiace naraz, bez filtrovania po kvartáli). Mesiace sa zoskupujú po kvartáloch priamo v JS.
- **Dve línie:** Teritoriálny MS (zelená/červená podľa vs. SK) a Slovenský MS (modrá).
- **Hodnoty pri bodkách:** Každý bod má label s hodnotou v %. Kolízia labelov sa rieši dynamicky — porovnajú sa y-pozície oboch línií a labely sa roztiahnu od stredu ak sú príliš blízko.
- **Zarovnanie krajných labelov:** Prvý bod má `text-anchor="start"`, posledný `text-anchor="end"` — labely nevypadnú mimo okraj grafu.
- **Y-os:** Dynamický krok podľa rozsahu dát (≤4% → krok 1, ≤10% → 2, ≤20% → 5, inak 10) — max 4–5 grid čiar.
- **Animácia čiar:** `stroke-dashoffset` trik — čiary sa dokreslujú za 1.6s (`cubic-bezier(0.4,0,0.2,1)`), body sa vyblasknú s oneskorením po dokončení čiar.
- **Kde platí:** Obaja — admin/manažér aj reprezentant (zdieľaná funkcia `pharmaRender()`).
- **Legenda:** Vycentrovaná (`justify-content:center`).

#### Názov okresu v rozpad po okresoch
- Tmavý navy header pás naprieč celou kartou (`background:#0C1E35`, biely uppercase text) — jasne odlíšený od názvov produktov.

#### Animácia progress barov v Plnení
- Bary sa renderujú s `width:0` + `data-bar-w` atribút, po vložení do DOM `animatePlanBars()` postupne animuje každý bar na finálnu šírku (1s, s 60ms oneskorením medzi barmi).
- Platí pre oba módy: admin (`plnenieRenderDetail`) aj reprezentant (`repPlnenieRender`).

### v2.6.4 — Fix trhový podiel v admin detaile

**Bug:** Keď admin/manažér otvoril detail reprezentanta v Plnení a prepol na Q2 (alebo iný kvartál), kliknutie na „📊 Trhový podiel" zobrazilo vždy dáta za Q1. Reprezentantom fungoval správne.

**Príčina:** `openPharmaMs()` brala vždy `REP_PL_STATE.q` (stav rep overlay), ktorý bol inicializovaný na `q: 1`. Admin Q taby volajú `plnenieSwitchQ()` → aktualizujú `PL_STATE.q`, nie `REP_PL_STATE.q`.

**Fix:** `openPharmaMs()` teraz zistí, ktorý overlay je otvorený (`rep-plnenie-overlay` = rep pohľad → `REP_PL_STATE.q`, inak admin pohľad → `PL_STATE.q`).

**2.6.3** — obsahuje všetko z 2.6.2 plus: zobrazenie zadaných hodnôt produktov v zázname lekára (bez €), fix scroll pozície pri otváraní záznamu.

### v2.6.3 — Zadané hodnoty v zázname lekára

- **Zadané hodnoty produktov v histórii:** Keď reprezentant otvorí záznam lekára v histórii, zobrazí sa sekcia „Zadané hodnoty" so 4 produktmi a ich počtami (bal./mes. pre Aflamil/Suprax, pac./mes. pre Vidonorm/Cavinton Forte). Bez EUR hodnôt — tie sú interná veličina.
- **Fix scroll pozície:** Pri otvorení záznamu lekára v histórii sa overlay vždy scrolluje na vrch (predtým si pamätal scroll pozíciu predchádzajúceho záznamu).

### v2.6.2 — Vizuálne vylepšenia

#### Rep nav bar — živé badges
Všetky 3 tlačidlá v rep nav bare (`História`, `Rebríček`, `Plnenie`) zobrazujú relevantné číslo automaticky po prihlásení:
- **📋 História `5`** — počet záznamov (existovalo, nezmenené)
- **🏆 Rebríček `#3`** — pozícia reprezentanta v aktuálnom mesiaci (`lbUpdateNavBtn()`, volá sa z `onDone()` v `lbLoadData()`)
- **💊 Plnenie `88%`** — % plnenia aktuálneho kvartálu (`repPlnenieUpdateNavBtn()`, volá sa po dokončení všetkých fetchov v `repPlnenieLoad()`)

Farebná logika pre Plnenie badge: zelená ≥100%, oranžová ≥95%, červená <95%.
Farebná logika pre Rebríček badge: tmavá `#0C1E35` (neutrálna, pozícia nemá farbu).

#### Submit tlačidlo — pulzujúca žiara
Tlačidlo **Potvrdiť** má CSS animáciu `submitGlow` (2.2s, `ease-in-out infinite`) keď je viditeľné v plnom zobrazení (`.submit-wrap.at-bottom .btn-submit`). Animácia pulzuje zelenou žiarou `box-shadow`. Pri hover a active stave sa animácia zastaví (`animation:none`).

#### Progress bar — hrubší
Progress bar na hlavnej obrazovke reprezentanta: `height` zmenená z `6px` na `8px`, `border-radius` z `3px` na `4px`. Gradient pri 100% (`complete`) zmenený na `linear-gradient(90deg,#059669,#10B981)` namiesto solid farby.

#### Rebríček — podium vizuál
- Avatar 1. miesta: `64px` (bol `52px`), zlatý ring `box-shadow:0 0 0 3px #FBBF24,0 0 0 5px rgba(251,191,36,.25)` + žiara
- Korunka 👑: väčšia (`26px`, bol `15px`), pozicionovaná `top:-22px;left:50%;transform:translateX(-50%)` — nasadená na kruhu avatara
- Strieborná medaila 🥈 na 2. mieste: `position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);font-size:22px` — zavesená dole z avatara
- Bronzová medaila 🥉 na 3. mieste: rovnaké poziciovanie ako strieborná
- Avatary 2. a 3. miesta: `margin-bottom:20px` aby meno nesplývalo s medailou

#### EUR súčet v Plnenie sumári — väčší
Číslo predajov v pravom hornom rohu sumárnej karty (napr. `2 992 755 €`) zväčšené z `11.5px` na `20px` (Outfit font). Text "z plánu X €" zväčšený z `10.5px` na `11.5px`. Platí pre manažérsky aj reprezentantský sumár.

#### Ohnostroj pri otvorení rebríčka
Po načítaní rebríčka sa spustí ohnostroj z avatara 1. miesta (`lbConfetti()`):
- **3 výbuchy** — hneď, po 600ms a po 1200ms, všetky zo stredu `.lb-p-1 .lb-p-avatar`
- Každý výbuch: ~28–40 iskier letiacich do všetkých strán s gravitáciou a odporom vzduchu
- Každá iskra má `trail` (chvost 6 bodov) pre efekt svietiacich iskier
- Farby sa líšia pri každom výbuchu (13 farieb v palete)
- Spúšťa sa cez `LB_STATE.showConfetti = true` flag — nastavuje sa v `openLeaderboard()` a `mgrSwitchSubtab('leaderboard')`, vykonáva sa v `lbRender()` až po skutočnom vykreslení dát (nie počas načítavania)
- Funguje pre reprezentantov aj manažérov
- Canvas: `position:fixed`, `z-index:99999`, `pointer-events:none`, zmizne po 3s

#### Drobné UX/vizuálne fixy (z predchádzajúcej session)
- Touch targety zvýšené na min. 44px pre všetky taby, tlačidlá Späť, Odhlásiť, rep nav bar
- Malé fonty 9–9.5px zvýšené na 11px (trend-bar-val, ms-labels atď.)
- Gap v `.mgr-stats` zjednotený na `8px` (bol mix 7px/9px)
- Label "Reprezent." v manažérskych štatistikách premenovaný na "Tím"
- Tlačidlo 📊 Trhový podiel: viditeľnejší border `#E2E8F0` a pozadie `#F8FAFC`

---

### v2.6.1 — Trhový podiel v manažérskom móde (pôvodný obsah)

### v2.6.0 — Trhový podiel (Pharma MS overlay)

#### Čo je nové
Každý produkt v Rep Plnenie overlaye má tlačidlo **📊 Trhový podiel**. Po kliknutí sa otvorí overlay s market share dátami z Google Sheets.

#### Dátová štruktúra (Google Sheets)
- **`PharmaData_Summary`** — teritoriálny a SK market share po mesiacoch (YYMM formát napr. `2601` = jan 2026)
  - Stĺpce: `produkt | oblast | mesiac | terit_ms | sk_ms`
- **`PharmaData_Okresy`** — rozpad po okresoch s mesačnými hodnotami pre náš produkt + top 3 konkurenti
  - Stĺpce: `produkt | oblast | okres | kvartal | nas_m1 | nas_m2 | nas_m3 | k1_nazov | k1_m1 | k1_m2 | k1_m3 | k2_nazov | k2_m1 | k2_m2 | k2_m3 | k3_nazov | k3_m1 | k3_m2 | k3_m3`
- **`PharmaData_Graf`** — mesačný MS% trend nášho produktu + top 3 konkurenti (posledných 6–12 mesiacov)
  - Stĺpce: `produkt | oblast | mesiac | nas_ms | k1_nazov | k1_ms | k2_nazov | k2_ms | k3_nazov | k3_ms`
  - Dáta generuje **`graf_konverter.html`** zo záložky `MS_ChartTab` v Excel súboroch IQVIA
- Kvartal kód formát **YYQQ**: `2601` = Q1 2026, `2602` = Q2 2026 atď.
- Dáta do Sheets sa generujú cez **`pharma_converter.html`** (Summary + Okresy) a **`graf_konverter.html`** (Graf)

#### pharma_converter.html
- Nástroj na konverziu Excel súborov (formát `202603_TEL_e_KE.xlsx`) do TSV na kopírovanie do Sheets
- `raw: true` — číta skutočné hodnoty z buniek (nie formátovaný text) → správne desatinné čísla
- Summary záložka detekovaná podľa **názvu** (`MS_e_KE`, `MS_w_BA`) — nie podľa obsahu (predchádzajúci bug)
- District záložky detekované podľa kvartal kódov (4 cifry, rozsah 2401–2699)
- Výstup: 2 desatinné miesta pre všetky MS hodnoty
- **NIKDY neupravovať** — je to Ivanův nástroj na iné použitie. Pre graf dáta slúži `graf_konverter.html`

#### graf_konverter.html
- **Nový** standalone nástroj (nie pharma_converter.html!) pre konverziu `MS_ChartTab` záložky z Excel súborov
- Vstup: rovnaké IQVIA Excel súbory ako pharma_converter.html (formát `202603_TEL_e_KE.xlsx`)
- Záložka `MS_ChartTab`: riadok s hlavičkou obsahuje `MESIAC` v stĺpci B, dáta v riadkoch pod ním
  - Rok: fill-down z prvého neprázdneho bunky v stĺpci A (každá skupina mesiacov má rok len raz)
  - Mesiace: čísla 1–12 v stĺpci B, subtotaly (kde B nie je 1–12) sa preskakujú
  - Hodnoty sú desatinné (0.118 = 11.8%) → konvertor ich násobí 100 pre výstup
- Výstup: TSV s top 3 konkurentmi podľa priemerného MS%, mesačný kód YYMM (napr. 2504 = apríl 2025)
- Kopíruje sa do záložky `PharmaData_Graf` v Google Sheets

#### Apps Script — endpoint `getPharmaData`
- **Parametre:** `oblast` (napr. `KE`), `produkt` (napr. `TEL`), `kvartal` (napr. `2601`)
- Číta z oboch Sheets (`PharmaData_Summary` + `PharmaData_Okresy`), filtruje podľa všetkých troch parametrov
- Odpoveď: `{ ok:true, summary:[{mesiac, terit_ms, sk_ms}], okresy:[{okres, nas_m1..3, k1:{name,m1..3}, k2, k3}] }`
- **Po každej zmene Apps Scriptu treba nasadiť novú verziu** (Nasadiť → Spravovať nasadenia → Nová verzia)

#### Apps Script — endpoint `getPharmaGraf`
- **Parametre:** `oblast` (napr. `KE`), `produkt` (napr. `VID`)
- Číta z `PharmaData_Graf`, filtruje podľa `produkt` a `oblast`, zoradí podľa `mesiac`
- Odpoveď: `{ ok:true, produkt, oblast, rows:[{mesiac, nas_ms, k1_nazov, k1_ms, k2_nazov, k2_ms, k3_nazov, k3_ms}] }`
- Ak `rows.length < 2` → appka nezobrazí graf (placeholder sa po 6s skryje)

#### Kódy produktov (`PHARMA_CODES`)
```javascript
'aflamil_kr'            → ['AFLcrm']
'aflamil_tablety_sacky' → ['AFLtbl', 'AFLsach']  // Tablety tab prvý
'cavinton'              → ['CAV']
'suprax'                → ['SUP']
'telexer'               → ['TEL']
'vidonorm'              → ['VID']
'junod'                 → ['JUN']
'kogavant'              → ['KOGGOL']
```

#### PHARMA_STATE
```javascript
var PHARMA_STATE = {
  open: false,
  loading: {},        // per-cacheKey objekt — umožňuje paralelné fetche
  activeCode: null,
  codes: [],
  oblast: null,
  kvartal: null,
  cache: {}           // kľúč: 'CODE_OBLAST_KVARTAL' (napr. 'TEL_KE_2601')
};
```

#### Kvartal kódy — pomocné funkcie
- `pharmaKvartalCode(year, q)` → napr. `pharmaKvartalCode(2026, 1)` = `'2601'`
- `pharmaQuarterMonths(kvartal)` → napr. `'2601'` = `['2601','2602','2603']` (YYMM mesiace v Q)

#### Pharma overlay — UI
- Header: biely pill tlačidlo "← Späť" (štýl `mgr-back`) + titulok `Trhový podiel · Q1 2026 · Aflamil krém`
- Tmavá karta: 2-stĺpcový layout — **Teritoriálny MS** (zelený ak ≥ SK MS, červený ak nižší) | **Slovenský MS** (modrý)
- Mesačný trend (M1 M2 M3) pod kartou
- Tabuľka po okresoch: náš produkt (modrý, tučný) + top 3 konkurenti
- Aflamil tablety/sáčky: 2 subtaby — **Tablety** vľavo, **Sáčky** vpravo
- Tlačidlo "📊 Trhový podiel" v produkte: svetlosivé (`#F1F5F9`), celá šírka karty

#### Preload stratégia (dôležité!)
Pharma dáta sa fetchujú **paralelne na pozadí** v 3 situáciách:
1. `loginSuccess()` — 1.5 s po prihlásení (prvé prihlásenie)
2. `initLogin()` — 1.5 s po reloade stránky s existujúcou session (PWA restart, OS discard tab)
3. `visibilitychange` — keď appka príde z pozadia a `PHARMA_STATE.cache` je prázdna

Tým je zaistené, že keď reprezentant klikne na Trhový podiel, dáta sú už v cache → žiadny spinner.

**Pravidlo:** `PHARMA_STATE.loading` je **objekt** (nie boolean) — každý cacheKey má vlastný flag → paralelné fetche fungujú bez blokovania.

---

### v2.6.1 — Trhový podiel v manažérskom móde

#### Čo je nové
Tlačidlo **📊 Trhový podiel** je teraz dostupné aj v manažérskom detaile reprezentanta (`plnenieRenderDetail`), nielen v rep Plnenie overlaye.

#### Oblast — kritické pravidlo
V manažérskom móde sa oblast pre pharma fetch berie ako **raw `USERS_LOCAL[rep].region`** bez normalizácie. Funkcia `pharmaOblastFromRegion` sa v manažérskom móde **nesmie používať** — normalizuje `BAMA`→`BA` a `BASE`→`BA`, čo nespôsobuje zhodu so Sheets hodnotami.

```javascript
// pharmaGetOblast() — manažérský mód
if (document.body.classList.contains('manager-mode')) {
  var rep = PL_STATE.detailRep;
  if (rep) return (USERS_LOCAL[rep] && USERS_LOCAL[rep].region) || '';
  return '';
}
```

Regióny podľa reprezentanta (hodnoty v `PharmaData_Summary.oblast`):
- `j.bohovic` → `BAMA`, `v.hatinova` → `BASE` (tieto dvaja by boli chybne normalizovaní na `BA`)
- Ostatní (`DS`, `TN`, `MT`, `NR`, `LV`, `RS`, `PP`, `PO`, `MI`, `KE`) — normalizácia ich nemenila

#### Preload pre manažéra
Pharma dáta sa preloadujú pre všetky oblasti všetkých reprezentantov v 4 situáciách:
1. `loginSuccess()` — 2500ms po prihlásení manažéra
2. `initLogin()` — 2500ms po reloade s existujúcou session
3. `buildRepData()` dokončenie — keď `getRepList` dobeží a manažér je prihlásený
4. `visibilitychange` — keď appka príde z pozadia a cache je prázdna

V `preloadAllPharmaData()` sa iteruje cez `USERS_LOCAL`, zbierajú sa unikátne oblasti (`seenOblasts`) a pre každú sa fetchujú všetky kódy — bez normalizácie.

#### Ďalšie fixy v v2.6.1
- **Aflamil tbl a sáčky — default tab:** `PHARMA_CODES['aflamil_tablety_sacky']` = `['AFLtbl', 'AFLsach']` — Tablety sú prvé, teda `activeCode = codes[0] = AFLtbl`. Poradie v tomto poli určuje ktorý subtab sa zobrazí ako prvý.
- **Q persistencia v manažérskom detaile:** `plnenieOpenDetail()` už nevynucuje prepnutie na aktuálny Q. `PL_STATE.q` sa zachová — ak manažér prepol na Q1 a klikne na reprezentanta, detail ostane na Q1. Defaultný Q (aktuálny) sa nastavuje raz pri `mgrEnter()`.
- **Farba míľnikov a popiskov (ms-labels):** Pre minulé Q dostávajú všetky popisky (Začiatok, Jan·32%, Feb·65%, Koniec Mar) triedu `active` → čierne. Pre aktuálny Q: Začiatok + uplynulé mesiace = `active` (čierne), budúce = default (šedé). Milestone čiarky: budúce dostávajú triedu `future` → `background:#CBD5E1` (šedé).
- **Farba mesiacov v month-rows:** Trieda `past` (= `!isFuture`) sa pridáva na `mrow-lbl` aj `mrow-plan` → `color:#0C1E35` (čierna). Budúce mesiace ostávajú šedé. Font `mrow-plan` zjednotený s `mrow-lbl` (9.5px, bold, letter-spacing).
- **prod-money vycentrovaný:** `text-align:center` na `.mrow-plan` aj `.prod-money` v oboch scopoch (`mgr-plnenie-detail` aj `rep-pl-inner`).

---

### v2.5.2 — Dynamický zoznam reprezentantov zo Sheets

**Kľúčová zmena:** Mená, skupiny (West/East) a regióny reprezentantov sa už **nenachádzajú hardcoded v kóde**. Po prihlásení appka fetchne zoznam zo Sheets cez nový endpoint `getRepList`.

#### Čo bolo hardcoded a teraz je dynamické:
- `MGR_REP_NAMES` — mapa username → celé meno
- `MGR_AM_WEST` / `MGR_AM_EAST` / `MGR_ALL` — skupiny West/East
- `MGR_ROLE_CFG` — reps polia pre jednotlivé roly
- `LB_REP_INFO` — info pre rebríček (meno, región, farba)
- `LB_ALL_REPS` — poradie v rebríčku
- `USERS_LOCAL` — fallback región per username

#### Nové funkcie:
- `loadRepList()` — fetchne `?action=getRepList`, zavolá `buildRepData()`, pri chybe ticho failne
- `buildRepData(reps)` — z poľa `{login, meno, rola, region}` zostaví všetky vyššie konštanty. West prídu pred East (v poradí zo Sheets). Farby avatárov v rebríčku sú auto-pridelené z `LB_COLOR_PALETTE` (12 farieb, cyklicky).
- `REP_LIST_STATE` — `{ loaded, loading }` — guard proti dvojitému fetchu

#### Kedy sa volá:
- Hneď pri `loginSuccess()` (pred setTimeout pre lbLoadData/plnenie)
- Hneď pri `initLogin()` pre vracajúce sa session (pred mgrRole kontrolou)

#### Fallback (keď getRepList ešte nenačítal):
- `lbRender()` — ak `LB_ALL_REPS` je prázdne, zobrazí reprezentantov z `Object.keys(LB_STATE.data)` (tí čo majú nejaké záznamy)
- Všetky ostatné moduly — prázdne polia/objekty, kým sa nenačíta

#### Apps Script (`apps_script/kód.gs`):
- Nový endpoint `?action=getRepList` — číta záložku `Pouzivatelia`, vracia všetky riadky kde `rola === 'rep west'` alebo `rola === 'rep east'`
- Odpoveď: `{ ok: true, reps: [{login, meno, rola, region}, ...] }`
- **DÔLEŽITÉ:** Po aktualizácii Apps Script treba nasadiť novú verziu (Nasadiť → Spravovať nasadenia → Nová verzia) — bez toho sa endpoint neprejaví

### v2.5.3 — Fix prázdnych reprezentantov pri prvom otvorení
- **Problém:** v2.5.2 vyčistil všetky polia na prázdne (`MGR_ALL = []`, `LB_ALL_REPS = []` atď.). Manažérsky view sa vykreslil okamžite po prihlásení, ale `getRepList` ešte nedobehol → zobrazilo "žiadni reprezentanti".
- **Riešenie:** Hardcoded defaults zostávajú ako okamžitá záloha. Keď `getRepList` dobeží, `buildRepData()` ich prepíše dátami zo Sheets. Ak `getRepList` zlyhá, app funguje s defaults.
- **Pravidlo do budúcna:** Pri dynamickom načítaní zo Sheets vždy zachovaj hardcoded defaults ako fallback — nikdy neštartuj s prázdnymi poliami.

### v2.5.1 — Oprava ke.rep → a.makis (Andrej Makiš, KE)
- Premenovaný účet `ke.rep` → `a.makis` vo všetkých miestach kde bol hardcoded
- Platné len historicky — od v2.5.2 sú tieto údaje dynamické zo Sheets

### v2.5.0 — Zjednotená navigácia + pre-loading

#### Rep navigácia (História / Rebríček / Plnenie)
- Všetky 3 sekcie sú teraz **full-screen overlaye** s rovnakým vizuálnym štýlom (svetlé pozadie `#EAECF2`)
- História prekonvertovaná z modalu (dark backdrop + box) na full-screen — rovnaký vzor ako Plnenie a Rebríček
- Nový **zdielaný panel-nav** (`.panel-nav`) hore v každej sekcii: `📋 História | 🏆 Rebríček | 💊 Plnenie + ✕`
- Aktívna sekcia je zvýraznená tmavo (`background:#0C1E35; color:#fff`)
- Kliknutím na tab v nav bare sa priamo prepneš do inej sekcie — bez návratu cez formulár
- `closeAllPanels()` — zatvára všetky 3 overlaye naraz a resetuje `body.overflow`
- Každý `openX()` najprv zatvorí ostatné dva overlaye bez resetovania `body.overflow`

#### Manažérský mód — Rebríček ako inline subtab
- Rebríček **nie je overlay** — zobrazuje sa inline ako `mgr-leaderboard-view` div v `mgr-view`
- Prepínanie medzi Plnenie / Návštevy / Rebríček zostáva na tej istej obrazovke (body CSS class toggle)
- CSS: `body.mgr-subtab-leaderboard .mgr-leaderboard-view{display:block}` + skryje `mgr-list-wrap`, `mgr-detail`
- Pre manažéra sa rebríček otvára cez `mgrSwitchSubtab('leaderboard')` (nie `openLeaderboard()`)
- `lbGetBody()` — helper funkcia; vracia `#mgr-lb-body` v manager mode, `#lb-body` pre reprezentanta
- `lbRender()` a `lbLoadData()` detekujú kontext cez `lbGetBody()`

#### Pre-loading dát po prihlásení
- **Rebríček** (`lbLoadData`): spustí sa 2 s po prihlásení na pozadí — pre všetky roly (rep, admin, AM)
- **Plnenie** (`repPlnenieLoad`): spustí sa 3,5 s po prihlásení — len pre reprezentantov (nie manažéri)
- Namiesto 12 individuálnych `getHistory` requestov rebríček používa jeden `getAllHistory` request (rýchlejší pre-load), s fallbackom na 12 requestov
- Ak sú dáta pri kliknutí už načítané → okamžité zobrazenie bez spinnera

### v2.4.4 — Predikcia plnenia konca kvartálu
- **Vzorec:** skutočné predaje za dokončené mesiace / mesačný plán pre tie mesiace. Mesačný plán = (Q plán / všetky pracovné dni v Q) × pracovné dni daného mesiaca.
- **Zobrazuje sa len pre aktuálny Q** a len ak existuje aspoň 1 dokončený mesiac (m < curMonth).
- **Tmavá súhrnná karta** (detail reprezentanta aj rep Plnenie overlay) — riadok "predikcia konca kvartálu XX%" pod čiarou oddeľovača
- **Trend graf** — prerušovaný šedý stĺpec pre aktuálny Q namiesto plného, pod ním popisok "predikcia". Míľniky (čierne deliace čiary) zobrazené iba pre aktuálny Q počas behu — nie pre minulé Q ani predikciu.
- **Per-produkt** — riadok s predikciou pod každým produktom, vycentrovaný
- **Slovensko / West / East sumárne karty** — predikcia v každej karte (funkcia `plnenieCalcPredikciaSummary` používa predajeEUR / súčet mesačných plánov pre dokončené mesiace)
- Kľúčové funkcie: `plnenieCalcPredikcia(q, year, qPlanTotal, predajeByMonth, productKey)`, `plnenieCalcPredikciaSummary(qPlanTotal, predajeEUR, q, year)`

### v2.3.0 — Plnenie (Predaje vs Plán) — manažérsky modul
- Nový tab 💊 **Plnenie** v manažérskom pohľade (vedľa Návštevy)
- Plnenie je **default tab** pri otvorení manažérskeho pohľadu (vľavo od Návštevy)
- Slovensko sumár: celkové % plnenia, regióny West/East, per-produkt prehľad
- Zoznam reprezentantov zoradený podľa % plnenia (medaily 🥇🥈🥉)
- Q taby (Q1–Q4), aktuálny Q predvolený
- Endpoint `getPlnenieAll` na Google Apps Script

### v2.3.1 — Detail reprezentanta + UX vylepšenia
- **Detail reprezentanta**: tmavá súhrnná karta, per-produkt progress bary s milestone čiarami
- Milestone čiary delené podľa pracovných dní — čierne, vyčnievajú po stranách, sivé % popisky
- Trend plnenia cez kvartály — stĺpcový graf, farby podľa výkonu (g/o/r)
- **Paralelný load** všetkých 4 kvartálov naraz → okamžité prepínanie Q tabov bez fetchu
- Detail pri prvom otvorení (po prihlásení) otvára aktuálny Q — ale zachováva vybraný Q ak manažér manuálne prepol na iný Q pred kliknutím na reprezentanta
- Všetci reprezentanti klikateľní aj bez dát (zobrazí "Žiadne dáta")
- Skrátený názov: "Aflamil tbl a sáčky", fix zalamovanie v Slovensko sumári
- Poradie produktov: Aflamil skupina pohromade (`PL_PRODUCT_ORDER`)
- Pull-to-refresh v Plnenie tab: vymaže cache, načíta všetko od znova

### v2.3.2 — Roly a regionálne filtrovanie
- **boss, bum, pm** — vidia Plnenie rovnako ako admin (všetci reprezentanti, Slovensko sumár)
- **AM West** — vidí iba West reprezentantov, hlavička "West · Q2 2026", bez region kariet
- **AM East** — vidí iba East reprezentantov, hlavička "East · Q2 2026", bez region kariet
- `plnenieGetActiveReps()` — helper, vracia správny zoznam repov podľa `MGR_STATE.role`
- `plnenieIsAmRole()` — true pre amwest/ameast, skryje region karty
- `plnenieSumLabel()` — "West" / "East" / "Slovensko" podľa roly

### v2.3.3 — Jednotná farebná logika v Plnenie
- `plnenieColorClass()` opravená: ≥100% zelená, 95–99,99% oranžová, <95% červená
- Platí všade: celkové % v sumári, West/East karty, produkty v sumári, % pri každom reprezentantovi

### v2.4.0 — Rep nav bar + Rep Plnenie overlay (vlastné plnenie pre reprezentantov)

#### Rep navigačný panel
- **Nový `.rep-nav` panel** pod headerom — 3 tlačidlá v rade: 📋 História | 🏆 Rebríček | 💊 Plnenie
- Nahradil malé badge tlačidlá (História, Rebríček) ktoré boli predtým vpravo v headri
- História tlačidlo má dynamický číselný badge (počet záznamov) — aktualizuje ho `updateBadge()`
- Panel je **automaticky skrytý v manažérskom móde** cez CSS `body.manager-mode .rep-nav { display:none !important }`
- Logout tlačidlo ostáva v headri (nezmenené)
- HTML ID pôvodného `#hdr-badge-wrap` zachovaný (skrytý `display:none`) kvôli JS kompatibilite — `updateBadge()` ho stále referencuje

#### Rep Plnenie overlay
- **Nový `.rep-plnenie-overlay`** — celostránkový fixed overlay (z-index 2000), otvorí sa po kliknutí na 💊 Plnenie v rep nav bare
- Zobrazuje **iba plnenie prihláseného reprezentanta** (filtruje podľa `session.username`)
- Obsah: tlačidlo „← Späť na formulár", tmavá celková karta, Q1–Q4 taby, produkty s progress barmi + milestone čiarami, trend graf
- Vizuálny štýl identický s manažérskym detailom (rovnaké CSS triedy: `total-card`, `prod-item-adv`, `bar-wrap`, `milestone`, `month-rows`, `trend-bars`) — CSS scopovaný cez `.rep-pl-inner`
- Zelená bodka na aktuálnom Q tabe vždy viditeľná (trieda `current` sa nastavuje pre curQ bez ohľadu na `active`)

#### REP_PL_STATE — stav rep Plnenie view
```javascript
var REP_PL_STATE = {
  q: 1,              // aktuálne zobrazený Q
  year: 2026,        // aktuálny rok
  loading: false,
  loaded: false,
  data: null,        // raw odpoveď z getPlnenieAll
  aggregates: null,  // vypočítané agregáty
  qCache: {}         // { 1: {data, aggregates}, ... } — cache pre všetky Q
};
```

#### Kľúčové funkcie (rep Plnenie)
- `openRepPlnenie()` — otvorí overlay, defaultne na aktuálny Q, použije cache ak je k dispozícii
- `closeRepPlnenie()` — zatvorí overlay, obnoví `body.overflow`
- `repPlnenieLoad()` — paralelný fetch Q1–Q4 (rovnaká logika ako `plnenieLoadAllQuarters`), uloží do `REP_PL_STATE.qCache`
- `repPlnenieSwitchQ(q)` — okamžité prepnutie z cache (bez fetchu)
- `repPlnenieUpdateQTabs()` — aktualizuje triedy tabov v `#rep-pl-q-tabs` (selektuje iba rep taby, nie manažérske)
- `repPlnenieRenderLoading()` — loading stav v overlaye
- `repPlnenieRender()` — hlavný render: celková karta + produkty + volá `repPlnenieRenderTrend()`
- `repPlnenieRenderTrend(username)` — trend graf, čerpá % zo `REP_PL_STATE.qCache` pre daného reprezentanta

#### Dôležité poznámky pre Claude
- Rep Plnenie fetchuje rovnaký endpoint `getPlnenieAll` ako manažér — dostane dáta pre VŠETKÝCH reprezentantov, ale filtruje len `username` z `getSession()`
- `plnenieBuildAggregates()` sa volá aj z rep view — keďže `MGR_STATE.role` je null pre bežného reprezentanta, `plnenieGetActiveReps()` vracia `MGR_ALL` (celý zoznam) — to je OK, stačí nájsť jedného reprezentanta v výsledku
- DOM ID prefix `rep-pl-*`: `#rep-pl-total-card`, `#rep-pl-q-tabs`, `#rep-pl-prods`, `#rep-pl-prods-lbl`, `#rep-pl-trend`

### v2.4.1 — Fix zelená bodka Q tab v rep Plnení
- `repPlnenieUpdateQTabs()`: odstránená chybná podmienka `q !== REP_PL_STATE.q` — `current` trieda sa teraz nastavuje vždy pre aktuálny Q (rovnako ako v manažérskej verzii)

### v2.4.2 — Späť na formulár
- Tlačidlo v rep Plnenie overlaye premenované z „← Späť" na „← Späť na formulár" pre jasnejšiu navigáciu

### v2.4.3 — Rebríček pre manažérov
- Pridané tlačidlo 🏆 Rebríček do `mgr-subtabs` (vedľa Plnenie a Návštevy)
- Otvorí rovnaký `lb-overlay` ako u reprezentantov — žiadny extra kód, CSS to pre manažérov už malo povolené

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
- [ ] Zoznam reprezentantov sa načíta zo Sheets (`getRepList`) — mená v rebríčku a manažérskom view sú správne
- [ ] AM West/East rozdelenie sedí podľa Sheets (nie hardcoded)
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

### 7. What's New modal (pri každom release do main)
Appka má hotový systém "Čo je nové" — zobrazí sa každému používateľovi raz po prihlásení, keď príde nová verzia. Treba aktualizovať pri každom merge do `main`:
- [ ] `WN_KEY` zmenený na unikátnu hodnotu pre túto verziu (napr. `potencial_vl_wn_v2_5`) — bez toho sa modal starým používateľom **nezobrazí**
- [ ] `WN_CONTENT_REP` aktualizovaný — čo je nové pre reprezentantov (stručne, zrozumiteľne)
- [ ] `WN_CONTENT_MGR` aktualizovaný — čo je nové pre manažérov (môže byť iný obsah)
- [ ] Modal sa zobrazí po prihlásení s oneskorením ~600ms (po načítaní obsahu) — otestovať v DEV mode

### 6. DEV mode stále funguje
- [ ] Appka sa dá otvoriť s `?dev=1` a beží s mock dátami
- [ ] DEV banner je viditeľný
- [ ] Ak pribudol nový fetch zo Sheets, mock dáta boli tiež aktualizované

### 8. Apps Script — redeploy (ak sa menil `kód.gs`)
Ak bol od posledného mergu do `main` zmenený súbor `apps_script/kód.gs`, **treba nasadiť novú verziu Apps Scriptu** — inak sa zmeny v endpointoch neprejavia na produkčnej URL:
- [ ] Otvor Apps Script editor (script.google.com)
- [ ] Nasadiť → Spravovať nasadenia → Nová verzia → Nasadiť
- [ ] Skontroluj, že URL nasadenia je stále rovnaká ako `SCRIPT_URL` v `index.html`

**Zmeny v `kód.gs` od posledného mergu do `main` (v2.2.57):**
- `getConfig` endpoint — číta hodnotu z tabu "Config" (pre admin schvaľovanie Q v rebríčku)
- `setConfig` endpoint — zapisuje hodnotu do tabu "Config" (vyžaduje API token)
- Tab "Config" v Sheets sa vytvorí automaticky pri prvom `setConfig` ak neexistuje

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

1. ~~**Login cez Google Sheets**~~ ✅ **Hotové** — záložka `Pouzivatelia` v Sheets, endpoint `?action=login`, session uložená v `sessionStorage`/`localStorage`
2. **Reminder ak doktor nenavštívený X týždňov** — X nastaviteľné v admin móde
3. **Trend potenciálu lekára** — vizualizácia vývoja v čase
4. **Rebríček s fotkami reprezentantov** (voliteľné, neskôr)
5. **Reporting** — automatické reporty
6. **Neaktívni reprezentanti → email manažérovi**
7. **Schválenie záznamu manažérom**
8. **CRM light** (po 3 mesiacoch v teréne)
9. ~~**Progress bar produktov vs. kvartálny plán**~~ ✅ **Hotové v v2.3.x–v2.4.x** — Plnenie modul (manažérsky aj reprezentantský pohľad)
10. **Výber špecializácie pri každom zázname**
11. **Rýchly brief pred návštevou** — karta lekára s poslednou návštevou, segmentom, potenciálom, poznámkou, trendom a upozornením (ak je to nový lekár alebo zmena segmentu)
12. **At-risk lekári (kombinácia dát)** — manažérsky pohľad: lekári s klesajúcim MS a zároveň nízkou frekvenciou návštev za posledný kvartál. Akčný zoznam, nie surové dáta.
13. **Gamifikácia — odznaky / míľniky** — nad rámec rebríčka: "Všetci A1 navštívení tento kvartál", "100 návštev celkovo", "3 mesiace v rade v TOP 3". Reprezentant vidí progress k ďalšiemu míľniku.
14. **"Čo sa zmenilo od mojej poslednej návštevy"** — pri otvorení karty lekára: zmenila sa kapitácia? segment? MS trend? Krátky diff od poslednej návštevy, ešte pred vstupom do ordinácie.

### Plnenie — čo ešte chýba pred mergom do main
- **Reálne dáta v Sheets** — plány nahodené v Google Sheets (blocker pre merge do main) ⏳ čakáme na Q2 plány
- **Otestovať s reálnymi dátami** — overiť agregácie, farebné prahy, detail reprezentanta, rep Plnenie overlay
- ~~**Mód reprezentanta**~~ ✅ **Hotové v v2.4.0** — rep nav bar + rep Plnenie overlay
- **DEV mode mock dáta pre Plnenie** — `MOCK_PLNENIE` objekt simulujúci `getPlnenieAll` odpoveď (plány + predaje per reprezentant per produkt per mesiac)

### Plán mergu do main — poradie krokov (DÔLEŽITÉ)

Bezpečnostná oprava (API token) v `test` vetve vyžaduje koordinovaný deploy. **Poradie musí byť presne takéto:**

1. ⏳ Nahodiť Q2 plány do Google Sheets
2. Otestovať s reálnymi dátami (checklist)
3. Prejsť pre-merge checklist s Ivanom
4. **Mergnúť `test` → `main`** — reprezentanti dostanú novú verziu s tokenom v kóde
5. **Až potom** nasadiť nový Apps Script (Nasadiť → Spravovať nasadenia → Nová verzia)
6. V Apps Script nastaviť Script Properties: kľúč `API_TOKEN`, hodnota = rovnaká ako `API_TOKEN` v `index.html`
7. Zmeniť default token `gr-potencial-2026` na vlastnú unikátnu hodnotu v oboch miestach

**⚠️ NIKDY nerobiť kroky 5–6 pred krokom 4** — inak representanti na starej main vetve dostanú "Unauthorized" a appka prestane fungovať.

### Bezpečnostné opravy implementované v test vetve (v2.6.1)

- **XSS fix:** `mgrEscape()` pridaný na `found.lekar/dateStr/cas` (duplikátové upozornenie) a `item.lekar/okres/dateStr/cas` (história záznamov) — predchádza spusteniu škodlivého kódu cez meno lekára
- **API token:** Všetky backendové endpointy (okrem `login` a `pingLogin`) vyžadujú `&token=` parameter. Helper funkcia `scriptUrl(params)` v `index.html` ho pridáva automaticky. Token hodnota: `API_TOKEN` konštanta v `index.html` musí sedieť s `API_TOKEN` v Script Properties Apps Scriptu.

### Dátová integrácia (až po login + Sheets)
- Vlastné predaje na úrovni lekárne mesačne
- Konkurencia na úrovni okresu mesačne
- Plán: (1) Sheets štruktúra, (2) login, (3) panel trhových podielov v appke (naše vs. konkurencia, balenia → pacienti), (4) automatický mesačný report
- **Prepočty balení → pacienti ešte nedodané** (treba získať od R&D / medical)

### Plnenie — vizuálna referencia
Uložená v `docs/plnenie_vizual.html`. Obsahuje 4 módy (Admin, AM West, Detail reprezentanta, Mód reprezentanta). CSS triedy použité v implementácii sú zámerne totožné s referenciou (napr. `dhdr`, `total-card`, `prod-item-adv`, `bar-wrap`, `milestone`, `ms-labels`, `month-rows`, `trend`, `trend-bars`). Všetok nový Plnenie CSS je scopovaný cez `.mgr-plnenie-detail` aby sa predišlo konfliktom.

### Plnenie — kľúčové technické detaily

**Stav (`PL_STATE`):**
```javascript
var PL_STATE = {
  year: 2026,
  q: 1,           // aktuálne zobrazený Q
  loading: false,
  loaded: false,
  data: null,     // raw odpoveď z getPlnenieAll pre aktuálny Q
  aggregates: null, // vypočítané agregáty (sk, regions, products, reps)
  detailRep: null,  // username otvoreného detailu, null = zoznam
  qCache: {}      // { 1: {data, aggregates}, 2: {...}, ... } — cache pre všetky Q
};
```

**Endpoint:** `SCRIPT_URL + '?action=getPlnenieAll&rok=2026&Q=2'`

**Zdrojové záložky pre predaje (KRITICKÉ):**
- **Q1** → záložka `Predaje` (pôvodná, s pôvodnými regiónmi)
- **Q2, Q3, Q4** → záložka `Predaje_2` (nová, s premenovanými regiónmi)
- Logika je v Apps Scripte (`apps_script/kód.gs`) — appka posiela `Q` parameter, Apps Script sám vyberie správnu záložku
- Štruktúra stĺpcov v `Predaje` aj `Predaje_2` je totožná

**Očakávaná štruktúra odpovede:**
```javascript
{
  ok: true,
  planProducts: ['Aflamil', 'Aflamil krém', 'Aflamil tbl a sáčky', 'Suprax', 'Vidonorm', 'Cavinton Forte', ...],
  plan: {
    'j.bohovic': { 'aflamil': 1200, 'suprax': 800, ... },  // EUR za Q
    ...
  },
  predaje: {
    'j.bohovic': {
      total: { 'aflamil': 1100, 'suprax': 750, ... },      // EUR sumár za Q
      byMonth: { 4: { 'aflamil': 400, ... }, 5: {...}, 6: {...} } // mesačný rozpad
    },
    ...
  }
}
```

**Kľúčové funkcie:**
- `plnenieLoadAllQuarters()` — paralelný fetch Q1–Q4, uloží do `PL_STATE.qCache`
- `plnenieSwitchQ(q)` — okamžité prepnutie z cache, bez fetchu
- `plnenieBuildAggregates(resp)` — vypočíta sk/regions/products/reps súhrny
- `plnenieGetActiveReps()` — vracia MGR_ALL / MGR_AM_WEST / MGR_AM_EAST podľa roly
- `plnenieIsAmRole()` — true pre amwest/ameast
- `plnenieSumLabel()` — "Slovensko" / "West" / "East" podľa roly
- `plnenieColorClass(pct)` — `pl-g` ≥100%, `pl-o` 95–99,99%, `pl-r` <95% (pre sumár/zoznam)
- `plnenieDetailColorClass(pct)` — `g`/`o`/`r`/`none` (pre detail view, bez pl- prefixu)
- `plnenieOpenDetail(username)` — otvorí detail, zachová aktuálne zvolený `PL_STATE.q` (neprepisuje na curQ)
- `plnenieMilestonesHtml(year, q)` — HTML pre milestone čiary v progress bare
- `plnenieMonthlyPlans(year, q, total)` — rozdelí Q plán na mesiace podľa pracovných dní
- `PL_WORKING_DAYS_MAP` — pracovné dni per mesiac pre 2026 (pri novom roku treba doplniť)
- `PL_PRODUCT_ORDER` — fixné poradie produktov (Aflamil skupina pohromade)
- `PL_PROD_DOT_COLORS` — farby bodiek pri produktoch (Aflamil = modrá, Suprax = fialová, ...)

---

## DEV mode — testovanie bez internetu (KRITICKÉ)

Ivan testuje zmeny priamo v Claude Code preview paneli, ktorý **nemá prístup k produkčným Google Sheets endpointom**. Appka preto MUSÍ byť schopná fungovať bez internetu na `test` vetve.

### Požiadavky na DEV mode

1. **Preskočenie loginu:** Namiesto `pingLogin` a načítavania reprezentanta zo Sheets sa použije fiktívny profil `TEST_REP` (meno: "Test Rep", AM: "AM West", admin: false)
2. **Mock dáta namiesto fetchov:** Všetky volania na Sheets (načítavanie reprezentantov, `getAllHistory`, rebríček, AM West/East, atď.) sa nahradia lokálnymi zahardkódovanými dátami
3. **Viditeľný indikátor:** Malý žltý banner v hornej časti appky s textom `⚠️ DEV MODE — mock dáta, žiadne Sheets`
4. **Admin variant:** DEV mode má aj sub-variant pre testovanie admin funkcií (napr. URL `?dev=1&admin=1`)

### Aktivácia DEV mode

**Primárne:** URL parameter `?dev=1`
- `index.html?dev=1` → DEV mode ako normálny reprezentant
- `index.html?dev=1&admin=1` → DEV mode ako manažér

**Sekundárne (fallback):** Automatická detekcia. Ak fetch na Sheets zlyhá do 5 sekúnd (napr. offline, CORS, timeout), appka sa spýta: *"Prepnúť do DEV módu s mock dátami?"* a po potvrdení prepne.

**V produkcii (main vetva):** Kód DEV módu zostáva v appke, ale **NIKDY sa automaticky neaktivuje** pre bežných používateľov. Aktivovať sa dá len explicitne cez URL parameter (čo bežný reprezentant nespraví).

### Mock dáta — minimálny rozsah

Mock dataset musí obsahovať:

- **5–10 ukážkových lekárov** pokrývajúcich segmenty A1, A2, B1, B2, B3, C (aspoň po jednom z golden square)
- **Ukážková história návštev** (3–5 záznamov, rôzne produkty detailované)
- **Ukážkový rebríček** (5–10 reprezentantov s bodmi)
- **Ukážkoví area manažéri** (West + East)
- **Ukážková kapitácia** (rôzne rozsahy, aby sa dalo testovať ABC segmentovanie)

Mock dáta by mali byť v samostatnej sekcii `index.html` (napr. objekt `MOCK_DATA = {...}`) pre prehľadnosť.

### PRAVIDLO PRE CLAUDE

**Keď robíš akúkoľvek zmenu, ktorá sa dotýka dát zo Sheets** (pridávaš nový fetch, meníš endpoint, pridávaš nové pole v dátovej štruktúre), **VŽDY zároveň aktualizuj zodpovedajúce mock dáta** v DEV móde. Inak sa test vetva pokazí a Ivan ju nebude môcť testovať.

Toto je rovnako dôležité ako samotný feature — mock dáta nie sú "nice to have", sú súčasťou dodania každej zmeny.

### Stav DEV mode (april 2026)

DEV mode zatiaľ **nie je implementovaný** (chýba v oboch vetvách). Na `test` vetve (v2.3.1) pribudol Plnenie modul, ktorý fetchuje `getPlnenieAll` zo Sheets — bez DEV mode interceptu to v offline prostredí zlyhá. **Pred ďalšou väčšou zmenou treba DEV mode zaviesť**, inak sa test vetva nedá testovať bez pripojenia na produkčné Sheets.

**Minimálny rozsah mock dát pre Plnenie (`MOCK_PLNENIE`):**
- Objekt `{ ok: true, plan: {...}, predaje: {...}, planProducts: [...] }` — rovnaká štruktúra ako `getPlnenieAll` odpoveď
- Plány per reprezentant per produkt (Aflamil, Aflamil krém, Aflamil tbl a sáčky, Suprax, Vidonorm, Cavinton Forte)
- Predaje per reprezentant per produkt per mesiac (`byMonth`) + sumár (`total`)
- Pokryť Q1 aj Q2 (aspoň) aby sa dalo testovať prepínanie kvartálov

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
- **DEV mode musí vždy fungovať.** Pri každej zmene dát zo Sheets aktualizuj mock dáta. Bez toho sa test vetva pokazí.
- **Dizajn v2.2.57 je baseline.** Drž sa existujúceho štýlu, nemeň ho bez explicitného pokynu. Všetko musí byť použiteľné bez manuálu.
