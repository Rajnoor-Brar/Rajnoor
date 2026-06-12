// ── Shortcut Hints overlay (? key) ───────────────────────────────────────────
// Gated by window.__features.shortcutHints — only loaded when flag is on.
(function () {
  if (!window.__features?.shortcutHints) return;

  const dialog = document.getElementById('shortcuts-overlay');
  if (!dialog) return;

  const closeBtn = dialog.querySelector('.shortcuts-overlay__close');
  let lastFocused = null;   // element focused before open — restored on close

  function isOpen() { return dialog.classList.contains('shortcuts-overlay--open'); }

  function open() {
    lastFocused = document.activeElement;
    dialog.classList.add('shortcuts-overlay--open');
    if (closeBtn) closeBtn.focus();   // move focus into the modal
  }
  function close() {
    if (!isOpen()) return;
    dialog.classList.remove('shortcuts-overlay--open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }
  function toggle() { isOpen() ? close() : open(); }

  document.addEventListener('keydown', (e) => {
    // ? key — ignore when user is typing in an input / textarea
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      e.preventDefault();
      toggle();
    }
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    // Focus trap — the close button is the only focusable control in the panel,
    // so keep Tab / Shift+Tab from escaping to the page behind the modal.
    if (e.key === 'Tab' && closeBtn) { e.preventDefault(); closeBtn.focus(); }
  });

  // Click outside the panel to dismiss
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  // Action-panel "?" toggle button
  const toggleBtn = document.getElementById('shortcuts-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggle();
    });
  }

  // Close button inside the overlay
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Expose cleanup for SPA navigation
  window.__registerCleanup(function () { close(); });
})();
