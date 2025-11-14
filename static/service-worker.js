const CACHE_NAME = 'financeiro-em-dia-v1';
const OFFLINE_URL = '/Finan-as-em-dia-PWA/templates/offline.html';

// Recursos essenciais para cachear na instalação
const CORE_CACHE = [
  '/Finan-as-em-dia-PWA/',
  '/Finan-as-em-dia-PWA/index.html',
  '/Finan-as-em-dia-PWA/static/css/estilo.css',
  '/Finan-as-em-dia-PWA/static/js/app.js',
  '/Finan-as-em-dia-PWA/static/js/scripts.js',
  '/Finan-as-em-dia-PWA/templates/offline.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Recursos para cachear sob demanda
const RUNTIME_CACHE = [
  '/lancamentos',
  '/categorias',
  '/contas_fixas',
  '/contas_parceladas',
  '/relatorios'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(CORE_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de cache: Network First, fallback para Cache
self.addEventListener('fetch', (event) => {
  // Apenas cachear requisições GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições de API do Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clonar e adicionar ao cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Se for uma navegação e não houver cache, retornar página offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para outros recursos, retornar resposta vazia
            return new Response('Conteúdo não disponível offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-lancamentos') {
    event.waitUntil(syncLancamentos());
  }
});

async function syncLancamentos() {
  console.log('[Service Worker] Sincronizando lançamentos...');
  // Aqui você pode implementar a lógica de sincronização
  // Por exemplo, enviar dados pendentes para o servidor
}

// Notificações Push (opcional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Financeiro em Dia';
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Click em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
