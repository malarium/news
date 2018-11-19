const cacheName = 'news-M4U-static';
const staticAssets = [
  './',
  './app.js',
  './styles.css',
  './fallback.json',
  './images/fetch-dog.jpg'
];

//store all in cache upon first run
self.addEventListener('install', async function () {
  const cache = await caches.open(cacheName);
  cache.addAll(staticAssets);
  self.skipWaiting();
});

// waits for the SW to be activated
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());

  //Clear old caches - a snippet to be used with SW, because they will store all files again on smallest changes
  // Always put it in 'activate' part!

  //But be careful so that it won't wipe out cached assets before fetching them!
  // event.waitUntil(
  //   caches.keys()
  //   .then(cacheNames => {
  //     return Promise.all(
  //       cacheNames.filter(cache => {
  //         if(cache !== cacheName) {
  //           return caches.delete(cache);
  //         }
  //       })
  //     );
  //   })
  // );
});



//get data from chache or network - this allows to look into chache berfore downloading anything from the Web
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
//SAMPLE FETCH TEMPLATE:
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request)
//       .then((response) => {
//         if (response) { //entry found in cache
//           return response
//         }
//         return fetch(event.request)
//       }
//     )
//   )
// })

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function networkFirst(request) {
  const dynamicCache = await caches.open('news-dynamic');
  try {
    const networkResponse = await fetch(request);
    dynamicCache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (err) {
    //If there is no connection and cached assets
    const cachedResponse = await dynamicCache.match(request);
    return cachedResponse || await caches.match('./fallback.json');
  }
}

// Handle Push click
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click Received.', event);
  //When clicked close notification and open a new window in browser
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://www.media4u.pl')
  );
});
