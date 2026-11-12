import React, {useEffect, useId, useRef, useState, useSyncExternalStore} from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import {TOGGLE_THEME_EVENT} from '@site/src/client/events';
import {
  getOfflineReadingState,
  setOfflineReading,
  subscribeOfflineReading,
  type OfflineReadingState,
} from '@site/src/pwa/offlineReading';

const SERVER_OFFLINE_STATE: OfflineReadingState = {supported: false, forced: false, preferred: false};
const GITHUB_URL = 'https://github.com/nimatrueway/my-learning-journey';

type Props = {mobile?: boolean};

const readModes = () => {
  const classes = document.documentElement.classList;
  return {zen: classes.contains('zen-mode'), status: classes.contains('show-reading-status')};
};

function Check({on}: {on: boolean}) {
  return <span className="settingsMenuCheck" aria-hidden="true">{on ? '✓' : ''}</span>;
}

export default function SettingsMenu({mobile}: Props): React.ReactElement | null {
  const {colorMode, setColorMode} = useColorMode();
  const [open, setOpen] = useState(false);
  const [modes, setModes] = useState({zen: false, status: false});
  const rootRef = useRef<HTMLLIElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const dark = colorMode === 'dark';
  const offline = useSyncExternalStore(subscribeOfflineReading, getOfflineReadingState, () => SERVER_OFFLINE_STATE);
  const offlineOn = offline.forced || offline.preferred;

  useEffect(() => {
    setModes(readModes());
    const observer = new MutationObserver(() => setModes(readModes()));
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
    return () => observer.disconnect();
  }, []);

  // The `d` shortcut lives outside React, so it asks this component to switch the theme.
  useEffect(() => {
    const toggle = () => setColorMode(dark ? 'light' : 'dark');
    document.addEventListener(TOGGLE_THEME_EVENT, toggle);
    return () => document.removeEventListener(TOGGLE_THEME_EVENT, toggle);
  }, [dark, setColorMode]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  // The navbar button stays visible on small screens, so the mobile sidebar needs no copy.
  if (mobile) return null;

  return (
    <li className="navbar__item settingsMenu" ref={rootRef}>
      <button ref={triggerRef} type="button" className="settingsMenuTrigger"
        aria-label="Settings" title="Settings" aria-expanded={open} aria-controls={panelId}
        onClick={() => setOpen(value => !value)}>
        ⚙
      </button>
      <div id={panelId} className="settingsMenuPanel" role="group" aria-label="Settings" hidden={!open}>
        <ul>
          <li>
            <button type="button" data-reading-action="zen" aria-pressed={modes.zen}
              onClick={() => setOpen(false)}>
              <Check on={modes.zen} /><span>Zen mode</span><kbd>z</kbd>
            </button>
          </li>
          <li>
            <button type="button" data-reading-action="status" aria-pressed={modes.status}>
              <Check on={modes.status} /><span>Reading status bar</span><kbd>s</kbd>
            </button>
          </li>
          <li>
            <button type="button" aria-pressed={dark} onClick={() => setColorMode(dark ? 'light' : 'dark')}>
              <Check on={dark} /><span>Dark theme</span><kbd>d</kbd>
            </button>
          </li>
          <li>
            <button type="button" data-reading-action="shortcuts" onClick={() => setOpen(false)}>
              <Check on={false} /><span>Keyboard shortcuts</span><kbd>?</kbd>
            </button>
          </li>
          {offline.supported && (
            <li>
              <button type="button" aria-pressed={offlineOn} disabled={offline.forced}
                aria-describedby={`${panelId}-offline`}
                onClick={() => void setOfflineReading(!offline.preferred)}>
                <Check on={offlineOn} />
                <span>
                  Full offline reading
                  <small id={`${panelId}-offline`} className="settingsMenuHint">
                    {offline.forced ? 'Always on in the installed app' : 'Downloads the whole site to this device'}
                  </small>
                </span>
              </button>
            </li>
          )}
          <li className="settingsMenuDivider">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <Check on={false} /><span>GitHub</span><span aria-hidden="true">↗</span>
            </a>
          </li>
        </ul>
      </div>
    </li>
  );
}
