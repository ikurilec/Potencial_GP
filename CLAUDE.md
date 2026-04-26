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

**2.7.13** — obsahuje všetko z 2.7.12 plus: zaoblené rohy `.info-card`, oprava medzery pred formulárom, statický panel nav počas prechodov. **Zostáva na `test` vetve — čaká na schválenie pred mergom do main.**

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
