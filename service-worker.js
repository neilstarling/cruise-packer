const CACHE_NAME = 'cruise-packer-shell-v3';
const APP_SHELL_FILES = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './firebase-config.js',
    './manifest.webmanifest',
    './icons/cruisepacker192.png',
    './icons/cruisepacker512.png'
];
const APP_SHELL_URLS = APP_SHELL_FILES.map(file => new URL(file, self.registration.scope).href);

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(name => name.startsWith('cruise-packer-shell-') && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(() => caches.match(new URL('index.html', self.registration.scope)))
        );
        return;
    }

    event.respondWith(
        fetch(request).then(response => {
            if (response.ok) {
                event.waitUntil(
                    caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()))
                );
            }
            return response;
        }).catch(() => caches.match(request))
    );
});
