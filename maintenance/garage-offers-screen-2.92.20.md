# Satori 2.92.20 — prehľadnejšia obrazovka Ponuky v Garáži (iba náhľad)

Frontend-only, iba `nahlad/`; ostrá aplikácia v koreni zostáva na 2.92.17. Backend a logika ponúk (prijatie, odmietnutie, stiahnutie, serverové overenia) sa nemenia; mení sa len zobrazenie, zoskupenie a poradie.

- **Skupiny podľa toho, čo treba urobiť.** „Čaká na teba“ (prijateľné ponuky s veľkým Prijať a Odmietnuť), „Čakáš na odpoveď“ (vlastné čakajúce ponuky so Stiahnuť) a zbalená „História“ (prijaté, odmietnuté, zrušené, vypršané a už nedostupné). História sa otvorí sama, keď nič iné nečaká.
- **Karta ponuky.** Avatar a meno kolegu, riadok „Ponúka ti“ alebo „Tvoja ponuka“ s dátumom, štítok Prevod alebo Výmena, farebný okraj podľa stavu (čaká jantárovo, prijatá zelene, ostatné sivo) a stav s ikonou, takže sa nespolieha len na farbu.
- **Mini parkovacie lístky.** Miesto je veľké číslo na zelenej tabuľke (rovnaký jazyk ako lístok v Môj deň), pod ním dátum, čas a pôvodný text miesta. Výmena ukáže dva lístky s popismi „Ich miesto“ a „Tvoje miesto“ a šípku medzi nimi; prevod lístok a „Tebe“ alebo meno kolegu.
- **Čas platnosti po ľudsky.** Len pri čakajúcich: „Vyprší o 2 dni“, „o 3 h“, „o 20 min“. Surový dátum so sekundami sa už nezobrazuje a pri ukončených ponukách sa platnosť nezobrazuje vôbec.
- **Bez falošnej chyby.** Zrušená ponuka už nehlási „Pôvodná rezervácia už nie je dostupná“; ak rezervácia neexistuje, lístok sa jednoducho nezobrazí. Čakajúca ponuka, ktorú už nemožno prijať, ostáva v histórii so stavom „Ponuka už nie je dostupná“ a bez tlačidiel.
- **Upozornenia** sú kompaktný pásik na konci namiesto veľkej karty; tlačidlo aktivácie ostáva.
- **Prázdny stav** je prívetivejší („Nič nečaká“ s odkazom na Moje dni).

Overenie: nový prehliadačový test `test-garage-offers-screen-browser.cjs` (skupiny a poradie, počty tlačidiel, mini lístky s číslami, výmena aj prevod, čas platnosti, história bez šumu a bez akcií, prázdne stavy, bez horizontálneho posunu na 390 px) a celá garážová prehliadačová sada nad zostaveným náhľadom (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou). Reálne zariadenie nebolo použité.
