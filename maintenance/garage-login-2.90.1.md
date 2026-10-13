# Garáž vo výbere rozhrania

Používateľ požiadal o kartu Garáž na existujúcej obrazovke výberu rozhrania po prihlásení. Karta preberá pôvodné fonty, rozmer, okraje a stavy ostatných kariet; text je „Garáž“ a „Parkovanie a kancelária“. Office účty naďalej vstupujú priamo do Garáže.

Prístup používa overené medicínske relácie. Manažérske roly a explicitné garage_access majú voľbu ihneď. Ostatným účtom sa aktívne členstvo overí na centrálnom serveri cez existujúce getGarage. Pri jednej medicínskej línii alebo zapamätanej Garáži sa kontrola dokončí pred výberom, najviac za päť sekúnd; neúspech pustí používateľa do medicínskej línie. Pri viacerých potvrdených medicínskych líniách kontrola beží popri ich výbere. Oneskorená odpoveď nesmie zmeniť iného používateľa. Garáž zachová reálnu zdrojovú líniu a jej session token.

Pri priamom vstupe sa nezačínajú medicínske dátové požiadavky. Návrat alebo výber medicínskej línie spustí jej štandardný bootstrap. Zapamätaná Garáž sa zachová na zariadení a obnovená relácia znovu otvorí Garáž. Používateľ bez oprávnenia nedostane túto kartu.

Postup: najprv regresný test výberu a zdrojových relácií; potom úprava existujúceho výberu a bridge; následne kontrola priameho vstupu, obnovenia, návratu, členstva a mobilného layoutu na produkčnej aj náhľadovej stránke. Build a version.json majú zhodnú verziu 2.90.1. Zmena nevyžaduje nový Apps Script.

Mobilné záložky Garáže sa rozložia do troch stĺpcov. „Moje auto“ a „Správa“ sú viditeľné bez vodorovného posúvania.
