# Garáž 2.92.10 — všetci kolegovia bez rozbaľovania

Karta Kto príde do kancelárie zobrazuje rovno celý zoznam príchodov vo vybranom dni. Odstránený limit troch ľudí aj sekcia Ďalší kolegovia. Zachované mená, časy, označenie vlastného príchodu, celkový počet, triedenie a stav mimo dostupného obdobia. Platí pre všetky roly a rozhrania Garáže.

Overenie: pôvodná regresia po zmene očakávania šiestich viditeľných riadkov zlyhala na limite3, po oprave prešla. Browser kontroly office/management/fleet/admin, celý zoznam po obnove, presné časy, escapované mená, prázdne/nedostupné dni a šírky320/390/1200. Overené aj zostavené živé moduly a náhľad; nezávislá kontrola bez blokujúcich nálezov. Existujúca regresia oddeleného prezerania/nahlasovania prešla. npm test prešiel.

Frontend-only aktualizácia2.92.10 v koreni aj nahlad/. Backend ani plánovaný jednorazový reset sa nemenia; Apps Scripty netreba redeployovať.
