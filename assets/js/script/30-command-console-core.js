// ___________________________________________________________________________________________________________________
// ___________________________________________________________________________________________________________________
// ============================================== Command Console Functions ==============================================

let showTimeouts = [];
let hideTimeouts = [];

let panelTime = {{ site.Data.script.console.panel_open_ms }};

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

let consoleTray = document.getElementById('command-console-tray');
let commandConsole = document.getElementById('command-console');
let commandPanels = document.querySelectorAll('.command-panel');

// NOTE: these open/close timers are cleared on every SPA navigation directly
// from navigateTo() (60-spa-navigation.js). They are NOT registered through the
// consume-once __pageCleanup chain, which would only fire on the first nav.

// --------------- Open Nav Panel ---------------

// Re-sync the active-rail position on navigation-panel — offsetTop is 0 while the
// panel is display:none, so we must refresh once it's actually laid out.
function refreshActiveRail() {
  const panel = document.getElementById('navigation-panel');
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

  consoleTray.classList.remove('hide');
  if (commandConsole) commandConsole.setAttribute('aria-expanded', 'true');

  commandPanels.forEach((panel, i) => {
    const t = setTimeout(() => {
      panel.classList.remove('contract', 'hide');
      panel.classList.add('show');
      if (panel.id === 'navigation-panel') refreshActiveRail();
    }, i * panelTime);
    showTimeouts.push(t);
  });
}

function closeNavPanel() {
  clearAllTimeouts(showTimeouts);
  clearAllTimeouts(hideTimeouts);
  consoleTray.classList.remove('show');
  if (commandConsole) commandConsole.setAttribute('aria-expanded', 'false');

  // (Scroll-arc no longer lives inside command-console — no focus-hide to mask.)
  // (Text-size panel auto-close removed — toggle no longer lives inside command-console.)

  // Collapse in reverse order (action-panel first, then navigation-panel)
  const panels = [...commandPanels].reverse();
  panels.forEach((panel, i) => {
    const t = setTimeout(() => {
      panel.classList.remove('show');
      panel.classList.add('contract');

      // Hide after the collapse animation completes. These ms values are the
      // single source for the matching CSS `animation-duration` on
      // #navigation-panel / #action-panel (injected from the same keys), so the
      // teardown timer and the animation stay in lock-step.
      const animDuration = panel.id === 'navigation-panel' ? {{ site.Data.script.console.navigation_panel_anim_ms }} : {{ site.Data.script.console.panel_anim_ms }};
      const tHide = setTimeout(() => {
        panel.classList.remove('contract');
        panel.classList.add('hide');
      }, animDuration + 20);
      hideTimeouts.push(tHide);
    }, i * panelTime);
    hideTimeouts.push(t);
  });

  // Hide command-console-tray once all panels have finished collapsing
  const tHideBox = setTimeout(() => {
    consoleTray.classList.add('hide');
  }, (panels.length - 1) * panelTime + 220);
  hideTimeouts.push(tHideBox);
}
