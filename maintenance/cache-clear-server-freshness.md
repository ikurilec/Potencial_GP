# Vymazanie pamäte a čerstvé serverové dáta — 2.92.29

Nastavenia → Vymazať vyrovnávaciu pamäť odstránilo lokálne dáta a obnovilo stránku, ale obnovená stránka stratila príznak ručného obnovenia. Apps Script tak mohol opäť vrátiť starú odpoveď zo svojej dvojhodinovej cache. Opakované čistenie lokálnej pamäte tento stav nevyriešilo.

Pred reloadom sa teraz uloží jednorazový zámer do sessionStorage danej karty. Má päťminútovú platnosť a obsahuje rozsah používateľa, roly a línie; neobsahuje heslá ani tokeny. Zdrojová stránka ho nemôže predčasne spotrebovať. Nová stránka ho spotrebuje len pri rovnakom rozsahu a na 90 sekúnd aktivuje existujúce čítanie `fresh=1`, aby pokrylo aj pomalý štart. Pri prepnutí účtu, roly alebo línie sa toto obnovené vynútenie ukončí. Neskorší bežný štart sa vracia k štandardnej cache. Prihlásenie, nastavenia a neodoslané pracovné dáta sa nemažú.

Pravidlo platí rovnako v náhľade aj živej aplikácii. Nevyžaduje nový Apps Script, ak nasadenie už podporuje `fresh=1` (overené v existujúcom Golem zdroji). Pri riešení nahláseného prípadu bola v existujúcom Golem projekte spustená funkcia `dataBust`; hodnoty v Google Sheets ani nasadenie servera sa nemenili.

Overenie: `node scripts/test-cache-clear-fresh.cjs`, kompletný `node scripts/test.cjs` s privátnymi Apps Script fixtures a `SATORI_BUILT_TEST=1 node scripts/test-cache-clear-fresh-browser.cjs`. Browser test reálne vykoná reload, simuluje starý serverový plán bez príznaku a nový plán s príznakom a kontroluje zachovanie session. Testy používajú výhradne syntetické údaje.
