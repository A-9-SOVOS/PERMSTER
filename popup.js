/*
 * Arc-9 Open Royalty Agreement — draft
 * Copyright (c) A-9-SOVOS
 *
 * See LICENSE in repository root for full license terms (Arc-9 Open Royalty Agreement — 4% royalty for covered commercial use).
 */
document.addEventListener('DOMContentLoaded', function() {
  const dataCollectionToggle = document.getElementById('dataCollection');
  const statusElement = document.getElementById('status');

  // Helper for promise-style storage operations
  function storageGet(keys) {
    return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
  }

  // Load saved state (including filter threshold and save method)
  const thresholdInput = document.getElementById('thresholdInput');
  const thresholdMsg = document.getElementById('thresholdMsg');

  // Read both legacy (prefixed) and new (suffixed) keys; prefer suffixed keys when present.
  chrome.storage.local.get(['dataCollectionEnabled','enabledDataCollection','dataCollectionPath','pathDataCollection','filterThreshold','saveEveryN','showZeros','onlyZeros'], function(result) {
    const enabled = (typeof result.enabledDataCollection !== 'undefined' && result.enabledDataCollection !== null)
      ? !!result.enabledDataCollection
      : (typeof result.dataCollectionEnabled !== 'undefined' ? !!result.dataCollectionEnabled : false);
    dataCollectionToggle.checked = enabled;
    // Force downloads mode and show consistent path for clarity
    const downloadPath = 'Downloads/XData/xd.csv';
    updateStatus(downloadPath);
    if (typeof result.filterThreshold !== 'undefined' && result.filterThreshold !== null) {
      thresholdInput.value = String(result.filterThreshold);
      thresholdMsg.textContent = `Current minimum: ${result.filterThreshold}%`;
    }
    // Load save frequency setting
    const saveEveryInput = document.getElementById('saveEveryInput');
    const saveEveryMsg = document.getElementById('saveEveryMsg');
    if (typeof result.saveEveryN !== 'undefined' && result.saveEveryN !== null) {
      saveEveryInput.value = String(result.saveEveryN);
      saveEveryMsg.textContent = `Auto-save every ${result.saveEveryN} datapoints`;
    }

    // Load showZeros
    const showZerosEl = document.getElementById('showZeros');
    const onlyZerosWrap = document.getElementById('onlyZerosWrap');
    const onlyZerosEl = document.getElementById('onlyZeros');
    const onlyZerosWarning = document.getElementById('onlyZerosWarning');
    if (typeof result.showZeros !== 'undefined' && result.showZeros !== null) {
      showZerosEl.checked = !!result.showZeros;
      onlyZerosWrap.style.display = showZerosEl.checked ? 'block' : 'none';
    }
    if (typeof result.onlyZeros !== 'undefined' && result.onlyZeros !== null) {
      onlyZerosEl.checked = !!result.onlyZeros;
      // Keep the warning visible even before the user toggles 'onlyZeros'
      if (onlyZerosWarning) onlyZerosWarning.style.display = 'block';
    }

    // Show processed IDs count
    storageGet(['processedIds']).then(res => {
      const arr = res?.processedIds || [];
      const cnt = Array.isArray(arr) ? arr.length : '—';
      const el = document.getElementById('processedCount');
      if (el) el.textContent = `processed: ${cnt}`;
    }).catch(() => {});
  });

  // Handle toggle changes
  dataCollectionToggle.addEventListener('change', async function() {
    if (this.checked) {
      await chrome.storage.local.set({ enabledDataCollection: true, pathDataCollection: 'Downloads/XData/xd.csv' });
      updateStatus('Downloads/XData/xd.csv');
    } else {
      await chrome.storage.local.set({ enabledDataCollection: false, pathDataCollection: null });
      updateStatus(null);
    }
  });

  function updateStatus(path, error) {
    if (error) {
      statusElement.style.color = '#e74c3c';
      statusElement.textContent = error;
    } else if (path) {
      statusElement.style.color = '#666';
      statusElement.textContent = `Auto-saving to: ${path}`;
    } else {
      statusElement.style.color = '#666';
      statusElement.textContent = 'Data collection disabled';
    }
  }



  // Threshold change handling
  thresholdInput.addEventListener('change', async () => {
    const raw = thresholdInput.value?.toString()?.trim();
    if (!raw) {
      // Empty => clear filter
      await chrome.storage.local.remove(['filterThreshold']);
      thresholdMsg.textContent = 'Filtering disabled — showing all posts';
      return;
    }

    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < 0.01 || parsed > 100) {
      thresholdMsg.style.color = '#e74c3c';
      thresholdMsg.textContent = 'Value must be between 0.01 and 100';
      return;
    }

    // Save validated threshold
    await chrome.storage.local.set({ filterThreshold: parsed });
    thresholdMsg.style.color = '#666';
    thresholdMsg.textContent = `Current minimum: ${parsed}%`;
  });

  // Save-frequency handling
  const saveEveryInputEl = document.getElementById('saveEveryInput');
  const saveEveryMsgEl = document.getElementById('saveEveryMsg');
  saveEveryInputEl.addEventListener('change', async () => {
    const raw = saveEveryInputEl.value?.toString()?.trim();
    if (!raw) {
      // Empty => restore default behaviour (remove override)
      await chrome.storage.local.remove(['saveEveryN']);
      saveEveryMsgEl.style.color = '#666';
      saveEveryMsgEl.textContent = `Auto-save every 500 datapoints`;
      return;
    }

    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      saveEveryMsgEl.style.color = '#e74c3c';
      saveEveryMsgEl.textContent = 'Value must be a positive integer';
      return;
    }

    // Persist validated save frequency
    await chrome.storage.local.set({ saveEveryN: parsed });
    saveEveryMsgEl.style.color = '#666';
    saveEveryMsgEl.textContent = `Auto-save every ${parsed} datapoints`;
  });

  // Extension always restricts collection to the For You feed when enabled; no toggle provided in UI.

  // showZeros / onlyZeros handling
  const showZerosEl = document.getElementById('showZeros');
  const onlyZerosWrap = document.getElementById('onlyZerosWrap');
  const onlyZerosEl = document.getElementById('onlyZeros');
  const onlyZerosWarning = document.getElementById('onlyZerosWarning');
  if (showZerosEl) {
    showZerosEl.addEventListener('change', async () => {
      await chrome.storage.local.set({ showZeros: !!showZerosEl.checked });
      if (onlyZerosWrap) onlyZerosWrap.style.display = showZerosEl.checked ? 'block' : 'none';
    });
  }
  if (onlyZerosEl) {
    onlyZerosEl.addEventListener('change', async () => {
      await chrome.storage.local.set({ onlyZeros: !!onlyZerosEl.checked });
      // leave warning visible at all times to inform users before they toggle
    });
  }

  // Clear processed IDs control
  const clearProcessedBtn = document.getElementById('clearProcessed');
  if (clearProcessedBtn) {
    clearProcessedBtn.addEventListener('click', async () => {
      try {
        await chrome.storage.local.remove(['processedIds']);
        const el = document.getElementById('processedCount');
        if (el) el.textContent = 'processed: 0';
      } catch (e) {
        console.error('Failed to clear processedIds', e);
      }
    });
  }

  // Update threshold UI warnings for legal/abuse notice when selecting very high values
  const thresholdLegalWarning = (value) => {
    if (!value) return;
    const n = parseFloat(value);
    if (Number.isNaN(n)) return;
    if (n >= 100) {
      thresholdMsg.style.color = '#e67e22';
      thresholdMsg.textContent = 'Caution: 100% will likely return no results and may constitute scraping if used to bulk-collect — please be mindful of local law.';
    } else if (n >= 90) {
      thresholdMsg.style.color = '#e67e22';
      thresholdMsg.textContent = 'High thresholds reduce results and may stress upstream servers; use with care.';
    } else {
      thresholdMsg.style.color = '#666';
      thresholdMsg.textContent = `Current minimum: ${n}%`;
    }
  };

  // Show warnings while the user is typing
  thresholdInput.addEventListener('input', (e) => {
    const raw = e.target.value?.toString()?.trim();
    if (raw) thresholdLegalWarning(raw);
  });

  // Debug UI removed for publish; diagnostics still stored internally (lastSaveError) for support
});