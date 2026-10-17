// Service worker do site do passageiro.
// Guarda o app e os horários no aparelho para funcionar sem internet.
// Estratégia: mostra a cópia salva na hora e, se houver internet, busca a versão
// nova em segundo plano (stale-while-revalidate). Troque VERSAO ao mudar a lista abaixo.
const VERSAO = 'fronteira-v3';
const ARQUIVOS = [
  './',
  './index.html',
  './dados.js',
  './db.js',
  './geo.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'atualizar') self.skipWaiting();
});

// Arquivos externos que não mudam (fontes e biblioteca do mapa): guarda na primeira vez.
const FONTES = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'];

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const origem = new URL(req.url).origin;
  // Fontes do Google: guarda na primeira vez e usa a cópia depois (não mudam).
  if (FONTES.includes(origem)) {
    e.respondWith(caches.open(VERSAO).then(async cache => {
      const salvo = await cache.match(req);
      if (salvo) return salvo;
      try { const res = await fetch(req); cache.put(req, res.clone()); return res; }
      catch (err) { return new Response('', { status: 503 }); }
    }));
    return;
  }
  if (origem !== location.origin) return;
  const chave = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(VERSAO).then(async cache => {
      const salvo = await cache.match(chave, { ignoreSearch: true });
      const rede = fetch(req).then(res => {
        if (res.ok) cache.put(chave, res.clone());
        return res;
      }).catch(() => null);
      if (salvo) { e.waitUntil(rede); return salvo; }
      return (await rede) || new Response('Sem conexão', { status: 503, statusText: 'Offline' });
    })
  );
});
