let hoverTimer;
let leaveTimer;
const HOVER_OPEN_MS = 200;
const HOVER_LEAVE_GRACE_MS = 180;
// true when the panel was opened by tap/click — stays open until outside tap
let pinnedOpen = false;

document.addEventListener("DOMContentLoaded", function () {
    const hitbox = document.getElementById('signature-box');
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
        // Grace period: if the pointer re-enters #signature-box (which contains the
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
    if      (savedTheme === "dark" ) { themeIcon.innerText = "dark_mode";  setDarkTheme();  }
    else if (savedTheme === "light") { themeIcon.innerText = "light_mode"; setLightTheme(); }
    else                             { setAutoTheme(); }

    themeAnimReady = true; // allow icon swap animation after initial paint

    themeToggleEventMaker();

    attachCornerPickerHandlers();
    attachKeyboardHandler();
    attachDragHandlers();

});

// __________________________________________________________________________________________________________________
// ============================================== Theme Toggle Functions ==============================================
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Guard: skip icon-swap animation on the initial load call from setAutoTheme()
let themeAnimReady = false;

function themeToggleEventMaker(){
  themeToggleBtn.addEventListener("click", function () {
        // Restart animation cleanly even on rapid clicks
        themeIcon.classList.remove("rotate");
        void themeIcon.offsetWidth;
        themeIcon.classList.add("rotate");
        // document.getElementById("signature-box").blur();
        setTimeout(() => {
            let currentTheme = localStorage.getItem("theme") || "auto";

            // Fire background/colour transition for manual toggles
            document.documentElement.classList.add('theme-transitioning');
            setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);

            if (currentTheme === "light") {
                themeIcon.innerText = "dark_mode";
                localStorage.setItem("theme", "dark");
                setDarkTheme();
            }
            else if (currentTheme === "dark") {
                localStorage.setItem("theme", "auto");
                setAutoTheme(); }
            else {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', updateAutoTheme);
                themeIcon.innerText = "light_mode";
                localStorage.setItem("theme", "light");
                setLightTheme();
            }

            setTimeout(() => {
                themeIcon.classList.remove("rotate");
            }, 700);

        }, 300);
    });
}


function setLightTheme(){

    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-background').trim();

    document.documentElement.setAttribute("data-bs-theme", "light");

    metaThemeColor.setAttribute("content", black);
}

function setDarkTheme(){
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-background').trim();

    document.documentElement.setAttribute("data-bs-theme", "dark");

    metaThemeColor.setAttribute("content", black);         
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
    if (themeAnimReady) {
        themeIcon.classList.remove('icon-swap');
        void themeIcon.offsetWidth; // restart animation
        themeIcon.classList.add('icon-swap');
    }
    if (theme === "dark") setDarkTheme();
    else setLightTheme();
}


// ___________________________________________________________________________________________________________________
// ============================================== Command Box Functions ==============================================

let showTimeouts = [];
let hideTimeouts = [];

let itemTime = 50;
let panelTime = 100;

function clearAllTimeouts(arr) {
  arr.forEach(clearTimeout);
  arr.length = 0;
}

let commandBox = document.getElementById('commandBox');
let commandPanels = document.querySelectorAll('.commandPanel');

// --------------- Open Nav Panel ---------------

// Re-sync the active-rail position on navPanel — offsetTop is 0 while the
// panel is display:none, so we must refresh once it's actually laid out.
function refreshActiveRail() {
  const panel = document.getElementById('navPanel');
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
      if (panel.id === 'navPanel') refreshActiveRail();
    }, i * panelTime);
    showTimeouts.push(t);
  });
}

function closeNavPanel() {
  clearAllTimeouts(showTimeouts);
  clearAllTimeouts(hideTimeouts);
  commandBox.classList.remove('show');

  // Collapse in reverse order (actionPanel first, then navPanel)
  const panels = [...commandPanels].reverse();
  panels.forEach((panel, i) => {
    const t = setTimeout(() => {
      panel.classList.remove('show');
      panel.classList.add('contract');

      // Hide after the collapse animation completes (navPanel: 0.18s, actionPanel: 0.12s)
      const animDuration = panel.id === 'navPanel' ? 180 : 120;
      const tHide = setTimeout(() => {
        panel.classList.remove('contract');
        panel.classList.add('hide');
      }, animDuration + 20);
      hideTimeouts.push(tHide);
    }, i * panelTime);
    hideTimeouts.push(t);
  });

  // Hide commandBox once all panels have finished collapsing
  const tHideBox = setTimeout(() => {
    commandBox.classList.add('hide');
  }, (panels.length - 1) * panelTime + 220);
  hideTimeouts.push(tHideBox);
}


// __________________________________________________________________________________________________________________
// ============================================== Nav Position System ==============================================

const SHIFT_DURATION_MS = 500;
const DRAG_THRESHOLD_PX = 8;
const THROW_VELOCITY_PX_PER_MS = 0.5;
const sig = document.getElementById("signature-box");
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

  const beforeRect = sig.getBoundingClientRect();

  sig.classList.remove(from.vert, from.horz);
  sig.classList.add(to.vert, to.horz);

  const afterRect = sig.getBoundingClientRect();

  const dx = beforeRect.left - afterRect.left;
  const dy = beforeRect.top - afterRect.top;

  sig.style.transition = 'none';
  sig.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  // Force reflow so the browser commits the pre-state before we animate
  void sig.offsetWidth;

  if (reduceMotion.matches) {
    sig.style.transition = '';
    sig.style.transform = '';
  } else {
    sig.style.transition = '';
    sig.style.transform = '';
    // The base transition rule on #signature-box (`transition: transform 500ms cubic-bezier(...)`) takes over.
  }

  localStorage.setItem('navVert', to.vert);
  localStorage.setItem('navHorz', to.horz);
  updateTopSpacer(to.vert);
  updateCornerPicker(toCode);
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
    sig.classList.add(nowVert, nowHorz);
    updateTopSpacer(nowVert);
    updateCornerPicker(cornerCode(nowVert, nowHorz));
  }
}

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
      requestShift(dot.dataset.corner);
    });
  });
}

// __________________________________________________________________________________________________________________
// ============================================== Keyboard navigation ==============================================

function attachKeyboardHandler() {
  sig.addEventListener('keydown', (e) => {
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
  sig.addEventListener('pointerdown', (e) => {
    // Don't start a drag from inside the command box (nav links, theme toggle, corner-picker)
    if (e.target.closest('#commandBox')) return;
    if (e.button !== undefined && e.button !== 0) return;

    dragState = 'pending';
    dragStart = { x: e.clientX, y: e.clientY, t: performance.now(), pointerId: e.pointerId };
    clearTimeout(hoverTimer);
    try { sig.setPointerCapture(e.pointerId); } catch (_) {}
  });

  sig.addEventListener('pointermove', (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (dragState === 'pending' && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
      dragState = 'dragging';
      sig.classList.add('dragging');
      sig.blur();
      closeNavPanel();
      showCornerTargets();
    }

    if (dragState === 'dragging') {
      sig.style.transition = 'none';
      sig.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
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
        // Throw: target corner = direction of velocity vector
        const vert = dy > 0 ? 'bottom' : 'top';
        const horz = dx > 0 ? 'right' : 'left';
        targetCode = cornerCode(vert, horz);
      } else {
        // Snap to quadrant of release point
        targetCode = cornerCode(
          e.clientY < window.innerHeight / 2 ? 'top' : 'bottom',
          e.clientX < window.innerWidth / 2 ? 'left' : 'right'
        );
      }

      sig.classList.remove('dragging');
      hideCornerTargets();

      // Clear drag transform without transition so FLIP measurement is clean
      sig.style.transition = 'none';
      sig.style.transform = '';
      void sig.offsetWidth;

      const fromCode = currentCornerCode();
      if (fromCode !== targetCode) {
        shiftSignature(fromCode, targetCode);
      }
    } else {
      // Tap (no drag) — pin the panel open until outside tap/click
      pinnedOpen = true;
      sig.focus();
    }

    try { sig.releasePointerCapture(dragStart.pointerId); } catch (_) {}
    dragState = null;
    dragStart = null;
  }

  sig.addEventListener('pointerup', finishDrag);
  sig.addEventListener('pointercancel', () => {
    if (dragState === 'dragging') {
      sig.classList.remove('dragging');
      hideCornerTargets();
      sig.style.transition = 'none';
      sig.style.transform = '';
    }
    dragState = null;
    dragStart = null;
  });
}

// ─── SPA Navigation ──────────────────────────────────────────────────────────
(function () {
  let abortController = null;

  function updateActiveNav(activeNavId) {
    document.querySelectorAll('.nav-link.active').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('navPanel');
    if (activeNavId) {
      const el = document.querySelector(activeNavId);
      if (el) el.classList.add('active');
      // refreshActiveRail reads .nav-link.active + applies --y-offset
      if (typeof refreshActiveRail === 'function') refreshActiveRail();
    } else if (panel) {
      panel.style.setProperty('--active-shown', '0');
    }
  }

  // Hover rail: glides to whichever nav-item the pointer is over
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('#navPanel .nav-item');
    const panel = document.getElementById('navPanel');
    if (!item || !panel) return;
    panel.style.setProperty('--hover-y', item.offsetTop + 'px');
    panel.style.setProperty('--hover-shown', '1');
  });
  document.addEventListener('mouseout', (e) => {
    const panel = document.getElementById('navPanel');
    if (!panel) return;
    // Hide when leaving panel entirely
    if (e.target.closest('#navPanel') && !e.relatedTarget?.closest('#navPanel')) {
      panel.style.setProperty('--hover-shown', '0');
    }
  });

  async function navigateTo(url, pushState, restoreScrollY) {
    // Cancel any in-flight fetch
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const content = document.getElementById('page-content');

    // Run page-specific cleanup (e.g. clear homeScript timers)
    if (typeof window.__pageCleanup === 'function') {
      window.__pageCleanup();
      window.__pageCleanup = null;
    }

    // Fade out
    content.classList.add('page-leaving');

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
      if (err.name === 'AbortError') return;
      // Fallback: hard navigate
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

    if (pushState) {
      // Save current scroll before stamping new entry
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      history.pushState({ url: finalUrl + urlHash }, '', finalUrl + urlHash);
    }

    // Re-render math (KaTeX) if loaded
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(content, {
        delimiters: [
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ]
      });
    }

    // Re-highlight code blocks (Prism) if loaded
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(content);
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