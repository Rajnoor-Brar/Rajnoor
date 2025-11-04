

document.addEventListener("DOMContentLoaded", () => {
  const gtdPaths = document.querySelectorAll(".gtd-path");
  const about = document.getElementById("about");
  const header = document.getElementById("about-header");
  const lines = document.querySelectorAll(".about-line");

  const nowHorz = localStorage.getItem("navHorz");

  document.querySelectorAll(".about").forEach((item) => {
    item.classList.add((nowHorz == "left") ? "right" : "left");
  });

  const unwriteDelay = 3800; // after write completes
  const unwriteInterval = 600; // gap between unwriting each word

  const unwriteGTD = () => {
    gtdPaths.forEach((path, index) => {
      setTimeout(() => {
        path.classList.remove("draw");
        path.classList.add("undraw");
      }, unwriteInterval);
    });

    // After all unwrites done, start about typing
    setTimeout(() =>{
      document.getElementById("gtd-container").classList.add("d-none");
      startAboutTyping();
    }, 3 * gtdPaths.length * unwriteInterval);
  };

  // Step 3: About Section Typing Sequence
  const typeText = (element, text, speed = 80, callback) => {
    element.textContent = "";
    let i = 0;
    const typeInterval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i === text.length) {
        clearInterval(typeInterval);
        if (callback) callback();
      }
    }, speed);
  };

  const startAboutTyping = () => {
    about.classList.remove("d-none");
    about.classList.add("visible");

    const headerText = "I am Rajnoor";
    typeText(header, headerText, 100, () => {
      typeLinesSequentially();
    });
  };

  const typeLinesSequentially = () => {
    const texts = [
      "Mastering Physics at IIT Mandi",
      "while also exploring the depths of Mathematics and Computation as a personal venture",
      "I am a dedicated learner driven by a relentless pursuit of knowledge and a commitment to innovative thinking and scientific rigour."
    ];

    lines.forEach(line => line.textContent = "");

    const typeNext = (i) => {
      if (i >= lines.length) return;
      lines[i].classList.add("typed");
      typeText(lines[i], texts[i], 40, () => typeNext(i + 1));
    };

    typeNext(0);
  };

  // Run the unwrite after delay
  setTimeout(unwriteGTD, unwriteDelay);
});