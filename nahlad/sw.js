// ╔══════════════════════════════════════════════════════════════╗
// ║  Potenciál VL — Service Worker                                ║
// ║  (retrigger GitHub Pages deploy 2026-09-13 09:15 UTC)          ║
// ║  Stratégia: network-first pre HTML (vždy sviežie keď online), ║
// ║  cache-first pre ostatné assety (rýchly štart, offline ready).║
// ╚══════════════════════════════════════════════════════════════╝

var CACHE_NAME = 'potencial-nahlad-vd0e2fa182701';
// Názvy súborov nižšie aj CACHE_NAME vyššie píše "node scripts/build.mjs" —
// nemeniť ručne, prepíše sa to pri ďalšom builde. Hash v názve = odtlačok
// obsahu app.js/app.css, nie čísla verzie — zmení sa len keď sa obsah zmení.
var APP_SHELL = [
  './',
  './index.html',
  './dist/app.2701d9ac.css',
  './dist/app.d0e2fa18.js'
];

self.addEventListener('install', function(event){
  // Nová verzia sa stiahne do vlastnej cache, kým používateľ ešte pracuje so
  // starou. Pri ďalšom otvorení sú CSS aj JS okamžite k dispozícii z cache.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache){ return cache.addAll(APP_SHELL); })
      .catch(function(){ /* pri dočasnom výpadku nechaj štandardný network fallback */ })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(names){
        // Maž LEN staré verzie, nie všetko. Predtým tu bolo caches.delete(n) pre každý
        // názov, takže každé nasadenie zmazalo aj fonty a avatary z DiceBear — veci,
        // ktoré sa medzi verziami vôbec nemenia — a všetko sa sťahovalo odznova.
        return Promise.all(
          names.filter(function(n){ return n.indexOf('potencial-nahlad-') === 0 && n !== CACHE_NAME; })
               .map(function(n){ return caches.delete(n); })
        );
      })
      .then(function(){
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;

  if(req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch(e){ return; }

  // Apps Script endpoint — nikdy necacheovať
  if(url.hostname.indexOf('script.google.com') !== -1 ||
     url.hostname.indexOf('googleusercontent.com') !== -1){
    return;
  }

  // DiceBear avatar API — cache-first
  if(url.hostname.indexOf('api.dicebear.com') !== -1){
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached) return cached;
        return fetch(req).then(function(resp){
          if(resp && (resp.ok || resp.type === 'opaque')){
            var cloned = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(req, cloned);
            }).catch(function(){});
          }
          return resp;
        }).catch(function(){
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // version.json — vždy network, nikdy cache
  if(url.pathname.endsWith('/version.json') || url.pathname.endsWith('version.json')){
    return;
  }

  // Same-origin requesty
  if(url.origin === self.location.origin){
    var acceptHdr = req.headers.get('accept') || '';
    var isHTML = req.mode === 'navigate' || acceptHdr.indexOf('text/html') !== -1;

    if(isHTML){
      // Network-first pre HTML.
      // KĽÚČOVÁ OPRAVA: fetch s cache:'no-store' namiesto pôvodného req.
      // Dôvod: location.reload() posiela cache:'no-cache', GitHub Pages na to
      // odpovedá 304 Not Modified. SW vrátil 304 priamo browseru — browser
      // nevedel čo s tým (SW stojí medzi ním a HTTP cache) → sivá/biela stránka.
      // S cache:'no-store' vždy dostaneme 200 OK s aktuálnym obsahom.
      var freshReq = new Request(url.href, {
        method: 'GET',
        cache: 'no-store',
        headers: {'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'}
      });
      event.respondWith(
        fetch(freshReq).then(function(resp){
          if(resp && resp.ok){
            // Klonuj SYNCHRÓNNE pred returnom — resp.clone() v async callbacku
            // by zlyhalo, lebo telo response je už skonzumované browserom.
            var c1 = resp.clone();
            var c2 = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(req, c1).catch(function(){});  // presná URL
              cache.put('./', c2).catch(function(){}); // fallback kľúč
            }).catch(function(){});
            return resp;
          }
          // Non-ok (neočakávané — GitHub Pages vráti 5xx atď.): padni na cache
          return caches.match('./').then(function(c){ return c || resp; });
        }).catch(function(){
          // Sieť nedostupná — offline fallback zo SW cache
          return caches.match(req).then(function(cached){
            if(cached) return cached;
            return caches.match('./').then(function(c){
              if(c) return c;
              // Posledná záchrana: jednoduchá offline stránka (nie sivá prázdnota)
              return new Response(
                '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
                '<meta name="viewport" content="width=device-width,initial-scale=1">' +
                '<title>Potenciál GP — offline</title>' +
                '<style>body{font-family:sans-serif;display:flex;align-items:center;' +
                'justify-content:center;height:100vh;margin:0;background:#EAECF2;text-align:center}' +
                'h2{color:#0C1E35}p{color:#64748B}</style></head>' +
                '<body><div><h2>📵 Bez pripojenia</h2>' +
                '<p>Obnoviť stránku keď bude sieť k dispozícii.</p>' +
                '<button onclick="location.reload()" style="margin-top:16px;padding:12px 24px;' +
                'background:#2563EB;color:#fff;border:none;border-radius:9px;font-size:14px;cursor:pointer">' +
                'Skúsiť znova</button></div></body></html>',
                { headers: { 'Content-Type': 'text/html;charset=utf-8' } }
              );
            });
          });
        })
      );
      return;
    }

    // Ostatné assety: cache-first, fallback na network
    event.respondWith(
      caches.match(req).then(function(cached){
        if(cached) return cached;
        return fetch(req).then(function(resp){
          if(resp && resp.ok && resp.type !== 'opaque'){
            var cloned = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(req, cloned);
            }).catch(function(){});
          }
          return resp;
        });
      })
    );
    return;
  }

  // Cross-origin (Google Fonts a pod.) — network s cache fallback
  event.respondWith(
    fetch(req).then(function(resp){
      if(resp && (resp.ok || resp.type === 'opaque')){
        var cloned = resp.clone();
        caches.open(CACHE_NAME).then(function(cache){
          cache.put(req, cloned);
        }).catch(function(){});
      }
      return resp;
    }).catch(function(){
      return caches.match(req);
    })
  );
});

self.addEventListener('message', function(event){
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
