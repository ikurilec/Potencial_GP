// Firebase Cloud Messaging — service worker pre natívne push notifikácie.
// Registruje sa na samostatnom scope (./fcm-scope/) aby nekolidoval s hlavným sw.js.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCmuHdtBUHfV3pOx1NGWWgQAbAgoNIXAJ4",
  authDomain: "potencial-gp.firebaseapp.com",
  projectId: "potencial-gp",
  storageBucket: "potencial-gp.firebasestorage.app",
  messagingSenderId: "559326166818",
  appId: "1:559326166818:web:9f239e19220baab81a6f7b"
});

var messaging = firebase.messaging();
// Samostatný, verziovaný súbor: iOS si ikonu PWA drží agresívne v cache a pri
// starom súbore mohol v systémovej notifikácii ukázať prázdne miesto.
var SATORI_PUSH_ICON_URL = new URL('../satori-notification-icon.png?v=2.88.7', self.registration.scope).href;

// Data-only správy (bez 'notification' poľa) → notifikáciu zostavíme tu, žiadne duplicity.
messaging.onBackgroundMessage(function(payload) {
  var d = (payload && payload.data) || {};
  var title = d.title || 'Satori';
  // Každá správa má vlastný tag — rovnaký tag by staršiu neprečítanú notifikáciu PREPÍSAL
  // (dve žiadosti o absenciu by schvaľovateľ videl len ako jednu, tú poslednú).
  // Backend môže poslať d.tag, ak chce zámerne zlúčiť sériu správ do jednej.
  var options = {
    body: d.body || '',
    icon: SATORI_PUSH_ICON_URL,
    badge: SATORI_PUSH_ICON_URL,
    tag: d.tag || ('satori-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)),
    data: { link: d.link || 'https://ikurilec.github.io/Potencial_GP/' }
  };
  return self.registration.showNotification(title, options);
});

// Klik na notifikáciu → otvor/zameraj appku.
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var link = (event.notification.data && event.notification.data.link) || 'https://ikurilec.github.io/Potencial_GP/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(cl) {
      for (var i = 0; i < cl.length; i++) {
        if (cl[i].url.indexOf('Potencial_GP') !== -1 && 'focus' in cl[i]) {
          // Ak je appka už otvorená, nestačí ju len zamerať: musí prejsť na
          // konkrétnu Nástenku alebo Kalendár, ku ktorým notifikácia patrí.
          if ('navigate' in cl[i]) {
            return cl[i].navigate(link).then(function(client) { return client && client.focus ? client.focus() : cl[i].focus(); })
              .catch(function() { return cl[i].focus(); });
          }
          return cl[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
