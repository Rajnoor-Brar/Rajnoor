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
