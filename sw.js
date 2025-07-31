// Service Worker for MoodyMe PWA
const CACHE_NAME = 'moodyme-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/manifest.json',
    '/demo.html',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap',
    'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('Cache failed:', error);
            })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.includes('googleapis.com') &&
        !event.request.url.includes('unpkg.com') &&
        !event.request.url.includes('lottiefiles.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response for cache
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }).catch(() => {
                    // If both cache and network fail, show offline message for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return new Response(`
                            <!DOCTYPE html>
                            <html lang="ar" dir="rtl">
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>MoodyMe - غير متصل</title>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        text-align: center;
                                        padding: 50px;
                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                        color: white;
                                        min-height: 100vh;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        flex-direction: column;
                                    }
                                    .offline-icon {
                                        font-size: 4rem;
                                        margin-bottom: 20px;
                                    }
                                    h1 {
                                        font-size: 2rem;
                                        margin-bottom: 20px;
                                    }
                                    p {
                                        font-size: 1.2rem;
                                        opacity: 0.8;
                                        line-height: 1.6;
                                    }
                                    .retry-btn {
                                        background: rgba(255,255,255,0.2);
                                        color: white;
                                        border: 2px solid rgba(255,255,255,0.3);
                                        padding: 15px 30px;
                                        border-radius: 50px;
                                        font-size: 1rem;
                                        cursor: pointer;
                                        margin-top: 20px;
                                        transition: all 0.3s ease;
                                    }
                                    .retry-btn:hover {
                                        background: rgba(255,255,255,0.3);
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="offline-icon">🔌</div>
                                <h1>غير متصل بالإنترنت</h1>
                                <p>يبدو أنك غير متصل بالإنترنت حالياً.<br>
                                   تأكد من اتصالك وحاول مرة أخرى.</p>
                                <button class="retry-btn" onclick="window.location.reload()">
                                    إعادة المحاولة
                                </button>
                            </body>
                            </html>
                        `, {
                            headers: { 'Content-Type': 'text/html; charset=utf-8' }
                        });
                    }
                });
            })
    );
});

// Background Sync for future use
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Here you could sync mood entries to a server when connection is restored
    }
});

// Push notifications for future use
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'لا تنس تسجيل مزاجك اليوم! 😊',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: data,
            actions: [
                {
                    action: 'open',
                    title: 'فتح التطبيق'
                },
                {
                    action: 'close',
                    title: 'إغلاق'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'MoodyMe', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker loaded successfully');