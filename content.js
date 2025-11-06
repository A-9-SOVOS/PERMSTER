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

// Floating tooltip helper: renders tooltip into document.body so it's not clipped by ancestors
function attachFloatingTooltip(badge) {
  if (!badge || badge.__xlvp_tooltip_attached) return;
  badge.__xlvp_tooltip_attached = true;
  // mark badge so CSS can hide the inline pseudo-element when we use a floating tooltip
  badge.classList.add('xlvp-has-floating');

  let tipEl = null;

  function createTip(text) {
    const d = document.createElement('div');
    d.className = 'xlvp-floating-tooltip';
    d.textContent = text;
    d.style.position = 'fixed';
    d.style.pointerEvents = 'auto';
    document.body.appendChild(d);
    return d;
  }

  function positionTip(el, anchorRect) {
    if (!el || !anchorRect) return;
    const pad = 8;
    // Default center below the anchor
    let left = anchorRect.left + anchorRect.width / 2;
    let top = anchorRect.bottom + pad;
    el.style.left = '0px';
    el.style.top = '0px';
    el.style.visibility = 'hidden';
    // allow browser to measure
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    left = Math.min(Math.max(pad + w / 2, left), window.innerWidth - pad - w / 2);
    // convert center to left-edge
    const leftEdge = left - w / 2;
    // if not enough space below, show above
    if (anchorRect.bottom + pad + h > window.innerHeight) {
      top = anchorRect.top - pad - h;
    }
    // clamp top
    top = Math.max(pad, Math.min(top, window.innerHeight - pad - h));
    el.style.left = `${Math.round(leftEdge)}px`;
    el.style.top = `${Math.round(top)}px`;
    el.style.visibility = 'visible';
  }

  function showTip() {
    const text = badge.getAttribute('data-tooltip') || '';
    if (!text) return;
    if (tipEl) return; // already shown
    tipEl = createTip(text);
    tipEl.addEventListener('click', (ev) => ev.stopPropagation());
    const rect = badge.getBoundingClientRect();
    positionTip(tipEl, rect);
    // reposition on scroll/resize
    window.addEventListener('scroll', onWindowMove, true);
    window.addEventListener('resize', onWindowMove);
  }

  function hideTip() {
    if (!tipEl) return;
    try { tipEl.remove(); } catch (e) {}
    tipEl = null;
    window.removeEventListener('scroll', onWindowMove, true);
    window.removeEventListener('resize', onWindowMove);
  }

  function onWindowMove() {
    if (!tipEl) return;
    const rect = badge.getBoundingClientRect();
    positionTip(tipEl, rect);
  }

  badge.addEventListener('mouseenter', showTip);
  badge.addEventListener('focus', showTip);
  badge.addEventListener('mouseleave', hideTip);
  badge.addEventListener('blur', hideTip);

  // Keep click behaviour (open note URL) but ensure it doesn't recreate default inline tooltip
  const noteUrl = badge.getAttribute('data-note-url');
  if (noteUrl) {
    badge.style.cursor = 'pointer';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      window.open(noteUrl, '_blank');
    });
  }
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

    // Create or get the percent badge
    let badge = article.querySelector('.xlvp-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'xlvp-badge';
      actionRow.appendChild(badge);
    }

    // Set color per theme
    badge.style.color = themeColor();
    badge.textContent = ` ߷ ${pctText}`;
    badge.title = `${likes?.toLocaleString?.()} likes / ${views?.toLocaleString?.()} views`;

    // Handle community notes
    const communityNotes = article.querySelector('[data-testid="birdwatch-pivot"]');
    if (communityNotes) {
      // Create or get the community notes badge
      let noteBadge = article.querySelector('.community-note-badge');
      if (!noteBadge) {
        noteBadge = document.createElement('span');
        noteBadge.className = 'community-note-badge';

        // Find the user info area and buttons
        const headerArea = article.querySelector('[data-testid="User-Name"]')?.closest('.css-175oi2r.r-1awozwy.r-18u37iz.r-1cmwbt1.r-1wtj0ep');
        if (headerArea) {
          const buttons = headerArea.querySelector('.css-175oi2r.r-1awozwy.r-6koalj.r-18u37iz');
          if (buttons) {
            headerArea.insertBefore(noteBadge, buttons);
          }
        }
      }

      noteBadge.textContent = 'φ';

      // Extract a fuller community note text (robust against small DOM changes)
      function extractNoteText(container) {
        if (!container) return '';
        const parts = [];
        // Prefer visible text inside spans/divs but skip headers like "Readers added context"
        container.querySelectorAll('span, div, p').forEach((el) => {
          const t = (el.textContent || '').trim();
          if (!t) return;
          if (/^readers? added context[:\-–]?\s*/i.test(t)) return;
          if (/^community note[:\-–]?\s*/i.test(t)) return;
          parts.push(t);
        });
        if (parts.length) return parts.join(' ').replace(/\s+/g, ' ').trim();
        // Fallback: use innerText and remove common header prefixes
        const fallback = (container.innerText || '').replace(/^\s*(Readers? added context[:\-–]?\s*)/i, '').trim();
        return fallback;
      }

      const notesContent = extractNoteText(communityNotes) || 'Community note available';
      noteBadge.setAttribute('data-tooltip', notesContent);

      // Hide the original community notes
      communityNotes.style.display = 'none';
        // Attach floating tooltip so it renders above other elements
        attachFloatingTooltip(noteBadge);
    }
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

  function handleCommunityNotes(article) {
    const communityNotes = article.querySelector('[data-testid="birdwatch-pivot"]');
    if (communityNotes) {
      // Create or get the community notes badge
      let noteBadge = article.querySelector('.community-note-badge');
      if (!noteBadge) {
        noteBadge = document.createElement('span');
        noteBadge.className = 'community-note-badge';
        
        // Find the user info area and buttons
        const headerArea = article.querySelector('[data-testid="User-Name"]')?.closest('.css-175oi2r.r-k4xj1c.r-18u37iz.r-1wtj0ep');
        if (headerArea) {
          headerArea.style.position = 'relative';
          const wrapper = document.createElement('div');
          wrapper.className = 'note-badge-wrapper';
          wrapper.appendChild(noteBadge);
          noteBadge.textContent = 'φ';
          
          // Extract note content and URL more robustly
          const noteContainer = communityNotes;
          function extractNoteText(container) {
            if (!container) return '';
            const parts = [];
            container.querySelectorAll('span, div, p').forEach((el) => {
              const t = (el.textContent || '').trim();
              if (!t) return;
              if (/^readers? added context[:\-–]?\s*/i.test(t)) return;
              if (/^community note[:\-–]?\s*/i.test(t)) return;
              parts.push(t);
            });
            if (parts.length) return parts.join(' ').replace(/\s+/g, ' ').trim();
            const fallback = (container.innerText || '').replace(/^\s*(Readers? added context[:\-–]?\s*)/i, '').trim();
            return fallback;
          }

          const noteContent = extractNoteText(noteContainer);
          const noteUrl = communityNotes.querySelector('a[href^="http"]')?.href || '';
          
          noteBadge.setAttribute('data-tooltip', noteContent || 'Community note available');
          if (noteUrl) {
            noteBadge.setAttribute('data-note-url', noteUrl);
            noteBadge.style.cursor = 'pointer';
            noteBadge.addEventListener('click', (e) => {
              e.stopPropagation();
              window.open(noteUrl, '_blank');
            });
          }
          
          // Insert after User-Name but before any buttons
          headerArea.insertBefore(wrapper, headerArea.querySelector('.css-175oi2r.r-1kkk96v'));
          
          // Hide the original community notes
          communityNotes.style.display = 'none';
          // Attach floating tooltip so it renders above other elements
          attachFloatingTooltip(noteBadge);
        }
      }
    }
  }

  const hook = (root = document) => {
    root.querySelectorAll('article[data-testid="tweet"]').forEach((a) => {
      io.observe(a);
      handleCommunityNotes(a);
    });
  }

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;
        if (n.matches?.('article[data-testid="tweet"]')) {
          io.observe(n);
          handleCommunityNotes(n);
        }
        n.querySelectorAll?.('article[data-testid="tweet"]').forEach((a) => {
          io.observe(a);
          handleCommunityNotes(a);
        });
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
