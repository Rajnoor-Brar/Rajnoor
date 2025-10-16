
const themeToggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

document.addEventListener("DOMContentLoaded", function () {
    
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
        localStorage.setItem("theme", "auto");
        savedTheme = "auto";
    }

    if (savedTheme === "dark") setDarkTheme();
    else if (savedTheme === "light") setLightTheme();
    else setAutoTheme();

    document.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", function() { this.blur(); });
    });

    themeToggleBtn.addEventListener("click", function () {
        themeIcon.classList.add("rotate");
        setTimeout(() => {
            let currentTheme = localStorage.getItem("theme") || "auto";

            if (currentTheme === "light") {
                themeIcon.innerText = "dark_mode";
                localStorage.setItem("theme", "dark"); 
                setDarkTheme();
            }
            else if (currentTheme === "dark") {
                localStorage.setItem("theme", "auto");
                setAutoTheme(); }
            else {
                themeIcon.innerText = "light_mode";
                localStorage.setItem("theme", "light");
                setLightTheme(); 
            }

            setTimeout(() => {
                themeIcon.classList.remove("rotate");
            }, 700);

        }, 300);
    });
});


function setLightTheme(){
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-black').trim();

    document.documentElement.setAttribute("data-bs-theme", "light");

    // Animate out
    themeIcon.style.opacity = "0";
    themeIcon.style.transform = "rotate(180deg) scale(0.8)";

    setTimeout(() => {
        themeIcon.style.opacity = "1";
        themeIcon.style.transform = "rotate(0) scale(1)";
    }, 200);

    themeToggleBtn.classList.remove("btn-outline-light");
    themeToggleBtn.classList.add("btn-outline-dark");
    metaThemeColor.setAttribute("content", black);

    document.querySelectorAll(".signatures").forEach(el => {
        el.classList.remove("invert");
    });
}

function setDarkTheme(){
    let metaThemeColor = document.querySelector("meta[name=theme-color]");
    let black = getComputedStyle(document.documentElement).getPropertyValue('--my-black').trim();

    document.documentElement.setAttribute("data-bs-theme", "dark");

    // Animate out
    themeIcon.style.opacity = "0";
    themeIcon.style.transform = "rotate(180deg) scale(0.8)";

    setTimeout(() => {
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

function setAutoTheme() {
    updateAutoTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateAutoTheme);

    themeToggleBtn.classList.remove("btn-outline-light", "btn-outline-dark");
    themeToggleBtn.classList.add("btn-outline-secondary");
}

function updateAutoTheme() {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(systemDark ? "dark" : "light");
}

function applyTheme(theme) {
    if (theme === "dark") setDarkTheme();
    else setLightTheme();

    console.log("Applied theme:", theme);
    let currentTheme = localStorage.getItem("theme") || "auto";

    if (currentTheme == "auto") {
        if (theme=="light") {themeIcon.innerText = "brightness_5"; console.log("Set icon to brightness_5");}
        else {themeIcon.innerText = "brightness_4"; console.log("Set icon to brightness_4");}
    }
    else {if (currentTheme == "light") themeIcon.innerText = "light_mode"; 
        else  themeIcon.innerText = "dark_mode"; }
}