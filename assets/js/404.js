document.addEventListener('DOMContentLoaded', function() {
    const navigationPanel = document.getElementById('navigation-panel');
    if (navigationPanel) navigationPanel.style.display = 'none';

    // Bypass SPA navigation for the home link — arriving at / via SPA from
    // a 404 page skips the DOMContentLoaded init that shows the nav panel.
    // stopPropagation() prevents the click from reaching the document-level
    // SPA interceptor in script.js, so the browser does a full page load.
    const homeLink = document.querySelector('.err-sub a[href="/"]');
    if (homeLink) {
        homeLink.addEventListener('click', e => { e.stopPropagation(); });
    }
});
