# Satori 2.92.16 — prehľad Garáže: obsadenosť, kolega a čakacia listina (iba náhľad)

Mesačný kalendár Garáže farebne odlišuje dni podľa voľných miest (voľno, málo miest, plno) a pod kalendárom je legenda. Nová karta „Kedy je kolega v kancelárii“ ponúka aktívnych kolegov s aspoň jedným nahláseným dňom v najbližších 30 dňoch. Po výbere sa ich dni označia fialovou bodkou v kalendári a zobrazí sa zoznam dní s časmi; ťuknutie na deň ho otvorí. Výber sa pri zmene účtu alebo odhlásení vyčistí.

Dni, na ktoré sa čaká na voľné miesto, majú v kalendári značku ◷. Pri prezeranom dni sa zobrazí iba počet ostatných čakajúcich kolegov, bez mien. Čakacia listina nie je front, preto sa poradie nezobrazuje; upozornenie o uvoľnení dostávajú všetci členovia so zapnutými upozorneniami.

Zmena je iba na strane klienta. Backend (Apps Script) sa nemení, cielená notifikácia pre čakajúcich by vyžadovala jeho úpravu.

Overenie: nový prehliadačový test `scripts/test-garage-overview-browser.cjs` a celá garážová prehliadačová sada nad zostavenou náhľadovou aplikáciou (okrem `test-garage-time-picker-browser.cjs`, ktorý má pevnú cestu na lokálny počítač). Reálne zariadenie nebolo použité.

Nasadené je len v `nahlad/` (verzia 2.92.16, nový build). Ostrá aplikácia v koreni zostáva na 2.92.15 a po schválení sa povýši rovnakým postupom.
