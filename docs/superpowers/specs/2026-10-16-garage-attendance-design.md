# Garáž — nahlásená dochádzka, absencie a osobný PDF výkaz

## Dohodnutý výsledok

Zamestnanec v rozhraní Garáž nahlási kanceláriu, home office, dovolenku, OČR, lekára/paragraf alebo náhradné voľno. Záznam je po uložení účinný. V tomto module nie sú žiadosti, schvaľovatelia, čakanie na schválenie ani mesačná schvaľovacia uzávierka: interné schválenie prebehlo cez e-mail pred zadaním.

Hodiny sa preberajú z nahláseného času, nie z merania príchodu a odchodu. Zamestnanec nemusí denne potvrdzovať prítomnosť. Vlastný záznam môže spätne opraviť; PDF sa vytvorí z práve uložených údajov. Výkaz je výkazom nahlásených údajov, nie dôkazom fyzickej prítomnosti.

Každý člen Garáže vrátane office účtov, manažmentu, admina a fleet managera má prístup k vlastnej dochádzke a vlastnému PDF. Samotné oprávnenie spravovať parkovanie neoprávňuje fleet managera čítať osobné výkazy a dôvody absencií kolegov. Hromadný HR export ani nové oprávnenia na cudziu dochádzku nie sú súčasťou tohto návrhu.

## Ovládanie

Existujúca hlavná obrazovka, meniny, nastavenia, mapa parkovania a rezervovanie príchodu zostávajú zachované. Z Garáže pribudne priamy vstup „Moja dochádzka“. Použije existujúce Satori fonty, tlačidlá, kalendár, časový výber, stavy načítania a modálne okná. Pri prezeraní stačí kliknúť na deň; výber viacerých dní pre zadanie je oddelený, rovnako ako pri dnešnom nahlasovaní príchodov.

Dochádzka zobrazí vybraný mesiac, prehľad dní a akcie „Nahlásiť deň“ a „Stiahnuť PDF“. Formulár obsahuje typ dňa, jeden alebo viac dátumov a čas od–do; predvyplnené časy preberie z existujúcej konfigurácie Garáže. Kalendár môže zobrazovať minulé mesiace. Dátum mimo 30-dňového rezervačného okna môže mať vlastný dochádzkový záznam, ale nevytvára spätné ani vzdialenejšie parkovanie.

Rozsah dní a časov sa pred uložením jasne zhrnie. Viac dní sa uloží ako jedna overená operácia; pri konflikte sa neuloží iba nejasná časť výberu. Počas ukladania sú príslušné ovládacie prvky zablokované. Pri chybe ostane rozpracovaný formulár a je možné opakovať uloženie bez duplicity.

## Časy a súčty

Pre záznam 08:00–16:30 sa eviduje 8 hodín 30 minút nahláseného intervalu. Nevkladá sa žiadna nepomenovaná prestávka ani automatické zaokrúhľovanie. Kancelária a home office sa v súčtoch uvádzajú osobitne od absencií; dovolenka, OČR, lekár a náhradné voľno majú každý vlastný súčet. Hodiny absencie sa nepripočítajú k hodinám kancelárie alebo home office.

Deň môže obsahovať viac neprekrývajúcich sa úsekov, napríklad kanceláriu 08:00–12:00 a lekára 12:00–14:00. Dva typy sa nesmú započítať za rovnaký čas. Formulár pri nahradení existujúceho úseku ukáže, čo zmení; neprepisuje ho potichu. Dni bez záznamu sú „Neevidované“, nie odpracované, dovolenka ani nula odpracovaných hodín. Víkendy sa rozlišujú vizuálne; prípadný výslovný záznam sa nestratí.

## Prepojenie s parkovaním

Existujúci nahlásený čas kancelárie je východiskom pre vlastnú dochádzku. Nové zadanie cez pôvodný formulár a cez dochádzku musí používať rovnaké údaje, aby nevznikali dve protichodné kancelárie.

Uloženie neprítomnosti alebo home office v čase vlastnej osobnej rezervácie ponúkne súhrn uvoľnenia parkovania pred konečným potvrdením formulára. Celodenná neprítomnosť uvoľní príslušné vlastné parkovanie a čakaciu listinu; čiastočná uvoľní iba kolidujúci úsek. Kancelária vo zvyšku dňa aj parkovanie mimo neprítomnosti ostávajú zachované. Rezervácie ďalších áut vytvorené adminom alebo fleet managerom patria uvedeným autám a nesmú sa automaticky zrušiť osobnou absenciou ich tvorcu.

Kontrola konfliktov, uvoľnenie parkovania a uloženie dochádzky sú jedna serverová transakcia s existujúcim zámkom a deduplikáciou príkazov. Uvoľnené miesto využije existujúce notifikácie Garáže. Osobné dôvody absencie sa do spoločnej parkovacej notifikácie neposielajú.

Historická oprava dochádzky nesmie spätne meniť historickú rezerváciu ani dnešnú kapacitu parkovania. V PDF sa vždy samostatne označí rezervované parkovanie: nie skutočné využitie miesta.

## Osobný výkaz a história

Výber celého mesiaca alebo vlastného intervalu dátumov. PDF možno vytvoriť aj priebežne; pri neukončenom mesiaci bude zrejmé, ktoré dni sú ešte v budúcnosti. Uplynulý mesiac má rovnakú akciu bez dodatočného schvaľovania.

PDF obsahuje meno, vybrané obdobie, čas vytvorenia a tabuľku všetkých dní. Pre každý deň uvedie typ alebo typy, nahlásený čas od–do, hodiny podľa jednotlivých typov a vlastné osobné parkovanie s časom, poschodím a číslom miesta. Na −1 uvedie nečíslované parkovanie, nevymyslí číslo. Deň bez auta ostáva platnou kanceláriou. Ďalšie fleet autá sa nezapočítajú ako vlastná dochádzka. Na konci sú samostatné súhrny typov a chýbajúcich dní.

Zdrojom reportu je serverom overená história daného účtu; klient neposiela ľubovoľný login, ktorého report chce získať. Bežný 30-dňový snapshot Garáže nestačí na históriu, preto bude samostatné stránkované čítanie vlastného obdobia. Historické záznamy sa netvoria odhadom z neskoršieho stavu alebo z auditného logu s obmedzenou dĺžkou. Dostupné staršie uložené kancelárie a rezervácie možno preniesť s označením pôvodu; chýbajúce údaje zostanú neevidované.

Parkovacie miesto sa pri archivovaní zaznamená aj s vtedajším poschodím a názvom, aby zmena konfigurácie neskôr neprepísala starý výkaz. História sa automaticky nevymazáva mesačným posunom rezervačného okna. Osobný report sa neukladá do spoločnej verejnej cache ani na verejnú adresu. Pri odhlásení alebo zmene účtu sa otvorený report aj jeho pamäť vyčistia.

PDF musí správne zobrazovať slovenskú diakritiku, viacstranové tabuľky, opakovanú hlavičku a čitateľné časy na mobile i PC. Pri chybe generovania zostáva zobrazený prehľad a zrozumiteľné tlačidlo na zopakovanie; aplikácia neoznámi úspech bez vytvoreného súboru.

## Vzťah k medicínskym kalendárom

Prvé vydanie je vlastná dochádzka Garáže. V existujúcich medicínskych kalendároch sa nerušia schvaľovania a ich súčasné pravidlá. Budúce spoločné zobrazenie musí používať jeden identifikovaný zdroj záznamu, nie kopírovanie zápisov do viacerých Sheets. Prenos starých absencií z línií sa nezapočíta dvakrát a nemôže vyrobiť schválený záznam z čakajúcej žiadosti. Také prepojenie sa zapne až po samostatnom overení mapovania účtov a konfliktov; PDF nesmie predstierať, že nezadané staré absencie pozná.

## Implementačné hranice a overenie

Samostatný model dochádzkových úsekov a výpočtu reportu sa napojí na existujúci čistý model Garáže a centralizovaný backend. Do veľkého app.js sa pridajú iba potrebné vstupy a smerovanie; nové UI a PDF majú vlastnú zodpovednosť. Privátne Apps Scripty, identifikátory tabuliek a obsah účtov zostanú mimo verejného Git repozitára. Živá aplikácia a náhľad dostanú rovnakú funkcionalitu a konzistentnú novú verziu až po overení.

Testy musia pokryť všetky štyri garážové roly, zdrojové účty vo všetkých troch líniách, vlastný/cudzí účet, odobratý prístup, obnovu relácie, historické mesiace a prelom roka. Doménové skúšky preveria čiastočné úseky, prekrývanie, presné minúty, hromadné operácie, opakované uloženie, súbežnú zmenu a nezmenené fleet rezervácie. Prehliadačové skúšky overia mobilné šírky, výber dní, načítanie z pamäte s obnovou, zlyhanie servera a obnovenie. PDF sa overí dátovo aj vizuálne na celom mesiaci, dlhých menách, diakritike a viacerých stranách.

## Stav návrhu

Potvrdené používateľom: druhy dní, absencie bez schvaľovania, hodiny podľa nahláseného času a vlastný PDF výkaz podľa mesiaca alebo obdobia. Tento dokument je finálny návrh na kontrolu pred implementáciou; žiadna z opísaných nových funkcií zatiaľ nie je nasadená.
