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

  // Pick the transition direction for a navigation. Returns one of
  // up | down | left | right | fade — consumed by CSS via #page-content[data-nav-dir].
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

  // Guess the active-nav key from a URL path before the fetch resolves.
  function estimateNavKey(path) {
    const p = path.replace(/[?#].*/, '');
    if (p === '/' || p === '') return 'home';
    const first = p.replace(/^\//, '').split('/')[0];
    const map = { projects: 'projects', notebook: 'notebook', about: 'about', now: 'now', credentials: 'credentials' };
    return map[first] || '';
  }

  async function navigateTo(url, pushState, restoreScrollY, triggerEl = null, popDir = null) {
    if (abortController) abortController.abort();
    abortController = new AbortController();

    const content = document.getElementById('page-content');
    const arcEl   = document.getElementById('nav-arc');
    const fromPath = currentPath;
    const fromNav  = content ? content.dataset.activeNav : '';

    if (typeof window.__pageCleanup === 'function') {
      try { window.__pageCleanup(); } catch (e) { console.error('pageCleanup error:', e); }
      window.__pageCleanup = null;
    }
    clearAllTimeouts(showTimeouts);
    clearAllTimeouts(hideTimeouts);

    // Separate path+search from hash fragment
    let urlHash = '';
    const hashIdx = url.indexOf('#');
    if (hashIdx !== -1) { urlHash = url.slice(hashIdx); url = url.slice(0, hashIdx); }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ANIM_MS = reduceMotion ? 1 : 200;   // exit / enter keyframe duration (--motion-base)
    const ARC_MS  = reduceMotion ? 1 : 120;   // arc fade-in / fade-out transition (--motion-fast)
    const ARC_THRESHOLD_MS = 150;             // only show arc when fetch is slower than this

    const dirEst = resolveMode(fromPath, url, fromNav, estimateNavKey(url), triggerEl, popDir);

    // Flush any leftover animation state from a rapid previous navigation
    if (content) {
      content.classList.remove('page-leaving', 'page-entering');
      content.removeAttribute('data-nav-dir');
      void content.offsetWidth; // force reflow to restart keyframes cleanly
    }

    // ── Phase 1: exit animation + fetch in parallel ──────────────────────────
    const fetchPromise = fetch(url, { signal: abortController.signal }).then(async res => {
      if (!res.ok) throw new Error(res.status);
      return { finalUrl: new URL(res.url).pathname, html: await res.text() };
    });

    if (content) {
      content.dataset.navDir = dirEst;
      content.classList.add('page-leaving');
    }

    // Gate arc on slow fetches — fade in after threshold, fade out when done.
    // The timer must measure fetch latency alone, so cancel it the instant the
    // fetch settles. (Phase 1 below always waits ≥ ANIM_MS for the exit keyframe,
    // which is longer than ARC_THRESHOLD_MS — clearing only after that wait would
    // let the arc flash on every navigation, even instant ones.)
    let arcShown = false;
    const arcTimer = setTimeout(() => {
      arcShown = true;
      if (arcEl) arcEl.classList.add('arc-visible');
    }, ARC_THRESHOLD_MS);
    fetchPromise.then(() => clearTimeout(arcTimer), () => clearTimeout(arcTimer));

    let fetchResult;
    try {
      [fetchResult] = await Promise.all([
        fetchPromise,
        new Promise(r => setTimeout(r, ANIM_MS))
      ]);
    } catch (err) {
      // arcTimer was already cleared by the fetch-settle handler above.
      if (arcShown && arcEl) arcEl.classList.remove('arc-visible');
      if (err.name !== 'AbortError') location.href = url;
      return;
    }

    const { finalUrl, html } = fetchResult;
    currentPath = finalUrl;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newContent = doc.getElementById('page-content');
    if (!newContent) { location.href = url; return; }
    const toNav = newContent.dataset.activeNav || '';

    // Refine direction now that we know the actual destination nav key
    const direction = resolveMode(fromPath, finalUrl, fromNav, toNav, triggerEl, popDir);

    // Sync any Google Fonts the new page may need
    doc.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]').forEach(newLink => {
      const href = newLink.getAttribute('href');
      if (!document.querySelector('link[href="' + href + '"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // ── Phase 2: DOM swap ────────────────────────────────────────────────────
    const pageStyleEl = document.getElementById('page-style');
    const newStyleHref = doc.getElementById('page-style')?.getAttribute('href') || '';
    if (pageStyleEl) pageStyleEl.setAttribute('href', newStyleHref);

    if (content) {
      content.dataset.navDir = direction; // refine before entering animation
      content.innerHTML = newContent.innerHTML;
      content.dataset.activeNav = newContent.dataset.activeNav || '';
    }

    document.title = doc.title;
    updateActiveNav(newContent.dataset.activeNav);

    if (restoreScrollY != null) {
      window.scrollTo(0, restoreScrollY);
    } else if (urlHash) {
      const target = document.getElementById(urlHash.slice(1));
      if (target) target.scrollIntoView({ behavior: 'instant' });
      else window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }

    // ── Phase 3: arc fades out, then content enters ──────────────────────────
    if (arcShown && arcEl) {
      arcEl.classList.remove('arc-visible');
      await new Promise(r => setTimeout(r, ARC_MS + 20));
    }

    // Swap page-leaving → page-entering in one synchronous batch so the browser
    // never sees an intermediate full-opacity frame between the two animations.
    requestAnimationFrame(() => {
      if (content) {
        content.classList.remove('page-leaving');
        content.classList.add('page-entering');
        setTimeout(() => {
          content.classList.remove('page-entering');
          content.removeAttribute('data-nav-dir');
        }, ANIM_MS + 50);
      }
    });

    // Post-nav housekeeping (runs while animations play)
    syncPageConsoleCorner();
    if (typeof window.__initScrollArc === 'function') window.__initScrollArc();
    if (typeof window.__initImages === 'function') window.__initImages(content);

    if (pushState) {
      history.replaceState({ ...history.state, scrollY: window.scrollY }, '');
      history.pushState({ url: finalUrl + urlHash, idx: ++navIdx }, '', finalUrl + urlHash);
    }

    syncLibAssets(doc).then(() => {
      if (typeof renderMathInElement === 'function') {
        renderMathInElement(content, {
          delimiters: [
            { left: '$$',  right: '$$',  display: true  },
            { left: '\\[', right: '\\]', display: true  },
            { left: '$',   right: '$',   display: false },
            { left: '\\(', right: '\\)', display: false },
          ]
        });
      }
      if (typeof Prism !== 'undefined' && typeof Prism.highlightElement === 'function') {
        content.querySelectorAll('code[class*="language-"]').forEach(el => Prism.highlightElement(el));
      }
    });

    const oldScript = document.getElementById('page-script');
    if (oldScript) oldScript.remove();
    const newScriptSrc = doc.getElementById('page-script')?.getAttribute('src') || '';
    if (newScriptSrc) {
      const script = document.createElement('script');
      script.id = 'page-script';
      script.src = newScriptSrc;
      document.body.appendChild(script);
    }

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
