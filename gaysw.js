const CACHE_NAME = 'gaybook-v8027350284'; // Incrementing version to force update
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// 1. Install & Immediate Takeover
self.addEventListener('install', (event) => {
  // skipWaiting() forces the waiting service worker to become the active one
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activation & Cleanup
self.addEventListener('activate', (event) => {
  // clients.claim() allows the SW to start controlling the page immediately
  event.waitUntil(clients.claim());
  
  // Clean up old caches if you update the version name
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// 3. Smart Fetch (Cache as you read)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        // Don't cache if not a success or if it's a POST/External ad request
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !event.request.url.includes('supabase')) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        // If offline and no cache, you're done!
      });
    })
  );
});
