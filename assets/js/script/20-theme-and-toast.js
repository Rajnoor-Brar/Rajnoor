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

            let nextThemeLabel;
            let toastTheme;
            if (currentTheme === "light") {
                themeIcon.innerText = "dark_mode";
                localStorage.setItem("theme", "dark");
                setTheme("dark");
                nextThemeLabel = "Dark";
                toastTheme = 'theme-night';
            }
            else if (currentTheme === "dark") {
                localStorage.setItem("theme", "auto");
                setAutoTheme();
                nextThemeLabel = "Auto";
                toastTheme = 'neutral';
            }
            else {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                mediaQuery.removeEventListener('change', updateAutoTheme);
                themeIcon.innerText = "light_mode";
                localStorage.setItem("theme", "light");
                setTheme("light");
                nextThemeLabel = "Light";
                toastTheme = 'theme-day';
            }

            showToast("Theme: " + nextThemeLabel, { duration: 'short', variant: toastTheme });

            setTimeout(() => {
                themeIcon.classList.remove("rotate");
            }, 500);

        }, 500);
    });
}


// ── Haptic helper — 10ms pulse on touch devices; no-op on desktop ────────────
function tapHaptic() {
  if (navigator.vibrate) navigator.vibrate(30);
}

// ── Notification toast pill ───────────────────────────────────────────────────
// showToast(message)                      — normal stay time
// showToast(message, 'short'|'normal'|'long')
// showToast(message, { duration, variant }) — duration name/ms + data/toast.yaml variant
// Safe to call repeatedly: cancels any in-flight dismiss and restarts.
{{- $toastVariants := slice -}}
{{- range site.Data.toast.variants -}}
  {{- $toastVariants = $toastVariants | append .name -}}
{{- end }}
const TOAST_DURATIONS = {{ site.Data.toast.durations | jsonify }};
const TOAST_VARIANTS = {{ $toastVariants | jsonify }};
const TOAST_DEFAULT_DURATION = {{ site.Data.toast.defaultDuration | jsonify }};
const TOAST_DEFAULT_VARIANT = {{ site.Data.toast.defaultVariant | jsonify }};

function showToast(message, options) {
  var settings = {};
  if (typeof options === 'number' || typeof options === 'string') {
    settings.duration = options;
  } else if (options && typeof options === 'object') {
    settings = options;
  }

  var requestedDuration = settings.duration || settings.stay || TOAST_DEFAULT_DURATION;
  var ms = (typeof requestedDuration === 'number')
    ? requestedDuration
    : (TOAST_DURATIONS[requestedDuration] || TOAST_DURATIONS[TOAST_DEFAULT_DURATION] || 1800);
  var variant = settings.variant || settings.tone || TOAST_DEFAULT_VARIANT;
  if (!TOAST_VARIANTS.includes(variant)) variant = TOAST_DEFAULT_VARIANT;

  var pill = document.getElementById('toast');
  if (!pill) return;

  pill.textContent = message;
  pill.classList.remove.apply(
    pill.classList,
    TOAST_VARIANTS.map(function (name) { return 'toast--' + name; })
  );
  pill.classList.add('toast--' + variant);

  // Cancel any pending auto-dismiss
  clearTimeout(pill._toastTimer);

  // Reset to base state, force reflow so the transition fires cleanly
  pill.classList.remove('toast--visible', 'toast--hiding');
  void pill.offsetWidth;

  pill.classList.add('toast--visible');

  pill._toastTimer = setTimeout(function () {
    pill.classList.remove('toast--visible');
    pill.classList.add('toast--hiding');
  }, ms);
}

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise(function (resolve, reject) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      if (document.execCommand('copy')) resolve();
      else reject(new Error('copy failed'));
    } catch (err) {
      reject(err);
    } finally {
      textarea.remove();
    }
  });
}

document.addEventListener('click', function (e) {
  var copyControl = e.target.closest('[data-rj-copy]');
  if (!copyControl) return;
  e.preventDefault();
  var value = copyControl.getAttribute('data-rj-copy');
  if (!value) return;

  copyTextToClipboard(value).then(function () {
    showToast('Copied ID', { duration: 'short', variant: 'success' });
  }).catch(function () {
    showToast('Could not copy ID', { duration: 'long', variant: 'error' });
  });
});

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
