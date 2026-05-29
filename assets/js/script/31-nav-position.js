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
document.addEventListener('rj:signature-moved', (e) => syncPageConsoleCorner(e.detail));

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
  const btn = document.getElementById('page-console-toggle');
  if (shouldContract) {
    pc.classList.add('contracted');
  } else {
    pc.classList.remove('contracted');
  }
  setPageConsoleToggleState(btn, pc.classList.contains('contracted'));

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
