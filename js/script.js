document.addEventListener("DOMContentLoaded", function () {
    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
  
    themeToggleBtn.addEventListener("click", function () {
      // Add the rotate class for animation
      themeIcon.classList.add("rotate");
  
      // After the animation duration (0.3s), toggle the theme and update the icon
      setTimeout(() => {
        let currentTheme = document.documentElement.getAttribute("data-bs-theme");
  
        if (currentTheme === "dark") {
            document.documentElement.setAttribute("data-bs-theme", "light");
            themeIcon.classList.remove("bi-moon-fill");
            themeIcon.classList.add("bi-sun-fill");
            themeToggleBtn.classList.remove("btn-outline-light");
            themeToggleBtn.classList.add("btn-outline-dark");
        } 
        else {
            document.documentElement.setAttribute("data-bs-theme", "dark");
            themeIcon.classList.remove("bi-sun-fill");
            themeIcon.classList.add("bi-moon-fill");
            themeToggleBtn.classList.remove("btn-outline-dark");
            themeToggleBtn.classList.add("btn-outline-light");
        }
        // Remove the rotation class so it can animate again next time
        themeIcon.classList.remove("rotate");
      }, 300);
    });
  });
  