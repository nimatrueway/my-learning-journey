import {PrecacheController} from 'workbox-precaching';

const params = JSON.parse(new URL(self.location.href).searchParams.get('params') ?? '{}');
const manifest = self.__WB_MANIFEST;
const OFFLINE_SHELL = '404.html';
const pending = new Map();
const downloads = [];
let status = {type: 'UPDATE_PROGRESS', phase: 'checking', downloadedBytes: 0, totalBytes: 0};
let lastReport = 0;

async function report(force = false) {
  if (!force && Date.now() - lastReport < 200) return;
  lastReport = Date.now();
  const clients = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
  for (const client of clients) client.postMessage(status);
}

const controller = new PrecacheController({
  fallbackToNetwork: true,
  plugins: [{
    async fetchDidSucceed({request, response, event}) {
      const entry = pending.get(request.url);
      if (!entry || !response.ok || !response.body) return response;
      const reader = response.clone().body.getReader();
      const download = (async () => {
        try {
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            const bytes = Math.min(value.byteLength, entry.total - entry.received);
            entry.received += bytes;
            status.downloadedBytes += bytes;
            await report();
          }
        } finally {
          reader.releaseLock();
        }
      })();
      downloads.push(download);
      event.waitUntil(download);
      return response;
    },
  }],
});

if (params.offlineMode) controller.addToCacheList(manifest);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      if (params.offlineMode) {
        const cache = await caches.open(controller.strategy.cacheName);
        const cached = new Set((await cache.keys()).map(request => request.url));
        for (const entry of manifest) {
          const url = new URL(entry.url, self.location.href).href;
          if (!cached.has(controller.getCacheKeyForURL(url))) {
            pending.set(url, {total: entry.byteLength, received: 0});
            status.totalBytes += entry.byteLength;
          }
        }
      }
      status.phase = 'downloading';
      await report(true);
      await controller.install(event);
      await Promise.all(downloads);
      status.phase = 'complete';
      status.downloadedBytes = status.totalBytes;
      await report(true);
    } catch (error) {
      status.phase = 'error';
      console.error('[PWA] Update installation failed.', error);
      await report(true);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil(controller.activate(event));
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'GET_UPDATE_PROGRESS') event.source?.postMessage(status);
});

self.addEventListener('fetch', event => {
  if (!params.offlineMode || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // Pages are not precached. Offline, serve the shell; the client router renders the route from precached chunks.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () =>
      (await controller.matchPrecache(OFFLINE_SHELL)) ?? Response.error()));
    return;
  }
  url.search = '';
  url.hash = '';
  const candidates = [
    url.href,
    `${url.href}${url.pathname.endsWith('/') ? '' : '/'}index.html`,
    `${url.href}.html`,
  ];
  const match = candidates.find(candidate => controller.getCacheKeyForURL(candidate));
  if (match) {
    event.respondWith(controller.matchPrecache(match).then(response => response ?? fetch(event.request)));
  }
});
