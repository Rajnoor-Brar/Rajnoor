document.addEventListener("DOMContentLoaded", function () {
    
    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function() {
            this.blur(); // Removes focus after click
        });
    });
    
    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
  
    themeToggleBtn.addEventListener("click", function () {
      // Add the rotate class for animation
      themeIcon.classList.add("rotate");
  
      // After the animation duration (0.3s), toggle the theme and update the icon
      setTimeout(() => {
        let currentTheme = document.documentElement.getAttribute("data-bs-theme");
        let metaThemeColor = document.querySelector("meta[name=theme-color]");
        let black = getComputedStyle(document.documentElement).getPropertyValue('--my-black').trim();

        if (currentTheme === "dark") {
            document.documentElement.setAttribute("data-bs-theme", "light");
            themeIcon.classList.remove("bi-moon-fill");
            themeIcon.classList.add("bi-sun-fill");
            themeToggleBtn.classList.remove("btn-outline-light");
            themeToggleBtn.classList.add("btn-outline-dark");
            metaThemeColor.setAttribute("content", black);

            document.querySelectorAll(".signatures").forEach(el => {
                el.classList.remove("invert");
            });
        } 
        else {
            document.documentElement.setAttribute("data-bs-theme", "dark");
            themeIcon.classList.remove("bi-sun-fill");
            themeIcon.classList.add("bi-moon-fill");
            themeToggleBtn.classList.remove("btn-outline-dark");
            themeToggleBtn.classList.add("btn-outline-light");
            metaThemeColor.setAttribute("content", black);

            document.querySelectorAll(".signatures").forEach(el => {
                el.classList.add("invert");
            });
        }
        // Remove the rotation class so it can animate again next time
        themeIcon.classList.remove("rotate");
      }, 300);
    });
  });
  