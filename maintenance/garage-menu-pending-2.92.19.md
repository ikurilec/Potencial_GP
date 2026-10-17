# Satori 2.92.19 — Garáž v menu počas overovania (iba náhľad)

Frontend-only, iba `nahlad/`; ostrá aplikácia v koreni zostáva na 2.92.17. Backend sa nemení.

Počas overovania prístupu sa Garáž v menu „Viac“ predtým vykreslila ako samostatná sivá pilulka mimo karty s líniami, s textom „🚘 Garáž Overujem prístup…“. Teraz je to štvrtá položka v tej istej karte ako Golem, Gynekológia a Reagila: rovnaká výška a štýl, názov „Garáž“ a točiaci sa indikátor načítavania (pri zníženom pohybe statický). Je zablokovaná a čítačka obrazovky oznámi „Garáž, overujem prístup“. Pri zlyhaní overenia ostáva položka s „!“ a pod kartou je existujúca akcia na opakovanie. Po úspechu ju nahradí bežná položka Garáž; pri potvrdenom zamietnutí zmizne. Zobrazenie nikdy nepridelí prístup. Pre používateľa bez viacerých línií sa zobrazí karta „Línia“ iba s touto položkou.

Overenie: nový prehliadačový test `test-garage-menu-pending-browser.cjs` (položka je v karte línií, zablokovaná, so spinnerom, rovnakej výšky ako ostatné, žiadna pilulka mimo karty, po overení sa nahradí skutočnou líniou) a upravený `test-garage-chooser-pending.cjs`. Celá garážová prehliadačová sada prešla nad zostaveným náhľadom. Reálne zariadenie nebolo použité.
