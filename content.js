/*
 * Arc-9 Open Royalty Agreement — draft
 * Copyright (c) A-9-SOVOS
 *
 * This source file is covered by the Arc-9 Open Royalty Agreement (see LICENSE in repo root).
 * Use of the code is permitted subject to the terms in LICENSE (4% royalty on covered commercial use).
 * This file is part of the PERMSTER project and is provided AS-IS. See LICENSE for full details.
 */
// ---- content.js (snippet) ----
(function () {
  const BADGE_CLASS = "xlvp-badge";

  // Theme detection helper
  function themeColor() {
    const theme = document.querySelector('html')?.getAttribute('data-theme') || '';
    const colors = {
      lightsOut: "#71767b",
      dim: "#8b98a5",
      light: "#536471"
    };
    return colors[theme] || '#536471';
  }
  
  // Global statistics storage with validation and persistence
  let stats = {
    users: new Map(), // username -> {count, totalScore, lastSeen, totalViews, viewRunningAvg, minViews, maxViews, totalComments, commentRunningAvg}
    categories: {
      length: {
        short: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 },
        mid: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 },
        long: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 },
        extended: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 }
      },
      media: {
        withImage: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 },
        withoutImage: { count: 0, totalScore: 0, totalViews: 0, avgViews: 0, totalComments: 0, avgComments: 0 }
      }
    },
    engagement: {
      totalLikes: 0,
      totalViews: 0,
      totalComments: 0,
      avgEngagementRatio: 0,
      minEngagementRatio: Infinity,
      maxEngagementRatio: -Infinity
    },
    postCount: 0,
    lastSaved: null
  };

  // Initialize default settings immediately
  window.__XLVP_saveEveryN = 500;
  window.__XLVP_restrictToFeed = true;
  window.__XLVP_showZeros = false;
  window.__XLVP_onlyZeros = false;

  // Promise to track initialization completion
  let initPromise = null;

  // Load any previously-saved aggregated stats from chrome.storage.local
  // This persistence ensures stats survive extension reloads/updates.
  async function loadStats() {
    try {
      const data = await new Promise(resolve => chrome.storage.local.get(['lastSavedStats'], resolve));
      const payload = data?.lastSavedStats;
      if (!payload) return;

      // Payload is expected to be an object matching the stats structure, but with plain objects
      // instead of Map. Rehydrate into the in-memory stats structure.
      const newStats = {
        users: new Map(Object.entries(payload.users || {}).map(([name, u]) => [name, {
          count: u.count || 0,
          totalScore: u.totalScore || 0,
          lastSeen: u.lastSeen ? new Date(u.lastSeen) : new Date(),
          totalViews: u.totalViews || 0,
          viewRunningAvg: u.viewRunningAvg || 0,
          minViews: u.minViews || 0,
          maxViews: u.maxViews || 0,
          totalComments: u.totalComments || 0,
          commentRunningAvg: u.commentRunningAvg || 0
        }])),
        categories: payload.categories || JSON.parse(JSON.stringify(stats.categories)),
        engagement: payload.engagement || { totalLikes: 0, totalViews: 0, totalComments: 0, avgEngagementRatio: 0, minEngagementRatio: Infinity, maxEngagementRatio: -Infinity },
        postCount: payload.postCount || 0,
        lastSaved: payload.lastSaved ? new Date(payload.lastSaved) : new Date()
      };

      mergeStats(newStats);
    } catch (error) {
      console.warn('Failed to load existing stats from storage:', error);
    }
  }

  // Merge loaded stats with current stats
  function mergeStats(newStats) {
    // Merge users
    newStats.users.forEach((userData, username) => {
      if (!stats.users.has(username)) {
        stats.users.set(username, userData);
      } else {
        const existing = stats.users.get(username);
        existing.count += userData.count;
        existing.totalScore += userData.totalScore;
        existing.totalViews += userData.totalViews || 0;
        existing.viewRunningAvg = existing.count > 0 ? existing.totalViews / existing.count : 0;
        existing.minViews = Math.min(existing.minViews, userData.minViews || 0);
        existing.maxViews = Math.max(existing.maxViews, userData.maxViews || 0);
        existing.totalComments += userData.totalComments || 0;
        existing.commentRunningAvg = existing.count > 0 ? existing.totalComments / existing.count : 0;
        existing.lastSeen = new Date(Math.max(
          existing.lastSeen.getTime(),
          userData.lastSeen.getTime()
        ));
      }
    });

    // Merge categories
    ['length', 'media'].forEach(catType => {
      Object.keys(stats.categories[catType]).forEach(key => {
        stats.categories[catType][key].count += newStats.categories[catType][key].count;
        stats.categories[catType][key].totalScore += newStats.categories[catType][key].totalScore;
        stats.categories[catType][key].totalViews += (newStats.categories[catType][key].totalViews || 0);
        stats.categories[catType][key].avgViews = stats.categories[catType][key].count > 0 
          ? stats.categories[catType][key].totalViews / stats.categories[catType][key].count 
          : 0;
        stats.categories[catType][key].totalComments += (newStats.categories[catType][key].totalComments || 0);
        stats.categories[catType][key].avgComments = stats.categories[catType][key].count > 0 
          ? stats.categories[catType][key].totalComments / stats.categories[catType][key].count 
          : 0;
      });
    });

    // Merge engagement metrics
    if (newStats.engagement) {
      stats.engagement.totalLikes += newStats.engagement.totalLikes || 0;
      stats.engagement.totalViews += newStats.engagement.totalViews || 0;
      stats.engagement.totalComments += newStats.engagement.totalComments || 0;
      stats.engagement.minEngagementRatio = Math.min(stats.engagement.minEngagementRatio, newStats.engagement.minEngagementRatio || Infinity);
      stats.engagement.maxEngagementRatio = Math.max(stats.engagement.maxEngagementRatio, newStats.engagement.maxEngagementRatio || -Infinity);
      stats.engagement.avgEngagementRatio = stats.engagement.totalViews > 0 ? stats.engagement.totalLikes / stats.engagement.totalViews : 0;
    }

    stats.postCount = Math.max(stats.postCount, newStats.postCount);
    stats.lastSaved = newStats.lastSaved;
  }

  // Initialize stats and settings
  (async function initialize() {
    try {
      console.log('Initializing extension...');
      await loadStats();
      await loadSaveSettings();
      console.log('Extension initialized with saveEveryN:', window.__XLVP_saveEveryN);
    } catch (e) {
      console.warn('Failed to initialize extension:', e);
    }
  })();

  // Parse number formats like "1.2K", "3,456", "1.2万"
  function parseCount(text) {
    if (!text) return null;
    let t = ("" + text).trim();

    // K/M/B
    const suf = t.match(/^(\d+(?:[.,]\d+)?)([KMBkmb])\b/);
    if (suf) {
      let n = parseFloat(suf[1].replace(",", "."));
      ({ K: () => (n *= 1e3), M: () => (n *= 1e6), B: () => (n *= 1e9) }[
        suf[2].toUpperCase()
      ] || (() => {}))();
      return Math.round(n);
    }

    // East Asian units
    const ea = t.match(/^(\d+(?:[.,]\d+)?)(万|億|亿)\b/);
    if (ea) {
      let n = parseFloat(ea[1].replace(",", "."));
      if (ea[2] === "万") n *= 1e4;
      else n *= 1e8;
      return Math.round(n);
    }

    // Plain 1,234 / 1.234.567 / 1234
    t = t.replace(/\u00A0/g, " ").replace(/[.,\s](?=\d{3}(\D|$))/g, "");
    return /^\d+$/.test(t) ? parseInt(t, 10) : null;
  }

  // Get number from label
  const numFromLabel = (lbl) => {
    const m = (lbl || "").match(/([\d.,]+\s*[KMBkmb万億亿]?)/);
    return m ? parseCount(m[1]) : null;
  };

  // Get username from tweet
  function extractUsername(article) {
    try {
      const userNameElement = article.querySelector('[data-testid="User-Name"]');
      if (!userNameElement) return null;

      const spanElement = userNameElement.querySelector('div span');
      if (!spanElement) return null;

      const username = spanElement.textContent.trim();
      return username.startsWith('@') ? username.substring(1) : username;
    } catch (e) {
      console.warn('Error extracting username:', e);
      return null;
    }
  }

  // Update statistics
  function updateStats(article, engagement, likes, views, comments) {
    const username = extractUsername(article);
    if (!username || username === '[object HTMLElement]') return;

    // Update user stats
    if (!stats.users.has(username)) {
      stats.users.set(username, {
        count: 0,
        totalScore: 0,
        lastSeen: new Date(),
        totalViews: 0,
        viewRunningAvg: 0,
        minViews: views || 0,
        maxViews: views || 0,
        totalComments: 0,
        commentRunningAvg: 0
      });
    }

    const userStats = stats.users.get(username);
    userStats.count++;
    userStats.totalScore += engagement;
    userStats.lastSeen = new Date();
    
    // Track view counts and running average
    if (views && Number.isFinite(views)) {
      userStats.totalViews += views;
      userStats.viewRunningAvg = userStats.totalViews / userStats.count;
      if (userStats.minViews === 0 || views < userStats.minViews) userStats.minViews = views;
      if (views > userStats.maxViews) userStats.maxViews = views;
    }

    // Track comment counts and running average
    if (comments && Number.isFinite(comments)) {
      userStats.totalComments += comments;
      userStats.commentRunningAvg = userStats.totalComments / userStats.count;
    }

    // Update length categories
    const tweetText = article.querySelector('[data-testid="tweetText"]')?.textContent || '';
    const length = tweetText.length;
    const lengthCat = length <= 70 ? 'short' 
                   : length <= 140 ? 'mid'
                   : length <= 280 ? 'long'
                   : 'extended';
    
    stats.categories.length[lengthCat].count++;
    stats.categories.length[lengthCat].totalScore += engagement;
    if (views && Number.isFinite(views)) {
      stats.categories.length[lengthCat].totalViews += views;
      stats.categories.length[lengthCat].avgViews = stats.categories.length[lengthCat].totalViews / stats.categories.length[lengthCat].count;
    }
    if (comments && Number.isFinite(comments)) {
      stats.categories.length[lengthCat].totalComments += comments;
      stats.categories.length[lengthCat].avgComments = stats.categories.length[lengthCat].totalComments / stats.categories.length[lengthCat].count;
    }

    // Update media categories
    const hasImage = article.querySelector('img[alt="Image"]');
    const mediaCat = hasImage ? 'withImage' : 'withoutImage';
    stats.categories.media[mediaCat].count++;
    stats.categories.media[mediaCat].totalScore += engagement;
    if (views && Number.isFinite(views)) {
      stats.categories.media[mediaCat].totalViews += views;
      stats.categories.media[mediaCat].avgViews = stats.categories.media[mediaCat].totalViews / stats.categories.media[mediaCat].count;
    }
    if (comments && Number.isFinite(comments)) {
      stats.categories.media[mediaCat].totalComments += comments;
      stats.categories.media[mediaCat].avgComments = stats.categories.media[mediaCat].totalComments / stats.categories.media[mediaCat].count;
    }

    // Track global engagement metrics
    if (likes && Number.isFinite(likes)) stats.engagement.totalLikes += likes;
    if (views && Number.isFinite(views)) stats.engagement.totalViews += views;
    if (comments && Number.isFinite(comments)) stats.engagement.totalComments += comments;
    if (views && Number.isFinite(views) && likes && Number.isFinite(likes)) {
      const engagementRatio = likes / views;
      stats.engagement.avgEngagementRatio = (stats.postCount > 0 ? (stats.engagement.totalLikes / stats.engagement.totalViews) : 0);
      stats.engagement.minEngagementRatio = Math.min(stats.engagement.minEngagementRatio, engagementRatio);
      stats.engagement.maxEngagementRatio = Math.max(stats.engagement.maxEngagementRatio, engagementRatio);
    }

    // Increment post count and save per-N datapoints.
    // Use a configurable saveEveryN value provided by settings (background) or a sensible default.
    stats.postCount++;

    // Clear any old save timeout (we still keep a long-run backup save in case of very low activity)
    if (window.saveTimeout) {
      clearTimeout(window.saveTimeout);
    }

    // Save if we've hit the configured per-N threshold
    const saveEveryN = window.__XLVP_saveEveryN || 500; // default to 500 if not supplied
    console.log(`[XLVP] Post #${stats.postCount} processed, saveEveryN=${saveEveryN}, shouldSave=${saveEveryN > 0 && stats.postCount % saveEveryN === 0}`);
    
    if (saveEveryN > 0 && stats.postCount % saveEveryN === 0) {
      console.log('[XLVP] Triggering per-N save after processing', stats.postCount, 'posts');
      saveStats();
    } else {
      // Backup safeguard: if no further posts are seen for 5 minutes, persist what we have
      window.saveTimeout = setTimeout(() => {
        console.log('[XLVP] Triggering backup save after idle 5m');
        saveStats();
      }, 300000); // 5 minutes
    }
  }

  // Save stats to CSV
  // Compute a SHA-256 hash (hex) of the CSV for tamper-detection and future verification
  async function computeHashHex(text) {
    try {
      const enc = new TextEncoder();
      const buf = enc.encode(text || '');
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Failed to compute hash', e);
      return null;
    }
  }

  async function saveStats() {
    console.log('[XLVP] SaveStats called with postCount:', stats.postCount);
    
    // Check if we have enough data to save
    if (stats.postCount === 0) {
      console.log('[XLVP] No data to save yet');
      return;
    }

    try {
      // Request settings from background script
      if (!chrome.runtime?.id) {
        console.warn('[XLVP] Extension context invalidated - cannot save data');
        return;
      }

      const response = await new Promise((resolve, reject) => {
        try {
          chrome.runtime.sendMessage({ type: 'getDataCollectionSettings' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            console.log('[XLVP] Received settings response:', response);
            resolve(response);
          });
        } catch (e) {
          reject(e);
        }
      });

      if (!response || !response.enabled) {
        console.log('[XLVP] Data collection is disabled or no response', response);
        return; // Don't save if data collection is disabled
      }

      let csvContent = 'Type,Name,Count,Average Score,Total Views, Avg Views, Min Views, Max Views, Total Comments, Avg Comments, Last Seen\n';
      
      // Add aggregated user stats (include all users with 1+ posts)
      for (const [username, data] of stats.users) {
        if (data.count >= 1) {
          const avgScore = (data.totalScore / data.count).toFixed(3);
          const avgViews = (data.viewRunningAvg).toFixed(1);
          const avgComments = (data.commentRunningAvg).toFixed(1);
          csvContent += `User,${username},${data.count},${avgScore},${data.totalViews},${avgViews},${data.minViews},${data.maxViews},${data.totalComments},${avgComments},${data.lastSeen.toISOString()}\n`;
        }
      }
      
      // Add length categories
      for (const [category, data] of Object.entries(stats.categories.length)) {
        if (data.count > 0) {
          const avgScore = (data.totalScore / data.count).toFixed(3);
          const avgViews = (data.avgViews).toFixed(1);
          const avgComments = (data.avgComments).toFixed(1);
          csvContent += `Length,${category},${data.count},${avgScore},${data.totalViews},${avgViews},N/A,N/A,${data.totalComments},${avgComments},N/A\n`;
        }
      }
      
      // Add media categories
      for (const [category, data] of Object.entries(stats.categories.media)) {
        if (data.count > 0) {
          const avgScore = (data.totalScore / data.count).toFixed(3);
          const avgViews = (data.avgViews).toFixed(1);
          const avgComments = (data.avgComments).toFixed(1);
          csvContent += `Media,${category},${data.count},${avgScore},${data.totalViews},${avgViews},N/A,N/A,${data.totalComments},${avgComments},N/A\n`;
        }
      }

      // Add global engagement metrics
      if (stats.postCount > 0) {
        const avgEngagement = stats.engagement.avgEngagementRatio.toFixed(6);
        const minEngagement = (stats.engagement.minEngagementRatio === Infinity ? 0 : stats.engagement.minEngagementRatio).toFixed(6);
        const maxEngagement = (stats.engagement.maxEngagementRatio === -Infinity ? 0 : stats.engagement.maxEngagementRatio).toFixed(6);
        const avgLikesPerPost = (stats.engagement.totalLikes / stats.postCount).toFixed(3);
        const avgCommentsPerPost = (stats.engagement.totalComments / stats.postCount).toFixed(3);
        csvContent += `Engagement,Overall,${stats.postCount},${avgEngagement},${stats.engagement.totalViews},${avgLikesPerPost},${minEngagement},${maxEngagement},${stats.engagement.totalComments},${avgCommentsPerPost},${new Date().toISOString()}\n`;
      }

      console.log('[XLVP] Generated CSV content, users.size=' + stats.users.size);

      // Merge with any accumulated CSV the extension already stored so we don't overwrite earlier saved data
      const storageEntry = await new Promise(resolve => chrome.storage.local.get(['accumulatedCsv'], resolve));
      let existingCsv = storageEntry?.accumulatedCsv || '';

      console.log('[XLVP] Existing CSV length=' + existingCsv.length);

      // If we have previous CSV rows, append new rows without repeating the header
      let combinedCsv = '';
      if (existingCsv && existingCsv.trim().length > 0) {
        // Remove header from the new csvContent and append only the rows
        const parts = csvContent.split('\n');
        const header = parts.shift(); // remove header
        const newRows = parts.filter(Boolean).join('\n');
        combinedCsv = existingCsv.trim();
        if (newRows) combinedCsv += '\n' + newRows + '\n';
      } else {
        combinedCsv = csvContent;
      }

      console.log('[XLVP] Combined CSV length=' + combinedCsv.length + ', about to send');

      console.log('[XLVP] Sending CSV data to background script...');

      // Compute a hash of the combined CSV and persist the pending data+hash immediately
      const combinedHash = await computeHashHex(combinedCsv);
      try {
        await new Promise(resolve => chrome.storage.local.set({ pendingSaveData: combinedCsv, pendingSaveHash: combinedHash }, resolve));
      } catch (e) {
        console.warn('[XLVP] Failed to persist pendingSaveData to storage before save:', e);
      }
      
      // Send data to background script for auto-save (manual: false)
      console.log('[XLVP] About to send saveDataToFile message');
      chrome.runtime.sendMessage({
        type: 'saveDataToFile',
        data: combinedCsv,
        hash: combinedHash,
        manual: false
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[XLVP] Message send error:', chrome.runtime.lastError);
          return;
        }
        if (!response) {
          console.warn('[XLVP] No response from background');
          return;
        }
        if (response.success) {
          console.log('[XLVP] Background confirmed save success');
        } else {
          console.error('[XLVP] Background returned error:', response.error);
        }
      });

      // Persist aggregated stats locally for continuity
      const usersObj = Object.fromEntries(Array.from(stats.users.entries()).map(([k, v]) => [k, {
        count: v.count,
        totalScore: v.totalScore,
        lastSeen: v.lastSeen ? v.lastSeen.toISOString() : new Date().toISOString()
      }]));

      const stored = {
        users: usersObj,
        categories: stats.categories,
        postCount: stats.postCount,
        lastSaved: (stats.lastSaved || new Date()).toISOString()
      };

      await new Promise(resolve => chrome.storage.local.set({ lastSavedStats: stored }, resolve));
    } catch (error) {
      console.error('[XLVP] Failed to save data:', error.message);
    }
  }

  // Ensure we load save frequency (per-N) from settings so updateStats can use it
  async function loadSaveSettings() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'getDataCollectionSettings' }, (response) => resolve(response));
      });
      if (response && typeof response.saveEveryN !== 'undefined' && response.saveEveryN != null) {
        const n = parseInt(response.saveEveryN, 10);
        if (!Number.isNaN(n) && n > 0) {
          window.__XLVP_saveEveryN = n;
          console.log('Loaded saveEveryN setting:', n);
        }
      } else {
        console.log('No saveEveryN setting found, using default: 500');
      }
      // Always restrict collection and filtering to the For You feed while data collection is enabled.
      // Ignore any user-settable toggle — the extension operates feed-only when enabled.
      window.__XLVP_restrictToFeed = true;
      if (response && typeof response.showZeros !== 'undefined') {
        window.__XLVP_showZeros = !!response.showZeros;
      } else {
        window.__XLVP_showZeros = false;
      }
      if (response && typeof response.onlyZeros !== 'undefined') {
        window.__XLVP_onlyZeros = !!response.onlyZeros;
      } else {
        window.__XLVP_onlyZeros = false;
      }
    } catch (e) {
      console.warn('Failed to load save settings', e);
    }
  }

  // Trigger a final persist when the page hides/unloads so data isn't lost during navigation
  function flushBeforeUnload() {
    try {
      // Trigger save synchronously by writing pendingSaveData — the background will pick it up
      // Make sure we don't lose data on page unload
      if (stats.postCount > 0) {
        console.log('Flushing data before unload:', stats.postCount, 'posts processed');
        // Don't await here to avoid blocking the page unload
        saveStats().catch(e => console.warn('Failed to save during flushBeforeUnload:', e));
      }
    } catch (e) {
      console.warn('Failed during flushBeforeUnload', e);
    }
  }

  // Wire up best-effort flush on pagehide/visibilitychange
  window.addEventListener('pagehide', flushBeforeUnload);
  window.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('Page hidden, flushing data...');
      flushBeforeUnload();
    }
  });

  // Set default save frequency immediately
  window.__XLVP_saveEveryN = 500;

  // Load and apply any save settings at startup
  loadSaveSettings();

  // Watch for changes to saveEveryN so the content script can adapt live
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.saveEveryN) {
      const newVal = changes.saveEveryN.newValue;
      const n = parseInt(newVal, 10);
      if (!Number.isNaN(n) && n > 0) {
        window.__XLVP_saveEveryN = n;
        console.log('Updated saveEveryN to', n);
      }
    }
        // Changes to restrictToFeed are intentionally ignored; the extension always acts as feed-only when active.
      if (changes.showZeros) {
        window.__XLVP_showZeros = !!changes.showZeros.newValue;
        console.log('Updated showZeros to', window.__XLVP_showZeros);
      }
      if (changes.onlyZeros) {
        window.__XLVP_onlyZeros = !!changes.onlyZeros.newValue;
        console.log('Updated onlyZeros to', window.__XLVP_onlyZeros);
      }
  });

    // Helper to detect whether an article appears inside a feed/timeline area
    // Avoid treating a post-detail / standalone page as a feed.
    function isInFeed(article) {
      try {
        let el = article;
        for (let i = 0; i < 8 && el; i++) {
          if (el.getAttribute) {
            const al = (el.getAttribute('aria-label') || '').toLowerCase();
            // Primary: Look for explicit feed/timeline indicators
            if (al.includes('for you') || al.includes('for you timeline')) return true;
            if (al.includes('home') && (al.includes('timeline') || al.includes('feed'))) return true;
            if (al.includes('following') && al.includes('timeline')) return true;
            // Negative: If we hit a conversation or detail region, stop looking
            if (al.includes('conversation') || al.includes('detail')) return false;
          }
          el = el.parentElement;
        }
      } catch (e) { /* ignore */ }
      return false;
    }

  function getMetrics(article) {
    let likes = null, views = null, comments = null;

    // First try to get the likes from the action buttons
    const likeButton = article.querySelector('[data-testid="like"]');
    if (likeButton) {
      const lbl = likeButton.getAttribute("aria-label") || "";
      if (/\blikes?\b/i.test(lbl)) {
        const n = numFromLabel(lbl);
        if (n != null) likes = Math.max(likes ?? 0, n);
      }
    }

    // Try to get comments from the action buttons
    const replyButton = article.querySelector('[data-testid="reply"]');
    if (replyButton) {
      const lbl = replyButton.getAttribute("aria-label") || "";
      if (/\breplies?\b|\bcomments?\b/i.test(lbl)) {
        const n = numFromLabel(lbl);
        if (n != null) comments = Math.max(comments ?? 0, n);
      }
    }

    // Try to find views in expanded view format
    article.querySelectorAll('.css-1jxf684.r-bcqeeo.r-1ttztb7.r-qvutc0.r-poiln3').forEach((el) => {
      const viewsLabel = el.closest('div')?.nextElementSibling;
      if (viewsLabel?.textContent?.includes('Views')) {
        const n = parseCount(el.textContent?.trim());
        if (n != null) views = Math.max(views ?? 0, n);
      }
    });

    // Fallback: Look for views in aria-labels
    if (views == null) {
      article.querySelectorAll('[role="group"] [aria-label], [aria-label]').forEach((el) => {
        const lbl = el.getAttribute("aria-label") || "";
        if (/\bviews?\b/i.test(lbl)) {
          const n = numFromLabel(lbl);
          if (n != null) views = Math.max(views ?? 0, n);
        }
      });
    }

    // Heuristic fallback: search the article text for a "X views" or "X impressions" pattern
    if (views == null) {
      try {
        // Build a string of the article's visible text, but keep some structure
        const text = (article.innerText || '').replace(/\n+/g, ' ');
        const m = text.match(/([\d.,]+\s*[KMBkmb万億亿]?)\s*(?:views|views\b|impressions|impression)/i);
        if (m) {
          const v = parseCount(m[1]);
          if (v != null) views = Math.max(views ?? 0, v);
        }
      } catch (e) { /* ignore */ }
    }

    // Second fallback: analytics link text
    if (views == null) {
      const a = article.querySelector('a[href$="/analytics"], a[href*="/analytics?"]');
      const n = parseCount(a?.textContent?.trim());
      if (n != null) views = n;
    }

    return { likes, views, comments };
  }

  // Filtering threshold (percentage). null or number between 0.01 and 100
  let filterThreshold = null;

  // Load threshold from background/storage
  async function loadFilterSettings() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'getDataCollectionSettings' }, (response) => resolve(response));
      });
      if (response && typeof response.threshold !== 'undefined' && response.threshold !== null) {
        const t = parseFloat(response.threshold);
        if (!Number.isNaN(t)) filterThreshold = t;
      }
    } catch (e) {
      console.warn('Failed to load filter threshold', e);
    }
  }

  function reapplyFilter() {
    // Re-process all articles that already have metrics
    document.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
      const pctStr = a.dataset.xlvpPct;
      if (!pctStr) return; // nothing to do

      const likes = parseFloat(a.dataset.xlvpLikes);
      const views = parseFloat(a.dataset.xlvpViews);
      const pct = parseFloat(pctStr);

      // If below threshold hide, otherwise show and ensure badge exists
      // Decide where to apply filtering based on restrictToFeed setting and detect if article is in a feed
      // Always restrict to feed when data collection is enabled
      const restrictToFeed = true;
      const inFeed = restrictToFeed ? isInFeed(a) : true;
      const showZeros = !!window.__XLVP_showZeros;
      const onlyZeros = !!window.__XLVP_onlyZeros;

      // Only show zero-pct items if onlyZeros is enabled (in feed when restricted)
      if (inFeed && onlyZeros) {
        if (Number.isFinite(pct) && pct !== 0) {
          if (a.dataset.xlvpFiltered !== 'true') {
            a.dataset.xlvpFiltered = 'true';
            a.style.display = 'none';
          }
          return; // processed
        }
      }

      // For normal filtering, do not hide zeros if 'showZeros' is enabled
      const shouldFilter = inFeed ? (filterThreshold != null && Number.isFinite(pct) && pct < filterThreshold && !(showZeros && Number(pct) === 0)) : false;
      if (shouldFilter) {
        if (a.dataset.xlvpFiltered !== 'true') {
          a.dataset.xlvpFiltered = 'true';
          a.style.display = 'none';
        }
      } else {
        if (a.dataset.xlvpFiltered === 'true') {
          a.dataset.xlvpFiltered = 'false';
          a.style.display = '';
        }

        // Ensure badge exists
        const pctText = clampPct(likes, views);
        if (pctText) renderBadge(a, pctText, likes, views);
      }
    });
  }

  function renderBadge(article, pctText, likes, views) {
    const actionRow = article.querySelector('[role="group"]') || article.querySelector('[data-testid="reply"]')?.parentElement;
    if (!actionRow) return;

    // Create or get the percent badge
    let badge = article.querySelector('.' + BADGE_CLASS);
    if (!badge) {
      badge = document.createElement('span');
      badge.className = BADGE_CLASS;
      actionRow.appendChild(badge);
    }

    // Set color per theme
    badge.style.color = themeColor();
    badge.textContent = ` ߷ ${pctText}`;
    badge.title = `${likes?.toLocaleString?.()} likes / ${views?.toLocaleString?.()} views`;
  }

  // Community-note handling: restore phi badge, hide original note content, and show floating tooltip
  function processCommunityNote(article) {
    try {
      // Community notes should appear everywhere
      if (article.dataset.xlvpNoteProcessed === '1') return;

      // Locate the birdwatch / community note pivot
      const pivot = article.querySelector('[data-testid="birdwatch-pivot"], [data-testid="community-note"]');
      if (!pivot) {
        article.dataset.xlvpNoteProcessed = '1'; // mark as processed for future
        return;
      }

      // Extract the note text and links (but strip anchors from the tooltip text)
      const anchors = Array.from(pivot.querySelectorAll('a[href]')).map(a => ({ href: a.getAttribute('href'), text: a.textContent?.trim() || a.getAttribute('href') }));
      // Build a tooltip text that excludes any anchor/link text or hrefs
      const clone = pivot.cloneNode(true);
      clone.querySelectorAll('a[href]').forEach(n => n.remove());
      let noteText = (clone.textContent || '').trim();
      // Remove "readers added context" prefix if present
      noteText = noteText.replace(/^readers\s+added\s+context\s*[:·]?\s*/i, '').trim();
      // Collapse repeated whitespace and truncate to a sensible length for tooltip readability
      noteText = noteText.replace(/\s+/g, ' ').trim();
      // Replace the common closing phrase with a clearer CTA with spacing
      noteText = noteText.replace(/do you find this helpful\s*\??\s*rate it/i, '\n\nclick for options');
      if (noteText.length > 800) noteText = noteText.slice(0, 800) + '…';

      // Hide the original pivot and all related community note UI elements
      // The pivot element and the following explanatory text div(s) need to be hidden
      pivot.style.display = 'none !important';
      pivot.style.visibility = 'hidden';
      pivot.style.height = '0';
      pivot.style.overflow = 'hidden';
      pivot.style.margin = '0';
      pivot.style.padding = '0';
      // Also hide all child elements to ensure no text leaks
      pivot.querySelectorAll('*').forEach(el => {
        el.style.display = 'none !important';
      });

      // Hide the explanatory text that follows the pivot
      // This is typically a sibling div with text like "Context is written by people..."
      let nextSibling = pivot.nextElementSibling;
      while (nextSibling) {
        // Stop if we hit a known content element (article elements)
        if (nextSibling.querySelector('[data-testid="tweetText"]') || 
            nextSibling.querySelector('[role="group"][aria-label*="replies"]')) {
          break;
        }
        // If it's a div with text about context/community notes, hide it
        const text = (nextSibling.textContent || '').toLowerCase();
        if (text.includes('context') || text.includes('readers added') || text.includes('find out more')) {
          nextSibling.style.display = 'none !important';
          nextSibling.style.visibility = 'hidden';
          nextSibling.style.height = '0';
          nextSibling.style.overflow = 'hidden';
          nextSibling.style.margin = '0';
          nextSibling.style.padding = '0';
          nextSibling = nextSibling.nextElementSibling;
        } else {
          break;
        }
      }

      // Insert a compact phi badge in the header area
      // The header should be the first div[role="group"] which contains timestamp and user info
      const articleHeader = article.querySelector('div[role="group"]');
      const actionRow = article.querySelectorAll('[role="group"]')[1] || article.querySelector('[data-testid="reply"]')?.closest('[role="group"]') || null;
      // Try to insert near the timestamp if available
      let insertAfter = article.querySelector('time')?.closest('a') || null;

      const wrapper = document.createElement('span');
      wrapper.className = 'note-badge-wrapper';
      const badge = document.createElement('span');
      badge.className = 'community-note-badge';
      badge.setAttribute('data-tooltip', noteText || 'Community note');
      badge.textContent = '\u03C6'; // phi

      // on click: show a dropdown listing link titles and rating actions
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        // If already shown, toggle off
        if (document.getElementById('xlvp-note-menu')) {
          const existing = document.getElementById('xlvp-note-menu');
          existing.parentNode.removeChild(existing);
          return;
        }

        // Find any rating elements (e.g. a 'Rate' link/button nearby)
        const ratingEls = [];
        // Search inside the article for elements which look like rating controls
        article.querySelectorAll('[role="link"],[role="button"], a, button').forEach(el => {
          const t = (el.textContent || '').trim().toLowerCase();
          if (!t) return;
          if (/rate|helpful|find this helpful|do you find this helpful|rate it|helpful/i.test(t)) {
            ratingEls.push(el);
          }
        });

        // Build menu element
        const menu = document.createElement('div');
        menu.id = 'xlvp-note-menu';
        menu.className = 'xlvp-note-menu';

        // Add header
        const hdr = document.createElement('div');
        hdr.className = 'xlvp-note-menu-header';
        hdr.textContent = 'Community note';
        menu.appendChild(hdr);

        // Add "Per colpa di" label section
        if (ratingEls.length > 2) {
          const perColdLabel = document.createElement('div');
          perColdLabel.className = 'xlvp-note-menu-section-label';
          perColdLabel.textContent = 'Per colpa di';
          menu.appendChild(perColdLabel);
        }

        // Add the 3rd rating button (index 2) as secondary action if available
        if (ratingEls.length > 2) {
          const thirdButton = ratingEls[2];
          const li = document.createElement('div');
          li.className = 'xlvp-note-menu-item xlvp-note-menu-primary-action';
          let buttonText = (thirdButton.textContent || 'Rate').trim();
          // Truncate at bullet point
          if (buttonText.includes('·')) {
            buttonText = buttonText.split('·')[0].trim();
          }
          li.textContent = buttonText;
          li.addEventListener('click', (ev) => { ev.stopPropagation(); try { thirdButton.click(); } catch (err) { console.warn('Failed to invoke rating element', err); } });
          menu.appendChild(li);
        }

        // Add sources list - show all sources
        if (anchors.length) {
          const listLabel = document.createElement('div');
          listLabel.className = 'xlvp-note-menu-section-label';
          listLabel.textContent = anchors.length === 1 ? 'Source' : 'Sources';
          menu.appendChild(listLabel);
          const sourcesList = document.createElement('div');
          sourcesList.className = 'xlvp-note-menu-list';
          anchors.forEach((a, idx) => {
            const li = document.createElement('div');
            li.className = 'xlvp-note-menu-item';
            const label = a.text || (() => { try { return new URL(a.href).hostname; } catch (e) { return a.href; } })();
            li.textContent = label;
            li.addEventListener('click', (ev) => { ev.stopPropagation(); try { window.open(a.href, '_blank'); } catch (err) { console.warn('Failed to open source', err); } });
            sourcesList.appendChild(li);
          });
          menu.appendChild(sourcesList);
        }

        // Add rating actions - only show rating buttons from index 4 onwards (skip first 4)
        if (ratingEls.length > 4) {
          const ratingLabel = document.createElement('div');
          ratingLabel.className = 'xlvp-note-menu-section-label';
          ratingLabel.textContent = 'Rating';
          menu.appendChild(ratingLabel);
          const ratingList = document.createElement('div');
          ratingList.className = 'xlvp-note-menu-list';
          ratingEls.forEach((el, idx) => {
            // Only show rating buttons from index 4 onwards
            if (idx < 4) return;
            const li = document.createElement('div');
            li.className = 'xlvp-note-menu-item';
            let buttonText = (el.textContent || `Rate note ${idx+1}`).trim();
            // Truncate at bullet point
            if (buttonText.includes('·')) {
              buttonText = buttonText.split('·')[0].trim();
            }
            li.textContent = buttonText;
            li.addEventListener('click', (ev) => { ev.stopPropagation(); try { el.click(); } catch (err) { console.warn('Failed to invoke rating element', err); } });
            ratingList.appendChild(li);
          });
          menu.appendChild(ratingList);
        }

        // Insert into DOM and position near badge
        document.body.appendChild(menu);
        const r = badge.getBoundingClientRect();
        // position menu below badge if space, otherwise above
        const top = (r.bottom + 8 + 220 < window.innerHeight) ? r.bottom + 8 : Math.max(8, r.top - 8 - menu.offsetHeight);
        const left = Math.min(window.innerWidth - menu.offsetWidth - 8, Math.max(8, r.left));
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;

        // Close when clicking anywhere else
        const onDoc = (ev) => { if (!menu.contains(ev.target) && ev.target !== badge) { menu.remove(); document.removeEventListener('mousedown', onDoc); } };
        document.addEventListener('mousedown', onDoc);
      });

      // on hover: show a floating tooltip appended to body (avoid clipping)
      let floating = null;
      const showFloating = (ev) => {
        try {
          if (floating) return;
          floating = document.createElement('div');
          floating.className = 'xlvp-floating-tooltip';
          floating.textContent = noteText || 'Community note';
          // Ensure a solid background and readable text (defensive inline styles in case page styles interfere)
          floating.style.backgroundColor = '#272C30';
          floating.style.color = '#fff';
          floating.style.padding = '8px 12px';
          floating.style.borderRadius = '6px';
          floating.style.zIndex = '2147483646';
          floating.style.pointerEvents = 'auto';
          document.body.appendChild(floating);
          // Mark the badge so the pseudo tooltip (CSS ::after) gets suppressed
          badge.classList.add('xlvp-has-floating');
          // Position close to badge
          const r = badge.getBoundingClientRect();
          const left = Math.min(window.innerWidth - floating.offsetWidth - 8, Math.max(8, r.left));
          const top = r.bottom + 8;
          floating.style.left = `${left}px`;
          floating.style.top = `${top}px`;
        } catch (e) { /* ignore */ }
      };
      const hideFloating = () => {
        try { if (floating && floating.parentNode) floating.parentNode.removeChild(floating); floating = null; } catch (e) { /* ignore */ }
        try { badge.classList.remove('xlvp-has-floating'); } catch (e) { /* ignore */ }
      };
      badge.addEventListener('mouseenter', showFloating);
      badge.addEventListener('mouseleave', hideFloating);

      wrapper.appendChild(badge);

      // Insert wrapper into the action row (the group with reply, retweet, like, bookmark buttons)
      // This keeps the phi badge with the engagement metrics at the bottom, not the timestamp area
      if (actionRow && actionRow.parentNode) {
        // Insert at the end of the action row
        actionRow.appendChild(wrapper);
      } else if (insertAfter && insertAfter.parentNode) {
        // Fallback: insert after timestamp
        insertAfter.parentNode.insertBefore(wrapper, insertAfter.nextSibling);
      } else if (articleHeader && articleHeader.parentNode) {
        // Fallback: append to header
        articleHeader.appendChild(wrapper);
      } else {
        // Last resort: append at end of article
        article.appendChild(wrapper);
      }

      article.dataset.xlvpNoteProcessed = '1';
    } catch (e) {
      console.warn('Failed to process community note', e);
    }
  }

  const clampPct = (likes, views) => {
    if (!Number.isFinite(likes) || !Number.isFinite(views) || views <= 0) return null;
    const pct = Math.min(100, Math.max(0, (likes / views) * 100));
    if (!isFinite(pct)) return null;
    return pct >= 10 ? pct.toFixed(1) + "%" : pct >= 1 ? pct.toFixed(2) + "%" : pct.toFixed(3) + "%";
  };

  // Process only visible tweets
  const seen = new WeakSet();

  // Persistent processed ids to avoid double-recording across sessions.
  // Keep the last 100k ids (approx <2MB depending on id lengths).
  const PROCESSED_MAX = 100000;
  let processedArray = []; // oldest-first
  let processedSet = new Set();
  let processedDirty = false;
  let processedSaveTimer = null;

  async function loadProcessedIds() {
    try {
      const entry = await new Promise(resolve => chrome.storage.local.get(['processedIds'], resolve));
      const arr = entry?.processedIds || [];
      if (Array.isArray(arr)) {
        processedArray = arr.slice(-PROCESSED_MAX);
        processedSet = new Set(processedArray);
      }
    } catch (e) {
      console.warn('Failed to load processedIds', e);
    }
  }

  async function persistProcessedIds() {
    if (!processedDirty) return;
    try {
      await new Promise(resolve => chrome.storage.local.set({ processedIds: processedArray }, resolve));
      processedDirty = false;
    } catch (e) {
      console.warn('Failed to persist processedIds', e);
    }
  }

  function schedulePersistProcessedIds() {
    if (processedSaveTimer) clearTimeout(processedSaveTimer);
    processedSaveTimer = setTimeout(() => persistProcessedIds(), 1000);
  }

  function addProcessedId(id) {
    if (!id) return;
    if (processedSet.has(id)) return;
    processedArray.push(id);
    processedSet.add(id);
    // trim if necessary
    if (processedArray.length > PROCESSED_MAX) {
      const removed = processedArray.splice(0, processedArray.length - PROCESSED_MAX);
      for (const r of removed) processedSet.delete(r);
    }
    processedDirty = true;
    schedulePersistProcessedIds();
  }

  // Load processed ids at startup
  loadProcessedIds();

  // Helper function to extract and collect data from a post
  // This is called REGARDLESS of visibility so we capture ALL posts
  function extractAndCollectPostData(a) {
    if (a.dataset.xlvpDataCollected === 'true') return;
    
    const { likes, views, comments } = getMetrics(a);
    if (likes == null || views == null) {
      // Mark as having no data so we don't retry
      a.dataset.xlvpDataCollected = 'true';
      return;
    }

    const numericPct = Number.isFinite(likes) && Number.isFinite(views) && views > 0 ? (likes / views) * 100 : null;
    if (numericPct == null || !Number.isFinite(numericPct)) {
      a.dataset.xlvpDataCollected = 'true';
      return;
    }

    // Save metric information on the element for UI rendering and re-filtering
    a.dataset.xlvpLikes = String(likes);
    a.dataset.xlvpViews = String(views);
    a.dataset.xlvpPct = String(numericPct);

    // Extract post ID for deduplication
    const postId = (function extractPostId(article) {
      try {
        const anchors = Array.from(article.querySelectorAll('a[href]'));
        for (const a of anchors) {
          const href = a.getAttribute('href') || '';
          const m1 = href.match(/status(?:es)?\/(\d+)/);
          if (m1) return m1[1];
          const m2 = href.match(/(?:status|statuses|post|posts|permalink)[\/_-]?([A-Za-z0-9_-]{6,})/i);
          if (m2) return m2[1];
        }
        const timeAnchor = article.querySelector('a time')?.closest('a') || article.querySelector('a:has(time)');
        if (timeAnchor) {
          const a = timeAnchor.closest('a');
          const href = a?.getAttribute('href') || '';
          const m = href.match(/status(?:es)?\/(\d+)/) || href.match(/(?:status|statuses|post|posts|permalink)[\/_-]?([A-Za-z0-9_-]{6,})/i);
          if (m) return m[1];
        }
      } catch (e) { /* ignore */ }
      return null;
    })(a);

    // Check if already processed in a previous session
    if (postId && processedSet.has(postId)) {
      console.log('[XLVP] Post already processed in previous session, skipping data collection');
      a.dataset.xlvpDataCollected = 'true';
      return;
    }

    // Collect data for this post regardless of visibility
    // The key fix: we're not checking isIntersecting, so filtered posts get collected too
    const restrictToFeed = true;
    const inFeed = restrictToFeed ? isInFeed(a) : true;
    if (inFeed) {
      updateStats(a, numericPct, likes, views, comments);
      console.log('[XLVP] Stats updated for post with engagement', numericPct, 'views:', views, 'comments:', comments, '(will be included in CSV regardless of filtering)');
      try {
        if (postId) addProcessedId(postId);
      } catch (e) { /* ignore */ }
    }

    // Mark as collected so we don't re-collect, but DON'T mark as seen yet
    // (so IntersectionObserver can still render the badge when visible)
    a.dataset.xlvpDataCollected = 'true';
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const a = e.target;
      if (seen.has(a)) continue;
      const { likes, views, comments } = getMetrics(a);
      if (likes != null && views != null) {
        // Compute numeric percentage and always update statistics
        const numericPct = Number.isFinite(likes) && Number.isFinite(views) && views > 0 ? (likes / views) * 100 : null;

        if (numericPct != null && Number.isFinite(numericPct)) {
          // Deduplicate by post id across sessions — try to extract a stable post id
          const postId = (function extractPostId(article) {
            try {
              // Prefer links to status/permalink
              const anchors = Array.from(article.querySelectorAll('a[href]'));
              for (const a of anchors) {
                const href = a.getAttribute('href') || '';
                // Support multiple URL patterns, including numeric IDs and newer slugs
                const m1 = href.match(/status(?:es)?\/(\d+)/);
                if (m1) return m1[1];
                const m2 = href.match(/(?:status|statuses|post|posts|permalink)[\/_-]?([A-Za-z0-9_-]{6,})/i);
                if (m2) return m2[1];
              }
              // fallback: time element within an anchor
                // fallback: find anchor containing a time element (older selector may not work everywhere)
                const timeAnchor = article.querySelector('a time')?.closest('a') || article.querySelector('a:has(time)');
              if (timeAnchor) {
                const a = timeAnchor.closest('a');
                const href = a?.getAttribute('href') || '';
                  const m = href.match(/status(?:es)?\/(\d+)/) || href.match(/(?:status|statuses|post|posts|permalink)[\/_-]?([A-Za-z0-9_-]{6,})/i);
                if (m) return m[1];
              }
            } catch (e) { /* ignore */ }
            return null;
          })(a);

          // If we have a stable post id and it's already processed, avoid double-counting
          if (postId && processedSet.has(postId)) {
            // Still set dataset and render UI if applicable, but don't increment aggregated stats
            a.dataset.xlvpLikes = String(likes);
            a.dataset.xlvpViews = String(views);
            a.dataset.xlvpPct = String(numericPct);

            const restrictToFeed = true;
            const inFeedExisting = restrictToFeed ? isInFeed(a) : true;
            const showZeros = !!window.__XLVP_showZeros;
            const onlyZeros = !!window.__XLVP_onlyZeros;

            if (inFeedExisting && onlyZeros) {
              if (Number.isFinite(numericPct) && numericPct !== 0) {
                a.dataset.xlvpFiltered = 'true';
                a.style.display = 'none';
                seen.add(a);
                continue; // do not render badge
              }
            }

            const shouldFilterExisting = inFeedExisting ? (filterThreshold != null && Number.isFinite(numericPct) && numericPct < filterThreshold && !(showZeros && Number(numericPct) === 0)) : false;
            if (shouldFilterExisting) {
              a.dataset.xlvpFiltered = 'true';
              a.style.display = 'none';
              seen.add(a);
              continue; // do not render badge
            }

            const text = clampPct(likes, views);
            if (text) renderBadge(a, text, likes, views);
            seen.add(a);
            continue;
          }
          // Save metric information on the element so we can re-filter later if the threshold changes
          a.dataset.xlvpLikes = String(likes);
          a.dataset.xlvpViews = String(views);
          a.dataset.xlvpPct = String(numericPct);

          // Update stats regardless of filtering only if collection is allowed for this location
          const restrictToFeed2 = true;
          const inFeed2 = restrictToFeed2 ? isInFeed(a) : true;
          const showZeros2 = !!window.__XLVP_showZeros;
          const onlyZeros2 = !!window.__XLVP_onlyZeros;
          if (inFeed2) {
            updateStats(a, numericPct, likes, views, comments);
            console.log('[XLVP] Stats updated for post with engagement', numericPct, 'views:', views, 'comments:', comments, '(will be included in CSV regardless of filtering)');
            // persist the fact we've processed this post id so we don't double-record in future sessions
            try {
              if (postId) addProcessedId(postId);
            } catch (e) { /* ignore */ }
          } else {
            // If we're not collecting in this location, do not add to processedIds so it may be recorded later
            try { /* intentionally skip adding processed id */ } catch (e) { /* ignore */ }
          }

          // Filtering is VISUAL ONLY - filtered posts still contribute to data collection above
          if (inFeed2 && onlyZeros2) {
            if (Number.isFinite(numericPct) && numericPct !== 0) {
              a.dataset.xlvpFiltered = 'true';
              a.style.display = 'none';
              console.log('[XLVP] Hiding post (onlyZeros filter) but data was already collected');
              seen.add(a);
              continue; // do not render badge
            }
          }

          const shouldFilterNew = inFeed2 ? (filterThreshold != null && Number.isFinite(numericPct) && numericPct < filterThreshold && !(showZeros2 && Number(numericPct) === 0)) : false;
          if (shouldFilterNew) {
            a.dataset.xlvpFiltered = 'true';
            a.style.display = 'none';
            console.log('[XLVP] Hiding post (threshold filter) but data was already collected');
            seen.add(a);
            continue; // do not render badge
          }

          // Otherwise render UI
          const text = clampPct(likes, views);
          if (text) renderBadge(a, text, likes, views);
        }

        // mark as processed so we don't re-process too often
        seen.add(a);
      }
    }
  }, { rootMargin: "200px" });

  const hook = (root = document) => {
    root.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
      try { processCommunityNote(a); } catch (e) { /* ignore */ }
      // Extract and collect data immediately, regardless of visibility
      extractAndCollectPostData(a);
      io.observe(a);
    });
  };

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.('article[data-testid="tweet"]')) {
          try { processCommunityNote(n); } catch (e) { /* ignore */ }
          // Extract and collect data immediately when post is added
          extractAndCollectPostData(n);
          io.observe(n);
        }
        n.querySelectorAll?.('article[data-testid="tweet"]').forEach((a) => {
          try { processCommunityNote(a); } catch (e) { /* ignore */ }
          // Extract and collect data immediately when post is added
          extractAndCollectPostData(a);
          io.observe(a);
        });
      }
    }
  });

  // Initialize
  // Load the filter threshold and monitor changes
  loadFilterSettings();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.filterThreshold) {
      const newVal = changes.filterThreshold.newValue;
      filterThreshold = (typeof newVal !== 'undefined' && newVal !== null) ? parseFloat(newVal) : null;
      // Re-apply filtering immediately
      reapplyFilter();
    }
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      hook();
      mo.observe(document.documentElement, { childList: true, subtree: true });
    });
  } else {
    hook();
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Listen for save completion
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'saveComplete' && message.success) {
      window.savePromptShown = false;  // Reset the prompt flag on successful save
      console.log('Save completed successfully');
    }
  });

  // Initialize stats and settings
  (async function initialize() {
    try {
      console.log('Initializing extension...');
      await loadStats();
      await loadSaveSettings();
      console.log('Extension initialized with saveEveryN:', window.__XLVP_saveEveryN);
    } catch (e) {
      console.warn('Failed to initialize extension:', e);
    }
  })();
})();
