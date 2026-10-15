# Satori 2.92.12 — avatary v prehľade kancelárie

„Kto príde do kancelárie“ zobrazuje existujúce Satori avatary namiesto iniciál. Bez nastaveného alebo podporovaného avatara zostávajú iniciály. Pri zlyhaní obrázka sa zobrazia iniciály konkrétneho človeka a prebehne najviac jeden pokus o opätovné načítanie daného obrázka. Veľkosť kruhov a rozloženie zoznamu sa nemenia.

Centralizovaná Garáž preberá avatar zo stĺpca `avatar` zdrojového účtu viazaného na daného člena (GP/GYN/Reagila), vrátane office účtov. Využíva existujúce načítanie používateľov bez ďalších požiadaviek na medicínske dáta. Odstránenie a zmena sa prenášajú pri obnove; vlastná úprava avatara sa prejaví ihneď.

Doménová projekcia a lokálna cache povoľujú iba podporovaný štýl a konkrétne parametre vzhľadu. Neprenášajú heslá, tokeny ani ľubovoľné polia zo zdrojového JSON. Roly, prístup, parkovacie poradie, rezervácie a resetové metadáta ostávajú zachované.

Overenie: backendové testy čítania zo všetkých troch zdrojov, aktualizácie a odstránenia, bezpečnej projekcie a absencie opakovaných zápisov pri nezmenenom avatare. Prehliadačové testy pre štyri roly s existujúcim generátorom URL, iniciálami, obnovou, vlastnou úpravou, cache, jedným opakovaním po chybe a šírkami 320/390/1200 px. Regresné testy spoločnej hlavičky/nastavení a výberu parkovania zostávajú súčasťou kontroly.

Frontend má verziu 2.92.12 na živej aj náhľadovej adrese. Golem Apps Script bol aktualizovaný ako verzia 143 (15. 10. 2026); Google potvrdil úspešnú aktualizáciu existujúceho nasadenia. Gyn a Reagila Apps Scripty sa nemenia. URL a oprávnenia backendu zostávajú rovnaké.
