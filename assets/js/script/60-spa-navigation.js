// ─── SPA Navigation ──────────────────────────────────────────────────────────
(function () {
  let abortController = null;
  // Monotonic history index — lets popstate tell back from forward.
  let navIdx = 0;
  // The path we're currently showing. Tracked explicitly because on popstate the
  // browser has already moved location.pathname to the destination before
  // navigateTo runs, so location can't tell us where we came *from*.
  let currentPath = location.pathname;

  // Nav-panel link order (home → projects → … ) drives the vertical slide
  // direction between top-level pages.
  function navOrder() {
    return [...document.querySelectorAll('#navigation-panel [data-nav-key]')]
      .map(el => el.dataset.navKey);
  }
  function seg(p) { return p.replace(/^\/+|\/+$/g, '').split('/'); }

  // Pick the view-transition mode for a navigation. Returns one of
  // up | down | left | right | fade — consumed by CSS via html[data-vt].
  // See assets/css/style/40-motion.css.
  function resolveMode(fromPath, toPath, fromNav, toNav, trigger, popDir) {
    const fromGallery = fromPath === '/projects/' || fromPath === '/projects';
    const toGallery   = toPath   === '/projects/' || toPath   === '/projects';
    const fromArt = seg(fromPath)[0] === 'projects' && seg(fromPath).length >= 2;
    const toArt   = seg(toPath)[0]   === 'projects' && seg(toPath).length   >= 2;

    // B — gallery is the left-most project on the horizontal rail: a clean
    // swipe, same as moving between articles.
    if (fromGallery && toArt) return 'left';
    if (toGallery && fromArt) return 'right';

    // C — article ↔ article: horizontal slide, direction from the trigger.
    if (fromArt && toArt) {
      const q = trigger && trigger.closest('.project-nav-quad__btn');
      if (q) return /--(?:outer|inner)-prev/.test(q.className) ? 'right' : 'left';
      const strip = trigger && trigger.closest('.pg-chapter-strip-list');
      if (strip) {
        const items = [...strip.querySelectorAll('.pg-chapter-strip__item')];
        const ai = items.findIndex(li => li.classList.contains('active'));
        const ci = items.findIndex(li => li.contains(trigger));
        return ci < ai ? 'right' : 'left';
      }
      if (popDir) return popDir === 'back' ? 'right' : 'left';
      return 'left';
    }

    // A — top-level pages: vertical slide by nav-panel order.
    const order = navOrder();
    const fi = order.indexOf(fromNav), ti = order.indexOf(toNav);
    if (fi >= 0 && ti >= 0 && fi !== ti) return ti > fi ? 'down' : 'up';

    return 'fade';
  }

  function updateActiveNav(activeNavKey) {
    document.querySelectorAll('.nav-link.active').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('navigation-panel');
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
    const item = e.target.closest('#navigation-panel .nav-item');
    const panel = document.getElementById('navigation-panel');
    if (!item || !panel) return;
    panel.style.setProperty('--hover-y', item.offsetTop + 'px');
    panel.style.setProperty('--hover-shown', '1');
  });
  document.addEventListener('mouseout', (e) => {
    const panel = document.getElementById('navigation-panel');
    if (!panel) return;
    // Hide when leaving panel entirely
    if (e.target.closest('#navigation-panel') && !e.relatedTarget?.closest('#navigation-panel')) {
      panel.style.setProperty('--hover-shown', '0');
    }
  });

  function showNavLoader() {
    let loader = document.getElementById('page-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'page-loader';
      loader.setAttribute('aria-hidden', 'true');
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
    } else {
      // Re-activate if it was dismissed by the initial-load sequence
      loader.classList.remove('dismissed');
    }
  }

  function hideNavLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    loader.classList.add('dismissed');
    setTimeout(() => { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
  }

  // KaTeX/Prism are page-gated in baseof.html (only article pages ship them).
  // When an SPA hop lands on a page that declares a data-lib asset this
  // document never loaded, copy it across. Resolves once injected scripts have
  // executed — async=false keeps order (auto-render after katex core, the
  // matlab component after prism core). The inline onload of the original
  // auto-render tag is deliberately not copied; navigateTo renders itself.
  function syncLibAssets(doc) {
    const pending = [];
    doc.querySelectorAll('[data-lib]').forEach(el => {
      const key = el.getAttribute('data-lib');
      if (document.querySelector('[data-lib="' + key + '"]')) return;
      let clone;
      if (el.tagName === 'LINK') {
        clone = document.createElement('link');
        clone.rel = 'stylesheet';
        clone.href = el.getAttribute('href');
      } else {
        clone = document.createElement('script');
        clone.src = el.getAttribute('src');
        clone.async = false;
        pending.push(new Promise(res => { clone.onload = res; clone.onerror = res; }));
      }
      clone.setAttribute('data-lib', key);
      ['integrity', 'crossorigin', 'referrerpolicy'].forEach(attr => {
        const v = el.getAttribute(attr);
        if (v !== null) clone.setAttribute(attr, v);
      });
      document.head.appendChild(clone);
    });
    return Promise.all(pending);
  }

  async function navigateTo(url, pushState, restoreScrollY, triggerEl = null, popDir = null) {
    // Cancel any in-flight fetch
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const content = document.getElementById('page-content');
    // Capture the starting context before anything is swapped. fromPath comes
    // from our own tracker (not location) so it's correct on popstate too.
    const fromPath = currentPath;
    const fromNav = content.dataset.activeNav;

    // Run page-specific cleanup (e.g. clear homeScript timers)
    if (typeof window.__pageCleanup === 'function') {
      try { window.__pageCleanup(); } catch (e) { console.error('pageCleanup error:', e); }
      window.__pageCleanup = null;
    }

    // Hard-clear command-console open/close timers on every navigation.
    // The __pageCleanup chain is consume-once (it nulls itself after running),
    // so a cleanup registered once at load is lost after the first nav — these
    // timers live in the global bundle and must be cleared unconditionally here.
    clearAllTimeouts(showTimeouts);
    clearAllTimeouts(hideTimeouts);

    // View Transitions (C1) drive the page crossfade when the browser supports
    // them and motion is allowed; otherwise fall back to the manual opacity
    // fade. Reduced-motion users always take the fallback, which the global
    // motion clamp renders instant.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const useVT = typeof document.startViewTransition === 'function' && !reduceMotion;

    // Fade out current content immediately (fallback path only).
    // Delay the full-screen loader so it only appears on slow fetches (>150ms).
    // Fast same-origin navigations complete before the timer fires — no flash.
    if (!useVT) content.classList.add('page-leaving');
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
    // fromPath is already captured; advance the tracker to the resolved page.
    currentPath = finalUrl;

    // Wait for CSS fade-out to finish (fallback path only)
    if (!useVT) await new Promise(r => setTimeout(r, 160));

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newContent = doc.getElementById('page-content');
    if (!newContent) { location.href = url; return; }
    const toNav = newContent.dataset.activeNav || '';

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

    // The DOM-mutating swap, factored out so a view transition can wrap it.
    const applyDom = function () {
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

      // Fade in (fallback path only — VT runs its own crossfade)
      if (!useVT) content.classList.remove('page-leaving');
    };

    if (useVT) {
      // Choose the transition shape from where we're navigating, expose it to
      // CSS via html[data-vt].
      document.documentElement.dataset.vt = resolveMode(fromPath, finalUrl, fromNav, toNav, triggerEl, popDir);

      // The console panels (view-transition-name: vt-signature etc.) are lifted into
      // snapshot during the transition, which fires a spurious blur/pointerleave on
      // it — collapsing the open nav panel mid-navigation. Hold the lock so the hover
      // logic ignores those, then reconcile against the real cursor once it settles.
      consoleNavLock = true;

      // Await only the DOM update, not the animation, so post-swap work (math,
      // highlight, lib load) proceeds while the transition plays out.
      let transition;
      try {
        transition = document.startViewTransition(applyDom);
        await transition.updateCallbackDone;
      } catch (e) { /* transition aborted — applyDom already ran in the callback */ }

      // Clear the mode + lock once the animation finishes, so the next nav starts
      // clean, then restore the console to whatever the cursor is actually doing.
      const cleanup = function () {
        delete document.documentElement.dataset.vt;
        consoleNavLock = false;
        reconcileConsoleHover();
      };
      if (transition && transition.finished) transition.finished.finally(cleanup);
      else cleanup();
    } else {
      applyDom();
    }

    hideNavLoader();

    // Position #page-console (if present in new content) to mirror command-console corner
    syncPageConsoleCorner();
    if (typeof window.__initScrollArc === 'function') window.__initScrollArc();
    // Mark already-cached images as loaded; start shimmer on new in-flight ones
    if (typeof window.__initImages === 'function') window.__initImages(content);

    if (pushState) {
      // Save current scroll before stamping new entry
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      history.pushState({ url: finalUrl + urlHash, idx: ++navIdx }, '', finalUrl + urlHash);
    }

    // Pull in any page-gated libs the destination declares, then re-render
    // math (KaTeX) and re-highlight code (Prism). Fire-and-forget so a slow
    // CDN never blocks the fade-in.
    syncLibAssets(doc).then(() => {
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
      if (typeof Prism !== 'undefined' && typeof Prism.highlightElement === 'function') {
        content.querySelectorAll('code[class*="language-"]').forEach(el => Prism.highlightElement(el));
      }
    });

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
    navigateTo(url.pathname + url.search + url.hash, true, null, link);
  });

  // Handle back / forward — restore saved scroll position if available.
  // Compare the target history index with ours to recover the direction.
  window.addEventListener('popstate', (e) => {
    const savedY = e.state?.scrollY ?? null;
    const targetIdx = e.state?.idx ?? 0;
    const popDir = targetIdx < navIdx ? 'back' : 'forward';
    navIdx = targetIdx;
    navigateTo(location.pathname + location.search + location.hash, false, savedY, null, popDir);
  });

  // Stamp initial history entry so popstate works on first back
  history.replaceState({ url: location.pathname, scrollY: 0, idx: 0 }, '', location.pathname);

  // Apply active nav on initial load (replaces the removed inline script)
  document.addEventListener('DOMContentLoaded', () => {
    const activeNav = document.getElementById('page-content')?.dataset.activeNav;
    updateActiveNav(activeNav);
  });
}());
