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
  document.querySelectorAll('.corner-picker__dot').forEach(dot => {
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
    if (e.target.closest('#command-console-tray')) return;
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
      const panelIsOpen = !consoleTray.classList.contains('hide');
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
