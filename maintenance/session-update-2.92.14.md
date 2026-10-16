# Satori 2.92.14 — zapamätané prihlásenie cez aktualizáciu

Pri štarte novej verzie handler DOMContentLoaded vymazával všetky relácie cez clearSession(), hoci appReload() ich už zámerne zachovával. Nová verzia preto opakovane pýtala heslo aj od používateľov Garáže so zapamätaným prihlásením. Kontrola verzie teraz aktualizuje metadata a oznámenie pre neprihláseného používateľa bez vymazania platnej relácie.

Existujúci getSession() zostáva autoritou lokálnej platnosti: chýbajúci token, dátum expirácie a limit neaktivity naďalej znamenajú prihlásenie znova. Serverové overenie tokenu, zariadenia, členstva a prístupu sa nemení. Bez zapamätania sa relácia neukladá do localStorage a neprežije zatvorenie aplikácie. Ručné odhlásenie reláciu stále odstráni. Nejde o zavedenie passkeys ani ukladanie hesiel do lokálneho úložiska.

Regresný test pred opravou zlyhal pri zachovaní office relácie po zmene verzie. Po oprave testuje 21 kombinácií rola/línia v oboch zdrojoch a hranice neplatných, vypršaných a nezapamätaných relácií. Prehliadačový test používa skutočný prihlasovací formulár a checkbox, Android používateľského agenta, nové browser context po zatvorení a zachované localStorage. Overuje prenos remember=1 na backend, obnovenie Garáže bez nového login requestu a zachovanie tokenu pri zmene verzie na živej i náhľadovej ceste. Používa výlučne syntetický účet a odpovede; nejde o skúšku na kolegovom fyzickom telefóne.

Frontend 2.92.14 sa publikuje na živú aj náhľadovú adresu. Apps Script sa nemení a nevyžaduje redeploy. Používateľ, ktorého relácia už bola predchádzajúcou verziou vymazaná, sa musí raz znova prihlásiť; bez platného tokenu sa nedá bezpečne obnoviť.
