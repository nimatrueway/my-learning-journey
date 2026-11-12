import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from '../theme/PwaReloadPopup/styles.module.css';

const watchForUpdates = (registration: ServiceWorkerRegistration) => {
  let currentNotice: HTMLElement | undefined;
  const showDownloadNotice = () => {
    const worker = registration.installing;
    if (!registration.active || !worker || worker.state !== 'installing') return;

    currentNotice?.remove();
    const notice = document.createElement('div');
    currentNotice = notice;
    notice.className = `alert alert--secondary ${styles.popup} ${styles.download}`;
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    const label = document.createElement('span');
    label.textContent = 'Checking update... You can keep reading.';
    notice.appendChild(label);

    const progress = document.createElement('progress');
    progress.setAttribute('aria-label', 'Downloading update');
    progress.setAttribute('max', '100');
    notice.appendChild(progress);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = `clean-btn ${styles.close}`;
    close.setAttribute('aria-label', 'Hide update progress');
    close.textContent = '×';
    close.addEventListener('click', () => notice.remove());
    notice.appendChild(close);
    document.body.appendChild(notice);

    let failed = false;
    const showFailure = () => {
      if (failed) return;
      failed = true;
      label.textContent = 'Update failed. Your current version is still available. Reload to retry when online.';
      notice.className = `alert alert--danger ${styles.popup} ${styles.download}`;
      progress.remove();
      close.remove();
      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'button button--link';
      dismiss.textContent = 'Dismiss';
      dismiss.addEventListener('click', () => notice.remove());
      notice.appendChild(dismiss);
      // A hidden progress notice must still surface the failure.
      if (!notice.isConnected && currentNotice === notice) document.body.appendChild(notice);
    };

    const updateProgress = (event: MessageEvent<unknown>) => {
      if (event.source !== worker || !event.data || typeof event.data !== 'object') return;
      const data = event.data;
      if (!('type' in data) || data.type !== 'UPDATE_PROGRESS' || !('phase' in data)) return;
      if (data.phase === 'error') {
        showFailure();
        return;
      }
      if (failed) return;
      if (data.phase !== 'downloading' && data.phase !== 'complete') return;
      if (!('downloadedBytes' in data) || typeof data.downloadedBytes !== 'number'
        || !Number.isFinite(data.downloadedBytes) || data.downloadedBytes < 0
        || !('totalBytes' in data) || typeof data.totalBytes !== 'number'
        || !Number.isFinite(data.totalBytes) || data.totalBytes < data.downloadedBytes) return;

      const {downloadedBytes, totalBytes} = data;
      const percent = data.phase === 'complete' ? 100
        : totalBytes === 0 ? 0 : Math.min(99, Math.floor(100 * downloadedBytes / totalBytes));
      progress.setAttribute('value', String(percent));
      const bytes = `${(downloadedBytes / 1e6).toFixed(1)} / ${(totalBytes / 1e6).toFixed(1)} MB`;
      label.textContent = data.phase === 'complete' || downloadedBytes === totalBytes
        ? 'Finishing update...'
        : `Downloading update... ${percent}% (${bytes}). You can keep reading.`;
    };
    navigator.serviceWorker.addEventListener('message', updateProgress);
    worker.postMessage({type: 'GET_UPDATE_PROGRESS'});

    const clearDownloadNotice = () => {
      if (worker.state === 'installing') return;
      if (worker.state === 'redundant') showFailure();
      else notice.remove();
      worker.removeEventListener('statechange', clearDownloadNotice);
      navigator.serviceWorker.removeEventListener('message', updateProgress);
    };
    worker.addEventListener('statechange', clearDownloadNotice);
  };

  registration.addEventListener('updatefound', showDownloadNotice);
  showDownloadNotice();
};

const checkForUpdate = () => {
  if (document.visibilityState !== 'visible' || !('serviceWorker' in navigator)) return;

  void navigator.serviceWorker
    .getRegistration()
    .then((registration) => registration?.update())
    .catch(() => undefined);
};

if (ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.ready.then(watchForUpdates).catch(() => undefined);
  document.addEventListener('visibilitychange', checkForUpdate);
}