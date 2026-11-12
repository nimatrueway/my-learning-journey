const PREFERENCE_KEY = 'site.offlineReading';

export type OfflineReadingState = {
  /** A service worker registration is available (production builds only). */
  supported: boolean;
  /** Offline mode is forced on by an activation strategy, e.g. the installed app. */
  forced: boolean;
  /** The reader opted in from the settings menu. */
  preferred: boolean;
};

let state: OfflineReadingState = {supported: false, forced: false, preferred: false};
let apply: ((offlineMode: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

export const readOfflinePreference = (): boolean => {
  try {
    return localStorage.getItem(PREFERENCE_KEY) === '1';
  } catch {
    return false;
  }
};

const update = (next: Partial<OfflineReadingState>) => {
  state = {...state, ...next};
  listeners.forEach(listener => listener());
};

export const getOfflineReadingState = (): OfflineReadingState => state;

export const subscribeOfflineReading = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Called by the service worker registration module once it can apply the preference. */
export function provideOfflineReading(forced: boolean, applyMode: (offlineMode: boolean) => Promise<void>): void {
  apply = applyMode;
  update({supported: true, forced, preferred: readOfflinePreference()});
}

export async function setOfflineReading(preferred: boolean): Promise<void> {
  try {
    localStorage.setItem(PREFERENCE_KEY, preferred ? '1' : '0');
  } catch {
    // Without storage the choice only lasts for this page.
  }
  update({preferred});
  await apply?.(state.forced || preferred);
}
