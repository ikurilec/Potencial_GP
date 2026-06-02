// ╔══════════════════════════════════════════════════════════════╗
// ║  Potenciál VL — Service Worker                                ║
// ║  Stratégia: network-first pre HTML (vždy sviežie keď online), ║
// ║  cache-first pre ostatné assety (rýchly štart, offline ready).║
// ╚══════════════════════════════════════════════════════════════╝

var CACHE_NAME = 'potencial-vl-v8-reload-fix';

self.addEventListener('install', function(event){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys()
      .then(function(names){
        return Promise.all(names.map(function(n){ return caches.delete(n); }));
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
            var cloned = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              // Ulož pod presnou URL aj pod './' (fallback kľúč)
              cache.put(req, cloned).catch(function(){});
              cache.put('./', resp.clone()).catch(function(){});
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
