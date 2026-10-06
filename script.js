/* ==========================================================================
   Zihad — Frontend Developer Portfolio
   Vanilla JavaScript: mobile menu, smooth scrolling, active nav link,
   project filtering, scroll reveal, and screenshot loading.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: border appears once the page is scrolled ---------- */

  const header = document.querySelector('.site-header');

  /* ---------- Mobile navigation ---------- */

  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.getElementById('site-nav');
  const desktopQuery = window.matchMedia('(min-width: 821px)');

  const isMenuOpen = () => navToggle.getAttribute('aria-expanded') === 'true';

  function setMenu(open) {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    siteNav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
  }

  navToggle.addEventListener('click', () => setMenu(!isMenuOpen()));

  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (isMenuOpen() && !event.target.closest('.site-header')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenu(false);
      navToggle.focus();
    }
  });

  desktopQuery.addEventListener('change', (event) => {
    if (event.matches) setMenu(false);
  });

  /* ---------- Smooth scrolling for in-page links ---------- */

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const id = link.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    history.pushState(null, '', `#${id}`);

    // Move keyboard focus to the section so screen-reader and keyboard users land there
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- Active navigation link ---------- */

  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  function updateActiveLink() {
    const headerHeight = header.offsetHeight;
    const marker = headerHeight + window.innerHeight * 0.3;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });
    if (atBottom) current = sections[sections.length - 1];

    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${current.id}`;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ---------- Scroll handler (shared, throttled with requestAnimationFrame) ---------- */

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      updateActiveLink();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  header.classList.toggle('is-scrolled', window.scrollY > 8);
  updateActiveLink();

  /* ---------- Scroll reveal ---------- */

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  // Stagger items that sit side by side in the same grid
  document.querySelectorAll('.skills-grid, .projects-grid, .contact-grid, .principles').forEach((group) => {
    Array.from(group.children).forEach((child, index) => {
      child.style.setProperty('--delay', `${Math.min(index, 5) * 70}ms`);
    });
  });

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  /* ---------- Project filtering ---------- */

  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const projectItems = Array.from(document.querySelectorAll('.project-item'));
  const emptyMessage = document.getElementById('projects-empty');
  const filterStatus = document.getElementById('filter-status');

  function applyFilter(filter, label) {
    let shown = 0;

    projectItems.forEach((item) => {
      const categories = (item.dataset.category || '').split(/\s+/);
      const matches = filter === 'all' || categories.includes(filter);

      item.hidden = !matches;
      if (!matches) return;

      shown += 1;
      item.classList.add('is-visible'); // skip the scroll-reveal for items that were hidden
      item.classList.remove('is-entering');
      void item.offsetWidth; // restart the animation
      if (!prefersReducedMotion) item.classList.add('is-entering');
    });

    emptyMessage.hidden = shown > 0;
    filterStatus.textContent = `Showing ${shown} ${shown === 1 ? 'project' : 'projects'}: ${label}`;
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((other) => {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      applyFilter(button.dataset.filter, button.textContent.trim());
    });
  });

  /* ---------- Project screenshots ----------
     The styled placeholder shows until a real screenshot finishes loading.
     If an image file is missing, the placeholder simply stays in place. */

  document.querySelectorAll('.project-preview img').forEach((img) => {
    const preview = img.closest('.project-preview');
    const markLoaded = () => preview.classList.add('has-image');

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
    }
  });

  /* ---------- Footer year ---------- */

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
