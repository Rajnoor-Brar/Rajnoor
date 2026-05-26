// ─── Page loader ─────────────────────────────────────────────────────────────
// The loader div lives in baseof.html (covers content from first paint).
// JS only handles the dismissal once DOM + fonts are ready.
(function () {
  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    var el = document.getElementById('rj-page-loader');
    if (!el) return;
    el.classList.add('dismissed');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 500);
  }

  var domReady = new Promise(function (res) {
    if (document.readyState !== 'loading') res();
    else document.addEventListener('DOMContentLoaded', res, { once: true });
  });
  var fontsReady = (document.fonts && document.fonts.ready) || Promise.resolve();
  Promise.all([domReady, fontsReady]).then(dismiss);
  setTimeout(dismiss, 2500); // failsafe — never trap the user
})();

// ─── Image placeholder & graceful load ───────────────────────────────────────
// • Shimmer background (CSS) pulses while images are downloading
// • .img-loaded triggers @starting-style fade-in when the image arrives
// • Broken images fall back to /resources/img_placeholder.svg
(function () {
  var PLACEHOLDER = '/resources/img_placeholder.svg';

  function markLoaded(img) {
    // If we already fell into error state, don't re-classify as loaded
    // (the placeholder itself fires a load event — we ignore it)
    if (img.classList.contains('img-error')) return;
    img.classList.add('img-loaded');
  }

  function markError(img) {
    if (img.dataset.rjErrored === '1') return; // prevent infinite loop
    img.dataset.rjErrored = '1';
    img.classList.remove('img-loaded');
    img.classList.add('img-error');
    img.src = PLACEHOLDER;
  }

  function checkImg(img) {
    var src = img.getAttribute('src');
    if (!src || src === '') return;
    if (img.classList.contains('img-loaded') || img.classList.contains('img-error')) return;
    if (img.complete) {
      if (img.naturalWidth > 0) markLoaded(img);
      else markError(img);
    }
    // Otherwise in-flight: the delegated listeners below will handle it
  }

  // Capture phase: load/error don't bubble, capture catches them at document level
  document.addEventListener('load', function (e) {
    if (e.target && e.target.tagName === 'IMG') markLoaded(e.target);
  }, { capture: true });
  document.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') markError(e.target);
  }, { capture: true });

  function initImages(root) {
    (root || document).querySelectorAll('img').forEach(checkImg);
  }

  document.addEventListener('DOMContentLoaded', function () { initImages(); }, { once: true });
  // Exposed so navigateTo() can re-scan after a content swap
  window.__initImages = initImages;
})();

// Feature flags — read from the <meta name="rj-features"> tag written by Hugo.
// Each Track-B module can guard itself with: if (!window.__features.notebook) return;
(function () {
  try {
    const meta = document.querySelector('meta[name="rj-features"]');
    window.__features = meta ? JSON.parse(meta.content) : {};
  } catch (_) {
    window.__features = {};
  }
})();

let hoverTimer;
let leaveTimer;
const HOVER_OPEN_MS = 200;
const HOVER_LEAVE_GRACE_MS = 180;
// true when the panel was opened by tap/click — stays open until outside tap
let pinnedOpen = false;

document.addEventListener("DOMContentLoaded", function () {
    const hitbox = document.getElementById('command-console');
    let savedTheme = localStorage.getItem("theme");

    hitbox.addEventListener('pointerenter', () => {
        clearTimeout(leaveTimer);
        hoverTimer = setTimeout(() => {
            pinnedOpen = false;   // hover-open: not pinned
            hitbox.focus();
        }, HOVER_OPEN_MS);
    });

    hitbox.addEventListener('pointerleave', () => {
        clearTimeout(hoverTimer);
        if (pinnedOpen) return;  // tap/click opened — ignore leave
        // Grace period: if the pointer re-enters #command-console (which contains the
        // command box and panels) before this elapses, cancel the blur.
        leaveTimer = setTimeout(() => { hitbox.blur(); }, HOVER_LEAVE_GRACE_MS);
    });

    hitbox.addEventListener('focus', () => openNavPanel());
    hitbox.addEventListener('blur', () => { pinnedOpen = false; closeNavPanel(); });

    // Outside-tap/click dismissal for pinned (tap-opened) panel
    document.addEventListener('pointerdown', (e) => {
        if (!pinnedOpen) return;
        if (hitbox.contains(e.target)) return;
        pinnedOpen = false;
        hitbox.blur();
    }, { capture: true });

    shiftCommand("initialise");

    if (!savedTheme) {  localStorage.setItem("theme", "auto");  savedTheme = "auto";  }

    // Set icon immediately so there's no wrong-icon flash on initial load.
    // setAutoTheme() → updateAutoTheme() handles its own icon; set explicit ones here.
    if      (savedTheme === "dark" ) { themeIcon.innerText = "dark_mode";  setTheme("dark");  }
    else if (savedTheme === "light") { themeIcon.innerText = "light_mode"; setTheme("light"); }
    else                             { setAutoTheme(); }

    themeAnimReady = true; // allow icon swap animation after initial paint

    themeToggleEventMaker();

    attachCornerPickerHandlers();
    attachKeyboardHandler();
    attachDragHandlers();

    // Alt+T (Opt+T on macOS) — cycle theme, same as clicking the toggle
    document.addEventListener('keydown', (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 't' &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        themeToggleBtn.click();
      }
    });
});

// ── Page-console contraction toggle ────────────────────────────────────────
// Delegated so it survives SPA #page-content swaps. The contract button only
// exists when a page injects a #page-console — pages without one are no-ops.
// State persisted in localStorage so it survives navigations and reloads.
document.addEventListener('click', (e) => {
    const btn = e.target.closest('#page-console-toggle');
    if (!btn) return;
    e.stopPropagation();
    const pc = document.getElementById('page-console');
    if (!pc) return;
    const contracted = pc.classList.toggle('contracted');
    btn.setAttribute('aria-expanded', contracted ? 'false' : 'true');
    localStorage.setItem('rj_page_console_contracted', contracted ? '1' : '0');
});

// __________________________________________________________________________________________________________________
// ============================================== Theme Toggle Functions ==============================================
const themeToggleBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// Guard: skip icon-swap animation on the initial load call from setAutoTheme()
let themeAnimReady = false;

function themeToggleEventMaker(){
  themeToggleBtn.addEventListener("click", function () {
        tapHaptic();
        // Cancel any in-progress animation, then restart cleanly.
        // getAnimations().cancel() is more reliable than the void-offsetWidth
        // reflow trick, which browsers can silently skip.
        themeIcon.getAnimations().forEach(a => a.cancel());
        themeIcon.classList.remove("rotate");
        themeIcon.classList.add("rotate");
        // document.getElementById("command-console").blur();
        setTimeout(() => {
            let currentTheme = localStorage.getItem("theme") || "auto";

            // Fire background/colour transition for manual toggles
            document.documentElement.classList.add('theme-transitioning');
            setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);

            if (currentTheme === "light") {
                themeIcon.innerText = "dark_mode";
                localStorage.setItem("theme", "dark");
                setTheme("dark");
            }
            else if (currentTheme === "dark") {
                localStorage.setItem("theme", "auto");
                setAutoTheme(); }
            else {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', updateAutoTheme);
                themeIcon.innerText = "light_mode";
                localStorage.setItem("theme", "light");
                setTheme("light");
            }

            setTimeout(() => {
                themeIcon.classList.remove("rotate");
            }, 500);

        }, 500);
    });
}


// ── Haptic helper — 10ms pulse on touch devices; no-op on desktop ────────────
function tapHaptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

function setTheme(mode) {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--my-background').trim();

    document.documentElement.setAttribute("data-bs-theme", mode);

    if (metaThemeColor) metaThemeColor.setAttribute("content", bg);
}

function setAutoTheme() {
    updateAutoTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateAutoTheme);
}

function updateAutoTheme() {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
     if (systemDark) {themeIcon.innerText = "brightness_4"; }
      else {themeIcon.innerText = "brightness_5"; }
    applyTheme(systemDark ? "dark" : "light");
}

function applyTheme(theme) {
    // Fire background/colour transition for system-triggered auto changes
    document.documentElement.classList.add('theme-transitioning');
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
    // Skip icon-swap when .rotate is already running (manual toggle) —
    // both set `animation` on the same element and the last cascade wins,
    // which would kill the spin mid-way through the dark→auto transition.
    if (themeAnimReady && !themeIcon.classList.contains('rotate')) {
        themeIcon.classList.remove('icon-swap');
        void themeIcon.offsetWidth; // restart animation
        themeIcon.classList.add('icon-swap');
    }
    setTheme(theme === "dark" ? "dark" : "light");
}


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


// __________________________________________________________________________________________________________________
// ============================================== Nav Position System ==============================================

const SHIFT_DURATION_MS = 350; // matches --motion-slow
const DRAG_THRESHOLD_PX = 8;
const THROW_VELOCITY_PX_PER_MS = 0.5;
const commandConsoleEl = document.getElementById("command-console");
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function cornerCode(vert, horz) {
  return `${vert[0].toUpperCase()}${horz[0].toUpperCase()}`;
}

function cornerFromCode(code) {
  return {
    vert: code[0] === 'T' ? 'top' : 'bottom',
    horz: code[1] === 'L' ? 'left' : 'right'
  };
}

function currentCornerCode() {
  return cornerCode(
    localStorage.getItem('navVert') || 'top',
    localStorage.getItem('navHorz') || 'left'
  );
}

function updateTopSpacer(vert) {
  const spacer = document.querySelector('.top-spacer');
  if (!spacer) return;
  if (vert === 'bottom') spacer.classList.add('contract');
  else spacer.classList.remove('contract');
}

function updateCornerPicker(code) {
  document.querySelectorAll('.corner-dot').forEach(d => {
    d.classList.toggle('active', d.dataset.corner === code);
  });
}

// FLIP-style transform-only shift between corners (layout-free)
function shiftSignature(fromCode, toCode) {
  if (fromCode === toCode) return;
  const from = cornerFromCode(fromCode);
  const to = cornerFromCode(toCode);

  const beforeRect = commandConsoleEl.getBoundingClientRect();

  commandConsoleEl.classList.remove(from.vert, from.horz);
  commandConsoleEl.classList.add(to.vert, to.horz);

  const afterRect = commandConsoleEl.getBoundingClientRect();

  const dx = beforeRect.left - afterRect.left;
  const dy = beforeRect.top - afterRect.top;

  commandConsoleEl.style.transition = 'none';
  commandConsoleEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  // Force reflow so the browser commits the pre-state before we animate
  void commandConsoleEl.offsetWidth;

  if (reduceMotion.matches) {
    commandConsoleEl.style.transition = '';
    commandConsoleEl.style.transform = '';
  } else {
    commandConsoleEl.style.transition = '';
    commandConsoleEl.style.transform = '';
    // The base transition rule on #command-console (`transition: transform 500ms cubic-bezier(...)`) takes over.
  }

  localStorage.setItem('navVert', to.vert);
  localStorage.setItem('navHorz', to.horz);
  updateTopSpacer(to.vert);
  updateCornerPicker(toCode);
  document.dispatchEvent(new CustomEvent('rj:signature-moved', { detail: to }));
}

function requestShift(toCode) {
  const fromCode = currentCornerCode();
  if (fromCode === toCode) return;

  const panelOpen = !commandBox.classList.contains('hide');
  if (panelOpen) {
    closeNavPanel();
    setTimeout(() => shiftSignature(fromCode, toCode), 350);
  } else {
    shiftSignature(fromCode, toCode);
  }
}

function shiftCommand(button) {
  if (button === 'initialise') {
    let nowVert = localStorage.getItem('navVert');
    let nowHorz = localStorage.getItem('navHorz');
    if (!nowVert || (nowVert !== 'top' && nowVert !== 'bottom')) {
      localStorage.setItem('navVert', 'top');
      nowVert = 'top';
    }
    if (!nowHorz || (nowHorz !== 'left' && nowHorz !== 'right')) {
      localStorage.setItem('navHorz', 'left');
      nowHorz = 'left';
    }
    commandConsoleEl.classList.add(nowVert, nowHorz);
    updateTopSpacer(nowVert);
    updateCornerPicker(cornerCode(nowVert, nowHorz));
    syncPageConsoleCorner({ vert: nowVert, horz: nowHorz });
  }
}

// Mirror the command-console corner classes onto #page-console (same vert, opposite horz)
// and apply the persisted contracted state. Called on initial load and after every
// SPA navigation (since #page-console is now injected by the page template).
function syncPageConsoleCorner(to) {
  const pc = document.getElementById('page-console');
  if (!pc) return;
  const vert = to?.vert || localStorage.getItem('navVert') || 'top';
  const horz = to?.horz || localStorage.getItem('navHorz') || 'left';
  const mirror = horz === 'left' ? 'right' : 'left';
  pc.classList.remove('top', 'bottom', 'left', 'right');
  pc.classList.add(vert, mirror);
  // Default to contracted on mobile (≤768px) if no user preference is stored;
  // respect explicit toggle on either platform otherwise.
  const stored = localStorage.getItem('rj_page_console_contracted');
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const shouldContract = stored === '1' || (stored === null && isMobile);
  if (shouldContract) {
    pc.classList.add('contracted');
    const btn = document.getElementById('page-console-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  // ── Chapter-strip-panel collapsed-state init ─────────────────────────
  // Adaptive default: mobile (≤768px) starts collapsed, desktop expanded.
  // User override persisted to localStorage under `rj_chapter_strip_collapsed`.
  // Mirrors the page-console contracted-state pattern above.
  const strip = document.getElementById('chapter-strip-panel');
  if (strip) {
    const stripStored = localStorage.getItem('rj_chapter_strip_collapsed');
    const stripCollapsed =
      stripStored === '1' || (stripStored === null && isMobile);
    if (stripCollapsed) {
      strip.classList.add('collapsed');
      const stripBtn = document.getElementById('chapter-strip-toggle');
      if (stripBtn) {
        stripBtn.setAttribute('aria-expanded', 'false');
        stripBtn.setAttribute('aria-label', 'Expand chapter strip');
      }
    }
    // Bind click handler (idempotent — replace any prior listener after SPA nav)
    const stripBtn = document.getElementById('chapter-strip-toggle');
    if (stripBtn && !stripBtn.dataset.rjBound) {
      stripBtn.dataset.rjBound = '1';
      stripBtn.addEventListener('click', () => {
        const collapsed = strip.classList.toggle('collapsed');
        stripBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        stripBtn.setAttribute(
          'aria-label',
          collapsed ? 'Expand chapter strip' : 'Collapse chapter strip'
        );
        localStorage.setItem('rj_chapter_strip_collapsed', collapsed ? '1' : '0');
      });
    }
  }
}
document.addEventListener('rj:signature-moved', (e) => syncPageConsoleCorner(e.detail));

// __________________________________________________________________________________________________________________
// ============================================== Corner-target hints (drag affordance) ==============================

let cornerTargetsEl = null;
function ensureCornerTargets() {
  if (cornerTargetsEl) return cornerTargetsEl;
  cornerTargetsEl = document.createElement('div');
  cornerTargetsEl.id = 'corner-targets';
  ['TL', 'TR', 'BL', 'BR'].forEach(c => {
    const t = document.createElement('div');
    t.className = `corner-target ${c}`;
    cornerTargetsEl.appendChild(t);
  });
  document.body.appendChild(cornerTargetsEl);
  return cornerTargetsEl;
}
function showCornerTargets() { ensureCornerTargets().classList.add('visible'); }
function hideCornerTargets() { if (cornerTargetsEl) cornerTargetsEl.classList.remove('visible'); }

// __________________________________________________________________________________________________________________
// ============================================== Mini-map dot clicks ==============================================

function attachCornerPickerHandlers() {
  document.querySelectorAll('.corner-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      tapHaptic();
      requestShift(dot.dataset.corner);
    });
  });
}

// __________________________________________________________________________________________________________________
// ============================================== Keyboard navigation ==============================================

function attachKeyboardHandler() {
  commandConsoleEl.addEventListener('keydown', (e) => {
    const axis = { ArrowUp: ['top', null], ArrowDown: ['bottom', null], ArrowLeft: [null, 'left'], ArrowRight: [null, 'right'] }[e.key];
    if (!axis) return;
    e.preventDefault();
    const [v, h] = axis;
    const nowV = localStorage.getItem('navVert') || 'top';
    const nowH = localStorage.getItem('navHorz') || 'left';
    const target = cornerCode(v || nowV, h || nowH);
    requestShift(target);
  });
}

// __________________________________________________________________________________________________________________
// ============================================== Drag + swipe/throw ==============================================

let dragState = null;   // null | 'pending' | 'dragging'
let dragStart = null;

function attachDragHandlers() {
  commandConsoleEl.addEventListener('pointerdown', (e) => {
    // Don't start a drag from inside the command box (nav links, theme toggle, corner-picker)
    if (e.target.closest('#command-box')) return;
    if (e.button !== undefined && e.button !== 0) return;

    dragState = 'pending';
    dragStart = { x: e.clientX, y: e.clientY, t: performance.now(), pointerId: e.pointerId };
    clearTimeout(hoverTimer);
    try { commandConsoleEl.setPointerCapture(e.pointerId); } catch (_) {}
  });

  commandConsoleEl.addEventListener('pointermove', (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragState === 'pending' && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      dragState = 'dragging';
      commandConsoleEl.classList.add('dragging');
      commandConsoleEl.blur();
      closeNavPanel();
      showCornerTargets();
    }

    if (dragState === 'dragging') {
      commandConsoleEl.style.transition = 'none';
      commandConsoleEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    }
  });

  function finishDrag(e) {
    if (!dragState) return;
    const wasDragging = dragState === 'dragging';

    if (wasDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const dt = performance.now() - dragStart.t;
      const dist = Math.hypot(dx, dy);
      const velocity = dist / Math.max(dt, 1);

      let targetCode;
      if (velocity > THROW_VELOCITY_PX_PER_MS) {
        // Throw locks to a single axis — whichever component of the velocity
        // vector has greater magnitude. The orthogonal axis keeps its
        // current value, so a fast diagonal toss only moves the pill on
        // one axis instead of jumping to the opposite corner. To reach the
        // opposite corner, the user can drag (release with low velocity)
        // or perform two consecutive throws.
        const current = cornerFromCode(currentCornerCode());
        if (Math.abs(dx) > Math.abs(dy)) {
          targetCode = cornerCode(current.vert, dx > 0 ? 'right' : 'left');
        } else {
          targetCode = cornerCode(dy > 0 ? 'bottom' : 'top', current.horz);
        }
      } else {
        // Snap to quadrant of release point
        targetCode = cornerCode(
          e.clientY < window.innerHeight / 2 ? 'top' : 'bottom',
          e.clientX < window.innerWidth / 2 ? 'left' : 'right'
        );
      }

      commandConsoleEl.classList.remove('dragging');
      hideCornerTargets();

      // Clear drag transform without transition so FLIP measurement is clean
      commandConsoleEl.style.transition = 'none';
      commandConsoleEl.style.transform = '';
      void commandConsoleEl.offsetWidth;

      const fromCode = currentCornerCode();
      if (fromCode !== targetCode) {
        shiftSignature(fromCode, targetCode);
      }
    } else {
      // Tap (no drag) — toggle: close if already open, otherwise pin open
      const panelIsOpen = !commandBox.classList.contains('hide');
      if (panelIsOpen) {
        pinnedOpen = false;
        commandConsoleEl.blur();
      } else {
        tapHaptic();
        pinnedOpen = true;
        commandConsoleEl.focus();
      }
    }

    try { commandConsoleEl.releasePointerCapture(dragStart.pointerId); } catch (_) {}
    dragState = null;
    dragStart = null;
  }

  commandConsoleEl.addEventListener('pointerup', finishDrag);
  commandConsoleEl.addEventListener('pointercancel', () => {
    if (dragState === 'dragging') {
      commandConsoleEl.classList.remove('dragging');
      hideCornerTargets();
      commandConsoleEl.style.transition = 'none';
      commandConsoleEl.style.transform = '';
    }
    dragState = null;
    dragStart = null;
  });
}

// ─── SPA Navigation ──────────────────────────────────────────────────────────
(function () {
  let abortController = null;

  function updateActiveNav(activeNavKey) {
    document.querySelectorAll('.nav-link.active').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('nav-panel');
    if (activeNavKey) {
      const el = [...document.querySelectorAll('[data-nav-key]')]
        .find(nav => nav.dataset.navKey === activeNavKey);
      if (el) el.classList.add('active');
      // refreshActiveRail reads .nav-link.active + applies --y-offset
      if (typeof refreshActiveRail === 'function') refreshActiveRail();
    } else if (panel) {
      panel.style.setProperty('--active-shown', '0');
    }
  }

  // Hover rail: glides to whichever nav-item the pointer is over
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('#nav-panel .nav-item');
    const panel = document.getElementById('nav-panel');
    if (!item || !panel) return;
    panel.style.setProperty('--hover-y', item.offsetTop + 'px');
    panel.style.setProperty('--hover-shown', '1');
  });
  document.addEventListener('mouseout', (e) => {
    const panel = document.getElementById('nav-panel');
    if (!panel) return;
    // Hide when leaving panel entirely
    if (e.target.closest('#nav-panel') && !e.relatedTarget?.closest('#nav-panel')) {
      panel.style.setProperty('--hover-shown', '0');
    }
  });

  function showNavLoader() {
    let loader = document.getElementById('rj-page-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'rj-page-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<div class="rj-spinner"></div>';
      document.body.appendChild(loader);
    } else {
      // Re-activate if it was dismissed by the initial-load sequence
      loader.classList.remove('dismissed');
    }
  }

  function hideNavLoader() {
    const loader = document.getElementById('rj-page-loader');
    if (!loader) return;
    loader.classList.add('dismissed');
    setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
  }

  async function navigateTo(url, pushState, restoreScrollY) {
    // Cancel any in-flight fetch
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const content = document.getElementById('page-content');

    // Run page-specific cleanup (e.g. clear homeScript timers)
    if (typeof window.__pageCleanup === 'function') {
      try { window.__pageCleanup(); } catch (e) { console.error('pageCleanup error:', e); }
      window.__pageCleanup = null;
    }

    // Fade out current content and show spinner (both start together)
    content.classList.add('page-leaving');
    showNavLoader();

    // Separate path+search from hash fragment
    let urlHash = '';
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) { urlHash = url.slice(hashIdx); url = url.slice(0, hashIdx); }

    let html, finalUrl;
    try {
      const res = await fetch(url, { signal: abortController.signal });
      if (!res.ok) throw new Error(res.status);
      // Use the post-redirect URL (e.g. /credentials → /credentials/)
      finalUrl = new URL(res.url).pathname;
      html = await res.text();
    } catch (err) {
      if (err.name === 'AbortError') { hideNavLoader(); return; }
      // Fallback: hard navigate (loader stays — the browser will unload the page)
      location.href = url;
      return;
    }

    // Wait for CSS fade-out to finish
    await new Promise(r => setTimeout(r, 160));

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newContent = doc.getElementById('page-content');
    if (!newContent) { location.href = url; return; }

    // Swap page-specific CSS
    const pageStyleEl = document.getElementById('page-style');
    const newStyleHref = doc.getElementById('page-style')?.getAttribute('href') || '';
    if (pageStyleEl) pageStyleEl.setAttribute('href', newStyleHref);

    // Swap content
    content.innerHTML = newContent.innerHTML;
    content.dataset.activeNav = newContent.dataset.activeNav || '';

    // Update title + active nav
    document.title = doc.title;
    updateActiveNav(newContent.dataset.activeNav);

    // Scroll: restore saved position (back/forward), jump to hash anchor, or top
    if (restoreScrollY != null) {
      window.scrollTo(0, restoreScrollY);
    } else if (urlHash) {
      const target = document.getElementById(urlHash.slice(1));
      if (target) target.scrollIntoView({ behavior: 'instant' });
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    // Fade in — do this before script loading so content is never blocked
    content.classList.remove('page-leaving');
    hideNavLoader();

    // Position #page-console (if present in new content) to mirror command-console corner
    syncPageConsoleCorner();
    if (typeof window.__initScrollArc === 'function') window.__initScrollArc();
    // Mark already-cached images as loaded; start shimmer on new in-flight ones
    if (typeof window.__initImages === 'function') window.__initImages(content);

    if (pushState) {
      // Save current scroll before stamping new entry
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      history.pushState({ url: finalUrl + urlHash }, '', finalUrl + urlHash);
    }

    // Re-render math (KaTeX) if loaded
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(content, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
        ]
      });
    }

    // Re-highlight code blocks (Prism) if loaded
    if (typeof Prism !== 'undefined' && typeof Prism.highlightElement === 'function') {
      content.querySelectorAll('code[class*="language-"]').forEach(el => Prism.highlightElement(el));
    }

    // Swap page-specific script (fire-and-forget — never block the fade-in)
    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();
    const newScriptSrc = doc.getElementById('page-script')?.getAttribute('src') || '';
    if (newScriptSrc) {
      const script = document.createElement('script');
      script.id = 'page-script';
      script.src = newScriptSrc;
      document.body.appendChild(script);
    }
  }

  // Intercept same-origin link clicks
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (link.target === '_blank') return;
    if (link.hasAttribute('download')) return;
    if (link.getAttribute('href')?.startsWith('mailto:')) return;
    if (link.getAttribute('href')?.startsWith('javascript:')) return;
    // Same page: hash-only change (or no change at all) — let browser handle
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    navigateTo(url.pathname + url.search + url.hash, true);
  });

  // Handle back / forward — restore saved scroll position if available
  window.addEventListener('popstate', (e) => {
    const savedY = e.state?.scrollY ?? null;
    navigateTo(location.pathname + location.search + location.hash, false, savedY);
  });

  // Stamp initial history entry so popstate works on first back
  history.replaceState({ url: location.pathname, scrollY: 0 }, '', location.pathname);

  // Apply active nav on initial load (replaces the removed inline script)
  document.addEventListener('DOMContentLoaded', () => {
    const activeNav = document.getElementById('page-content')?.dataset.activeNav;
    updateActiveNav(activeNav);
  });
}());
