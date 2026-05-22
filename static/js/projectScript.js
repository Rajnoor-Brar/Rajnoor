// ── Project list: filter toggle + tag chips ──────────────────────────────────
(function () {
  const toggleBtn   = document.getElementById('filter-toggle');
  const filtersWrap = document.getElementById('project-filters-wrap');
  const chips       = document.querySelectorAll('.filter-chip');
  const cards       = document.querySelectorAll('.project-card-wrap');
  const groups      = document.querySelectorAll('.project-group');
  const empty       = document.getElementById('project-empty-state');

  // ── Filter panel toggle ────────────────────────────────────────────────────
  if (toggleBtn && filtersWrap) {
    toggleBtn.addEventListener('click', () => {
      const isOpen = filtersWrap.classList.toggle('open');
      toggleBtn.classList.toggle('active', isOpen);
      toggleBtn.setAttribute('aria-expanded', isOpen);

      // When closing, clear all active chips and reset the filter
      if (!isOpen) {
        activeTags.clear();
        chips.forEach(c => c.classList.remove('active'));
        applyFilter();
      }
    });
  }

  if (!chips.length) return;

  // ── Tag filtering (AND logic) ──────────────────────────────────────────────
  const activeTags = new Set();

  function applyFilter() {
    let totalVisible = 0;

    cards.forEach(card => {
      const cardTags = (card.dataset.tags || '').split(' ').filter(Boolean);
      const matches  = activeTags.size === 0 ||
        [...activeTags].every(t => cardTags.includes(t));
      card.classList.toggle('hidden', !matches);
      if (matches) totalVisible++;
    });

    // Collapse group sections whose every card is hidden
    groups.forEach(section => {
      const sectionCards = section.querySelectorAll('.project-card-wrap');
      const anyVisible   = [...sectionCards].some(c => !c.classList.contains('hidden'));
      section.classList.toggle('hidden', !anyVisible);
    });

    if (empty) empty.style.display = totalVisible === 0 ? '' : 'none';
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        chip.classList.remove('active');
      } else {
        activeTags.add(tag);
        chip.classList.add('active');
      }
      applyFilter();
    });
  });

  // Expose cleanup for SPA navigation
  window.__pageCleanup = function () {
    window.__pageCleanup = null;
  };
})();
