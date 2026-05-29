// ─── Image placeholder & graceful load ───────────────────────────────────────
// • Shimmer background (CSS) pulses while images are downloading
// • .img-loaded triggers @starting-style fade-in when the image arrives
// • Broken images fall back to /resources/img_placeholder.svg
(function () {
  var PLACEHOLDER = '/resources/img_placeholder.svg';
  var errorCount = 0;
  var errorTimer = null;

  function queueImageErrorToast() {
    errorCount += 1;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(function () {
      showToast(
        errorCount === 1 ? 'An image could not load' : 'Some images could not load',
        { duration: 'long', variant: 'warning' }
      );
      errorCount = 0;
    }, 900);
  }

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
    queueImageErrorToast();
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
