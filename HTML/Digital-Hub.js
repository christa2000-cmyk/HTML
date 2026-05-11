/* ============================================================
   Digital Hub — Premium Eco Rentals
   JavaScript: Itinerary planner (local storage) + nav toggle
   ============================================================ */

(function () {
  'use strict';

  /* ─── Local Storage Key ──────────────────────────────────── */
  const STORAGE_KEY = 'per_dh_itinerary';

  /* ─── Load saved itinerary from localStorage ─────────────── */
  function loadItinerary() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  /* ─── Save itinerary to localStorage ─────────────────────── */
  function saveItinerary(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* Storage unavailable — degrade silently */
    }
  }

  /* ─── Render the "My Itinerary" panel ───────────────────── */
  function renderPanel() {
    const items   = loadItinerary();
    const list    = document.getElementById('itinerary-list');
    const empty   = document.getElementById('itinerary-empty');
    const count   = document.getElementById('itinerary-count');
    const printBtn = document.getElementById('print-itinerary-btn');

    if (!list) return;

    /* Remove existing saved-item nodes (keep empty placeholder) */
    Array.from(list.querySelectorAll('.dh-saved-item')).forEach(n => n.remove());

    /* Count badge */
    count.textContent = items.length === 0
      ? '0 stops'
      : `${items.length} stop${items.length > 1 ? 's' : ''}`;

    if (items.length === 0) {
      empty.style.display = 'flex';
      printBtn.disabled = true;
      return;
    }

    empty.style.display = 'none';
    printBtn.disabled = false;

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'dh-saved-item';
      row.setAttribute('data-id', item.id);
      row.innerHTML = `
        <span class="dh-saved-item__dot"></span>
        <span class="dh-saved-item__name">${escapeHtml(item.name)}</span>
        <span class="dh-saved-item__day">${escapeHtml(item.day)}</span>
        <button class="dh-saved-item__remove" data-id="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.name)}">
          <i class="ri-close-line"></i>
        </button>
      `;
      list.appendChild(row);
    });

    /* Sync add-button states */
    syncAddButtons(items);
  }

  /* ─── Sync "Add" button states across day panels ─────────── */
  function syncAddButtons(items) {
    const ids = new Set(items.map(i => i.id));
    document.querySelectorAll('.dh-add-btn').forEach(btn => {
      const id = btn.getAttribute('data-id');
      if (ids.has(id)) {
        btn.classList.add('added');
        btn.innerHTML = '<i class="ri-check-line"></i> Added';
      } else {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="ri-add-line"></i> Add';
      }
    });
  }

  /* ─── Add activity ──────────────────────────────────────── */
  function addActivity(id, day, name) {
    const items = loadItinerary();
    if (items.find(i => i.id === id)) return; /* already exists */
    items.push({ id, day, name });
    saveItinerary(items);
    renderPanel();
  }

  /* ─── Remove activity ───────────────────────────────────── */
  function removeActivity(id) {
    const items = loadItinerary().filter(i => i.id !== id);
    saveItinerary(items);
    renderPanel();
  }

  /* ─── HTML escape helper ────────────────────────────────── */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Day tab switching ──────────────────────────────────── */
  function initDayTabs() {
    const tabs   = document.querySelectorAll('.dh-day-tab');
    const panels = document.querySelectorAll('.dh-day-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const day = tab.getAttribute('data-day');

        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        panels.forEach(p => {
          p.classList.toggle('active', p.getAttribute('data-day') === day);
        });
      });
    });
  }

  /* ─── "Add to My Trip" button handler ───────────────────── */
  function initAddButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.dh-add-btn');
      if (!btn) return;

      const id   = btn.getAttribute('data-id');
      const day  = btn.getAttribute('data-day');
      const name = btn.getAttribute('data-name');

      const items = loadItinerary();
      if (items.find(i => i.id === id)) {
        /* Already added → remove (toggle) */
        removeActivity(id);
      } else {
        addActivity(id, day, name);
        /* Brief scale feedback */
        btn.style.transform = 'scale(0.93)';
        setTimeout(() => { btn.style.transform = ''; }, 180);
      }
    });
  }

  /* ─── Remove button handler (inside panel) ───────────────── */
  function initRemoveButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.dh-saved-item__remove');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      removeActivity(id);
    });
  }

  /* ─── Clear button ───────────────────────────────────────── */
  function initClearButton() {
    const btn = document.getElementById('clear-itinerary-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (loadItinerary().length === 0) return;
      if (!confirm('Clear all saved activities from your itinerary?')) return;
      saveItinerary([]);
      renderPanel();
    });
  }

  /* ─── Print / Share button ───────────────────────────────── */
  function initPrintButton() {
    const btn = document.getElementById('print-itinerary-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const items = loadItinerary();
      if (items.length === 0) return;
      window.print();
    });
  }

  /* ─── Mobile nav toggle ──────────────────────────────────── */
  function initMobileNav() {
    const toggleBtn = document.getElementById('dh-mobile-btn');
    const navLinks  = document.getElementById('dh-nav-links');
    if (!toggleBtn || !navLinks) return;

    toggleBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggleBtn.innerHTML = open
        ? '<i class="ri-close-line"></i>'
        : '<i class="ri-menu-3-line"></i>';
    });

    /* Close nav on link click */
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggleBtn.innerHTML = '<i class="ri-menu-3-line"></i>';
      });
    });
  }

  /* ─── Smooth scroll for quick-nav links ─────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = 80; /* nav height offset */
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ─── Init on DOM ready ──────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initDayTabs();
    initAddButtons();
    initRemoveButtons();
    initClearButton();
    initPrintButton();
    initMobileNav();
    initSmoothScroll();
    renderPanel(); /* restore saved itinerary on page load */
  });

})();
