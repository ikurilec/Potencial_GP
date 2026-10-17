# Satori 2.92.21 — prehľadnejšia obrazovka Moje dni v Garáži (iba náhľad)

Frontend-only, iba `nahlad/`; ostrá aplikácia v koreni zostáva na 2.92.17. Backend a logika (zrušenie príchodu, úprava parkovania, ponuka kolegovi) sa nemenia.

- **Týždne.** Dni sú zoskupené pod nadpisy „Tento týždeň“, „Budúci týždeň“ a ďalej podľa rozsahu dátumov. Pri každom týždni je štítok s počtom dní v kancelárii voči týždennému cieľu (napr. „3 / 3 dní“). V hlavičke karty je celkový počet dní.
- **Riadok dňa.** Vľavo dátumový blok (skratka dňa, číslo, mesiac), pri dnešku zvýraznený modro so štítkom „Dnes“, pri zajtrajšku „Zajtra“. Farebný okraj podľa stavu: zelený pri parkovaní, jantárový pri čakaní na miesto, modrý pri samotnej kancelárii.
- **Obsah.** Riadok „V kancelárii · čas“, parkovací lístok s veľkým číslom miesta a poschodím (rovnaký jazyk ako v Môj deň a v ponukách), pri čakaní jantárový riadok „Čakáte na voľné miesto“ a pri dni bez auta „Bez parkovania“.
- **Menej tlačidiel.** Namiesto troch rovnako veľkých tlačidiel sú dve hlavné akcie (Upraviť deň, Ponúknuť) a nenápadné „Zrušiť príchod“ pod nimi. Existujúce „Upraviť parkovanie“ (zmena času alebo miesta, zrušenie iba parkovania) ostáva zbalené. Pri dni bez parkovania sa „Ponúknuť“ nezobrazí.
- **Nová akcia Upraviť deň** otvorí formulár príchodu s predvybraným dňom a jeho uloženými časmi, takže čas príchodu alebo spôsob dopravy sa dá zmeniť priamo zo zoznamu. Používa existujúci formulár aj serverové overenie.
- Týždenný plán a karta „Ďalšie autá“ ostávajú pod zoznamom.

Overenie: nový prehliadačový test `test-garage-mydays-browser.cjs` (týždenné skupiny a štítky, dnešok, lístok s číslom, riadok kancelárie, čakanie, deň bez parkovania, počty akcií, Upraviť deň s predvyplnenými časmi, potvrdenie zrušenia, žiadne horizontálne posúvanie na 390 aj 320 px, prázdny stav) a celá garážová prehliadačová sada nad zostaveným náhľadom (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou). Reálne zariadenie nebolo použité.
