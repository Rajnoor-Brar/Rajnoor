// ─── Page loader ─────────────────────────────────────────────────────────────
// The loader div lives in baseof.html (covers content from first paint).
// JS only handles the dismissal once DOM + fonts are ready.
(function () {
  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    var el = document.getElementById('page-loader');
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
