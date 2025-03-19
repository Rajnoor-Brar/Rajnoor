
document.addEventListener("DOMContentLoaded", function () {

    if (localStorage.getItem("theme") === "dark") {    
        document.querySelectorAll(".signatures").forEach(el => {
            el.classList.add("invert");
        });
    }

    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function() {
            this.blur(); // Removes focus after click
        });
    });
    
    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
  
    themeToggleBtn.addEventListener("click", function () {

        themeIcon.classList.add("rotate");
        setTimeout(() => {
            let currentTheme = document.documentElement.getAttribute("data-bs-theme");
            let metaThemeColor = document.querySelector("meta[name=theme-color]");
            let black = getComputedStyle(document.documentElement).getPropertyValue('--my-black').trim();

            if (currentTheme === "dark") {
                document.documentElement.setAttribute("data-bs-theme", "light");
                localStorage.setItem("theme", "light");
            
                // Animate out
                themeIcon.style.opacity = "0";
                themeIcon.style.transform = "rotate(180deg) scale(0.8)";
            
                setTimeout(() => {
                    themeIcon.innerText = "light_mode";
                    themeIcon.style.opacity = "1";
                    themeIcon.style.transform = "rotate(0) scale(1)";
                }, 200);
            
                themeToggleBtn.classList.remove("btn-outline-light");
                themeToggleBtn.classList.add("btn-outline-dark");
                metaThemeColor.setAttribute("content", black);
            
                document.querySelectorAll(".signatures").forEach(el => {
                    el.classList.remove("invert");
                });
            } else {
                document.documentElement.setAttribute("data-bs-theme", "dark");
                localStorage.setItem("theme", "dark");
            
                // Animate out
                themeIcon.style.opacity = "0";
                themeIcon.style.transform = "rotate(180deg) scale(0.8)";
            
                setTimeout(() => {
                    themeIcon.innerText = "dark_mode";
                    themeIcon.style.opacity = "1";
                    themeIcon.style.transform = "rotate(0) scale(1)";
                }, 200);
            
                themeToggleBtn.classList.remove("btn-outline-dark");
                themeToggleBtn.classList.add("btn-outline-light");
                metaThemeColor.setAttribute("content", black);         

                document.querySelectorAll(".signatures").forEach(el => {
                    el.classList.add("invert");
                });
            }
            setTimeout(() => themeIcon.classList.remove("rotate"), 700);
            
        }, 300);
    });
});
  