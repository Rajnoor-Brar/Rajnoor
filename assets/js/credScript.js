// ── Credentials: skill-meter proficiency pill ───────────────────────────────
// Replaces the meter's native tooltip with the site notification pill.
//  • fine pointer (desktop): hover shows the pill, holds while hovering,
//    dismisses on mouseleave/blur.
//  • coarse pointer (touch): tap shows the pill with a normal auto-dismiss.
// Level→word mapping comes from data/labels.yaml › skill_levels.
(function () {
  const LABELS = {{ site.Data.labels.skill_levels | jsonify }};
  const meters = document.querySelectorAll('.skill-badge__meter[data-level]');
  if (!meters.length) return;

  const labelFor = (meter) => {
    const n = parseInt(meter.dataset.level, 10);
    if (!Number.isFinite(n) || n < 1 || !LABELS.length) return null;
    return LABELS[Math.min(n, LABELS.length) - 1];
  };

  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const show = (word) => { if (typeof showToast === 'function') showToast(word, { duration: 'hold', variant: 'info' }); };
  const showTimed = (word) => { if (typeof showToast === 'function') showToast(word, { duration: 'normal', variant: 'info' }); };
  const hide = () => { if (typeof hideToast === 'function') hideToast(); };

  const cleanups = [];
  meters.forEach((meter) => {
    const word = labelFor(meter);
    if (!word) return;

    if (coarse) {
      // Tap → timed pill. Inside a link badge, let the link win (don't intercept).
      if (meter.closest('a')) return;
      const onTap = (e) => {
        e.stopPropagation();
        if (typeof tapHaptic === 'function') tapHaptic();
        showTimed(word);
      };
      meter.addEventListener('click', onTap);
      cleanups.push(() => meter.removeEventListener('click', onTap));
    } else {
      const onEnter = () => show(word);
      const onLeave = () => hide();
      meter.addEventListener('mouseenter', onEnter);
      meter.addEventListener('mouseleave', onLeave);
      // Keyboard focus reaches the meter only if focusable; harmless otherwise.
      meter.addEventListener('focus', onEnter);
      meter.addEventListener('blur', onLeave);
      cleanups.push(() => {
        meter.removeEventListener('mouseenter', onEnter);
        meter.removeEventListener('mouseleave', onLeave);
        meter.removeEventListener('focus', onEnter);
        meter.removeEventListener('blur', onLeave);
      });
    }
  });

  // SPA cleanup: drop listeners and dismiss any held pill before leaving.
  window.__registerCleanup(function () {
    cleanups.forEach((fn) => fn());
    hide();
  });
})();
