// Acupuncture Monique St-Arnault — Main JS

document.addEventListener('DOMContentLoaded', () => {

  // ── Sticky header ──────────────────────────────────
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ── Mobile menu ────────────────────────────────────
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.site-nav');
  if (hamburger && nav) {
    // Add close button dynamically
    const closeBtn = document.createElement('button');
    closeBtn.className = 'nav-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Fermer le menu');
    nav.prepend(closeBtn);

    hamburger.addEventListener('click', () => nav.classList.add('open'));
    closeBtn.addEventListener('click', () => nav.classList.remove('open'));
    nav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  // ── Counter animation ──────────────────────────────
  const counters = document.querySelectorAll('[data-count]');
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(easeOut(progress) * target);
      el.textContent = value.toLocaleString('fr-CA') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Trigger counters when visible
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => obs.observe(c));
  } else {
    counters.forEach(c => {
      c.textContent = parseInt(c.dataset.count).toLocaleString('fr-CA') + (c.dataset.suffix || '');
    });
  }

  // ── Fade-in on scroll ──────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-in');
  if ('IntersectionObserver' in window && fadeEls.length) {
    const fadeObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fadeObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    fadeEls.forEach(el => fadeObs.observe(el));
  }
});
