import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const ZEN_STORAGE_KEY = 'zen-mode';

const readStoredZen = (): boolean => {
  try {
    return localStorage.getItem(ZEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const setZen = (on: boolean) => {
  document.documentElement.classList.toggle('zen-mode', on);
  try {
    localStorage.setItem(ZEN_STORAGE_KEY, on ? '1' : '0');
  } catch {
    // storage unavailable; zen stays session-only
  }
};

const isZen = () => document.documentElement.classList.contains('zen-mode');

const toggleTheme = () => {
  const button = document.querySelector<HTMLButtonElement>(
    '[class*="colorModeToggle"] button, .navbar button[aria-label^="Switch between dark and light mode"]',
  );
  button?.click();
};

const ensureZenExit = () => {
  if (!document.body || document.getElementById('zen-exit')) return;
  const button = document.createElement('button');
  button.id = 'zen-exit';
  button.type = 'button';
  button.textContent = 'exit zen · z';
  button.addEventListener('click', () => setZen(false));
  document.body.appendChild(button);
};

const ensureGuide = (): HTMLElement | null => {
  let overlay = document.getElementById('kbd-guide');
  if (!overlay && document.body) {
    overlay = document.createElement('div');
    overlay.id = 'kbd-guide';
    overlay.innerHTML = `
      <div class="kbdPanel" role="dialog" aria-label="Keyboard shortcuts">
        <p class="kbdTitle"># keyboard shortcuts</p>
        <div class="kbdRow"><kbd>z</kbd><span>toggle zen mode (hide all chrome)</span></div>
        <div class="kbdRow"><kbd>d</kbd><span>toggle dark / light theme</span></div>
        <div class="kbdRow"><kbd>?</kbd><span>show this guide</span></div>
        <div class="kbdRow"><kbd>esc</kbd><span>close guide / exit zen</span></div>
      </div>`;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) overlay!.classList.remove('open');
    });
    document.body.appendChild(overlay);
  }
  return overlay;
};

const toggleGuide = () => ensureGuide()?.classList.toggle('open');

const init = () => {
  // Restore first so persistence survives even if later DOM setup fails.
  if (readStoredZen()) document.documentElement.classList.add('zen-mode');
  ensureZenExit();

  // Docusaurus rewrites the html className wholesale during hydration and
  // route changes, wiping the zen class; re-assert it whenever that happens.
  new MutationObserver(() => {
    if (readStoredZen() && !document.documentElement.classList.contains('zen-mode')) {
      document.documentElement.classList.add('zen-mode');
    }
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('#kbd-guide-btn')) toggleGuide();
  });

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (event.key === 'z') {
      setZen(!isZen());
    } else if (event.key === 'd') {
      toggleTheme();
    } else if (event.key === '?') {
      toggleGuide();
    } else if (event.key === 'Escape') {
      const guide = document.getElementById('kbd-guide');
      if (guide?.classList.contains('open')) {
        guide.classList.remove('open');
      } else if (isZen()) {
        setZen(false);
      }
    }
  });
};

if (ExecutionEnvironment.canUseDOM) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
}

// Re-assert after each route render in case body-level nodes were replaced.
export function onRouteDidUpdate(): void {
  if (!ExecutionEnvironment.canUseDOM) return;
  if (readStoredZen()) document.documentElement.classList.add('zen-mode');
  ensureZenExit();
}
