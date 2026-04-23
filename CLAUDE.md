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

**2.2.57** (na `main` vetve) — obsahuje:
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

**2.6.1** — obsahuje všetko z 2.6.0 plus Trhový podiel v manažérskom móde. **Zostáva na `test` vetve — čaká na schválenie pred mergom do main.**

### v2.6.0 — Trhový podiel (Pharma MS overlay)

#### Čo je nové
Každý produkt v Rep Plnenie overlaye má tlačidlo **📊 Trhový podiel**. Po kliknutí sa otvorí overlay s market share dátami z Google Sheets.

#### Dátová štruktúra (Google Sheets)
- **`PharmaData_Summary`** — teritoriálny a SK market share po mesiacoch (YYMM formát napr. `2601` = jan 2026)
  - Stĺpce: `produkt | oblast | mesiac | terit_ms | sk_ms`
- **`PharmaData_Okresy`** — rozpad po okresoch s mesačnými hodnotami pre náš produkt + top 3 konkurenti
  - Stĺpce: `produkt | oblast | okres | kvartal | nas_m1 | nas_m2 | nas_m3 | k1_nazov | k1_m1 | k1_m2 | k1_m3 | k2_nazov | k2_m1 | k2_m2 | k2_m3 | k3_nazov | k3_m1 | k3_m2 | k3_m3`
- Kvartal kód formát **YYQQ**: `2601` = Q1 2026, `2602` = Q2 2026 atď.
- Dáta do Sheets sa generujú cez **`pharma_converter.html`** (samostatný nástroj, nie v appke)

#### pharma_converter.html
- Nástroj na konverziu Excel súborov (formát `202603_TEL_e_KE.xlsx`) do TSV na kopírovanie do Sheets
- `raw: true` — číta skutočné hodnoty z buniek (nie formátovaný text) → správne desatinné čísla
- Summary záložka detekovaná podľa **názvu** (`MS_e_KE`, `MS_w_BA`) — nie podľa obsahu (predchádzajúci bug)
- District záložky detekované podľa kvartal kódov (4 cifry, rozsah 2401–2699)
- Výstup: 2 desatinné miesta pre všetky MS hodnoty

#### Apps Script — endpoint `getPharmaData`
- **Parametre:** `oblast` (napr. `KE`), `produkt` (napr. `TEL`), `kvartal` (napr. `2601`)
- Číta z oboch Sheets (`PharmaData_Summary` + `PharmaData_Okresy`), filtruje podľa všetkých troch parametrov
- Odpoveď: `{ ok:true, summary:[{mesiac, terit_ms, sk_ms}], okresy:[{okres, nas_m1..3, k1:{name,m1..3}, k2, k3}] }`
- **Po každej zmene Apps Scriptu treba nasadiť novú verziu** (Nasadiť → Spravovať nasadenia → Nová verzia)

#### Kódy produktov (`PHARMA_CODES`)
```javascript
'aflamil_kr'            → ['AFLcrm']
'aflamil_tablety_sacky' → ['AFLtbl', 'AFLsach']  // Tablety tab prvý
'cavinton'              → ['CAV']
'suprax'                → ['SUP']
'telexer'               → ['TEL']
'vidonorm'              → ['VID']
'junod'                 → ['JUN']
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
