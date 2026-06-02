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

// Data-only správy (bez 'notification' poľa) → notifikáciu zostavíme tu, žiadne duplicity.
messaging.onBackgroundMessage(function(payload) {
  var d = (payload && payload.data) || {};
  var title = d.title || 'Potenciál GP';
  var options = {
    body: d.body || '',
    icon: 'https://ikurilec.github.io/Potencial_GP/icon-192.png',
    badge: 'https://ikurilec.github.io/Potencial_GP/icon-192.png',
    tag: 'potencial-update',
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
        if (cl[i].url.indexOf('Potencial_GP') !== -1 && 'focus' in cl[i]) return cl[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(link);
    })
  );
});
