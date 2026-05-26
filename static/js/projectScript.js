// ── Project detail: range-slider factory (font-size + image-size) ───────────
// Shared shape: hydrate from localStorage with clamp, write to a CSS var on
// :root (and optionally a mirror style on .article), persist on input,
// reset via dot button (left-click) + slider (right-click).
function initRangeSlider({ sliderId, resetBtnId, storageKey, cssVar, defaultValue, min, max, unit, articleStyleProp }) {
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
    }
    slider.addEventListener('contextmenu', doReset);
    if (resetBtn) resetBtn.addEventListener('click', doReset);
}

initRangeSlider({
    sliderId: 'text-size-slider', resetBtnId: 'text-size-reset',
    storageKey: 'rj_doc_font_size', cssVar: '--rj-article-fs',
    defaultValue: 1.1, min: 0.8, max: 1.6, unit: 'rem',
    articleStyleProp: 'fontSize',
});

initRangeSlider({
    sliderId: 'img-size-slider', resetBtnId: 'img-size-reset',
    storageKey: 'rj_doc_img_size', cssVar: '--rj-article-img-size',
    defaultValue: 96, min: 40, max: 100, unit: '%',
});

// ── Project list: filter toggle + tag chips ──────────────────────────────────
(function () {
  const toggleBtn   = document.getElementById('filter-toggle');
  const filtersWrap = document.getElementById('project-filters-wrap');
  const chips       = document.querySelectorAll('.filter-chip');
  const cards       = document.querySelectorAll('.project-card-wrap');
  const groups      = document.querySelectorAll('.project-group');
  const empty       = document.getElementById('project-empty-state');

  // ── Filter panel toggle ────────────────────────────────────────────────────
  if (toggleBtn && filtersWrap) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = filtersWrap.classList.toggle('open');
      toggleBtn.classList.toggle('active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen);

      // When closing, clear all active chips and reset the filter
      if (!isOpen) {
        activeTags.clear();
        chips.forEach(c => c.classList.remove('active'));
        applyFilter();
      }
    });
  }

  if (!chips.length) return;

  // ── Tag filtering (AND logic) ──────────────────────────────────────────────
  const activeTags = new Set();

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
      applyFilter();
    });
  });
})();

// ── Project detail: Table of contents ────────────────────────────────────
// Positioning is handled by parent #page-console (mirror of #command-console).
// This IIFE only manages: heading extraction, 3-state cycle, scroll spy,
// and visibility (.shown on toggle, .hide on panel).
(function () {
  const toggle  = document.getElementById('toc-toggle');
  const panel   = document.getElementById('toc-panel');
  const list    = document.getElementById('toc-list');
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
    list.querySelectorAll('.toc-list__item--active').forEach(el => el.classList.remove('toc-list__item--active'));
    if (!li) { panel.style.setProperty('--toc-indicator-shown', '0'); return; }
    li.classList.add('toc-list__item--active');
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
      li.className = 'toc-list__item ' + (h.tagName === 'H3' ? 'toc-list__item--h3' : 'toc-list__item--h2');
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

// ── Project detail: text-size toggle button (head-panel) ─────────────────
// Wires the #text-size-toggle click to open/close #text-size-panel. Element
// lives in #page-console, which only exists on project pages, so this IIFE
// re-runs (and re-attaches the handler) on every SPA navigation hit.
(function () {
  const toggle = document.getElementById('text-size-toggle');
  const panel  = document.getElementById('text-size-panel');
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

