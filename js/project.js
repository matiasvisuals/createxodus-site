/* ============================================
   CREATEXODUS — Project Page Interactions
   ============================================ */

(function () {
  'use strict';

  /* ---- Mini Preloader (1s) ---- */
  var preloader = document.getElementById('preloader');
  var barFill = document.querySelector('.pre-bar-fill');
  if (preloader) {
    document.body.style.opacity = '1';
    var loaded = false;
    var duration = 1000;
    var startTime = Date.now();

    window.addEventListener('load', function () { loaded = true; });

    function tick() {
      var elapsed = Date.now() - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 2);
      if (!loaded && eased > 0.9) eased = 0.9;
      if (barFill) barFill.style.width = (eased * 100) + '%';

      if (progress >= 1 && loaded) {
        if (barFill) barFill.style.width = '100%';
        setTimeout(function () {
          preloader.classList.add('done');
          setTimeout(function () {
            preloader.classList.add('gone');
          }, 600);
        }, 150);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  } else {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.style.opacity = '1';
      });
    });
  }

  /* ---- Page Fade Out on Navigation ---- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:') || link.target === '_blank') return;
    if (href.startsWith('http')) return;

    e.preventDefault();
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '0';
    setTimeout(function () {
      window.location.href = href;
    }, 400);
  });

  /* ---- Nav scroll state ---- */
  var nav = document.querySelector('.proj-nav');
  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(
    '.proj-hero-title, .proj-hero-label, .proj-tags, .proj-details, .proj-media-full, .proj-media-half, .proj-media-third, .proj-media-vertical, .proj-nav-item'
  );

  var observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { observer.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ---- Project Tabs ---- */
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

        // Re-observe new elements for scroll reveal
        var newReveals = panel.querySelectorAll(
          '.proj-media-full, .proj-media-half, .proj-media-third, .proj-media-vertical'
        );
        if ('IntersectionObserver' in window && observer) {
          newReveals.forEach(function (el) {
            if (!el.classList.contains('revealed')) observer.observe(el);
          });
        }
      }

      // Scroll to tabs
      var tabsEl = document.querySelector('.proj-tabs');
      if (tabsEl) tabsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---- Video Lightbox (multi-video) ---- */
  var lightbox = document.getElementById('videoLightbox');
  var lightboxVideo = document.getElementById('lightboxVideo');
  var closeBtn = document.getElementById('videoClose');
  var previews = document.querySelectorAll('.proj-video-preview[data-video]');

  if (lightbox && lightboxVideo && previews.length) {
    previews.forEach(function (preview) {
      preview.addEventListener('click', function () {
        var src = preview.getAttribute('data-video');
        lightboxVideo.querySelector('source').src = src;
        lightboxVideo.load();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
        lightboxVideo.play();
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      lightboxVideo.pause();
    }

    closeBtn.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });
  }
})();
