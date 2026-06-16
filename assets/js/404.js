document.addEventListener('DOMContentLoaded', function() {
    const navigationPanel = document.getElementById('navigation-panel');
    if (navigationPanel) navigationPanel.style.display = 'none';

    // "Try knocking another door." — the door knocks back: when spotlight is
    // available the link opens the site search instead of navigating home.
    // Without JS (or with the feature off) the href="/" fallback still works.
    const homeLink = document.querySelector('.err-sub a[href="/"]');
    if (homeLink) {
        homeLink.addEventListener('click', e => {
            if (typeof window.__openSpotlight === 'function') {
                e.preventDefault();
                e.stopPropagation();
                // Un-hide the nav panel first: a spotlight pick navigates via
                // SPA, which would otherwise carry the hidden panel along.
                if (navigationPanel) navigationPanel.style.display = '';
                window.__openSpotlight();
            } else {
                // Bypass SPA navigation for the home link — arriving at / via
                // SPA from a 404 page skips the DOMContentLoaded init that
                // shows the nav panel. stopPropagation() keeps the click from
                // the document-level SPA interceptor, forcing a full load.
                e.stopPropagation();
            }
        });
    }
});
