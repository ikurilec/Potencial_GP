# Garáž 2.92.0 — účty, prístup a fleet autá

Hárky Pouzivatelia v Goleme, Gyn a Reagile ostávajú zdrojom loginu, hesla, mena a roly. Voliteľný stĺpec office_dni obsahuje celé číslo 0–5: týždenný cieľ kancelárie. Prázdny alebo chýbajúci stĺpec znamená 0, nie chybu. Hodnotu upravujte iba v tabuľke. Neplatné údaje sú označené v správe; nedochádza k tichému sčítaniu ani prevzatiu cieľa z iného účtu.

Správa Garáže načíta účet zo všetkých troch zdrojov a umožní zapnúť/vypnúť prístup. Existujúce aktívne profily ostanú povolené, existujúce vypnuté ostanú vypnuté a nové účty sú predvolene zamietnuté. Prvé nastavenie admina je jednorazové a po migrácii sa už neotvára. Vlastné správcovské oprávnenie nemožno vypnúť. Účty s rovnakým loginom sú jasne viazané na zdroj; samotná medicínska rola neobchádza prístup. Rovnaký používateľ s platnými dual sessions môže použiť svoj overený token viazaného zdroja. Heslá, relácie ani kompletné dátumy narodenia sa do zoznamu účtov neposielajú.

Odobratý prístup sa overuje aj na serveri a pri obnovení relácie. Office účet bez prístupu vidí vysvetlenie, nenahráva sa mu medicínske rozhranie. Existujúce rezervácie sa pri vypnutí prístupu nemažú. Správca ich vidí pri účte a môže ich uvoľniť. Potvrdené odstránenie účtu z jeho zdrojového hárku odoberie prístup, zachová jeho rezervácie na upratanie a zastaví upozornenia; nedostupný hárok sa nesmie považovať za odstránenie účtu.

Rola fleet (prípadne fleet manager) v Golem Pouzivatelia vytvorí rolu Fleet v Garáži. Pôvodnú medicínsku rolu manažéra nemeníme automaticky; administrátor úmyselne určuje role v príslušnej tabuľke. Fleet/admin má tlačidlo Rezervovať ďalšie auto: meno, model (výber alebo vlastný text), farba, deň, čas a miesto. Každá extra rezervácia drží svojho overeného tvorcu, príjemcu a vlastné auto. Môže byť viac súčasných extra áut, ale obsadené/blokované miesto ani kapacitu −1 nemožno prekročiť. Fleet rezervácie netvoria kancelársku dochádzku a osobné storno ich neuvoľní. Extra rezervácie majú samostatnú úpravu a zrušenie, nepoužívajú osobné ponuky/výmeny.

## Nasadenie používateľom

1. Do prvého riadku každého používaného hárku Pouzivatelia pridaj na koniec stĺpec office_dni. Zachovaj pôvodné poradie ostatných stĺpcov. Pod hlavičku zadaj príslušným office kolegom 3 alebo 4 (ostatným podľa potreby 0/prázdne).
2. Fleet managerovi nastav v jeho Golem účte rolu fleet. Pri existujúcich medicínskych manažéroch ponechaj medicínsku rolu; tieto roly sa automaticky mapujú na Manažment.
3. Celý aktuálny apps_script/KOD_GOLEM.txt prenes do existujúceho Golem Apps Script projektu a nasadenie aktualizuj na novú verziu. URL, vlastnosti GARAGE_GYN_SHEET_ID/GARAGE_REAGILA_SHEET_ID, uložené rezervácie a existujúci trigger ostávajú. Gyn ani Reagila skripty kvôli tejto zmene netreba redeployovať.
4. Po potvrdení backend redeploya publikuj náhľad aj produkciu 2.92.0. Vo Správe Garáže povoľ prístup potrebným účtom.

## Kontrola

100 doménových scenárov (vrátane fleet, pôvodného modelu, automatického parkovania a spoločnej kapacity), 48 testov reálneho backend adaptera, testy explicitných grantov a identity, 52 zdrojových regresných balíkov. Browser kontroly pokrývajú obyčajné aj fleet rezervácie, zdrojové účty, štyri roly, storno, vlastné auto, login/restored denied sessions a obe zostavy. Skutočné Google nasadenie je samostatný manuálny krok; verejná verzia ostáva 2.91.0 až do publikovania.
