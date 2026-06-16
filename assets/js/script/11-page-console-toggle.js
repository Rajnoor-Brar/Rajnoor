// ── Page-console contraction toggle ────────────────────────────────────────
// Delegated so it survives SPA #page-content swaps. The contract button only
// exists when a page injects a #page-console — pages without one are no-ops.
// State persisted in localStorage so it survives navigations and reloads.
function setPageConsoleToggleState(btn, contracted) {
    if (!btn) return;
    btn.setAttribute('aria-expanded', contracted ? 'false' : 'true');
    btn.setAttribute('aria-label', contracted ? 'Expand page console' : 'Contract page console');
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('#page-console-toggle');
    if (!btn) return;
    e.stopPropagation();
    const pc = document.getElementById('page-console');
    if (!pc) return;
    const contracted = pc.classList.toggle('contracted');
    setPageConsoleToggleState(btn, contracted);
    // Per-form-factor key: see syncPageConsoleCorner in 31-nav-position.js.
    const key = window.matchMedia('(max-width: 768px)').matches
      ? 'rj_page_console_contracted_sm'
      : 'rj_page_console_contracted';
    localStorage.setItem(key, contracted ? '1' : '0');
    showToast(contracted ? 'Page tools collapsed' : 'Page tools expanded', {
      duration: 'short',
      variant: 'info'
    });
});
