# Aktivita: mená a avatary používateľov

Aktivita vedela zobraziť login manažéra, pretože `getManagers` sa spracoval až po dokončení spoločného `Promise.all` s históriou návštev. Štatistika už medzitým vykreslila karty bez mien; ich mená ani avatary sa po príchode metadát neobnovili. Globálna obnova avatarov navyše neobsahovala karty a detail Aktivity.

Oprava používa jeden zdieľaný loader existujúceho `getManagers`, nezávislý od návštev. Načítané profily sa spracujú ihneď, používajú sa najviac tri minúty a ručné obnovenie vynúti nové načítanie. Odpovede sú viazané na účet, líniu a epochu; stará odpoveď nemôže prepísať stav novej relácie. Neúspešné načítanie nemení už dostupný zoznam.

Zoznam a detail Aktivity aktualizujú mená, prístupné popisy a avatary priamo v DOM bez opätovného vykreslenia grafov či zatvárania rozbalených častí. Identifikátory účtov sa normalizujú. Aktuálne mená manažérov majú prednosť pred záložným slovníkom; mená reprezentantov sa čítajú aj zo živého rosteru. Ak profil skutočne nemá dostupné meno, aplikácia ho nevymýšľa a používa neutrálny text Používateľ.

Existujúci avatar renderer zachováva obrázok pri nastavenom avatarovi a iniciály pri chýbajúcom avatarovi. Autoritatívne prázdny avatar manažéra odstráni starú obrázkovú cache. Aktivita reaguje aj na neskorý roster a zmenu avatara. GYN používa vlastný roster používateľov; nespúšťa GP/Reagila loader a čerstvý profil obnoví meno aj odstránený avatar.

Backend, oprávnenia Aktivity a uložené záznamy sa nemenia. Nie je potrebný Apps Script redeploy. Oprava je rovnaká v živej aplikácii a náhľade, verzia 2.92.25.

Overenie: `test-activity-identities.cjs` pokrýva celé mená a normalizáciu, prioritu aktuálneho manažéra, zdieľanie a opätovné použitie načítania, odstránenie avatarovej cache a izoláciu neskorej odpovede. `test-activity-identities-browser.cjs` reprodukuje GP aj Reagila profily pri nedokončenej histórii, karty a detail, iniciály a avatary, neskorý roster a avatar event aj GYN profil; beží nad oboma aplikáciami na mobilnej šírke.
