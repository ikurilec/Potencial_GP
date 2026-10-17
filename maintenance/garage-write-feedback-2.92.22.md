# Satori 2.92.22 — viditeľná spätná väzba pri každom zápise v Garáži (iba náhľad)

Frontend-only, iba `nahlad/`; ostrá aplikácia v koreni zostáva na 2.92.17. Backend a logika zápisov sa nemenia.

Všetky zápisy v Garáži prechádzajú jednou funkciou `mutate` (nahlásenie a zrušenie príchodu, rezervácia a zmena parkovania, uvoľnenie miesta, čakacia listina, odoslanie, prijatie, odmietnutie a stiahnutie ponuky, auto, prístupy, nastavenia, blokovanie), preto je spätná väzba na jednom mieste a pokrýva všetky. Pridané je aj zapnutie upozornení.

- **Počas ukladania** sa hore na obrazovke ukáže banner s točiacim sa indikátorom a textom, čo sa deje a „Počkajte, prosím.“: napr. „Potvrdzujem príchod a hľadám parkovanie…“, „Rezervujem miesto v garáži…“, „Prijímam ponuku…“, „Zaraďujem vás na čakaciu listinu…“. Stlačené tlačidlo má spinner a je zablokované, takže sa nedá odoslať dvakrát.
- **Po úspechu** banner zozelenie a ukáže výsledok (ten istý text ako doteraz, napr. „Príchod aj parkovanie potvrdené: Miesto 588“), po chvíli zmizne. Čiastočný výsledok (kancelária potvrdená, parkovanie nie) je jantárový a ostáva dlhšie.
- **Po zlyhaní** banner zčervenie, ukáže dôvod zo servera a „Skúste to znova“ s tlačidlom **Skúsiť znova**. Formulár ostáva otvorený a rozpracovaný. Opakovanie posiela rovnaký príkaz s rovnakým identifikátorom, takže sa nič neuloží dvakrát. Chybový banner po 12 s sám zmizne (chyba ostáva aj v dialógu a stavovom riadku).
- Banner je hore, aby neprekrýval spodné tlačidlá ani lištu, má vlastnú rolu pre čítačky obrazovky (chyba ako upozornenie) a pri znížení pohybu nemá animáciu. Pri zatvorení Garáže alebo zmene účtu sa odstráni.
- Spinner pri zablokovaných tlačidlách pokrýva všetky potvrdzovacie tlačidlá a tlačidlo Obnoviť.

Overenie: nový prehliadačový test `test-garage-feedback-browser.cjs` so zadržanou odpoveďou servera (priebeh a spinner počas čakania, zablokované tlačidlo, úspech, zlyhanie so zachovaným formulárom, opakovanie s rovnakým command id, čakacia listina, prijatie ponuky, odstránenie bannera) a celá garážová prehliadačová sada nad zostaveným náhľadom (okrem `test-garage-time-picker-browser.cjs` s pevnou lokálnou cestou). Reálne zariadenie nebolo použité.
