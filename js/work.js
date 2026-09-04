/* ============================================
   CREATEXODUS — Work index: filters + hover video
   ============================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=force/.test(location.search);
  var grid = document.getElementById('workGrid');
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.wk-card'));
  var empty = document.getElementById('workEmpty');
  var countEl = document.querySelector('[data-count]');

  /* ---- Reveal ---- */
  var observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
    cards.forEach(function (c) { observer.observe(c); });
  } else {
    cards.forEach(function (c) { c.classList.add('revealed'); });
  }

  /* ---- Filters ---- */
  var filters = document.querySelectorAll('.wk-filter');
  function applyFilter(key) {
    var shown = 0;
    cards.forEach(function (card) {
      var services = (card.getAttribute('data-services') || '').split(/\s+/);
      var match = key === 'all' || services.indexOf(key) !== -1;
      card.classList.toggle('is-hidden', !match);
      if (match) {
        shown++;
        if (observer && !card.classList.contains('revealed')) observer.observe(card);
      }
    });
    if (empty) empty.hidden = shown > 0;
    if (countEl) countEl.textContent = shown;
  }
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'));
      if (history.replaceState) history.replaceState(null, '', '#' + btn.getAttribute('data-filter'));
    });
  });

  // Deep link: work.html#photography
  var initial = (location.hash || '').replace('#', '');
  if (initial) {
    var target = document.querySelector('.wk-filter[data-filter="' + initial + '"]');
    if (target) target.click();
  }

  /* ---- Hover video preview ---- */
  var canHover = window.matchMedia('(hover: hover)').matches;
  if (canHover) {
    cards.forEach(function (card) {
      var vid = card.querySelector('video[data-src]');
      if (!vid) return;
      card.addEventListener('mouseenter', function () {
        if (!vid.getAttribute('src')) vid.src = vid.getAttribute('data-src');
        var p = vid.play();
        if (p && p.catch) p.catch(function () {});
        card.classList.add('is-playing');
      });
      card.addEventListener('mouseleave', function () {
        vid.pause();
        card.classList.remove('is-playing');
      });
    });
  }
})();
