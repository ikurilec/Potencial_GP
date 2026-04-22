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

**2.2.56** (na `main` vetve) — obsahuje:
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

## Verzia na `test` vetve

**2.4.2** — obsahuje všetko z 2.2.56 plus kompletný Plnenie modul (manažérsky aj reprezentantský pohľad). **Zámerné rozhodnutie: zostáva na `test` vetve až kým nebudú plány nahodené v Google Sheets. Potom otestovať s reálnymi dátami a pushnúť do `main`.**

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
- Detail vždy otvára aktuálny Q (defaultne)
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

**Aktuálna verzia 2.2.56 je vizuálny baseline appky.** Všetky nové features, úpravy a rozšírenia musia rešpektovať existujúci dizajnový jazyk:

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
9. ~~**Progress bar produktov vs. kvartálny plán**~~ ✅ **Hotové v v2.3.x–v2.4.x** — Plnenie modul (manažérsky aj reprezentantský pohľad)
10. **Výber špecializácie pri každom zázname**
11. **Rýchly brief pred návštevou** — karta lekára s poslednou návštevou, segmentom, potenciálom, poznámkou, trendom a upozornením (ak je to nový lekár alebo zmena segmentu)

### Plnenie — čo ešte chýba pred mergom do main
- **Reálne dáta v Sheets** — plány nahodené v Google Sheets (blocker pre merge do main)
- **Otestovať s reálnymi dátami** — overiť agregácie, farebné prahy, detail reprezentanta, rep Plnenie overlay
- ~~**Mód reprezentanta**~~ ✅ **Hotové v v2.4.0** — rep nav bar + rep Plnenie overlay
- **DEV mode mock dáta pre Plnenie** — `MOCK_PLNENIE` objekt simulujúci `getPlnenieAll` odpoveď (plány + predaje per reprezentant per produkt per mesiac)

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
- `plnenieOpenDetail(username)` — otvorí detail, prepne na aktuálny Q
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
- **Dizajn v2.2.56 je baseline.** Drž sa existujúceho štýlu, nemeň ho bez explicitného pokynu. Všetko musí byť použiteľné bez manuálu.
