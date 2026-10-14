# Garáž 2.92.9 — súkromné auto

V Mojom aute pribudla možnosť „Iné – súkromné auto“. Odhalí povinné polia Značka a model auta a ŠPZ auta; firemné modely fungujú pôvodne. Výber a údaje zostanú rozpracované aj po obnovení dát. ŠPZ sa normalizuje na veľké písmená a kontroluje aj na serveri. Údaje sú súčasťou existujúceho centrálneho profilu Garáže; každý upravuje svoje auto.

Model, farba, typ a ŠPZ sú zahrnuté v projekcii odpovedí aj v cache. Súkromné auto je identifikované v profile, nastaveniach a pri parkovaní na oboch poschodiach. Neznámy model využíva neutrálnu SVG grafiku. Upravenie fleet rezervácie zachová existujúci typ a ŠPZ. Historické vlastné modely sa ponúkajú cez Iné, s predvyplneným modelom; pri ďalšom uložení treba doplniť ŠPZ.

## Overenie

- Zdrojové testy modelu: office, management, fleet, admin; povinný model/ŠPZ, normalizácia, atomicita odmietnutia, projekcia kolegovi, prechod na firemný model a izolácia vlastného profilu.
- Browser: všetky štyri roly, dopĺňanie a uloženie, čítanie po uložení, označenie pri parkovaní, rozpracovaný výber cez obnovu, fleet edit bez straty ŠPZ, šírky320/390/1200. Aj zostavené živé moduly a náhľad.
- Existujúce UI, fleet a shell regresie. Nezávislá kontrola vrátane opačného prechodu súkromné→firemné počas obnovy.
- Syntetické účty; nezmenili sa skutočné autá zamestnancov ani ich rezervácie.

## Backend a vydanie

Centrálny Golem Apps Script bol v prihlásenom účte upravený iba v existujúcom pomocníkovi vehicle(value); pôvodný online obsah bol zálohovaný a upravený obsah presne porovnaný cez editor. Nasadenie na tej istej URL: Google potvrdil Version141,14.10.2026 17:31. Gyn/Reagila backendy sa nemenia — Garáž používa centrálne úložisko. Používateľ nemusí nič redeployovať.

Zostavenie a verzia2.92.9 v koreňovej aplikácii aj nahlad/. Samostatný jednorazový reset GarageReset20261014.gs ani jeho plánovanie sa pri tejto úprave nemenili.
