# Garáž 2.92.8 — samostatné prezeranie a nahlásenie príchodu

Klik na dátum v hlavnom kalendári zobrazí kolegov, vlastný deň a parkovanie. Nemení rozpracovaný výber ani nič nezapisuje. Tlačidlo „Nahlásiť príchod“ otvorí samostatné okno na jeden alebo viac dní, čas a príchod autom/bez auta. Zatvorenie okna zachová rozpracované údaje počas otvorenej Garáže; „Zrušiť výber“ odoberie iba neuložené dni. Uloženie prebehne až po potvrdení serverom.

Hlavný kalendár je kompaktnejší, má tlačidlo „Dnes“, samostatné označenie prezeraného dňa a zachovanú dostupnosť miest. Nasledujú kolegovia, vlastný deň a stále viditeľná mapa. Vzdialenejšie dni možno prezerať, ale nahlásiť iba v aktuálnom 30-dňovom období. Nápoveda v Nastaveniach opisuje nové ovládanie.

Pridelenie −3/−1, čakanie pri plnej garáži, rušenie, ponuky, ďalšie autá admina/fleet managera aj oprávnenia ostávajú cez existujúce serverové príkazy. Počas potvrdenia je výber zamknutý; chyba ponechá formulár na opravu/opakovanie. Klávesnica zostáva v otvorenom okne a po zatvorení sa vráti na aktuálne tlačidlo. Pri zmene rezervačného obdobia počas nastavovania času sa formulár po zatvorení voliča zosúladí s aktuálnymi dňami, aj keď sa verzia dát nezmenila.

## Overenie

- `npm test`: 57 zdrojových regresných súprav.
- `test-garage-browse-booking-browser.cjs`: office, management, fleet, admin; prezeranie bez zápisov, zachovanie dátumu/času, klávesnica vrátane oboch hraníc Tab, zadržané odpovede, plná garáž, bez auta, chyba/opakovanie, zmena obdobia počas voliča; šírky 320/390/1200. Overené aj nad zostavenými modulmi živého rozhrania a náhľadu.
- Regresie: UI, kalendár/volič času, obnovenie Android/iPhone, ponuky, admin/fleet, zrozumiteľnosť, pridelenie/rušenie, kolegovia/výber.
- Zostavená aplikácia: login/výber rozhraní, shell/nastavenia, aktivita, aktualizačný banner/ochrana zápisu.
- Nezávislá kontrola opráv zamerania a posunu obdobia bez zostávajúcich blokujúcich nálezov.

Testy používajú syntetické účty a odpovede. Nevytvárajú skutočné rezervácie ani neposielajú upozornenia zamestnancom.

## Nasadenie

Zdroj, verzie a zostavené moduly sú v koreňovej aplikácii aj `nahlad/`. Verzia `2.92.8`. Apps Scripty sa nemenia; redeploy nie je potrebný.
