# Garáž 2.91.0

Nahlásenie kancelárie pri príchode autom teraz v jednom serverovom zápise pridáva parkovanie. Prvé voľné oprávnené miesto sa hľadá na −3 podľa poradia konfigurácie, potom v spoločnej kapacite −1. Vlastné pokrývajúce parkovanie sa zachová. Neúspešné predĺženie ponechá pôvodnú rezerváciu. Pri plnej kapacite sa kancelária potvrdí a vznikne čakacia listina; tá ešte nepotvrdzuje parkovanie. Je to používateľom potvrdené pravidlo.

Hlavné ovládanie: označiť dni → autom/bez auta → potvrdiť. Čas, manuálny výber miesta a zoznam kolegov sa rozbaľujú na požiadanie. Moje dni obsahujú kanceláriu, rezervácie aj čakaciu listinu. Zrušenie príchodu odstráni vlastnú dochádzku, parkovanie aj čakanie. Samostatné zrušenie parkovania ponechá kanceláriu. Ponuky, výmeny a správa ostávajú v spoločnom menu. Aktívne zvolené dni/formuláre a rozbalené sekcie ostávajú pri obnove.

Pravý múr tvorí jeden spoločný okraj príjazdov a parkovacích miest. Oba príjazdy majú popis „Príjazd“. Päť fotografických ilustrácií áut má vlastné modely, priehľadné pozadie a náhľad nastavenej farby. Dokumentované prompty: garage-car-images-2.91.0.md. Obrázky, modul aj PWA sú zhodné v náhľade a živej verzii.

## Nasadenie

Vyžaduje redeploy **iba Golem** (centrálny backend Garáže). Kompletný súkromný súbor je pripravený v pôvodnom apps_script/KOD_GOLEM.txt; nesmie sa zverejniť do GitHubu. Nahraď ním celý kód súčasného Golem projektu, ulož a cez Spravovať nasadenia uprav existujúce webové nasadenie na novú verziu. Zachovaj URL, vlastnosti projektu, oprávnenia a existujúci trigger. Nie je potrebné znova inštalovať trigger ani mazať údaje. Frontend 2.91.0 publikovať až po potvrdení redeploya, pretože starší backend voliteľný parameter parking ignoruje.

## Kontrola

- 26 scenárov automatického parkovania, 21 pôvodných modelových scenárov a 33 scenárov spoločnej kapacity.
- 25 testov súkromného adaptera vrátane identity, súbehu, deduplikácie, triggrov a push izolácie.
- Prehliadač: štyri roly, obe poschodia, plná kapacita, storno príchodu/parkovania, bez auta, odložené odpovede, zachované pôvodné funkcie, hlavička/menu/nastavenia, mesačné hranice a šírky 320/390/1200 px.
- Päť áut × päť farieb, chránené okná/svetlá/kolesá, priehľadnosť, zdieľané načítanie, LRU, odpojené uzly, obmedzené opakovanie a náhradné zobrazenie pri chybe siete.
- 50 zdrojových regresných balíkov celej aplikácie a build oboch cieľov.

Kontroly používajú testovacie dáta. Skutočné Google nasadenie ostáva samostatný krok používateľa; nulová chybovosť na všetkých zariadeniach sa netvrdí.
