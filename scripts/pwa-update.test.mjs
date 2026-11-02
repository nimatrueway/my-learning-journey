import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/client/pwaUpdate.ts', import.meta.url), 'utf8');
const {outputText} = ts.transpileModule(source, {
  compilerOptions: {module: ts.ModuleKind.CommonJS},
});

class Element extends EventTarget {
  attributes = new Map();
  children = [];
  textContent = '';
  removed = false;

  constructor(tagName) {
    super();
    this.tagName = tagName;
  }

  setAttribute(name, value) {
    this.attributes.set(name, value);
  }

  appendChild(child) {
    this.children.push(child);
  }

  remove() {
    this.removed = true;
  }
}

async function setup({active = true, state = 'installing', installing = true} = {}) {
  const requests = [];
  const worker = Object.assign(new EventTarget(), {state, postMessage: message => requests.push(message)});
  const registration = Object.assign(new EventTarget(), {
    active: active ? {} : null,
    installing: installing ? worker : null,
  });
  const body = new Element('body');
  const serviceWorker = Object.assign(new EventTarget(), {ready: Promise.resolve(registration)});
  runInNewContext(outputText, {
    exports: {},
    require: (name) => {
      if (name === '@docusaurus/ExecutionEnvironment') {
        return {canUseDOM: true};
      }
      if (name === '../theme/PwaReloadPopup/styles.module.css') {
        return {popup: 'popup', download: 'download'};
      }
      throw new Error(`Unexpected import: ${name}`);
    },
    document: {
      body,
      createElement: (tagName) => new Element(tagName),
      addEventListener() {},
    },
    navigator: {serviceWorker},
  });
  await new Promise((resolve) => setImmediate(resolve));
  const send = (data, source = worker) => serviceWorker.dispatchEvent(
    Object.assign(new Event('message'), {data, source}),
  );
  return {body, worker, registration, requests, send};
}

test('an update shows an accessible indeterminate progress bar until installation ends', async () => {
  for (const finalState of ['installed', 'activated']) {
    const {body, worker} = await setup();
    assert.equal(body.children.length, 1);
    const notice = body.children[0];
    assert.equal(notice.attributes.get('role'), 'status');
    const progress = notice.children.find((child) => child.tagName === 'progress');
    assert.ok(progress, 'Downloading updates must show a progress bar');
    assert.equal(progress.attributes.get('aria-label'), 'Downloading update');
    assert.equal(progress.attributes.has('value'), false, 'Do not invent a percentage');
    worker.dispatchEvent(new Event('statechange'));
    assert.equal(notice.removed, false);
    worker.state = finalState;
    worker.dispatchEvent(new Event('statechange'));
    assert.equal(notice.removed, true);
  }
});

test('real worker progress shows percentage and changed bytes, and rejects other workers', async () => {
  const {body, requests, send} = await setup();
  assert.equal(requests[0].type, 'GET_UPDATE_PROGRESS');
  const [label, progress] = body.children[0].children;
  const message = {type: 'UPDATE_PROGRESS', phase: 'downloading', downloadedBytes: 4e6, totalBytes: 8e6};
  send(message, null);
  assert.equal(progress.attributes.has('value'), false);
  send(message);
  assert.equal(progress.attributes.get('value'), '50');
  assert.match(label.textContent, /50% \(4\.0 \/ 8\.0 MB\)/);
  send({...message, totalBytes: -1});
  assert.equal(progress.attributes.get('value'), '50');
  send({...message, downloadedBytes: 8e6});
  assert.equal(progress.attributes.get('value'), '99', 'Do not claim success before caching finishes');
  send({...message, downloadedBytes: 8e6, phase: 'complete'});
  assert.equal(progress.attributes.get('value'), '100');
});

test('a failed install keeps an explicit error and stops processing progress', async () => {
  const {body, worker, send} = await setup();
  const notice = body.children[0];
  worker.state = 'redundant';
  worker.dispatchEvent(new Event('statechange'));
  assert.equal(notice.removed, false);
  assert.match(notice.children[0].textContent, /Update failed/);
  send({type: 'UPDATE_PROGRESS', phase: 'downloading', downloadedBytes: 1, totalBytes: 2});
  assert.match(notice.children[0].textContent, /Update failed/);
});

test('first installs and workers that are not installing do not show the update notice', async () => {
  for (const options of [{active: false}, {state: 'installed'}, {installing: false}]) {
    const {body} = await setup(options);
    assert.equal(body.children.length, 0);
  }
});

test('updates discovered after startup also show progress', async () => {
  const {body, registration, worker} = await setup({installing: false});
  registration.installing = worker;
  registration.dispatchEvent(new Event('updatefound'));
  assert.ok(body.children[0]?.children.some((child) => child.tagName === 'progress'));
});
