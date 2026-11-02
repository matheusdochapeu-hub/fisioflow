/* Service worker do app Atendimentos (Fisioterapia).
   Incrementar CACHE_VERSION ao publicar mudanças de assets para invalidar o cache. */
var CACHE_VERSION = 'fisioflow-v10';
var CORE_CACHE = CACHE_VERSION + '-core';
var RUNTIME_CACHE = CACHE_VERSION + '-runtime';

/* App shell: caminhos RELATIVOS ao escopo (funciona na raiz do tiiny.site
   e também em subdiretório do GitHub Pages). */
var CORE_ASSETS = [
  './',
  './atendimentos.html',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/pix_qr.svg',
  './scripts/qrcode.min.js'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CORE_CACHE).then(function(cache){
      /* addAll falha se algum recurso faltar; add individual tolera ausências. */
      return Promise.all(CORE_ASSETS.map(function(url){
        return cache.add(url).catch(function(){ /* ignora o que não existir */ });
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k.indexOf(CACHE_VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method !== 'GET') return;  // nunca intercepta POST (gravações na planilha)

  var url;
  try { url = new URL(req.url); } catch(e){ return; }

  /* Dados da planilha (Apps Script) sempre pela rede — nunca cacheia. */
  if(url.hostname.indexOf('script.google.com') > -1 ||
     url.hostname.indexOf('script.googleusercontent.com') > -1){
    return;  // deixa o navegador tratar
  }

  var isHtml = req.mode === 'navigate' ||
               url.pathname.endsWith('.html') ||
               url.pathname.endsWith('/') ||
               url.href === self.registration.scope;

  /* Páginas HTML e App Shell: sempre NETWORK-FIRST para atualizações instantâneas.
     Em caso de falha de conexão (offline), recorre ao cache local. */
  if(isHtml){
    event.respondWith(
      fetch(req).then(function(res){
        if(res && res.ok){
          var copy = res.clone();
          caches.open(CORE_CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      }).catch(function(){
        return caches.match(req).then(function(r){
          return r || caches.match('./atendimentos.html').then(function(fallback){
            return fallback || caches.match('./index.html');
          });
        });
      })
    );
    return;
  }

  /* Fontes do Google e jsPDF (CDN): stale-while-revalidate. */
  if(url.hostname.indexOf('fonts.googleapis.com') > -1 ||
     url.hostname.indexOf('fonts.gstatic.com') > -1 ||
     url.hostname.indexOf('cdnjs.cloudflare.com') > -1){
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  /* Mesmo domínio (ícones, manifest, qr): cache-first. */
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(req).then(function(cached){
        return cached || fetch(req).then(function(res){
          var copy = res.clone();
          caches.open(CORE_CACHE).then(function(c){ c.put(req, copy); });
          return res;
        }).catch(function(){ return cached; });
      })
    );
  }
});

function staleWhileRevalidate(req){
  return caches.open(RUNTIME_CACHE).then(function(cache){
    return cache.match(req).then(function(cached){
      var network = fetch(req).then(function(res){
        if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function(){ return cached; });
      return cached || network;
    });
  });
}
