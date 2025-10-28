// ---- content.js (snippet) ----
(function () {
  const BADGE_CLASS = "xlvp-badge";

  // Parse "1.2K", "3,456", "1.2万"
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

  const numFromLabel = (lbl) => {
    const m = (lbl || "").match(/([\d.,]+\s*[KMBkmb万億亿]?)/);
    return m ? parseCount(m[1]) : null;
  };

// --- Add this helper near the top of content.js ---
function cssHex(c) {
  // c like "rgb(21, 32, 43)" → "#15202B"
  const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return null;
  const [r,g,b] = [m[1], m[2], m[3]].map(n => Math.max(0, Math.min(255, parseInt(n,10))));
  return "#" + [r,g,b].map(n => n.toString(16).padStart(2,"0")).join("").toUpperCase();
}

function themeColor() {
  // More reliable theme detection using Twitter's theme color
  const theme = document.querySelector('html')?.getAttribute('data-theme') || '';
  const colors = {
    lightsOut: "#71767b",
    dim: "#8b98a5",
    light: "#536471"
  };
  return colors[theme] || '#536471';

  // Nothing needed here - theme detection is handled above
}

  function getMetrics(article) {
    let likes = null, views = null;

    // Strong path: look at aria-labels inside the action cluster
    article
      .querySelectorAll('[role="group"] [aria-label], [aria-label]')
      .forEach((el) => {
        const lbl = el.getAttribute("aria-label") || "";
        if (/\blikes?\b/i.test(lbl)) {
          const n = numFromLabel(lbl);
          if (n != null) likes = Math.max(likes ?? 0, n);
        }
        if (/\bviews?\b/i.test(lbl)) {
          const n = numFromLabel(lbl);
          if (n != null) views = Math.max(views ?? 0, n);
        }
      });

    // Fallback: the analytics link text often *is* the views number
    if (views == null) {
      const a = article.querySelector('a[href$="/analytics"], a[href*="/analytics?"]');
      const n = parseCount(a?.textContent?.trim());
      if (n != null) views = n;
    }

    // If likes == views (common selector collision), try stricter pass
    if (likes != null && views != null && likes === views) {
      let ll = null, vv = null;
      article
        .querySelectorAll('[aria-label$=" Like" i], [aria-label$=" Likes" i], [aria-label$=" View" i], [aria-label$=" Views" i]')
        .forEach((el) => {
          const lbl = el.getAttribute("aria-label") || "";
          if (/\blikes?\b/i.test(lbl)) ll = numFromLabel(lbl) ?? ll;
          if (/\bviews?\b/i.test(lbl)) vv = numFromLabel(lbl) ?? vv;
        });
      if (ll != null) likes = ll;
      if (vv != null) views = vv;
    }

    return { likes, views };
  }

  const clampPct = (likes, views) => {
    if (!Number.isFinite(likes) || !Number.isFinite(views) || views <= 0) return null;
    const pct = Math.min(100, Math.max(0, (likes / views) * 100));
    if (!isFinite(pct)) return null;
    return pct >= 10 ? pct.toFixed(1) + "%" : pct >= 1 ? pct.toFixed(2) + "%" : pct.toFixed(3) + "%";
  };

  function renderBadge(article, pctText, likes, views) {
  const actionRow = article.querySelector('[role="group"]') || article.querySelector('[data-testid="reply"]')?.parentElement;
  if (!actionRow) return;

  let badge = article.querySelector('.xlvp-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'xlvp-badge';
    actionRow.appendChild(badge);
  }

  // NEW: color per theme
  badge.style.color = themeColor();

  badge.textContent = ` ߷ ${pctText}`;
  badge.title = `${likes?.toLocaleString?.()} likes / ${views?.toLocaleString?.()} views`;
}

  // Process only visible tweets; don’t spin the DOM to death
  const seen = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const a = e.target;
      if (seen.has(a)) continue;
      const { likes, views } = getMetrics(a);
      const text = (likes != null && views != null) ? clampPct(likes, views) : null;
      if (text) {
        renderBadge(a, text, likes, views);
        seen.add(a);
      }
    }
  }, { rootMargin: "200px" });

  const hook = (root = document) =>
    root.querySelectorAll('article[data-testid="tweet"]').forEach((a) => io.observe(a));

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.('article[data-testid="tweet"]')) io.observe(n);
        n.querySelectorAll?.('article[data-testid="tweet"]').forEach((a) => io.observe(a));
      }
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
})();
