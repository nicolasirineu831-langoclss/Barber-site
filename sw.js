// Service worker mínimo — necessário pra o site ser reconhecido como app instalável (PWA)
// e pra gerar o APK depois no PWABuilder. Não faz cache agressivo pra sempre pegar dados
// atualizados do Firebase (agendamentos, serviços, etc. têm que vir sempre em tempo real).
const CACHE_NAME = 'barberpro-shell-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Estratégia "network-first": tenta buscar da internet primeiro; só usa o cache
// (versão salva anteriormente) se o celular estiver sem conexão.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
