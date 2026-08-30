(() => {
  'use strict';

  function configureStorageTimeouts() {
    try {
      if (!window.firebase?.storage || !firebase.apps?.length) return false;
      const storage = firebase.storage();
      if (typeof storage.setMaxUploadRetryTime === 'function') storage.setMaxUploadRetryTime(12000);
      if (typeof storage.setMaxOperationRetryTime === 'function') storage.setMaxOperationRetryTime(10000);
      return true;
    } catch (error) {
      console.warn('[OSG storage] timeout guard setup failed', error);
      return false;
    }
  }

  if (!configureStorageTimeouts()) {
    window.addEventListener('load', configureStorageTimeouts, { once: true });
  }
})();
