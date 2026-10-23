# Golem Q3 2026 — hodnotené portfólio (2.92.28)

Celkové plnenie sa výhradne za Q3 2026 v Goleme počíta z plánov a predajov produktov `aflamil_tablety_sacky`, `cavinton`, `telexer`, `vidonorm`, `junod`, `suprax`, `kogavant`. Predaj produktu sa započíta iba reprezentantovi s kladným plánom tohto produktu. Ide o pomer súčtu predajov k súčtu plánov, nie priemer produktových percent.

Rovnaké pravidlo používajú vlastné plnenie, manažérske a regionálne súhrny, Domov, rebríček podľa plnenia, reportové súčty, predikcie a odporúčania k celkovému výsledku. Existujúci rozsah účtov sa nemení. Q2/Q4 2026, Q3 iných rokov, GYN a Reagila ostávajú bezo zmeny.

Krém aj ďalšie nezahrnuté produkty ostávajú v produktových pohľadoch a surových dátach. Individuálna predikcia produktu a Family karty zachováva pôvodnú mesačnú základňu nezávisle od užšieho celkového portfólia. Produktový signál vysvetľuje, že nezahrnutý produkt neovplyvňuje celkové plnenie Q3 2026.

Uložené agregáty dotknutého kvartálu sa pri čítaní prerátajú zo surových údajov v cache; neprichádza sa o offline dáta a netreba ručne mazať pamäť. Google Sheets a Apps Script sa nemenia; redeploy nie je potrebný. Nasadenie vyžaduje prijatie aktualizácie aplikácie na 2.92.28.

Overenie: `node scripts/test-golem-q3-2026.cjs` (vrátane riedkych mesačných predajov a zachovanej produktovej predikcie), kompletný runner `node scripts/test.cjs` s privátnymi Apps Script fixtures a `SATORI_BUILT_TEST=1 node scripts/test-golem-q3-2026-browser.cjs` pre 8 rolí × 2 šírky × živú/náhľadovú zostavu. Browser testy používajú syntetické dáta a neposielajú živé požiadavky používateľov.
