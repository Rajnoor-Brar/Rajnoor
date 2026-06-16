// ── Project detail: range-slider factory (font-size + figure-width) ─────────
// Shared shape: hydrate from localStorage with clamp, write to a CSS var on
// :root (and optionally a mirror style on .article), persist on input,
// reset via dot button (left-click) + slider (right-click).
function initRangeSlider({ sliderId, resetBtnId, storageKey, cssVar, defaultValue, min, max, unit, articleStyleProp, toastLabel }) {
    const slider   = document.getElementById(sliderId);
    const resetBtn = document.getElementById(resetBtnId);
    const article  = document.querySelector('.article');
    if (!slider || !article) return;

    const clamp = v => Math.min(max, Math.max(min, v));
    const apply = v => {
        const str = v + unit;
        document.documentElement.style.setProperty(cssVar, str);
        if (articleStyleProp) article.style[articleStyleProp] = str;
        slider.value = v;
    };

    const saved = parseFloat(localStorage.getItem(storageKey));
    apply(Number.isFinite(saved) ? clamp(saved) : defaultValue);

    slider.addEventListener('input', () => {
        const v = clamp(parseFloat(slider.value));
        apply(v);
        localStorage.setItem(storageKey, v);
    });

    function doReset(e) {
        if (e) e.preventDefault();
        apply(defaultValue);
        localStorage.removeItem(storageKey);
        if (typeof showToast === 'function' && toastLabel) {
            showToast(toastLabel + ' reset', { duration: 'short', variant: 'success' });
        }
    }
    slider.addEventListener('contextmenu', doReset);
    if (resetBtn) resetBtn.addEventListener('click', doReset);
}

{{ range site.Data.script.project.sliders }}initRangeSlider({{ . | jsonify }});
{{ end }}

// ── Project list: filter toggle + tag chips ──────────────────────────────────
(function () {
  const toggleBtn   = document.getElementById('filter-toggle');
  const filtersWrap = document.getElementById('project-filters-wrap');
  const chips       = document.querySelectorAll('.filter-chip');
  const cards       = document.querySelectorAll('.project-card-wrap');
  const groups      = document.querySelectorAll('.project-group');
  const empty       = document.getElementById('project-empty-state');
  const countEl     = toggleBtn?.querySelector('.filter-toggle__count');
  const activeTags  = new Set();

  function projectLabel(count) {
    return count === 1 ? 'project' : 'projects';
  }

  function updateToggleState(totalVisible, hasActiveFilters) {
    if (!toggleBtn) return;
    toggleBtn.classList.toggle('has-filter', hasActiveFilters);
    if (countEl) countEl.textContent = hasActiveFilters ? totalVisible : '';
    toggleBtn.setAttribute(
      'aria-label',
      hasActiveFilters
        ? `${totalVisible} ${projectLabel(totalVisible)} shown. Toggle tag filters`
        : 'Toggle tag filters'
    );
  }

  // ── Filter panel toggle ────────────────────────────────────────────────────
  if (toggleBtn && filtersWrap) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = filtersWrap.classList.toggle('open');
      toggleBtn.classList.toggle('active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen);
      filtersWrap.inert = !isOpen; // keep collapsed chips out of the tab order

      // When closing, clear all active chips and reset the filter
      if (!isOpen) {
        activeTags.clear();
        chips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        applyFilter();
      }
    });
  }

  if (!chips.length) return;

  function applyFilter() {
    let totalVisible = 0;

    cards.forEach(card => {
      const cardTags = (card.dataset.tags || '').split(' ').filter(Boolean);
      const matches  = activeTags.size === 0 ||
        [...activeTags].every(t => cardTags.includes(t));
      card.classList.toggle('hidden', !matches);
      if (matches) totalVisible++;
    });

    // Collapse group sections whose every card is hidden
    groups.forEach(section => {
      const sectionCards = section.querySelectorAll('.project-card-wrap');
      const anyVisible   = [...sectionCards].some(c => !c.classList.contains('hidden'));
      section.classList.toggle('hidden', !anyVisible);
    });

    if (empty) empty.style.display = totalVisible === 0 ? '' : 'none';
    updateToggleState(totalVisible, activeTags.size > 0);
    return totalVisible;
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      if (typeof tapHaptic === 'function') tapHaptic();
      const tag = chip.dataset.tag;
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        chip.classList.remove('active');
      } else {
        activeTags.add(tag);
        chip.classList.add('active');
      }
      chip.setAttribute('aria-pressed', activeTags.has(tag));
      const totalVisible = applyFilter();
      if (typeof showToast === 'function') {
        if (activeTags.size === 0) {
          showToast('Filters cleared', { duration: 'short', variant: 'info' });
        } else if (totalVisible === 0) {
          showToast('No matching projects', { duration: 'normal', variant: 'warning' });
        } else {
          showToast(`${totalVisible} ${projectLabel(totalVisible)} shown`, { duration: 'short', variant: 'info' });
        }
      }
    });
  });
})();

// ── Project detail: Table of contents ────────────────────────────────────
// Positioning is handled by parent #page-console (mirror of #command-console).
// This IIFE only manages: heading extraction, 3-state cycle, scroll spy,
// and visibility (.shown on toggle, .hide on panel).
(function () {
  const toggle  = document.getElementById('pg-toc-toggle');
  const panel   = document.getElementById('pg-toc-panel');
  const list    = document.getElementById('pg-toc-list');
  const article = document.querySelector('.article');
  if (!toggle || !panel || !list || !article) return;

  const headings = article.querySelectorAll('h2[id], h3[id]');
  if (!headings.length) return;
  toggle.hidden = false;

  // TOC three-state cycle: 'none' (hidden) → 'l1' (h2 only) → 'l2' (h2 + h3) → 'none'.
  const NEXT = { none: 'l1', l1: 'l2', l2: 'none' };
  let observer = null;
  let liByHeading = new Map();

  function setActive(li) {
    list.querySelectorAll('.pg-toc-list__item--active').forEach(el => el.classList.remove('pg-toc-list__item--active'));
    if (!li) { panel.style.setProperty('--toc-indicator-shown', '0'); return; }
    li.classList.add('pg-toc-list__item--active');
    const indH = Math.round(li.offsetHeight * 0.7);
    panel.style.setProperty('--toc-active-y',        (li.offsetTop + Math.round((li.offsetHeight - indH) / 2)) + 'px');
    panel.style.setProperty('--toc-active-h',        indH + 'px');
    panel.style.setProperty('--toc-indicator-shown', '1');
  }

  function buildList(mode) {
    list.innerHTML = '';
    liByHeading.clear();
    panel.style.setProperty('--toc-indicator-shown', '0');
    const selector = mode === 'l1' ? 'h2[id]' : 'h2[id], h3[id]';
    article.querySelectorAll(selector).forEach(h => {
      const li = document.createElement('li');
      li.className = 'pg-toc-list__item ' + (h.tagName === 'H3' ? 'pg-toc-list__item--h3' : 'pg-toc-list__item--h2');
      const a  = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setActive(li);
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + h.id);
      });
      li.appendChild(a);
      list.appendChild(li);
      liByHeading.set(h, li);
    });
  }

  function startScrollSpy() {
    stopScrollSpy();
    if (!('IntersectionObserver' in window)) return;
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const li = liByHeading.get(entry.target);
        if (li && entry.isIntersecting) setActive(li);
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    liByHeading.forEach((_li, h) => observer.observe(h));
  }

  function stopScrollSpy() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  function applyMode(mode) {
    if (!NEXT.hasOwnProperty(mode)) mode = 'none';
    toggle.dataset.mode = mode;
    toggle.setAttribute('aria-expanded', mode === 'none' ? 'false' : 'true');
    if (mode === 'none') {
      panel.classList.add('hide');
      stopScrollSpy();
      list.innerHTML = '';
      liByHeading.clear();
      return;
    }
    buildList(mode);
    panel.classList.remove('hide');
    startScrollSpy();
  }

  function onToggleClick() {
    const next = NEXT[toggle.dataset.mode || 'none'];
    applyMode(next);
    localStorage.setItem('rj_toc_mode', next);
  }
  toggle.addEventListener('click', onToggleClick);

  const savedMode = localStorage.getItem('rj_toc_mode');
  applyMode(NEXT.hasOwnProperty(savedMode) ? savedMode : 'none');

  // Chain into SPA cleanup
  window.__registerCleanup(function () {
    toggle.removeEventListener('click', onToggleClick);
    stopScrollSpy();
    list.innerHTML = '';
    panel.classList.add('hide');
    toggle.hidden = true;
    toggle.dataset.mode = 'none';
  });
})();

// ── Project detail: pg-text-size toggle button (pg-head-panel) ─────────────────
// Wires the #pg-text-size-toggle click to open/close #pg-text-size-panel. Element
// lives in #page-console, which only exists on project pages, so this IIFE
// re-runs (and re-attaches the handler) on every SPA navigation hit.
(function () {
  const toggle = document.getElementById('pg-text-size-toggle');
  const panel  = document.getElementById('pg-text-size-panel');
  if (!toggle || !panel) return;

  function onClick(e) {
    e.stopPropagation();
    const isOpen = panel.classList.toggle('open');
    toggle.classList.toggle('active', isOpen);
  }
  toggle.addEventListener('click', onClick);

  // Chain into SPA cleanup
  window.__registerCleanup(function () {
    toggle.removeEventListener('click', onClick);
    panel.classList.remove('open');
    toggle.classList.remove('active');
  });
})();

// ── Project detail: code-block toolkit (copy button + language chip) ─────
// Buttons live inside each <pre>; they're discarded with the content on SPA
// navigation, so no cleanup registration is needed.
(function () {
  const article = document.querySelector('.article');
  if (!article) return;

  const COPY_ICON  = '<i class="bi bi-clipboard" aria-hidden="true"></i>';
  const DONE_ICON  = '<i class="bi bi-clipboard-check" aria-hidden="true"></i>';

  // Async Clipboard API needs a secure context — fall back to the legacy
  // textarea + execCommand path elsewhere (http dev server, older Safari).
  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* fall through */ }
    ta.remove();
    if (!ok) throw new Error('copy rejected');
  }

  article.querySelectorAll('pre').forEach((pre) => {
    if (pre.querySelector('.pg-code-copy')) return; // idempotent on re-runs
    const code = pre.querySelector('code') || pre;

    const langMatch = (code.className + ' ' + pre.className).match(/language-([a-z0-9+#-]+)/i);
    if (langMatch) {
      const chip = document.createElement('span');
      chip.className = 'pg-code-lang';
      chip.textContent = langMatch[1];
      chip.setAttribute('aria-hidden', 'true');
      pre.appendChild(chip);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pg-code-copy';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = COPY_ICON;
    btn.addEventListener('click', async () => {
      try {
        await copyText(code.innerText);
        btn.classList.add('copied');
        btn.innerHTML = DONE_ICON;
        if (typeof showToast === 'function') showToast('Code copied', { duration: 'short', variant: 'success' });
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = COPY_ICON;
        }, 1600);
      } catch (e) {
        if (typeof showToast === 'function') showToast('Copy failed', { duration: 'short', variant: 'warning' });
      }
    });
    pre.appendChild(btn);
  });
})();
