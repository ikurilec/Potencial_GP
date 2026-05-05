// ╔══════════════════════════════════════════════════════════════╗
// ║  Potenciál VL — Service Worker                                ║
// ║  Stratégia: network-first pre HTML (vždy sviežie keď online), ║
// ║  cache-first pre ostatné assety (rýchly štart, offline ready).║
// ╚══════════════════════════════════════════════════════════════╝

var CACHE_NAME = 'potencial-vl-v5';

self.addEventListener('install', function(event){
  // Okamžitá aktivácia — nechceme čakať na zavretie všetkých kariet
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    // Zmazať VŠETKY staré cache
    caches.keys()
      .then(function(names){
        return Promise.all(names.map(function(n){ return caches.delete(n); }));
      })
      .then(function(){
        // Prevziať kontrolu nad všetkými otvorenými oknami okamžite
        return self.clients.claim();
      })
      .then(function(){
        // Vynútiť reload všetkých otvorených okien — dostanú čerstvé HTML
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function(clients){
        clients.forEach(function(client){
          try { client.navigate(client.url); } catch(e){}
        });
      })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;

  // Len GET requesty
  if(req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch(e){ return; }

  // Apps Script endpoint — NIKDY necacheovať (odoslanie dát)
  if(url.hostname.indexOf('script.google.com') !== -1 ||
     url.hostname.indexOf('googleusercontent.com') !== -1){
    return; // pass-through, browser handle
  }

  // version.json — VŽDY network, nikdy cache
  if(url.pathname.endsWith('/version.json') || url.pathname.endsWith('version.json')){
    return; // pass-through
  }

  // Iné same-origin requesty
  if(url.origin === self.location.origin){
    var acceptHdr = req.headers.get('accept') || '';
    var isHTML = req.mode === 'navigate' || acceptHdr.indexOf('text/html') !== -1;

    if(isHTML){
      // Network-first pre HTML → reprezentant vždy dostane najnovšiu verziu keď je online
      event.respondWith(
        fetch(req).then(function(resp){
          if(resp && resp.ok){
            var cloned = resp.clone();
            caches.open(CACHE_NAME).then(function(cache){
              cache.put(req, cloned);
            }).catch(function(){});
          }
          return resp;
        }).catch(function(){
          // Offline fallback — stará verzia z cache
          return caches.match(req).then(function(cached){
            return cached || caches.match('./') || caches.match('/');
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

  // Cross-origin (Google Fonts a pod.) — network, s pokusom o cache
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

// ── Manuálne vyžiadaný skip-waiting (z applyUpdate v appke) ──
self.addEventListener('message', function(event){
  if(event.data && event.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
