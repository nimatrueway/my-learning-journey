import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const ZEN_STORAGE_KEY = 'zen-mode';
const STATUS_STORAGE_KEY = 'reading-status';
const SCROLL_STORAGE_PREFIX = 'reading-scroll:';
const COMPLETION_STORAGE_PREFIX = 'reading-complete:';
const PROGRESS_STORAGE_PREFIX = 'reading-progress:';
const COMPLETION_THRESHOLD = 24;

let activeScrollKey: string | null = null;
let pendingScrollSave: number | null = null;

const getScrollKey = (): string | null => {
  if (!window.location.pathname.includes('/courses/')) return null;
  return `${SCROLL_STORAGE_PREFIX}${window.location.pathname}${window.location.search}`;
};

const normalizePath = (path: string): string => path.replace(/\/+$/, '');

const getCompletionKey = (path = window.location.pathname): string | null => {
  if (!path.includes('/courses/')) return null;
  return `${COMPLETION_STORAGE_PREFIX}${normalizePath(path)}`;
};

const getProgressKey = (path = window.location.pathname): string | null => {
  if (!path.includes('/courses/')) return null;
  return `${PROGRESS_STORAGE_PREFIX}${normalizePath(path)}`;
};

const readPageProgress = (path: string): number => {
  try {
    const stored = localStorage.getItem(getProgressKey(path) ?? '');
    if (stored !== null) return Math.max(0, Math.min(100, Number(stored) || 0));
    return localStorage.getItem(getCompletionKey(path) ?? '') === '1' ? 100 : 0;
  } catch {
    return 0;
  }
};

const decorateCompletedLinks = () => {
  document.querySelectorAll('.theme-doc-sidebar-menu .menu__link--completed').forEach((link) => {
    link.classList.remove('menu__link--completed');
  });
  document.querySelectorAll('.theme-doc-sidebar-menu .menu__page-progress').forEach((indicator) => {
    indicator.remove();
  });
  document
    .querySelectorAll<HTMLAnchorElement>('.theme-doc-sidebar-menu a.menu__link[href]:not(.menu__link--sublist)')
    .forEach((link) => {
      const progress = readPageProgress(new URL(link.href, window.location.origin).pathname);
      link.classList.toggle('menu__link--completed', progress === 100);
      if (progress <= 0 || progress >= 100) return;

      const indicator = document.createElement('span');
      indicator.className = 'menu__page-progress';
      indicator.title = 'Reading progress';
      indicator.setAttribute('role', 'progressbar');
      indicator.setAttribute('aria-label', `${progress}% read`);
      indicator.setAttribute('aria-valuemin', '0');
      indicator.setAttribute('aria-valuemax', '100');
      indicator.setAttribute('aria-valuenow', String(progress));
      const track = document.createElement('span');
      track.className = 'menu__progress-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.className = 'menu__progress-fill';
      fill.style.width = `${progress}%`;
      track.appendChild(fill);
      indicator.appendChild(track);
      link.appendChild(indicator);
    });
};

const updateCurrentPageProgress = () => {
  const completionKey = getCompletionKey();
  const progressKey = getProgressKey();
  if (!completionKey || !progressKey) return;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
  const progress =
    remaining <= COMPLETION_THRESHOLD
      ? 100
      : Math.max(0, Math.min(99, Math.round((window.scrollY / Math.max(1, maxScroll)) * 100)));

  try {
    const previous = Number(localStorage.getItem(progressKey));
    localStorage.setItem(progressKey, String(progress));
    if (progress === 100) localStorage.setItem(completionKey, '1');
    else localStorage.removeItem(completionKey);
    decorateCompletedLinks();
    if (previous !== progress) window.dispatchEvent(new Event('reading-progress-updated'));
  } catch {
    // storage unavailable; progress stays session-only
  }
};

const refreshCompletionIndicators = () => {
  window.requestAnimationFrame(() => {
    decorateCompletedLinks();
    updateCurrentPageProgress();
  });
};

const saveScrollPosition = () => {
  if (!activeScrollKey) return;
  try {
    localStorage.setItem(activeScrollKey, String(window.scrollY));
  } catch {
    // storage unavailable; the browser keeps its session-only behavior
  }
};

const scheduleScrollSave = () => {
  if (pendingScrollSave !== null) return;
  pendingScrollSave = window.requestAnimationFrame(() => {
    pendingScrollSave = null;
    saveScrollPosition();
    updateCurrentPageProgress();
  });
};

const restoreScrollPosition = () => {
  activeScrollKey = getScrollKey();
  if (!activeScrollKey || window.location.hash) return;

  try {
    const storedPosition = Number(localStorage.getItem(activeScrollKey));
    if (!Number.isFinite(storedPosition) || storedPosition < 0) return;

    const restoringKey = activeScrollKey;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (activeScrollKey === restoringKey) window.scrollTo(0, storedPosition);
      });
    });
  } catch {
    // storage unavailable; leave the current position unchanged
  }
};

const readStored = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const readStoredZen = (): boolean => readStored(ZEN_STORAGE_KEY);

const syncModeButtons = () => {
  const states = {
    zen: document.documentElement.classList.contains('zen-mode'),
    status: document.documentElement.classList.contains('show-reading-status'),
  };
  document.querySelectorAll<HTMLButtonElement>('[data-reading-action]').forEach((button) => {
    const action = button.dataset.readingAction as keyof typeof states;
    const active = states[action] ?? false;
    button.classList.toggle('navbarModeBtn--active', active);
    button.setAttribute('aria-pressed', String(active));
  });
};

const setStatusBar = (on: boolean) => {
  document.documentElement.classList.toggle('show-reading-status', on);
  try {
    localStorage.setItem(STATUS_STORAGE_KEY, on ? '1' : '0');
  } catch {
    // storage unavailable; status stays session-only
  }
  syncModeButtons();
};

const setZen = (on: boolean) => {
  document.documentElement.classList.toggle('zen-mode', on);
  try {
    localStorage.setItem(ZEN_STORAGE_KEY, on ? '1' : '0');
  } catch {
    // storage unavailable; zen stays session-only
  }
  syncModeButtons();
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
        <div class="kbdRow"><kbd>s</kbd><span>toggle reading status bar</span></div>
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
  if (readStored(STATUS_STORAGE_KEY)) document.documentElement.classList.add('show-reading-status');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  restoreScrollPosition();
  refreshCompletionIndicators();
  ensureZenExit();
  syncModeButtons();

  window.addEventListener('scroll', scheduleScrollSave, {passive: true});
  window.addEventListener('pagehide', saveScrollPosition);

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('a[href]')) {
        saveScrollPosition();
        updateCurrentPageProgress();
      }
    },
    {capture: true},
  );

  // Docusaurus rewrites the html className wholesale during hydration and
  // route changes, wiping the zen class; re-assert it whenever that happens.
  new MutationObserver(() => {
    if (readStoredZen() && !document.documentElement.classList.contains('zen-mode')) {
      document.documentElement.classList.add('zen-mode');
    }
    if (readStored(STATUS_STORAGE_KEY) && !document.documentElement.classList.contains('show-reading-status')) {
      document.documentElement.classList.add('show-reading-status');
    }
    syncModeButtons();
  }).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest('#kbd-guide-btn')) {
      toggleGuide();
      return;
    }
    const modeButton = target?.closest<HTMLButtonElement>('[data-reading-action]');
    if (modeButton?.dataset.readingAction === 'zen') {
      setZen(!isZen());
    } else if (modeButton?.dataset.readingAction === 'status') {
      setStatusBar(!document.documentElement.classList.contains('show-reading-status'));
    }
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
    } else if (event.key === 's') {
      setStatusBar(!document.documentElement.classList.contains('show-reading-status'));
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
  if (pendingScrollSave !== null) {
    window.cancelAnimationFrame(pendingScrollSave);
    pendingScrollSave = null;
  }
  restoreScrollPosition();
  refreshCompletionIndicators();
  if (readStoredZen()) document.documentElement.classList.add('zen-mode');
  if (readStored(STATUS_STORAGE_KEY)) document.documentElement.classList.add('show-reading-status');
  ensureZenExit();
  syncModeButtons();
}
