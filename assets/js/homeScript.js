function initHomePage() {
  const timers = [];
  const intervals = [];

  const HERO = {{ site.Data.heroPhrases.typography | jsonify }};
  const T = {{ site.Data.script.home.timing | jsonify }};

  // Register cleanup so SPA nav can cancel before leaving
  window.__registerCleanup(function () {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timers.length = 0;
    intervals.length = 0;
  });

  const gtdPaths = document.querySelectorAll(".gtd-path");
  const about = document.getElementById("about");
  const header = document.getElementById("about-header");
  const lines = document.querySelectorAll(".about-line");
  const nowBlock = document.getElementById("now");

  // Bio header/lines flip edge with the signature corner; the now-block is
  // centered as a hero footer and stays put regardless of corner.
  const nowHorz = localStorage.getItem("navHorz");
  if (header) header.classList.add((nowHorz === "left") ? "right" : "left");

  // Animation re-shows after a TTL (T.anim_ttl_ms). Stored as Date.now() in localStorage.
  const isFresh = (key) => {
    const t = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(t) && (Date.now() - t) < T.anim_ttl_ms;
  };
  const stampFresh = (key) => {
    try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* quota/disabled — non-fatal */ }
  };
  const heroFresh = isFresh("rj_hero_seen_at");
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroFresh || reduceMotion) {
    const gtdContainer = document.getElementById("gtd-stage");
    if (gtdContainer) gtdContainer.classList.add("d-none");
    if (about) {
      about.classList.remove("d-none");
      about.classList.add("visible");
    }
    if (header) header.textContent = HERO.header;
    lines.forEach((line, i) => {
      line.classList.add("typed");
      line.textContent = HERO.lines[i] || "";
    });
    if (nowBlock) nowBlock.classList.add("typed");
    return;
  }

  const unwriteDelay = T.unwrite_delay;
  const unwriteInterval = T.unwrite_interval;

  const unwriteGTD = () => {
    gtdPaths.forEach((path) => {
      const t = setTimeout(() => {
        path.classList.remove("draw");
        path.classList.add("undraw");
      }, unwriteInterval);
      timers.push(t);
    });

    const t2 = setTimeout(() => {
      const gtdContainer = document.getElementById("gtd-stage");
      if (gtdContainer) gtdContainer.classList.add("d-none");
      startAboutTyping();
    }, 3 * gtdPaths.length * unwriteInterval);
    timers.push(t2);
  };

  const typeText = (element, text, speed, callback) => {
    element.textContent = "";
    let i = 0;
    const iv = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i === text.length) {
        clearInterval(iv);
        intervals.splice(intervals.indexOf(iv), 1);
        if (callback) callback();
      }
    }, speed || 80);
    intervals.push(iv);
  };

  const startAboutTyping = () => {
    if (!about) return;
    about.classList.remove("d-none");
    about.classList.add("visible");
    typeText(header, HERO.header, T.header_type_speed, typeLinesSequentially);
  };

  const typeLinesSequentially = () => {
    const texts = HERO.lines;
    lines.forEach(line => line.textContent = "");

    const typeNext = (i) => {
      if (i >= lines.length) {
        // Pause, then fade in the "now" snippet — a deliberate "by the way…"
        const tNow = setTimeout(() => {
          if (nowBlock) nowBlock.classList.add("typed");
          stampFresh("rj_hero_seen_at");


          // Discover-pulse on the signature pill only once per browser profile.
          // Unlike the hero's timestamp, this marker deliberately never expires.
          const signatureShown = localStorage.getItem("rj_signature_pulse_seen") !== null;
          const pill = document.getElementById("signature-panel");
          if (!signatureShown && pill && !reduceMotion) {
            const tPulse = setTimeout(() => {
              pill.classList.add("discover-pulse");
              // Remove after the animation completes
              const tClear = setTimeout(() => pill.classList.remove("discover-pulse"), T.pulse_clear);
              timers.push(tClear);
              stampFresh("rj_signature_pulse_seen");
            }, T.pulse_delay);
            timers.push(tPulse);
          }
        }, T.now_reveal_delay);
        timers.push(tNow);
        return;
      }
      lines[i].classList.add("typed");
      typeText(lines[i], texts[i], T.line_type_speed, () => typeNext(i + 1));
    };
    typeNext(0);
  };

  timers.push(setTimeout(unwriteGTD, unwriteDelay));
}

// Run immediately on SPA re-entry; wait for DOM on first hard load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHomePage);
} else {
  initHomePage();
}
