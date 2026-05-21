function initHomePage() {
  const timers = [];
  const intervals = [];

  // Register cleanup so SPA nav can cancel before leaving
  window.__pageCleanup = function () {
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    timers.length = 0;
    intervals.length = 0;
  };

  const gtdPaths = document.querySelectorAll(".gtd-path");
  const about = document.getElementById("about");
  const header = document.getElementById("about-header");
  const lines = document.querySelectorAll(".about-line");

  const nowHorz = localStorage.getItem("navHorz");
  document.querySelectorAll(".about").forEach((item) => {
    item.classList.add((nowHorz === "left") ? "right" : "left");
  });

  const heroSeen = sessionStorage.getItem("rj_hero_seen") === "1";
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (heroSeen || reduceMotion) {
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
    return;
  }

  const unwriteDelay = 3800;
  const unwriteInterval = 600;

  const unwriteGTD = () => {
    gtdPaths.forEach(() => {
      timers.push(setTimeout(() => {}, unwriteInterval)); // placeholder; paths use class
    });
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
        sessionStorage.setItem("rj_hero_seen", "1");
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
