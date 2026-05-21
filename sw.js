// Pasaporte GCO — Service Worker
// Versión: actualiza este número cada vez que hagas cambios
const CACHE = 'gco-pasaporte-v1';

// Archivos que se guardan en caché para uso offline
const ASSETS = [
  '/experienciagco/',
  '/experienciagco/index.html',
  '/experienciagco/manifest.json',
  '/experienciagco/medalla1.png',
  '/experienciagco/medalla2.png',
  '/experienciagco/medalla3.png',
  '/experienciagco/icons/icon-192.png',
  '/experienciagco/icons/icon-512.png'
];

// Instalar: guarda los archivos en caché
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log('[SW] Cacheando assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activar: limpia cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => {
          console.log('[SW] Borrando caché viejo:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: responde con caché si existe, si no va a la red
self.addEventListener('fetch', e => {
  // Solo interceptar peticiones GET
  if (e.request.method !== 'GET') return;

  // Supabase y APIs externas: siempre van a la red (datos en tiempo real)
  const url = e.request.url;
  if (url.includes('supabase.co') || url.includes('resend.com') || url.includes('fonts.googleapis')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Guardar en caché si es una respuesta válida
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Sin conexión y sin caché: mostrar página principal
        return caches.match('/experienciagco/index.html');
      });
    })
  );
});
