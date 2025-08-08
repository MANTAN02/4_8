// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase configuration (should match your app config)
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Baartal Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: payload.notification?.image,
    data: payload.data || {},
    actions: [
      {
        action: 'open_app',
        title: 'Open Baartal',
        icon: '/icon-72x72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/close-icon.png'
      }
    ],
    tag: 'baartal-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: false
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  if (event.action === 'open_app') {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if the app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle push events (fallback)
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (event.data) {
    const data = event.data.json();
    const title = data.notification?.title || 'Baartal Update';
    const options = {
      body: data.notification?.body || 'You have a new update',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Firebase messaging service worker activated');
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Firebase messaging service worker installed');
  self.skipWaiting();
});