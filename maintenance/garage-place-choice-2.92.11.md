# Satori 2.92.11 — výber parkovania pri nahlásení príchodu

Vo formulári „Nahlásiť príchod“ má každý vybraný deň vlastný nepovinný výber parkovania. Ponúkajú sa povolené voľné miesta na −3 a spoločné parkovanie na −1 podľa zvoleného času. Predvolená voľba „Prideliť automaticky“ zachováva pridelenie najprv na −3, potom na −1 a čakaciu listinu pri plnej garáži.

Server kontroluje celý výber pod existujúcim zámkom. Ak sa explicitne vybrané miesto medzitým obsadí, nepotvrdí sa žiadna časť dávky. Formulár zachová dni, čas a miesta; používateľ môže obnoviť dostupnosť a zmeniť výber. Výber bez auta neposiela žiadne miesta. Existujúce vlastné parkovanie možno presunúť bez straty pôvodného záznamu pri neúspechu. Spracovanie opakovanej požiadavky zostáva idempotentné.

Hodiny v kalendári a ich legenda označujú len skutočné parkovacie rezervácie s pôvodnou dĺžkou najviac 4 hodiny. Nahlásenie kancelárie bez auta ani servisné blokovanie ikonu nezapína. Počty miest a dostupné časové intervaly sa nemenia.

Kontroly: doménové regresie pre štyri roly, rôzne miesta po dňoch, kombinácia automatického a explicitného pridelenia, oba podlažia, obmedzenia, blokovania, vlastné rezervácie, súbežný konflikt a opakovanie požiadavky. Prehliadačové testy kontrolujú zachovanie formulára, obnovu dostupnosti, fokus, uzamknutie počas ukladania, čakanie pri plnej garáži a šírky 320/390/1200 px. Samostatná kontrola hodín preveruje hranicu 4 h / 4 h 1 min a oba kalendáre.

Nasadenie: frontend a metadáta 2.92.11 v živej aj náhľadovej verzii. Centralizovaný Garage model v súkromnom Golem Apps Scripte bol nasadený ako verzia 142 (14. 10. 2026); Google potvrdil aktualizáciu existujúceho nasadenia. URL a oprávnenia zostávajú rovnaké. Gyn a Reagila backendy nevyžadujú zmenu. Žiadne používateľské rezervácie ani profily sa pri nasadení neupravujú.
