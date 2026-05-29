// ── Scroll Arc ────────────────────────────────────────────────────────────────
// Gated by window.__features.scrollArc — only loaded when flag is on.
// Traces a thin SVG arc around #pg-head-panel inside #page-console; its
// fill amount tracks page scroll progress (0 → 1).
// init() is re-entrant: called once at load and again after each SPA nav
// via window.__initScrollArc (hooked into navigateTo in script.js).
(function () {
  if (!window.__features?.scrollArc) return;

  let arc, path, panel, ro;
  const FADE_IN_SCROLL_PX = 200;
  let rafPending = false;

  // Recompute the SVG viewBox and rounded-rect path to match pg-head-panel's
  // actual dimensions. r matches CSS border-radius: calc(H * 0.4).
  function updatePath() {
    if (!arc || !path || !panel) return;
    const W   = panel.offsetWidth;
    const H   = panel.offsetHeight;
    if (!W || !H) return;
    const r   = H * 0.4;
    const ins = 1;          // inset so stroke isn't clipped at the edge
    const cx  = W / 2;
    arc.setAttribute('viewBox', `0 0 ${W} ${H}`);
    path.setAttribute('d',
      `M ${cx},${ins}` +
      ` H ${W - r}` +
      ` A ${r - ins},${r - ins} 0 0 1 ${W - ins},${r}` +
      ` V ${H - r}` +
      ` A ${r - ins},${r - ins} 0 0 1 ${W - r},${H - ins}` +
      ` H ${r}` +
      ` A ${r - ins},${r - ins} 0 0 1 ${ins},${H - r}` +
      ` V ${r}` +
      ` A ${r - ins},${r - ins} 0 0 1 ${r},${ins}` +
      ` H ${cx}`
    );
  }

  function update() {
    rafPending = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable < FADE_IN_SCROLL_PX) {
      document.documentElement.style.setProperty('--scroll-progress', '0');
      document.documentElement.style.setProperty('--scroll-arc-opacity', '0');
      return;
    }
    const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
    const opacity  = Math.min(1, (window.scrollY - 50) / 150);
    document.documentElement.style.setProperty('--scroll-progress', progress);
    document.documentElement.style.setProperty('--scroll-arc-opacity', opacity);
  }

  // Scroll listener lives for the lifetime of the page — passive, minimal cost.
  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  function init() {
    // Tear down any previous state before re-querying the (possibly new) DOM.
    if (ro) { ro.disconnect(); ro = null; }
    arc = path = panel = null;

    arc   = document.getElementById('scroll-arc');
    path  = document.getElementById('scroll-arc-path');
    panel = document.getElementById('pg-head-panel');
    if (!arc || !path || !panel) return;  // not a project page

    // Keep the arc path in sync when pg-head-panel width changes.
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(updatePath);
      ro.observe(panel);
    }
    updatePath();
    update();

    // Register cleanup for the next SPA nav. Placed inside init() so it
    // re-registers on every call (not just once at module load).
    window.__registerCleanup(function () {
      document.documentElement.style.setProperty('--scroll-progress', '0');
      document.documentElement.style.setProperty('--scroll-arc-opacity', '0');
      if (ro) { ro.disconnect(); ro = null; }
      arc = path = panel = null;
    });
  }

  // Expose so navigateTo() in script.js can re-initialize after content swap.
  window.__initScrollArc = init;
  init();
})();
