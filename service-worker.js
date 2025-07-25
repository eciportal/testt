// A unique name for the cache
const CACHE_NAME = 'eklavya-coaching-v1';

// A list of all the essential files to be cached for offline use
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js'
  // NOTE: If you add local images or CSS files, you must add their paths here too.
  // For example: './images/logo.png'
];

// Event listener for the 'install' event.
// This is where we open the cache and add our essential files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Event listener for the 'fetch' event.
// This intercepts all network requests.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the requested resource is found in the cache, return it.
        if (response) {
          return response;
        }
        // Otherwise, fetch the resource from the network.
        return fetch(event.request);
      }
    )
  );
});

// Event listener for the 'activate' event.
// This is where we clean up old, unused caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
