// ── Scroll Arc ────────────────────────────────────────────────────────────────
// Gated by window.__features.scrollArc — only loaded when flag is on.
// Traces a thin SVG arc around the rounded corner of #signature-background
// whose fill amount tracks the page scroll progress (0 → 1).
(function () {
  if (!window.__features?.scrollArc) return;

  const sig  = document.getElementById('signature-box');
  const arc  = document.getElementById('scroll-arc');
  const path = document.getElementById('scroll-arc-path');
  if (!sig || !arc || !path) return;

  const FADE_IN_SCROLL_PX = 200;  // don't show arc on very short pages
  let rafPending = false;

  function update() {
    rafPending = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable < FADE_IN_SCROLL_PX) {
      document.documentElement.style.setProperty('--scroll-progress', '0');
      document.documentElement.style.setProperty('--scroll-arc-opacity', '0');
      return;
    }
    const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
    const opacity  = Math.min(1, (window.scrollY - 50) / 150);  // fade in gently
    document.documentElement.style.setProperty('--scroll-progress', progress);
    document.documentElement.style.setProperty('--scroll-arc-opacity', opacity);
  }

  window.addEventListener('scroll', () => {
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();  // apply on load

  // Corner changes require re-positioning the arc — handled in CSS via sig classes
  // (arc element is a sibling of signature-background, so it inherits corner classes)

  // Expose cleanup
  window.__pageCleanup = (function (prev) {
    return function () {
      document.documentElement.style.setProperty('--scroll-progress', '0');
      document.documentElement.style.setProperty('--scroll-arc-opacity', '0');
      if (typeof prev === 'function') prev();
      window.__pageCleanup = null;
    };
  })(window.__pageCleanup);
})();
