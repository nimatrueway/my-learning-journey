/**
 * Replaces @docusaurus/plugin-pwa's registerSw so readers can opt into offline mode from the settings menu.
 * Offline mode is on when a configured activation strategy matches or the stored preference is set.
 */
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import {provideOfflineReading, readOfflinePreference} from './offlineReading';

// Defined by the PWA plugin's bundler config.
const SW_URL = process.env.PWA_SERVICE_WORKER_URL as string;
const STRATEGIES = process.env.PWA_OFFLINE_MODE_ACTIVATION_STRATEGIES as unknown as string[];
const DEBUG = process.env.PWA_DEBUG as unknown as boolean;
const APP_INSTALLED_KEY = 'docusaurus.pwa.event.appInstalled.fired';
const MAX_MOBILE_WIDTH = 996;

const storage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string | null) => {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      // Storage unavailable.
    }
  },
};

async function isRelatedAppInstalled(): Promise<boolean> {
  const nav = navigator as Navigator & {getInstalledRelatedApps?: () => Promise<{platform: string}[]>};
  if (!nav.getInstalledRelatedApps) return false;
  try {
    return (await nav.getInstalledRelatedApps()).some(app => app.platform === 'webapp');
  } catch {
    return false;
  }
}

const strategies: Record<string, () => boolean | Promise<boolean>> = {
  always: () => true,
  mobile: () => window.innerWidth <= MAX_MOBILE_WIDTH,
  saveData: () => !!(navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData,
  appInstalled: () => storage.get(APP_INSTALLED_KEY) === 'true' || isRelatedAppInstalled(),
  standalone: () => window.matchMedia('(display-mode: standalone)').matches,
  queryString: () => new URLSearchParams(window.location.search).get('offlineMode') === 'true',
};

async function isOfflineForced(): Promise<boolean> {
  const results = await Promise.all(STRATEGIES.map(name => Promise.resolve(strategies[name]?.() ?? false)));
  return results.some(Boolean);
}

let offlineMode = false;
// Set when the reader changes the preference, so the new worker takes over without the reload prompt.
let activateSilently = false;
const watched = new WeakSet<ServiceWorkerRegistration>();

function handleWaiting(worker: ServiceWorker) {
  const skipWaiting = () => worker.postMessage({type: 'SKIP_WAITING'});
  if (!offlineMode || activateSilently) {
    activateSilently = false;
    skipWaiting();
    return;
  }
  void import('@docusaurus/plugin-pwa/lib/renderReloadPopup.js').then(({renderReloadPopup}) => renderReloadPopup({
    onReload() {
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {once: true});
      skipWaiting();
    },
  }));
}

async function register(nextOfflineMode: boolean): Promise<void> {
  offlineMode = nextOfflineMode;
  const params = encodeURIComponent(JSON.stringify({offlineMode, debug: DEBUG}));
  const registration = await navigator.serviceWorker.register(`${SW_URL}?params=${params}`);
  if (!watched.has(registration)) {
    watched.add(registration);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && registration.active) handleWaiting(worker);
      });
    });
  }
  if (registration.waiting) handleWaiting(registration.waiting);
}

async function clearRegistrations() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map(registration => registration.unregister()));
  window.location.reload();
}

if (ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator) {
  // An installed app gets a fresh worker URL; clear the browser-tab worker so it does not keep serving.
  window.addEventListener('appinstalled', () => {
    storage.set(APP_INSTALLED_KEY, 'true');
    void clearRegistrations();
  });
  window.addEventListener('beforeinstallprompt', () => {
    if (storage.get(APP_INSTALLED_KEY) !== 'true') return;
    storage.set(APP_INSTALLED_KEY, null);
    void clearRegistrations();
  });

  void isOfflineForced().then(async forced => {
    provideOfflineReading(forced, async mode => {
      activateSilently = true;
      await register(mode);
    });
    await register(forced || readOfflinePreference());
  }).catch(error => console.error('registerSW failed', error));
}
