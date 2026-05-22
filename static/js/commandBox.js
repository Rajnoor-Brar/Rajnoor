// ── Command Box (⌘K palette) ─────────────────────────────────────────────────
// Gated by window.__features.commandPalette — only loaded when flag is on.
(function () {
  if (!window.__features?.commandPalette) return;

  const overlay = document.getElementById('command-box-overlay');
  const input   = document.getElementById('command-box-input');
  const list    = document.getElementById('command-box-list');
  if (!overlay || !input || !list) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let pages       = null;   // fetched once, cached
  let activeIndex = -1;

  // ── Open / close ──────────────────────────────────────────────────────────
  function open() {
    overlay.classList.add('command-box--open');
    input.value = '';
    input.focus();
    activeIndex = -1;
    if (!pages) fetchIndex();
    else renderResults('');
  }

  function close() {
    overlay.classList.remove('command-box--open');
    activeIndex = -1;
  }

  function toggle() {
    overlay.classList.contains('command-box--open') ? close() : open();
  }

  // ── Index fetch ────────────────────────────────────────────────────────────
  async function fetchIndex() {
    list.innerHTML = '<li class="command-box__status">Loading…</li>';
    try {
      const res  = await fetch('/index.json');
      if (!res.ok) throw new Error(res.status);
      pages = await res.json();
      renderResults(input.value);
    } catch (e) {
      list.innerHTML = '<li class="command-box__status command-box__status--error">Could not load index.</li>';
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
      list.innerHTML = '<li class="command-box__status">No results.</li>';
      activeIndex = -1;
      return;
    }

    list.innerHTML = scored.map((x, i) => {
      const p = x.page;
      const kindLabel = p.kind ? `<span class="command-box__kind">${p.kind}</span>` : '';
      return `<li class="command-box__item${i === 0 ? ' active' : ''}" data-url="${p.url}" role="option" aria-selected="${i === 0}">
        <span class="command-box__title">${escHtml(p.title)}</span>
        ${kindLabel}
      </li>`;
    }).join('');
    activeIndex = 0;

    list.querySelectorAll('.command-box__item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.url));
      item.addEventListener('mouseover', () => setActive(item));
    });
  }

  function escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function setActive(el) {
    list.querySelectorAll('.command-box__item').forEach((item, i) => {
      const on = item === el;
      item.classList.toggle('active', on);
      item.setAttribute('aria-selected', on);
      if (on) activeIndex = i;
    });
  }

  function moveActive(dir) {
    const items = [...list.querySelectorAll('.command-box__item')];
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
  // ⌘K / Ctrl+K
  document.addEventListener('keydown', (e) => {
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      toggle();
    }
    if (!overlay.classList.contains('command-box--open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(+1); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); moveActive(-1); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const active = list.querySelector('.command-box__item.active');
      if (active) navigate(active.dataset.url);
    }
  });

  input.addEventListener('input', () => renderResults(input.value.trim()));

  // Click outside panel to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // Expose cleanup for SPA navigation
  window.__pageCleanup = (function (prev) {
    return function () {
      close();
      if (typeof prev === 'function') prev();
      window.__pageCleanup = null;
    };
  })(window.__pageCleanup);
})();
