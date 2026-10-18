# Reagila — tímy West a East

## Potvrdené rozdelenie

| Tím | Reprezentant | Login | Zachované územie | Area manažérka |
| --- | --- | --- | --- | --- |
| West | Michaela Sibert | m.sibert | BA | Hana Madarászová |
| West | Zuzana Bernátová | z.bernatova | SE | Hana Madarászová |
| East | Ľudmila Hricová | l.hricova | ST | Lenka Fáber |
| East | Peter Papcun | p.papcun | VY | Lenka Fáber |

Zdrojom mien, loginov a území je živý Reagila hárok Pouzivatelia, overený 18. 10. 2026. Všetci štyria majú aktuálne rolu KAM. Lenka má rolu AM; Hana v Reagile zatiaľ nie je. Súčasní schvaľovatelia všetkých štyroch sú j.gavlak a e.starostova.

## Údajový model

Reprezentanti si ponechajú rolu KAM. Na koniec hárka Pouzivatelia pribudne stĺpec tim s hodnotami west/east, vyhľadávaný podľa hlavičky. Nebude sa používať stĺpec region, ktorý označuje územie BA/SE/ST/VY.

Hana má v cieľovom stave rolu AM West a Lenka AM East. Schvaľovateľ členov Westu bude h.madaraszova a členov Eastu l.faber. Nepremenúvajú sa existujúce účty, nemenia sa heslá, územia, plány, predaje, história, avatary ani Garáž. Nový prístup Hany sa nevytvorí kopírovaním hesla z Golemu; spôsob prihlásenia sa vyrieši pri schválenom zriadení účtu bez zapisovania hesiel do repozitára či logov.

Backend bude mať jeden spoločný prevod KAM + tim na interné rep west/rep east pre login, obnovenie relácie, getRepList, getInitData a bootstrap. Neúplné alebo neplatné zaradenie po aktivácii rozdelenia nesmie automaticky sprístupniť obe skupiny.

## Rozsah prístupov a zobrazenia

AM West pracuje s BA/SE, AM East so ST/VY. Platí to pre zoznam reprezentantov, hlavné plnenie a Domov, lekárne a ich detaily, okresy, trhové dáta, reporty a dohody, Aktivitu, vlastné tímové súhrny a adresované absencie. Oprávnenia musí kontrolovať server aj pri priamom zadaní cudzieho loginu, regiónu alebo územia v URL.

Admin, BOSS, BUM a PM si ponechajú celolíniový manažérsky pohľad. KAM si ponechá osobné pracovné dáta. Spoločný rebríček a existujúce celolíniové porovnania/tímové plnenie zostanú funkčne rovnaké ako príslušné porovnania v Goleme. Musia však mať samostatne definovaný dátový rozsah; všeobecný fullLine parameter nesmie obísť obmedzenie súkromných lekární, histórie, Aktivity, dohôd alebo schvaľovania. Jednotlivé spoločné pohľady sa počas implementácie otestujú oddelene od manažérskeho pracovného pohľadu.

Frontend použije existujúce Satori karty a ovládanie pre West/East. Odstránia sa iba Reagila výnimky, ktoré teraz zoskupujú všetkých KAM, skrývajú tímové označenia alebo v Reportoch vynucujú Celú líniu pre každú rolu. Spoločné renderery musia naďalej rozlišovať Golem, GYN a Reagilu. Nové zoznamy sa odvodia zo serverového rosteru, nie z natvrdo napísaných mien v aplikácii.

## Schvaľovanie a upozornenia

Pri schválenej aktivácii sa Schvaľovateľ všetkých štyroch zmení na príslušnú AM. Kalendár overí oprávnenie podľa vlastníka udalosti a jeho aktuálneho schvaľovateľa. Nové žiadosti a zmeny dostane správna AM; výsledok dostane vlastník. Nové žiadosti členov Westu sa nesmú odosielať Lenke a nové žiadosti členov Eastu Hane. Prístup manažmentu vyplývajúci z existujúcej roly sa posúdi oddelene od adresátov schvaľovacích upozornení.

Existujúce žiadosti ani kalendárové udalosti sa nevymažú. Nevykoná sa hromadné opätovné odoslanie starých notifikácií. Nástenka zostáva rozhraním Reagila línie s doterajšími pravidlami; rozdelenie AM samo osebe nemení publikum príspevkov.

## Cache a staré relácie

Zdieľané odpovede nesmú preniesť cudzie tímové údaje cez serverovú, pamäťovú ani trvalú klientsku cache. Serverové kľúče tímových odpovedí zahrnú overený rozsah oprávnení a verziu zaradenia. Stará celolíniová cache sa nebude vracať ako nová odpoveď AM tímu. Backend bude práva odvodzovať z aktuálneho riadku používateľa, nie iba zo starej role v uloženom tokene.

Pri aktivácii sa zneplatnia zasiahnuté cache. Dotknuté AM a KAM sa odhlásia a znova prihlásia, aby sa zosúladila aj klientská relácia. Neskoré odpovede z predchádzajúcej línie, účtu alebo starého zaradenia nesmú prepísať nové dáta. Existujúce okamžité zobrazenie povolenej cache, ručné obnovenie a stavy načítania zostanú zachované.

## Konvertory

Reagila konvertor lekární dostane West pre BA/SE a East pre ST/VY. VY má v predvolenom mapovaní ešte l.faber; budúce exporty musia používať overený p.papcun. To isté nesprávne predvolené mapovanie existuje aj v konvertore predajov a musí sa opraviť pre budúce exporty.

Migrácia uložených máp prebehne raz, so zálohou a iba pre rozpoznané staré predvolené hodnoty. Nesmie zmazať ostatné ručné nastavenia. Historické riadky sa neprepíšu hromadne z l.faber na p.papcun; prípadné chybné staršie importy sa najprv samostatne identifikujú a predložia vlastníkovi údajov.

## Poradie prípravy a nasadenia

1. Tento návrh sa predloží na kontrolu. Potom sa pripraví lokálny kód, testy, konvertory a presný plán migrácie. Živé účty, členstvo a prístupy sa pri vývoji nemenia.
2. Po lokálnom overení sa predloží konkrétna verzia na schválenie nasadenia. Backendová podpora sa nasadí s novým rozdelením neaktívnym; živé členstvo a prístupy zostanú v pôvodnom stave. Frontend musí tento stav vedieť rozpoznať.
3. Overí sa pripravenosť nasadenia bez zriadenia prístupu Hany a bez zmeny rozsahu Lenky. Podpora nového rozdelenia nesmie sama od seba zapnúť iné rozhranie, kopírovať účet či vytvoriť poverenia.
4. Bezprostredne pred živou zmenou sa vyžiada samostatné výslovné potvrdenie nového prístupu Hany k Reagila údajom Michaely a Zuzany vrátane ich absencií a smerovania schvaľovacích upozornení, a potvrdenie zmeny Lenkinho pracovného rozsahu na East. Toto potvrdenie je oddelené od schválenia kódu/deploymentu. Pri odmietnutí zostane migrácia vypnutá; nevytvorí sa náhradná cesta k rovnakým právam.
5. Až po potvrdení sa s obnoviteľnou zálohou vykoná kontrolovaná migrácia živých účtov, tímov a schvaľovateľov a aktivácia rozdelenia. Hana nesmie ani prechodne dostať celolíniový AM prístup. Pri čiastočnom zlyhaní sa nové prístupy nezapnú a stav sa obnoví zo zálohy; samotná príprava stĺpcov nie je úspešnou migráciou.
6. Overia sa živé pracovné pohľady, schvaľovanie a autorizácia oboch AM. Až potom sa označí rozdelenie za nasadené. Reagila Apps Script vyžaduje redeploy; Golem/GYN Apps Scripty sa kvôli tomuto návrhu nemenia. Živý frontend aj náhľad dostanú konzistentnú verziu až v dohodnutom kroku nasadenia.

## Overenie a návrat

Testovacia matica obsahuje štyroch KAM, AM West, AM East, admina, BOSS, BUM a PM; zapnuté aj vypnuté rozdelenie; platný, prázdny a neplatný tim; nové aj staré relácie. Pozitívne testy overia vlastný tím, negatívne priamy cudzí login/územie a pokus obísť rozsah cez fullLine. Osobitne sa overia cache zásahy naprieč rolami, zmena zaradenia, pomalá odpoveď po prepnutí línie, súhrny a percentá, spoločný rebríček, lekárne, trhové detaily, reporty, Aktivita, kalendár a adresáti push upozornení.

Prehliadačové testy mobilného aj desktopového pohľadu overia dve osoby v každom tíme, správne hlavičky, avatary a iniciály, návraty na Domov, obnovenie a neprítomnosť cudzích detailov. Golem a GYN prejdú existujúcimi regresiami. Nasadenie sa skontroluje aj podľa zverejnených verzií a odkazov na všetky moduly.

Pred živou migráciou sa uloží overiteľná obnova zmenených riadkov/metadát a konfigurácie bez kopírovania hesiel do lokálnych dokumentov. Návrat k starému širšiemu prístupu sa nesmie vykonať automaticky ako vedľajší účinok chyby alebo chýbajúceho tímu; musí byť vedomým schváleným krokom správcu.

## Stav

Tento dokument je pripravený na kontrolu pred implementáciou. Potvrdené je rozdelenie štyroch reprezentantov a zamýšľané AM podľa Golemu. Kód nového rozdelenia zatiaľ nie je implementovaný ani nasadený a žiadny živý účet, schvaľovateľ ani oprávnenie sa pri príprave tohto návrhu nezmenili.
