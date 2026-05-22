// ── Shortcut Hints overlay (? key) ───────────────────────────────────────────
// Gated by window.__features.shortcutHints — only loaded when flag is on.
(function () {
  if (!window.__features?.shortcutHints) return;

  const dialog = document.getElementById('shortcut-hints');
  if (!dialog) return;

  function open()  { dialog.classList.add('shortcut-hints--open');  }
  function close() { dialog.classList.remove('shortcut-hints--open'); }
  function toggle(){ dialog.classList.toggle('shortcut-hints--open'); }

  document.addEventListener('keydown', (e) => {
    // ? key — ignore when user is typing in an input / textarea
    if (e.key === '?' && !e.ctrlKey && !e.metaKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      toggle();
    }
    if (e.key === 'Escape') close();
  });

  // Click outside the panel to dismiss
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
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
