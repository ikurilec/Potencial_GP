# Satori

PWA pre terénnych reprezentantov Gedeon Richter Slovakia. Tri línie (Golem,
Gyn, Reagila), tri role (reprezentant, manažér, admin). Nasadzuje sa cez
GitHub Pages priamo z tohto repozitára.

## Ako appka funguje

- **Ostrá appka** je v koreni repozitára — `index.html`, jeden súbor
  (HTML + CSS + JS spolu). To má tím v teréne. Mení sa len na výslovný pokyn.
- **Náhľad** (`nahlad/`) je kópia na testovanie na ostrých dátach. Vlastný
  service worker, vlastná cache, oranžový pásik hore s číslom verzie —
  nič sa nepomieša s ostrou appkou. Sem ide bežná práca.
- `nahlad/` je od build kroku (`npm run build`, pozri nižšie) rozdelený na
  `index.html` + `app.css` + `app.js`. Ostrá appka ostáva jeden súbor —
  pri jej ďalšom nasadení bude treba rovnaký krok spraviť aj tam.

### Nasadenie náhľadu

```bash
npm run build          # minifikuje app.js/app.css, hash v názve, prepíše
                        # index.html + sw.js (scripts/build.mjs)
npm test                # smoke sada — 1× počas práce, 3× tesne pred publikovaním
git add -A && git commit && git push
```

Staré zostavené súbory ostávajú v `nahlad/dist/` vedľa nových — **návrat na
predošlú verziu je zmena jedného odkazu v `nahlad/index.html`** (a v
`nahlad/sw.js`), nie oprav-a-nasaď-znova. Vyčistiť staré buildy:
`npm run build:clean`.

## Línie a role

| | Golem (GP) | Gyn | Reagila |
|---|---|---|---|
| Reprezentant | zápis návštevy lekára, Lekári, Lekárne, Okresy, Plnenie, Rebríček, Kalendár, Nástenka, Tuyory/Lonelix/Apixaban | Plnenie, Rebríček, Kalendár, Nástenka | zápis návštevy, Plnenie, Rebríček, Kalendár, Nástenka |
| Manažér / AM | tímové Plnenie, Rebríček, reporty | tímové Plnenie, Rebríček | tímové Plnenie, Rebríček |
| Admin | všetko vyššie + notifikácie, správa liniek | — | — |

Jedna spodná lišta (Domov · Plnenie · Kalendár · Nástenka · Menu) je
rovnaká pre všetky línie a role — kde línia niečo nemá (napr. Lekári len
v Golem), je namiesto toho iná položka alebo je to pod „Menu".

## Backend a dáta

Tri samostatné Google Apps Script `/exec` endpointy (`SCRIPT_URL`,
`GYN_SCRIPT_URL`, `REAGILA_SCRIPT_URL` v `app.js`), každý nad vlastným
Google Sheetom. Backendový kód **nie je v tomto repozitári** — je
v `.gitignore` (`apps_script/`), autor ho nosí lokálne. Keď treba zmeniť
backend, dostane sa sem ako `.txt` na úpravu, nikdy sa nezacommituje.

Push notifikácie idú cez Firebase Cloud Messaging
(`firebase-messaging-sw.js`). Časť dát (história, PharmaData, roster) sa
cachuje lokálne — `localStorage` a IndexedDB — aby appka fungovala aj so
slabým signálom a aby sa obrazovky vykresľovali z cache, nie až po sieti.

## Overovanie — čo sa nesmie pokaziť

```bash
npm test
```

`tests/smoke.mjs` — pozri `tests/README.md`. Bežia proti skutočnému
prehliadaču (playwright-core), sieť je vždy zablokovaná — produkčný Apps
Script sa pri testoch nikdy nezavolá. Testy musia ísť cez **celý boot**
(`mgrEnter()`, `gynRenderShell()`, `updateSubmitBtn()`…), nie cez skratky —
skratky vedeli pustiť chyby, ktoré by inak nikdy neprešli.

Pomocné skripty na vizuálnu/funkčnú kontrolu naprieč líniami a rolami
vznikajú priebežne v scratchpade danej relácie (napr. `walk.mjs`,
`odstup.mjs`) — nie sú súčasťou repozitára.

## Tri veci, na ktoré sa najľahšie zabudne

1. **Verzia appky.** V `nahlad/` ju už píše `npm run build` (verzia v texte
   + `version.json` + hash v názve súborov). **V ostrej appke (koreň) sa
   ešte stále mení ručne** na viacerých miestach naraz — `APP_VERSION`
   v `index.html`, text v pätičke prihlásenia, `version.json` — kým sa
   build krok nedostane aj tam.
2. **`CACHE_NAME` v `sw.js`.** V `nahlad/` to už tiež rieši build krok —
   nemeniť ručne, prepíše sa pri ďalšom builde. Menia sa len staré verzie
   cache, nie všetko naraz (inak by každé nasadenie zmazalo aj fonty
   a avatary, ktoré sa medzi verziami nemenia).
3. **Prahy segmentu lekára** (`gpSegmentFor()`): `kapitácia < 1501` /
   `≥ 2000`, `total ≥ 3700`. Menia sa na jednom mieste, kryté testom
   („Segment lekára sa počíta na hraniciach správne").

## Vykonávací plán

Fázovaný plán (nasadenie, dátová vrstva, navigácia, formulár, vzhľad,
architektúra) s priebežne aktualizovaným stavom — čo je hotové, čo
rozbehnuté, čo nové oproti pôvodnému zámeru — vedie autor mimo tohto
repozitára.
