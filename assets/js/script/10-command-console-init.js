let hoverTimer;
let leaveTimer;
const HOVER_OPEN_MS = 200;
const HOVER_LEAVE_GRACE_MS = 180;
// true when the panel was opened by tap/click — stays open until outside tap
let pinnedOpen = false;


document.addEventListener("DOMContentLoaded", function () {
    const hitbox = document.getElementById('command-console');
    let savedTheme = localStorage.getItem("theme");

    hitbox.addEventListener('pointerenter', () => {
        clearTimeout(leaveTimer);
        hoverTimer = setTimeout(() => {
            pinnedOpen = false;   // hover-open: not pinned
            hitbox.focus();
        }, HOVER_OPEN_MS);
    });

    hitbox.addEventListener('pointerleave', () => {
        clearTimeout(hoverTimer);
        if (pinnedOpen) return;  // tap/click opened — ignore leave
        // Grace period: if the pointer re-enters #command-console (which contains the
        // command box and panels) before this elapses, cancel the blur.
        leaveTimer = setTimeout(() => { hitbox.blur(); }, HOVER_LEAVE_GRACE_MS);
    });

    hitbox.addEventListener('focus', () => openNavPanel());
    hitbox.addEventListener('blur', () => {
        pinnedOpen = false; closeNavPanel();
    });

    // Outside-tap/click dismissal for pinned (tap-opened) panel
    document.addEventListener('pointerdown', (e) => {
        if (!pinnedOpen) return;
        if (hitbox.contains(e.target)) return;
        pinnedOpen = false;
        hitbox.blur();
    }, { capture: true });

    shiftCommand("initialise");

    if (!savedTheme) {  localStorage.setItem("theme", "auto");  savedTheme = "auto";  }

    // Set icon immediately so there's no wrong-icon flash on initial load.
    // setAutoTheme() → updateAutoTheme() handles its own icon; set explicit ones here.
    if      (savedTheme === "dark" ) { themeIcon.innerText = "dark_mode";  setTheme("dark");  }
    else if (savedTheme === "light") { themeIcon.innerText = "light_mode"; setTheme("light"); }
    else                             { setAutoTheme(); }

    themeAnimReady = true; // allow icon swap animation after initial paint

    themeToggleEventMaker();

    attachCornerPickerHandlers();
    attachKeyboardHandler();
    attachDragHandlers();

    // Alt+T (Opt+T on macOS) — cycle theme, same as clicking the toggle.
    // e.code is the physical key (always 'KeyT') — unaffected by Alt/Option
    // modifier characters (e.g. macOS Opt+T produces '†', not 't').
    document.addEventListener('keydown', (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyT' &&
          !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        themeToggleBtn.click();
      }
    });
});
