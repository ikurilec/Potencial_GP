# Satori 2.92.15 — jednotné teritoriálne podiely pill značiek

Pri zobrazení vlastného pill produktu ako konkurenta používal teritoriálny graf jednoduchý priemer percent okresov. Vlastný graf pritom čítal skutočný podiel za celé teritórium z PharmaData_Summary. Rovnaká značka preto mala rozdielne číslo podľa otvoreného produktu. Rozpor bol reprodukovaný na pôvodných septembrových dátach; súkromné zdrojové súbory ani ich obchodné hodnoty nie sú súčasťou repozitára.

GYN backend v existujúcom jedinom čítaní Summary pripraví `territory_summary` pre vlastné značky spoločného pill trhu (Drovelis, Maitalon, Mistra, Belara, Daylette, Daylla, Evra, Azalia) z toho istého regiónu a ich vlastných mesačných riadkov. Frontend použije tieto autoritatívne série pri tvorbe konkurenčných čiar, legendy a porovnávacej tabuľky. Nepribúdajú požiadavky po jednotlivých produktoch. Skutočná nula ostáva nula a v tabuľke sa zobrazuje 0.00 %; chýbajúci mesiac sa nenahrádza neváženým okresným priemerom.

Oprava je viazaná na rovnaký pill trh a región. Okresné grafy, podiely v okresoch a oddelené metriky balení alebo Levosertu sa neprepisujú. Pri cudzích značkách bez vlastnej teritoriálnej Summary série sa týmto nezavádza nový vážený výpočet: naň treba pôvodné počty alebo váhy trhu; nie je správne ich odhadovať z percent. Tento release opravuje nekonzistentnosť vlastných pill značiek hlásenú pri prepínaní produktových detailov.

Serverový kľúč `gynPh-ms2` a klientsky kľúč `pharma-ms2` oddelia staré odpovede. Ostatné cache a platné prihlásenia sa nemažú. Primárna lokálna kópia KOD_GYN.txt je aktualizovaná; backendová zmena je zachytená v susednom patch súbore bez identifikátorov a tajomstiev.

Overenie: 64 zdrojových regresných sád, vrátane backendového a frontendového testu regiónu, mesiaca, núl, chýbajúcich údajov, nemennosti vstupu, oddeleného trhu a jedného čítania Summary. Prehliadačové testy zostavenej živej a náhľadovej cesty vykreslili päť rolí krát sedem produktov, overili legendu, porovnávaciu tabuľku, SVG a zachovanie okresného podielu. Verejné testovacie hodnoty sú syntetické.

GYN Apps Script bol 16. 10. 2026 úspešne aktualizovaný ako verzia 87. Celý vložený zdroj bol porovnaný s overenou lokálnou verziou; predchádzajúci zdroj je zálohovaný súkromne. URL, oprávnenia a zdrojové tabuľky zostali zachované. Golem a Reagila backend sa nemenia. Frontend živej aplikácie aj náhľadu: 2.92.15.
