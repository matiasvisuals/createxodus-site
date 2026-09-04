/* ============================================
   CREATEXODUS — Project Page Interactions
   ============================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=force/.test(location.search);

  /* ---- Lenis smooth scroll ---- */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.25,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
  }

  /* ---- Nav tab (mobile toggle) ---- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', function () { nav.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target)) nav.classList.remove('open');
    });
  }

  /* ---- Clock + year ---- */
  function tick() {
    var now = new Date();
    var time;
    try {
      time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' });
    } catch (err) {
      time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    document.querySelectorAll('[data-clock]').forEach(function (el) { el.textContent = time; });
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = now.getFullYear(); });
  }
  tick();
  setInterval(tick, 15000);

  /* ---- Scroll reveal ---- */
  var revealSelector = '.proj-tags, .proj-details, .proj-media-full, .proj-media-half, .proj-media-third, .proj-media-vertical, .proj-nav-item, .gfx-tile, .gfx-feature-aside';
  var reveals = document.querySelectorAll(revealSelector);
  var observer = null;

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---- Scroll motion (GSAP when present) ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); }
    var scrub = !reduceMotion;

    var heroBox = document.querySelector('.proj-hero .container');
    if (heroBox && scrub) {
      gsap.to(heroBox, { y: -60, opacity: 0.2, ease: 'none',
        scrollTrigger: { trigger: '.proj-hero', start: 'top top', end: 'bottom 25%', scrub: true } });
    }
    document.querySelectorAll('.proj-media, .gfx-stack, .wk-section').forEach(function (card) {
      if (scrub) {
        gsap.fromTo(card, { scale: 0.97, y: 36 }, { scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 50%', scrub: 0.5 } });
      }
    });
    if (scrub) {
      var parallaxSel = '.proj-media-full img, .proj-media-half img, .proj-media-third img' + (window.matchMedia('(max-width: 768px)').matches ? '' : ', .proj-video-preview video');
      document.querySelectorAll(parallaxSel).forEach(function (m) {
        var box = m.parentNode;
        gsap.fromTo(m, { yPercent: -6 }, { yPercent: 6, ease: 'none',
          scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }
    window.addEventListener('load', function () { setTimeout(function () { try { ScrollTrigger.refresh(); } catch (e) {} }, 60); });
  }

  /* ---- Tabs ---- */
  var tabs = document.querySelectorAll('.proj-tab');
  var tabContents = document.querySelectorAll('.proj-tab-content');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tabContents.forEach(function (tc) { tc.classList.remove('active'); });
      tab.classList.add('active');
      var panel = document.getElementById('tab-' + target);
      if (panel) {
        panel.classList.add('active');
        var fresh = panel.querySelectorAll(revealSelector);
        if (observer) {
          fresh.forEach(function (el) { if (!el.classList.contains('revealed')) observer.observe(el); });
        } else {
          fresh.forEach(function (el) { el.classList.add('revealed'); });
        }
      }
      var tabsEl = document.querySelector('.proj-tabs');
      if (tabsEl) {
        if (lenis) lenis.scrollTo(tabsEl, { offset: -90 });
        else tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---- Video lightbox ---- */
  var lightbox = document.getElementById('videoLightbox');
  var lightboxVideo = document.getElementById('lightboxVideo');
  var closeBtn = document.getElementById('videoClose');
  var previews = document.querySelectorAll('.proj-video-preview[data-video]');

  var smallScreen = window.matchMedia('(max-width: 768px)').matches;
  if (lightbox && lightboxVideo && previews.length) {
    previews.forEach(function (preview) {
      preview.addEventListener('click', function () {
        var src = preview.getAttribute('data-video');
        if (smallScreen) {
          // Phones: play right in the tile with native controls, no overlay
          var v = preview.querySelector('video');
          if (!v) return;
          if (!preview.classList.contains('is-inline')) {
            preview.classList.add('is-inline');
            v.removeAttribute('data-src');
            v.src = src;
            v.controls = true;
            v.muted = false;
            v.preload = 'auto';
            v.setAttribute('controls', '');
            v.load();
          }
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});
          return;
        }
        var source = lightboxVideo.querySelector('source');
        if (source) source.remove();
        lightboxVideo.src = src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
        var p = lightboxVideo.play();
        if (p && p.catch) p.catch(function () {});
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      lightboxVideo.pause();
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
  }
})();
