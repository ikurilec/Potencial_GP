# Satori 2.92.17 — Garáž je pri prihlásení vždy prítomná počas overovania

Frontend-only live and preview change. No Apps Script redeploy required.

Pri prihlásení do viacerých rozhraní (Golem, Gynekológia, Reagila) sa Garáž predtým ukázala hneď iba vtedy, ak si zariadenie pamätalo predchádzajúce úspešné overenie (zobrazovací hint na 30 dní). Na novom zariadení, po vymazaní údajov alebo po vypršaní hintu sa dlaždica objavila až po dokončení overenia. Teraz sa dlaždica Garáž ukáže vždy, keď prebieha alebo zlyhalo overenie prístupu: zablokovaná, s textom „Overujem prístup…“ (pri zlyhaní „Prístup sa nepodarilo overiť“ a existujúca akcia na opakovanie). Po úspechu sa tá istá dlaždica odomkne bez posunu v rozložení; pri potvrdenom zamietnutí (`NOT_MEMBER`) zmizne a zapamätaný výber rozhrania ostáva zachovaný.

Zobrazenie nikdy nepridelí prístup: dlaždica je pred overením zablokovaná a oprávnenie, zdroj a transport sa riadia výhradne serverovým overením ako doteraz. Hint zostáva len pre zobrazenie pred spustením overenia. Účty bez prístupu do Garáže vidia dlaždicu krátko počas overovania, potom zmizne.

Táto verzia zároveň povyšuje na ostrú aplikáciu zmeny z náhľadu 2.92.16: farebné rozlíšenie obsadenosti dní, kartu „Kedy je kolega v kancelárii“ a viditeľnosť čakacej listiny (pozri `garage-overview-2.92.16.md`).

Overenie: `test-garage-chooser-pending.cjs` a prehliadačový test pokrývajú zariadenie bez hintu aj so zapamätaným hintom (úspech, zamietnutie, zlyhanie s opakovaním, admin a area manager, ostrá aj náhľadová aplikácia). Upravené boli `test-garage-mobile-access-browser.cjs` (čaká na odomknutie, nie na existenciu dlaždice) a prípady v `test-garage-chooser-pending.cjs`, ktoré predpokladali skrytie dlaždice bez hintu. Celá garážová prehliadačová sada prešla (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou). Testy vyžadujúce súkromný Apps Script nebolo možné spustiť. Reálne zariadenie nebolo použité.
