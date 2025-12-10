/*
  background.js — service worker

  Responsibilities (simplified for publish):
  - Provide current data collection settings & filter threshold to content scripts.
  - Accept CSV payloads (saveDataToFile) and write them reliably to Downloads/XData/xd.csv
    using chrome.downloads (Downloads API fallback).
  - Persist a 'pendingSaveData' marker and any lastSaveError details to chrome.storage.local
    so the popup can display or retry on user interaction.

  Notes:
  - Directory handle / showDirectoryPicker flows were removed to avoid fragile, platform-dependent
    behavior. The popup and content scripts no longer expect the background to read/write a folder.
  - This service worker keeps message handling compact and defensive.
  
  ARC-9: This file and the project are licensed under the Arc-9 Open Royalty Agreement (see LICENSE).
  Use is permitted subject to the license terms; commercial uses may be subject to a royalty.
*/

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getDataCollectionSettings') {
    // Always return restrictToFeed true — extension is feed-only when enabled
    // Read both legacy (prefixed) and new (suffixed) key names so upgrades are smooth.
    chrome.storage.local.get([
      'dataCollectionEnabled','enabledDataCollection','dataCollection_enabled','enabled_dataCollection',
      'dataCollectionPath','pathDataCollection','dataCollection_path','path_dataCollection',
      'filterThreshold','saveEveryN','showZeros','onlyZeros'
    ], (result) => {
      // Prefer suffixed keys when present, fall back to legacy prefixed names.
      const enabled = (typeof result.enabledDataCollection !== 'undefined' && result.enabledDataCollection !== null)
        ? !!result.enabledDataCollection
        : (typeof result.dataCollectionEnabled !== 'undefined' ? !!result.dataCollectionEnabled : false);
      const path = (typeof result.pathDataCollection !== 'undefined' && result.pathDataCollection !== null)
        ? result.pathDataCollection
        : (typeof result.dataCollectionPath !== 'undefined' ? result.dataCollectionPath : null);

      // Migration: if only legacy prefixed keys were present, copy them to the new suffixed keys
      // to keep storage consistent for future reads/writes.
      (async () => {
        try {
          const toWrite = {};
          if ((typeof result.enabledDataCollection === 'undefined' || result.enabledDataCollection === null) && typeof result.dataCollectionEnabled !== 'undefined') {
            toWrite.enabledDataCollection = !!result.dataCollectionEnabled;
          }
          if ((typeof result.pathDataCollection === 'undefined' || result.pathDataCollection === null) && typeof result.dataCollectionPath !== 'undefined') {
            toWrite.pathDataCollection = result.dataCollectionPath;
          }
          if (Object.keys(toWrite).length) await new Promise(resolve => chrome.storage.local.set(toWrite, resolve));
        } catch (e) { /* Best-effort migration - ignore errors */ }
      })();

      sendResponse({
        enabled: enabled,
        path: path,
        threshold: typeof result.filterThreshold !== 'undefined' ? result.filterThreshold : null,
        saveEveryN: typeof result.saveEveryN !== 'undefined' ? result.saveEveryN : null,
        restrictToFeed: true,
        showZeros: typeof result.showZeros !== 'undefined' ? result.showZeros : false,
        onlyZeros: typeof result.onlyZeros !== 'undefined' ? result.onlyZeros : false
      });
    });
    return true;
  }

  if (message.type === 'saveDataToFile') {
    (async () => {
      console.log('Background: received saveDataToFile message, manual=' + message.manual);
      
      try { 
        await new Promise(resolve => chrome.storage.local.set({ pendingSaveData: message.data }, resolve)); 
      } catch (e) { /* ignore */ }

      // Support both suffixed (new) and prefixed (legacy) keys for enabled state
      const settings = await new Promise(resolve => chrome.storage.local.get(['enabledDataCollection','dataCollectionEnabled'], resolve));
      const enabled = (typeof settings?.enabledDataCollection !== 'undefined' && settings?.enabledDataCollection !== null)
        ? !!settings.enabledDataCollection
        : (!!settings?.dataCollectionEnabled);
      
      console.log('Background: data collection enabled=' + enabled);
      
      if (!enabled) {
        console.log('Background: data collection disabled, not saving');
        sendResponse({ success: false, error: 'Data collection is disabled' });
        return;
      }

      try {
        // Try to merge with a previous accumulated CSV (if present) so we don't overwrite user data
        const storageEntry = await new Promise(resolve => chrome.storage.local.get(['accumulatedCsv'], resolve));
        const existingCsv = storageEntry?.accumulatedCsv || '';

        // Collect current settings so they are backed up into the top of the CSV file
        const currentSettings = await new Promise(resolve => chrome.storage.local.get(['saveEveryN','filterThreshold','showZeros','onlyZeros'], resolve));

        let finalCsv = '';
        // Helper: find header line index and rows after it, filtering out settings blocks
        function splitCsvToHeaderAndRows(csvStr) {
          const allLines = (csvStr || '').split(/\r?\n/);
          // Find the first line that looks like the column header we expect
          const headerIdx = allLines.findIndex(l => /^Type,\s*Name,\s*Count,\s*Average Score,\s*Total Views/i.test(l.trim()));
          if (headerIdx === -1) return { header: 'Type,Name,Count,Average Score,Total Views, Avg Views, Min Views, Max Views, Total Comments, Avg Comments, Last Seen', rows: [] };
          const header = allLines[headerIdx].trim();
          // Filter out settings lines and empty lines, but keep data rows
          const rows = allLines.slice(headerIdx + 1)
            .filter(line => line.trim() && !line.trim().startsWith('#PERMSTER_SETTINGS:'))
            .filter(Boolean);
          return { header, rows };
        }

        const existingParsed = splitCsvToHeaderAndRows(existingCsv);
        const incomingParsed = splitCsvToHeaderAndRows(message.data || '');

        // Parse CSV row respecting quoted strings
        function parseCsvRow(row) {
          // Simple RFC4180-like parser: split CSV line into fields respecting quoted strings
          const fields = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
              if (inQuotes && row[i + 1] === '"') {
                cur += '"';
                i++;
                continue;
              }
              inQuotes = !inQuotes;
              continue;
            }
            if (ch === ',' && !inQuotes) {
              fields.push(cur);
              cur = '';
              continue;
            }
            cur += ch;
          }
          if (cur.length || row.endsWith(',')) fields.push(cur);
          return fields.map(f => (typeof f === 'string' ? f.trim() : f));
        }

        function makeKeyFromFields(fields) {
          const t = (fields[0] || '').trim();
          const n = (fields[1] || '').trim();
          return `${t}|${n}`;
        }

        const rowMap = new Map();
        const pushRows = (rowsArray) => {
          for (const r of rowsArray) {
            if (!r) continue;
            const fields = parseCsvRow(r);
            const key = makeKeyFromFields(fields);
            rowMap.set(key, { fields, raw: r });
          }
        };

        // Add existing first, then incoming will overwrite
        pushRows(existingParsed.rows || []);
        pushRows(incomingParsed.rows || []);

        // Group by Type for organized output
        const groups = { User: [], Length: [], Media: [], other: [] };
        for (const entry of rowMap.values()) {
          const type = (entry.fields[0] || '').trim();
          if (type === 'User') groups.User.push(entry.raw);
          else if (type === 'Length') groups.Length.push(entry.raw);
          else if (type === 'Media') groups.Media.push(entry.raw);
          else groups.other.push(entry.raw);
        }

        const mergedRows = [].concat(groups.User, groups.Length, groups.Media, groups.other);

        // Prepend settings metadata to CSV
        const settingsMeta = JSON.stringify({
          savedAt: new Date().toISOString(),
          saveEveryN: typeof currentSettings.saveEveryN !== 'undefined' ? currentSettings.saveEveryN : null,
          filterThreshold: typeof currentSettings.filterThreshold !== 'undefined' ? currentSettings.filterThreshold : null,
          showZeros: !!currentSettings.showZeros,
          onlyZeros: !!currentSettings.onlyZeros
        });

        finalCsv = `${existingParsed.header}\n\n${mergedRows.join('\n')}\n\n#PERMSTER_SETTINGS:${settingsMeta}\n`;

        const filename = `XData/xd.csv`;
        const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalCsv);

        // Download for both manual AND auto-save
        await new Promise((resolve, reject) => {
          chrome.downloads.download({ url: dataUrl, filename, conflictAction: 'overwrite' }, (downloadId) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            console.log('Background: download initiated, downloadId=' + downloadId);
            resolve(downloadId);
          });
        });

        // Persist accumulated CSV for future saves to append
        try {
          const toStore = { accumulatedCsv: finalCsv };
          if (message.hash) toStore.accumulatedCsvHash = message.hash;
          await new Promise(resolve => chrome.storage.local.set(toStore, resolve));
          console.log('Background: saved accumulatedCsv, length=' + finalCsv.length);
        } catch (e) { 
          console.error('Background: failed to persist accumulatedCsv', e); 
        }

        console.log('Background: sending success response, manual=' + message.manual);
        sendResponse({ success: true, downloaded: !!message.manual });
      } catch (downloadErr) {
        try {
          await new Promise(resolve => chrome.storage.local.set({ lastSaveError: {
            source: 'background', step: 'downloads.fallback', name: downloadErr?.name || null,
            message: downloadErr?.message || String(downloadErr), stack: downloadErr?.stack || null,
            timestamp: Date.now()
          } }, resolve));
        } catch (e) {
          console.error('Background: failed to persist downloads fallback error', e);
        }
        sendResponse({ success: false, error: downloadErr.message });
      }
    })();
    return true;
  }
});