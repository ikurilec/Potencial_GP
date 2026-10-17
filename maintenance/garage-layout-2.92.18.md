# Satori 2.92.18 — nové rozloženie Prehľadu Garáže (iba náhľad)

Zmena je iba na strane klienta a iba v `nahlad/`; ostrá aplikácia v koreni zostáva na 2.92.17. Backend sa nemení.

- **Môj deň hore.** Karta „Môj deň“ je prvá, kalendár nasleduje pod ňou. Používateľ hneď vidí stav vybraného dňa a akcie.
- **Parkovací lístok.** Pri vlastnej rezervácii je číslo miesta veľké (zelená tabuľka s „P“, číslom a poschodím), vedľa je čitateľný text miesta a čas. Zdieľané parkovanie na −1 bez čísla zobrazí „−1“. Pôvodný text miesta a času ostáva v lístku, takže čítačky obrazovky ani existujúce kontroly textu neprídu o informáciu.
- **Menej rolovania.** Karta „Kedy je kolega v kancelárii“ je v predvolenom stave zbalená; v nadpise ukazuje meno vybraného kolegu a výber ostáva aktívny aj po zbalení. Mapa garáže ostáva stále viditeľná.
- **Spodná lišta na telefónoch.** Prehľad / Moje dni / Ponuky / Moje auto (a Správa) sú pri šírke do 759 px pripnuté dole s ikonami, rešpektujú bezpečnú oblasť iPhonu a obsah má dolné odsadenie, takže posledná karta nie je schovaná za lištou. Dialógy a časový výber sú nad lištou. Od šírky 760 px ostávajú horné taby ako doteraz. Ikony sú CSS masky, takže sa nemení text ani štruktúra tlačidiel; značka nových ponúk sa drží pri ikone.

Overenie: nový prehliadačový test `test-garage-overview-browser.cjs` (poradie kariet, lístok s číslom aj −1, zbalený výber kolegu, pripnutá spodná lišta na 390 px, horné taby na 1000 px, posledná karta nezakrytá). Test `test-garage-people-selection-browser.cjs` kontroluje poradie nezávisle od rozloženia, takže prechádza aj na ostrej aplikácii aj na náhľade. Celá garážová prehliadačová sada prešla nad zostaveným náhľadom (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou). Skutočný telefón nebol použitý. Testovacia stránka teraz obsahuje `viewport` meta, inak emulácia nepoužila mobilné rozloženie.
