document.addEventListener("DOMContentLoaded", function () {
    // Load the nav panel
    fetch("resources/nav-panel.html")
        .then(response => response.text())
        .then(html => {
            document.body.insertAdjacentHTML("afterbegin", html);
            setActiveNav();
        })
        .catch(error => console.error("Error loading navigation panel:", error));

    // Function to set the active class
    function setActiveNav() {
        const homeButton = document.querySelector("#home-button");
        if (homeButton) {
            homeButton.classList.add("active");
        }
    }
});
