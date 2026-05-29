function initHomePage() {
  const timers = [];
  const intervals = [];

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

  // Animation re-shows after a 12-hour TTL. Stored as Date.now() in localStorage.
  const ANIM_TTL_MS = 12 * 60 * 60 * 1000;
  const isFresh = (key) => {
    const t = parseInt(localStorage.getItem(key), 10);
    return Number.isFinite(t) && (Date.now() - t) < ANIM_TTL_MS;
  };
  const stampFresh = (key) => {
    try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* quota/disabled — non-fatal */ }
  };
  const heroFresh = isFresh("rj_hero_seen_at");
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroFresh || reduceMotion) {
    const gtdContainer = document.getElementById("gtd-container");
    if (gtdContainer) gtdContainer.classList.add("d-none");
    if (about) {
      about.classList.remove("d-none");
      about.classList.add("visible");
    }
    if (header) header.textContent = "I am Rajnoor";
    const finalTexts = [
      "Mastering Physics at IIT Mandi",
      "while also exploring the depths of Mathematics and Computation as a personal venture",
      "I am a dedicated learner driven by a relentless pursuit of knowledge and a commitment to innovative thinking and scientific rigour."
    ];
    lines.forEach((line, i) => {
      line.classList.add("typed");
      line.textContent = finalTexts[i] || "";
    });
    if (nowBlock) nowBlock.classList.add("typed");
    return;
  }

  const unwriteDelay = 3800;
  const unwriteInterval = 600;

  const unwriteGTD = () => {
    gtdPaths.forEach((path) => {
      const t = setTimeout(() => {
        path.classList.remove("draw");
        path.classList.add("undraw");
      }, unwriteInterval);
      timers.push(t);
    });

    const t2 = setTimeout(() => {
      const gtdContainer = document.getElementById("gtd-container");
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
    typeText(header, "I am Rajnoor", 100, typeLinesSequentially);
  };

  const typeLinesSequentially = () => {
    const texts = [
      "Mastering Physics at IIT Mandi",
      "while also exploring the depths of Mathematics and Computation as a personal venture",
      "I am a dedicated learner driven by a relentless pursuit of knowledge and a commitment to innovative thinking and scientific rigour."
    ];
    lines.forEach(line => line.textContent = "");

    const typeNext = (i) => {
      if (i >= lines.length) {
        // Pause, then fade in the "now" snippet — a deliberate "by the way…"
        const tNow = setTimeout(() => {
          if (nowBlock) nowBlock.classList.add("typed");
          stampFresh("rj_hero_seen_at");

          // Discover-pulse on the signature pill. Also gated by a 12h TTL so it
          // can fire again after the user's been away. Skipped under reduced motion.
          const signatureFresh = isFresh("rj_signature_seen_at");
          const pill = document.getElementById("signature-panel");
          if (!signatureFresh && pill && !reduceMotion) {
            const tPulse = setTimeout(() => {
              pill.classList.add("discover-pulse");
              // Remove after the animation completes
              const tClear = setTimeout(() => pill.classList.remove("discover-pulse"), 2600);
              timers.push(tClear);
              stampFresh("rj_signature_seen_at");
            }, 600);
            timers.push(tPulse);
          }
        }, 900);
        timers.push(tNow);
        return;
      }
      lines[i].classList.add("typed");
      typeText(lines[i], texts[i], 40, () => typeNext(i + 1));
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
