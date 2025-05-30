const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles/styles.css',
  '/images/logo.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cache static assets
  if (ASSETS_TO_CACHE.includes(event.request.url) || event.request.url.endsWith('.png') || event.request.url.endsWith('.jpg') || event.request.url.endsWith('.jpeg') || event.request.url.endsWith('.svg')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  } else if (event.request.url.startsWith('https://story-api.dicoding.dev/v1/')) {
    // Cache API data
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          })
          .catch((err) => {
            // Network request failed, try to get it from the cache.
            return cache.match(event.request.url);
          });
      })
    );
  } else {
    // Let the browser handle other requests.
    event.respondWith(fetch(event.request));
  }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  self.registration.getNotifications().then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });

  const title = data.title || "Notifikasi";
  const options = {
    body: `${data.options.body}`,
    icon: data.options.icon || "/images/logo.png", // Gunakan logo aplikasi sebagai default
    data: data,
    timestamp: Date.now(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});