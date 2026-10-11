# 2.89.28 — Zasunutie rozbaleného stavu údajov

Podľa doplneného zadania sa po úspešnom overení všetkých zobrazených častí skryje aj rozbalený panel so zelenými výsledkami. Interval je 2 sekundy pre oba stavy panelu, potom nasleduje rovnaká animácia zasunutia ako v 2.89.27. Otvorenie už overených podrobností poskytne celý dvojsekundový interval na prečítanie.

Čakajúce, neoverené, staré údaje alebo chyba zostávajú viditeľné. Opätovná obnova zobrazí panel aj s pôvodne rozbalenými podrobnosťami. Dáta z pamäte, skutočný čas overenia, cache, oprávnenia a endpointy sa nemenia. Fokus klávesnice stále chráni aktívny ovládací prvok pred skrytím.

Zmena je spoločná pre všetky dátové obrazovky, roly a tri línie. Náhľad a živá verzia používajú rovnaký zdroj. Apps Scripty netreba nasadzovať znova.

Pred úpravou regresný test zlyhal na chýbajúcom skrytí rozbalených zelených výsledkov. Deterministické testy kontrolujú celý interval, otvorenie už zelených podrobností, opätovnú obnovu, čiastočné načítavanie, chybu a izoláciu obrazoviek/prihlásenia. Browserové testy pokrývajú otvorenie prstom, pohyb výšky panelu, rozbalené stavy rolí/línií, zobrazenie pri obnove a dotykové gestá Android/iPhone v emulácii. Publikovanie sa kontroluje osobitne po pushnutí.

Overenie prešlo: 34 zdrojových regresných balíkov; nad minifikovaným buildom 63 kombinácií zasúvania rozbalených podrobností, 489 existujúcich kombinácií stavov, 21 tokov Domova a dôveryhodné dotykové gestá pre Android/iPhone vrátane obnovenia rozbaleného panelu po jeho skrytí. Overené tiež zhodné zdroje oboch cieľov, verzie, obsahové hashe a odkazy service workerov. Ide o izolované testovacie údaje a mobilnú emuláciu.
