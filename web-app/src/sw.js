// sw.js - SERVICE WORKER OPTIMISÉ AVEC CACHE DYNAMIQUE
const CACHE_NAME = 'smartpool-v3';
const API_CACHE = 'smartpool-api-v1';

// URLs à mettre en cache immédiatement
const urlsToCache = [
  '/',
  '/assets/index.css',
  '/assets/react-vendor.js',
  '/assets/firebase-auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Cache stratégique pour Firebase Realtime DB
  if (event.request.url.includes('firebaseio.com')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            // Mettre en cache la réponse
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Retourner le cache en cas d'erreur
            return cache.match(event.request);
          });
      })
    );
    return;
  }

  // Stratégie Cache First pour les assets statiques
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Background sync pour données hors ligne
self.addEventListener('sync', (event) => {
  if (event.tag === 'firebase-sync') {
    event.waitUntil(syncSensorData());
  }
});

async function syncSensorData() {
  // Logique de synchronisation des données hors ligne
  console.log('Background sync for sensor data');
}