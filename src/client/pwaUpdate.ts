import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';
import styles from '../theme/PwaReloadPopup/styles.module.css';

const watchForUpdates = (registration: ServiceWorkerRegistration) => {
  const showDownloadNotice = () => {
    const worker = registration.installing;
    if (!registration.active || !worker || worker.state !== 'installing') return;

    const notice = document.createElement('div');
    notice.className = `alert alert--secondary ${styles.popup}`;
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.textContent = 'Downloading update...';
    document.body.appendChild(notice);

    const clearDownloadNotice = () => {
      if (worker.state === 'installing') return;
      notice.remove();
      worker.removeEventListener('statechange', clearDownloadNotice);
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