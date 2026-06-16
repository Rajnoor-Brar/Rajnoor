// ── Spotlight — fuzzy page search overlay (Shift+Space) ──────────────────────
// Gated by window.__features.spotlight — only loaded when flag is on.
(function () {
  if (!window.__features?.spotlight) return;

  const overlay = document.getElementById('spotlight-overlay');
  const input   = document.getElementById('spotlight-overlay-input');
  const list    = document.getElementById('spotlight-overlay-list');
  if (!overlay || !input || !list) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let pages       = null;   // fetched once, cached
  let activeIndex = -1;
  let searchReadyAnnounced = false;
  let lastFocused = null;   // element focused before open — restored on close

  // Toast copy sourced from data/script.yaml › spotlight.toasts (single source
  // of truth). cfgToast maps a { message, duration, variant } config onto showToast.
  const TOASTS = {{ site.Data.script.spotlight.toasts | jsonify }};
  function cfgToast(cfg) {
    if (cfg && cfg.message && typeof showToast === 'function') {
      showToast(cfg.message, { duration: cfg.duration, variant: cfg.variant });
    }
  }

  // ── Open / close ──────────────────────────────────────────────────────────
  // While the modal is open the page behind it is inert'd — screen readers
  // and Tab can't wander into content the backdrop only hides visually.
  const pageContainer = document.getElementById('page-container');

  function open() {
    lastFocused = document.activeElement;   // remember trigger for focus restore
    overlay.classList.add('spotlight-overlay--open');
    if (pageContainer) pageContainer.inert = true;
    input.value = '';
    input.focus();
    activeIndex = -1;
    if (!pages) fetchIndex();
    else renderResults('');
  }

  function close() {
    overlay.classList.remove('spotlight-overlay--open');
    if (pageContainer) pageContainer.inert = false;
    activeIndex = -1;
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  function toggle() {
    overlay.classList.contains('spotlight-overlay--open') ? close() : open();
  }

  // ── Index fetch ────────────────────────────────────────────────────────────
  async function fetchIndex(isRetry) {
    if (isRetry && typeof showToast === 'function') {
      cfgToast(TOASTS.retry);
    }
    list.innerHTML = '<li class="spotlight-overlay__status">Loading…</li>';
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort('timeout'), 8000);
    try {
      const res = await fetch('/index.json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(res.status);
      pages = await res.json();
      renderResults(input.value);
      if (!searchReadyAnnounced && typeof showToast === 'function') {
        cfgToast(TOASTS.ready);
        searchReadyAnnounced = true;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        // 8 s timeout — offer a retry
        list.innerHTML =
          '<li class="spotlight-overlay__status spotlight-overlay__status--error">' +
          'Took too long to load. ' +
          '<button class="spotlight-overlay__retry">Retry</button>' +
          '</li>';
        list.querySelector('.spotlight-overlay__retry')
            ?.addEventListener('click', () => fetchIndex(true), { once: true });
        if (typeof showToast === 'function') {
          cfgToast(TOASTS.slow);
        }
      } else {
        list.innerHTML =
          '<li class="spotlight-overlay__status spotlight-overlay__status--error">' +
          'Could not load index. ' +
          '<button class="spotlight-overlay__retry">Retry</button>' +
          '</li>';
        list.querySelector('.spotlight-overlay__retry')
            ?.addEventListener('click', () => fetchIndex(true), { once: true });
        if (typeof showToast === 'function') {
          cfgToast(TOASTS.unavailable);
        }
      }
    }
  }

  // ── Fuzzy match (substring + token rank) ──────────────────────────────────
  function score(page, query) {
    if (!query) return 1;  // show all when query is empty
    const q     = query.toLowerCase();
    const title = (page.title || '').toLowerCase();
    const desc  = (page.desc  || '').toLowerCase();
    const tags  = (page.tags  || []).join(' ').toLowerCase();
    const kind  = (page.kind  || '').toLowerCase();
    const haystack = `${title} ${desc} ${tags} ${kind}`;

    // Exact substring in title: highest score
    if (title.includes(q))    return 3;
    // All query tokens present in haystack
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.every(t => haystack.includes(t))) return 2;
    // Any token present
    if (tokens.some(t => haystack.includes(t)))  return 1;
    return 0;
  }

  function renderResults(query) {
    if (!pages) return;
    const scored = pages
      .map(p => ({ page: p, s: score(p, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8);

    if (!scored.length) {
      list.innerHTML = '<li class="spotlight-overlay__status">No results.</li>';
      activeIndex = -1;
      return;
    }

    list.innerHTML = scored.map((x, i) => {
      const p = x.page;
      const kindLabel = p.kind ? `<span class="spotlight-overlay__kind">${p.kind}</span>` : '';
      return `<li class="spotlight-overlay__item${i === 0 ? ' active' : ''}" data-url="${p.url}" role="option" aria-selected="${i === 0}">
        <span class="spotlight-overlay__title">${escHtml(p.title)}</span>
        ${kindLabel}
      </li>`;
    }).join('');
    activeIndex = 0;

    list.querySelectorAll('.spotlight-overlay__item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.url));
      item.addEventListener('mouseover', () => setActive(item));
    });
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function setActive(el) {
    list.querySelectorAll('.spotlight-overlay__item').forEach((item, i) => {
      const on = item === el;
      item.classList.toggle('active', on);
      item.setAttribute('aria-selected', on);
      if (on) activeIndex = i;
    });
  }

  function moveActive(dir) {
    const items = [...list.querySelectorAll('.spotlight-overlay__item')];
    if (!items.length) return;
    activeIndex = Math.max(0, Math.min(items.length - 1, activeIndex + dir));
    items.forEach((item, i) => {
      const on = i === activeIndex;
      item.classList.toggle('active', on);
      item.setAttribute('aria-selected', on);
      if (on) item.scrollIntoView({ block: 'nearest' });
    });
  }

  function navigate(url) {
    close();
    // Reuse the SPA click-interception by dispatching a real click on a temp link
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  // ⇧⌘Space (Mac) / Shift+Win+Space (Windows) — toggles spotlight
  // • opens only when focus is outside text inputs
  // • closes even when spotlight's own search input has focus
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const isOpen = overlay.classList.contains('spotlight-overlay--open');
      const tag    = document.activeElement?.tagName;
      if (isOpen || !tag || !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault();
        toggle();
      }
    }
    if (!overlay.classList.contains('spotlight-overlay--open')) return;
    // Focus trap — the input is the only focusable control in the panel, so
    // keep Tab / Shift+Tab from escaping to the page behind the modal.
    if (e.key === 'Tab') { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(+1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); moveActive(-1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const active = list.querySelector('.spotlight-overlay__item.active');
      if (active) navigate(active.dataset.url);
    }
  });

  input.addEventListener('input', () => renderResults(input.value.trim()));

  // Click outside panel to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Programmatic open hook — used by the 404 page's "another door" link
  window.__openSpotlight = open;

  // Expose cleanup for SPA navigation
  window.__registerCleanup(function () { close(); });
})();
