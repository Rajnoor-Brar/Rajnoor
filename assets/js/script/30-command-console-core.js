// ___________________________________________________________________________________________________________________
// ___________________________________________________________________________________________________________________
// ============================================== Command Box Functions ==============================================

let showTimeouts = [];
let hideTimeouts = [];

let panelTime = 100;

function clearAllTimeouts(arr) {
  arr.forEach(clearTimeout);
  arr.length = 0;
}

// Registers a SPA cleanup callback, chaining safely into any prior registration.
window.__registerCleanup = function (fn) {
  const prev = window.__pageCleanup;
  window.__pageCleanup = function () {
    try { fn(); } catch (e) { console.error('pageCleanup error:', e); }
    if (typeof prev === 'function') {
      try { prev(); } catch (e) { console.error('pageCleanup chain error:', e); }
    }
    window.__pageCleanup = null;
  };
};

let commandBox = document.getElementById('command-box');
let commandPanels = document.querySelectorAll('.command-panel');

// Chain into SPA cleanup so mid-animation navigation can't leak phantom
// open/close timers onto the next page.
window.__registerCleanup(function () {
  clearAllTimeouts(showTimeouts);
  clearAllTimeouts(hideTimeouts);
});

// --------------- Open Nav Panel ---------------

// Re-sync the active-rail position on nav-panel — offsetTop is 0 while the
// panel is display:none, so we must refresh once it's actually laid out.
function refreshActiveRail() {
  const panel = document.getElementById('nav-panel');
  if (!panel) return;
  const active = panel.querySelector('.nav-link.active');
  const item = active?.closest('.nav-item');
  if (!item) return;
  // --y-offset is resolved by CSS via calc(); JS only needs the row's offsetTop.
  panel.style.setProperty('--active-y', item.offsetTop + 'px');
  panel.style.setProperty('--active-shown', '1');
}

function openNavPanel() {
  clearAllTimeouts(hideTimeouts);
  clearAllTimeouts(showTimeouts);

  commandBox.classList.remove('hide');

  commandPanels.forEach((panel, i) => {
    const t = setTimeout(() => {
      panel.classList.remove('contract', 'hide');
      panel.classList.add('show');
      if (panel.id === 'nav-panel') refreshActiveRail();
    }, i * panelTime);
    showTimeouts.push(t);
  });
}

function closeNavPanel() {
  clearAllTimeouts(showTimeouts);
  clearAllTimeouts(hideTimeouts);
  commandBox.classList.remove('show');

  // (Scroll-arc no longer lives inside command-console — no focus-hide to mask.)
  // (Text-size panel auto-close removed — toggle no longer lives inside command-console.)

  // Collapse in reverse order (action-panel first, then nav-panel)
  const panels = [...commandPanels].reverse();
  panels.forEach((panel, i) => {
    const t = setTimeout(() => {
      panel.classList.remove('show');
      panel.classList.add('contract');

      // Hide after the collapse animation completes (nav-panel: 0.18s, action-panel: 0.12s)
      const animDuration = panel.id === 'nav-panel' ? 180 : 120;
      const tHide = setTimeout(() => {
        panel.classList.remove('contract');
        panel.classList.add('hide');
      }, animDuration + 20);
      hideTimeouts.push(tHide);
    }, i * panelTime);
    hideTimeouts.push(t);
  });

  // Hide command-box once all panels have finished collapsing
  const tHideBox = setTimeout(() => {
    commandBox.classList.add('hide');
  }, (panels.length - 1) * panelTime + 220);
  hideTimeouts.push(tHideBox);
}
