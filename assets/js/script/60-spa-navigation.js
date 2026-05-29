// ─── SPA Navigation ──────────────────────────────────────────────────────────
(function () {
  let abortController = null;

  function updateActiveNav(activeNavKey) {
    document.querySelectorAll('.nav-link.active').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('nav-panel');
    if (activeNavKey) {
      const el = [...document.querySelectorAll('[data-nav-key]')]
        .find(nav => nav.dataset.navKey === activeNavKey);
      if (el) el.classList.add('active');
      // refreshActiveRail reads .nav-link.active + applies --y-offset
      if (typeof refreshActiveRail === 'function') refreshActiveRail();
    } else if (panel) {
      panel.style.setProperty('--active-shown', '0');
    }
  }

  // Hover rail: glides to whichever nav-item the pointer is over
  document.addEventListener('mouseover', (e) => {
    const item = e.target.closest('#nav-panel .nav-item');
    const panel = document.getElementById('nav-panel');
    if (!item || !panel) return;
    panel.style.setProperty('--hover-y', item.offsetTop + 'px');
    panel.style.setProperty('--hover-shown', '1');
  });
  document.addEventListener('mouseout', (e) => {
    const panel = document.getElementById('nav-panel');
    if (!panel) return;
    // Hide when leaving panel entirely
    if (e.target.closest('#nav-panel') && !e.relatedTarget?.closest('#nav-panel')) {
      panel.style.setProperty('--hover-shown', '0');
    }
  });

  function showNavLoader() {
    let loader = document.getElementById('rj-page-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'rj-page-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<div class="rj-spinner"></div>';
      document.body.appendChild(loader);
    } else {
      // Re-activate if it was dismissed by the initial-load sequence
      loader.classList.remove('dismissed');
    }
  }

  function hideNavLoader() {
    const loader = document.getElementById('rj-page-loader');
    if (!loader) return;
    loader.classList.add('dismissed');
    setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
  }

  async function navigateTo(url, pushState, restoreScrollY) {
    // Cancel any in-flight fetch
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const content = document.getElementById('page-content');

    // Run page-specific cleanup (e.g. clear homeScript timers)
    if (typeof window.__pageCleanup === 'function') {
      try { window.__pageCleanup(); } catch (e) { console.error('pageCleanup error:', e); }
      window.__pageCleanup = null;
    }

    // Fade out current content immediately.
    // Delay the full-screen loader so it only appears on slow fetches (>150ms).
    // Fast same-origin navigations complete before the timer fires — no flash.
    content.classList.add('page-leaving');
    const loaderTimer = setTimeout(showNavLoader, 150);

    // Separate path+search from hash fragment
    let urlHash = '';
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) { urlHash = url.slice(hashIdx); url = url.slice(0, hashIdx); }

    let html, finalUrl;
    try {
      const res = await fetch(url, { signal: abortController.signal });
      if (!res.ok) throw new Error(res.status);
      // Use the post-redirect URL (e.g. /credentials → /credentials/)
      finalUrl = new URL(res.url).pathname;
      html = await res.text();
    } catch (err) {
      clearTimeout(loaderTimer);
      if (err.name === 'AbortError') { hideNavLoader(); return; }
      // Fallback: hard navigate (loader stays — the browser will unload the page)
      location.href = url;
      return;
    }

    // Fetch done — cancel loader if it hasn't appeared yet
    clearTimeout(loaderTimer);

    // Wait for CSS fade-out to finish
    await new Promise(r => setTimeout(r, 160));

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newContent = doc.getElementById('page-content');
    if (!newContent) { location.href = url; return; }

    // Sync Google Fonts links — the new page may need fonts not loaded on the
    // starting page (conditional per active_nav in baseof.html).
    // Inject any missing <link> before the content swap so the browser can
    // start fetching while we finish the transition.
    doc.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach(function (newLink) {
      var href = newLink.getAttribute('href');
      if (!document.querySelector('link[href="' + href + '"]')) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Swap page-specific CSS
    const pageStyleEl = document.getElementById('page-style');
    const newStyleHref = doc.getElementById('page-style')?.getAttribute('href') || '';
    if (pageStyleEl) pageStyleEl.setAttribute('href', newStyleHref);

    // Swap content
    content.innerHTML = newContent.innerHTML;
    content.dataset.activeNav = newContent.dataset.activeNav || '';

    // Update title + active nav
    document.title = doc.title;
    updateActiveNav(newContent.dataset.activeNav);

    // Scroll: restore saved position (back/forward), jump to hash anchor, or top
    if (restoreScrollY != null) {
      window.scrollTo(0, restoreScrollY);
    } else if (urlHash) {
      const target = document.getElementById(urlHash.slice(1));
      if (target) target.scrollIntoView({ behavior: 'instant' });
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    // Fade in — do this before script loading so content is never blocked
    content.classList.remove('page-leaving');
    hideNavLoader();

    // Position #page-console (if present in new content) to mirror command-console corner
    syncPageConsoleCorner();
    if (typeof window.__initScrollArc === 'function') window.__initScrollArc();
    // Mark already-cached images as loaded; start shimmer on new in-flight ones
    if (typeof window.__initImages === 'function') window.__initImages(content);

    if (pushState) {
      // Save current scroll before stamping new entry
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      history.pushState({ url: finalUrl + urlHash }, '', finalUrl + urlHash);
    }

    // Re-render math (KaTeX) if loaded
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(content, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '\\[', right: '\\]', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
        ]
      });
    }

    // Re-highlight code blocks (Prism) if loaded
    if (typeof Prism !== 'undefined' && typeof Prism.highlightElement === 'function') {
      content.querySelectorAll('code[class*="language-"]').forEach(el => Prism.highlightElement(el));
    }

    // Swap page-specific script (fire-and-forget — never block the fade-in)
    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();
    const newScriptSrc = doc.getElementById('page-script')?.getAttribute('src') || '';
    if (newScriptSrc) {
      const script = document.createElement('script');
      script.id = 'page-script';
      script.src = newScriptSrc;
      document.body.appendChild(script);
    }

    // On touch-primary devices there is no hover-away to close the pill.
    // Auto-collapse 1 s after navigation unless the user touches the console.
    if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
      const collapseTimer = setTimeout(() => {
        pinnedOpen = false;
        commandConsoleEl.blur();
      }, 1000);
      commandConsoleEl.addEventListener('pointerdown', () => clearTimeout(collapseTimer), { once: true });
    }
  }

  // Intercept same-origin link clicks
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    let url;
    try { url = new URL(link.href, location.href); } catch { return; }
    if (url.origin !== location.origin) return;
    if (link.target === '_blank') return;
    if (link.hasAttribute('download')) return;
    if (link.getAttribute('href')?.startsWith('mailto:')) return;
    if (link.getAttribute('href')?.startsWith('javascript:')) return;
    // Same page: hash-only change (or no change at all) — let browser handle
    if (url.pathname === location.pathname) return;
    e.preventDefault();
    navigateTo(url.pathname + url.search + url.hash, true);
  });

  // Handle back / forward — restore saved scroll position if available
  window.addEventListener('popstate', (e) => {
    const savedY = e.state?.scrollY ?? null;
    navigateTo(location.pathname + location.search + location.hash, false, savedY);
  });

  // Stamp initial history entry so popstate works on first back
  history.replaceState({ url: location.pathname, scrollY: 0 }, '', location.pathname);

  // Apply active nav on initial load (replaces the removed inline script)
  document.addEventListener('DOMContentLoaded', () => {
    const activeNav = document.getElementById('page-content')?.dataset.activeNav;
    updateActiveNav(activeNav);
  });
}());
