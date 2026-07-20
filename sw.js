var CACHE_NAME = 'byte-v21';  
var PRECACHE_URLS = [
  'shared/garden.css',
  'shared/skin.css',
  'shared/garden.js',
  'shared/garden-data.js',
   
  'shared/courses_catalog.json',
   
  'shared/garden-header.css',
  'shared/garden-header.js',
   
  'shared/planner-v2.css',
  'shared/planner-v2.js',
  'shared/dashboard.css',
  'shared/dashboard.js',
  'shared/onboarding.css',
  'shared/onboarding.js',
  'shared/course-hub.css',
  'shared/course-hub.js',
  'shared/hub.css',
  'shared/hub.js',
  'shared/gpa.css',
  'shared/gpa.js',
  'shared/gpa-forecast.js',
  'shared/schedule.css',
  'shared/schedule.js',
  'shared/bottom-nav.css',
  'shared/bottom-nav.js',
  'shared/export-png.js',
  'shared/sw-register.js',
  'shared/search.js',
  'shared/data/courses_catalog.json',
   
  'shared/vendor/fontawesome/css/all.min.css',
  'shared/vendor/fontawesome/webfonts/fa-solid-900.woff2',
  'shared/vendor/fontawesome/webfonts/fa-regular-400.woff2',
  'shared/vendor/fontawesome/webfonts/fa-brands-400.woff2',
  'shared/icons/logo-mark.svg',
  'shared/icons/favicon-32.png',
  'shared/icons/apple-touch-icon.png',
  'manifest.json',
   
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      
      return Promise.all(PRECACHE_URLS.map(function(url) {
         
        return cache.add(new Request(url, { cache: 'reload' }))
                    .catch(function() {   });
      }));
    })
  );
   
});

 
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) { return name !== CACHE_NAME; })
                  .map(function(name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  
  if (event.request.method !== 'GET') return;

  
  var url = event.request.url;
  if (url.includes('firestore') || url.includes('googleapis') ||
      url.includes('workers.dev') || url.includes('google-analytics') ||
      url.includes('googletagmanager')) return;

  
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cachedResponse) {
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(function() { return cachedResponse; });

        return cachedResponse || fetchPromise;
      });
    })
  );
});
