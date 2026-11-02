import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/pwa/service-worker.js', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}});

function setup({cached = true, fail = false, offlineMode = true} = {}) {
  const manifest = [
    {url: 'unchanged.js', revision: 'same', byteLength: 900},
    {url: 'changed.js', revision: 'new', byteLength: 4},
  ];
  const listeners = new Map();
  const reports = [];
  const fetched = [];
  const scope = 'https://example.test/learning/';
  const cacheKey = entry => `${scope}${entry.url}?__WB_REVISION__=${entry.revision}`;
  let now = 0;
  class Controller {
    constructor({plugins}) {
      this.plugins = plugins;
      this.strategy = {cacheName: 'existing-workbox-cache'};
      this.entries = [];
    }

    addToCacheList(entries) {
      this.entries = entries;
    }

    getCacheKeyForURL(url) {
      const entry = this.entries.find(candidate => new URL(candidate.url, scope).href === url);
      return entry && cacheKey(entry);
    }

    async install(event) {
      if (fail) throw new Error('Network failed');
      for (const entry of this.entries) {
        if (cached && entry.url === 'unchanged.js') continue;
        const request = new Request(new URL(entry.url, scope));
        fetched.push(entry.url);
        const response = new Response(new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(entry.byteLength / 2));
            controller.enqueue(new Uint8Array(entry.byteLength / 2));
            controller.close();
          },
        }));
        const original = await this.plugins[0].fetchDidSucceed({request, response, event});
        assert.equal(original, response, 'Progress must not change response semantics');
        await original.arrayBuffer();
      }
    }
  }
  runInNewContext(outputText, {
    exports: {},
    require: name => {
      assert.equal(name, 'workbox-precaching');
      return {PrecacheController: Controller};
    },
    self: {
      location: new URL(`${scope}sw.js?params=${encodeURIComponent(JSON.stringify({offlineMode}))}`),
      __WB_MANIFEST: manifest,
      clients: {matchAll: async () => [{postMessage: data => reports.push(structuredClone(data))}]},
      addEventListener: (type, listener) => listeners.set(type, listener),
    },
    caches: {
      open: async name => {
        assert.equal(name, 'existing-workbox-cache');
        return {keys: async () => cached ? [{url: cacheKey(manifest[0])}] : []};
      },
    },
    URL, Request, Response,
    Date: class extends Date {static now() {now += 250; return now;}},
    console: {error() {}},
  });
  return {
    reports, fetched, listeners,
    async install() {
      const promises = [];
      listeners.get('install')({waitUntil: promise => promises.push(promise)});
      await Promise.all(promises);
    },
  };
}

test('progress counts streamed bytes only for changed cache revisions', async () => {
  const {install, reports, fetched, listeners} = setup();
  await install();
  assert.deepEqual(fetched, ['changed.js']);
  assert.ok(reports.some(report => report.downloadedBytes === 2 && report.totalBytes === 4));
  assert.equal(reports.at(-1).phase, 'complete');
  assert.equal(reports.at(-1).downloadedBytes, 4);
  assert.equal(reports.at(-1).totalBytes, 4, '900 unchanged cached bytes are excluded');
  let replay;
  listeners.get('message')({
    data: {type: 'GET_UPDATE_PROGRESS'}, source: {postMessage: data => {replay = data;}},
  });
  assert.equal(replay.phase, 'complete', 'Late subscribers receive the latest status');
});

test('first installs count all bytes; ordinary online mode downloads nothing', async () => {
  const first = setup({cached: false});
  await first.install();
  assert.equal(first.reports.at(-1).totalBytes, 904);
  const online = setup({offlineMode: false});
  await online.install();
  assert.equal(online.reports.at(-1).totalBytes, 0);
  assert.deepEqual(online.fetched, []);
});

test('failed downloads reject installation and report failure, not completion', async () => {
  const {install, reports} = setup({fail: true});
  await assert.rejects(install, /Network failed/);
  assert.equal(reports.at(-1).phase, 'error');
  assert.equal(reports.some(report => report.phase === 'complete'), false);
});
