import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

const checkForUpdate = () => {
  if (document.visibilityState !== 'visible' || !('serviceWorker' in navigator)) return;

  void navigator.serviceWorker
    .getRegistration()
    .then((registration) => registration?.update())
    .catch(() => undefined);
};

if (ExecutionEnvironment.canUseDOM && 'serviceWorker' in navigator) {
  document.addEventListener('visibilitychange', checkForUpdate);
}