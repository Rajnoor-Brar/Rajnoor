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
    localStorage.setItem('rj_page_console_contracted', contracted ? '1' : '0');
    showToast(contracted ? 'Page tools collapsed' : 'Page tools expanded', {
      duration: 'short',
      variant: 'info'
    });
});
