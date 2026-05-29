// ── Command Palette (⌘K palette) ─────────────────────────────────────────────
// Gated by window.__features.commandPalette — only loaded when flag is on.
(function () {
  if (!window.__features?.commandPalette) return;

  const overlay = document.getElementById('command-palette');
  const input   = document.getElementById('command-palette-input');
  const list    = document.getElementById('command-palette-list');
  if (!overlay || !input || !list) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let pages       = null;   // fetched once, cached
  let activeIndex = -1;
  let searchReadyAnnounced = false;

  // ── Open / close ──────────────────────────────────────────────────────────
  function open() {
    overlay.classList.add('command-palette--open');
    input.value = '';
    input.focus();
    activeIndex = -1;
    if (!pages) fetchIndex();
    else renderResults('');
  }

  function close() {
    overlay.classList.remove('command-palette--open');
    activeIndex = -1;
  }

  function toggle() {
    overlay.classList.contains('command-palette--open') ? close() : open();
  }

  // ── Index fetch ────────────────────────────────────────────────────────────
  async function fetchIndex(isRetry) {
    if (isRetry && typeof showToast === 'function') {
      showToast('Retrying search', { duration: 'short', variant: 'info' });
    }
    list.innerHTML = '<li class="command-palette__status">Loading…</li>';
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort('timeout'), 8000);
    try {
      const res = await fetch('/index.json', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(res.status);
      pages = await res.json();
      renderResults(input.value);
      if (!searchReadyAnnounced && typeof showToast === 'function') {
        showToast('Search ready', { duration: 'short', variant: 'success' });
        searchReadyAnnounced = true;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        // 8 s timeout — offer a retry
        list.innerHTML =
          '<li class="command-palette__status command-palette__status--error">' +
          'Took too long to load. ' +
          '<button class="command-palette__retry">Retry</button>' +
          '</li>';
        list.querySelector('.command-palette__retry')
            ?.addEventListener('click', () => fetchIndex(true), { once: true });
        if (typeof showToast === 'function') {
          showToast('Search took too long', { duration: 'long', variant: 'warning' });
        }
      } else {
        list.innerHTML =
          '<li class="command-palette__status command-palette__status--error">' +
          'Could not load index. ' +
          '<button class="command-palette__retry">Retry</button>' +
          '</li>';
        list.querySelector('.command-palette__retry')
            ?.addEventListener('click', () => fetchIndex(true), { once: true });
        if (typeof showToast === 'function') {
          showToast('Search unavailable', { duration: 'long', variant: 'error' });
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
      list.innerHTML = '<li class="command-palette__status">No results.</li>';
      activeIndex = -1;
      return;
    }

    list.innerHTML = scored.map((x, i) => {
      const p = x.page;
      const kindLabel = p.kind ? `<span class="command-palette__kind">${p.kind}</span>` : '';
      return `<li class="command-palette__item${i === 0 ? ' active' : ''}" data-url="${p.url}" role="option" aria-selected="${i === 0}">
        <span class="command-palette__title">${escHtml(p.title)}</span>
        ${kindLabel}
      </li>`;
    }).join('');
    activeIndex = 0;

    list.querySelectorAll('.command-palette__item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.url));
      item.addEventListener('mouseover', () => setActive(item));
    });
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function setActive(el) {
    list.querySelectorAll('.command-palette__item').forEach((item, i) => {
      const on = item === el;
      item.classList.toggle('active', on);
      item.setAttribute('aria-selected', on);
      if (on) activeIndex = i;
    });
  }

  function moveActive(dir) {
    const items = [...list.querySelectorAll('.command-palette__item')];
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
  // ⇧⌘Space (Mac) / Shift+Win+Space (Windows) — toggles palette
  // • opens only when focus is outside text inputs
  // • closes even when the palette's own search input has focus
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      const isOpen = overlay.classList.contains('command-palette--open');
      const tag    = document.activeElement?.tagName;
      if (isOpen || !tag || !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        e.preventDefault();
        toggle();
      }
    }
    if (!overlay.classList.contains('command-palette--open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(+1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); moveActive(-1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const active = list.querySelector('.command-palette__item.active');
      if (active) navigate(active.dataset.url);
    }
  });

  input.addEventListener('input', () => renderResults(input.value.trim()));

  // Click outside panel to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Expose cleanup for SPA navigation
  window.__registerCleanup(function () { close(); });
})();
