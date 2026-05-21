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

    if      (savedTheme === "dark" ) setDarkTheme() ;
    else if (savedTheme === "light") setLightTheme();
    else                             setAutoTheme();

    themeToggleEventMaker();

    attachCornerPickerHandlers();
    attachKeyboardHandler();
    attachDragHandlers();

});

// __________________________________________________________________________________________________________________
// ============================================== Theme Toggle Functions ==============================================
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function themeToggleEventMaker(){
  themeToggleBtn.addEventListener("click", function () {
        themeIcon.classList.add("rotate");
        // document.getElementById("signature-box").blur();
        setTimeout(() => {
            let currentTheme = localStorage.getItem("theme") || "auto";

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
    themeIcon.style.opacity = "0";
    themeIcon.style.transform = "rotate(180deg) scale(0.8)";

    setTimeout(() => {
        themeIcon.style.opacity = "1";
        themeIcon.style.transform = "rotate(0) scale(1)";
    }, 200);

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

function openNavPanel() {
  clearAllTimeouts(hideTimeouts);

  commandBox.classList.remove('hide');
  commandBox.classList.add('show');

  clearAllTimeouts(showTimeouts);

  commandPanels.forEach((commandPanel, i) => {
    const tPanel = setTimeout(() => {
      commandPanel.classList.remove('contract');
      commandPanel.classList.remove('hide');
      commandPanel.classList.add('show');

      const panelItems = commandPanel.querySelectorAll('.panel-item');
      panelItems.forEach((panelItem, j) => {
        const tItem = setTimeout(() => {
          panelItem.classList.remove('hide');
          panelItem.classList.add('show');
        }, j * itemTime + 5);
        showTimeouts.push(tItem);
      });
    }, i * panelTime);
    showTimeouts.push(tPanel);
  });
}

function closeNavPanel() {
  clearAllTimeouts(showTimeouts);
  commandBox.classList.remove('show');
  clearAllTimeouts(hideTimeouts);

  const panels = [...commandPanels].reverse();
  panels.forEach((commandPanel, i) => {
    
    const tPanel = setTimeout(() => {
      const panelItems = [...commandPanel.querySelectorAll('.panel-item')].reverse();
      commandPanel.classList.remove('show');
      commandPanel.classList.add('contract');
      panelItems.forEach((panelItem, j) => {
        const tItem = setTimeout(() => {
          panelItem.classList.remove('show');
          panelItem.classList.add('hide');
        }, j * itemTime);
        hideTimeouts.push(tItem);
      });

      const tHidePanel = setTimeout(() => {
        commandPanel.classList.add('hide');
      }, panelItems.length * itemTime);
      hideTimeouts.push(tHidePanel);
      
      if (i === panels.length - 1) {
        const tHideBox = setTimeout(() => {
          commandBox.classList.add('hide');
          document.getElementById("signature-box").blur();
        }, panelItems.length * itemTime + panelTime);
        hideTimeouts.push(tHideBox);
      }
    }, i * panelTime);
    hideTimeouts.push(tPanel);
  });
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
    if (activeNavId) {
      const el = document.querySelector(activeNavId);
      if (el) el.classList.add('active');
    }
  }

  async function navigateTo(url, pushState) {
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

    // Scroll to top
    window.scrollTo(0, 0);

    // Fade in — do this before script loading so content is never blocked
    content.classList.remove('page-leaving');

    if (pushState) history.pushState({ url: finalUrl }, '', finalUrl);

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
    // Same page, only hash change — let browser handle
    if (url.pathname === location.pathname && url.hash !== location.hash) return;
    e.preventDefault();
    navigateTo(url.pathname + url.search, true);
  });

  // Handle back / forward
  window.addEventListener('popstate', () => {
    navigateTo(location.pathname + location.search, false);
  });

  // Stamp initial history entry so popstate works on first back
  history.replaceState({ url: location.pathname }, '', location.pathname);

  // Apply active nav on initial load (replaces the removed inline script)
  document.addEventListener('DOMContentLoaded', () => {
    const activeNav = document.getElementById('page-content')?.dataset.activeNav;
    updateActiveNav(activeNav);
  });
}());