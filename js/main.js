/* ============================================
   CREATEXODUS — Interactions
   Lenis smooth scroll + GSAP ScrollTrigger.
   All reveals are scroll-position driven; nothing
   fires on load except the hero fade-in (CSS).
   ============================================ */

(function () {
  'use strict';

  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=force/.test(location.search);

  /* ---- Lenis smooth scroll ---- */
  var lenis = null;
  if (typeof Lenis !== 'undefined' && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.25,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
    }
  }

  function scrollToTarget(target) {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  /* ---- Anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id === '#' ) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeNav();
      scrollToTarget(target);
    });
  });

  /* ---- Nav tab (mobile toggle) ---- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  function closeNav() { if (window.__closeMenu) window.__closeMenu(); }
  // the phone menu is a separate sheet built by js/glass.js

  /* ---- Live clock (Pacific) + year ---- */
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

  /* ---- Background videos: make sure muted loops actually run ---- */
  function initBgVideos() {
    var vids = document.querySelectorAll('video[autoplay][muted]');
    if (!vids.length) return;
    function tryPlay(v) {
      v.muted = true;
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }
    vids.forEach(tryPlay);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) tryPlay(e.target); else e.target.pause();
        });
      }, { threshold: 0.05 });
      vids.forEach(function (v) { io.observe(v); });
    }
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) vids.forEach(tryPlay);
    });
    var kick = function () { vids.forEach(tryPlay); };
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    window.addEventListener('load', kick);
  }

  /* ---- Cinematic intro on the landing page ---- */
  function initIntro() {
    var html = document.documentElement;
    if (!html.classList.contains('is-intro')) return;
    var finished = false;
    var veil = document.querySelector('.intro-veil');
    var shade = document.querySelector('.hero-shade');
    var name = document.querySelector('.hero-name');
    var title = document.querySelector('.hero-title');

    function done() {
      if (finished) return;
      finished = true;
      // Every tween ends on its stylesheet value, so clearing inline styles changes nothing on screen.
      if (hasGsap) {
        gsap.set('.hero-bg', { clearProps: 'clipPath,transform' });
        gsap.set('.nav', { clearProps: 'transform' }); // keep the tab's clip-path (set by glass.js)
        gsap.set(['.hero-line > *', '.hero-foot > *', '.hero-name .ch', '.hero-title > *'], { clearProps: 'all' });
      }
      html.classList.remove('is-intro');
      if (hasGsap) {
        gsap.set(veil, { display: 'none' });
        ScrollTrigger.refresh();
      }
    }
    if (!hasGsap) { done(); return; }

    // Split the name into letters so it can rise from a mask, letter by letter
    var chars = [];
    if (name && !name.querySelector('.ch')) {
      var text = name.textContent;
      name.textContent = '';
      for (var i = 0; i < text.length; i++) {
        var sp = document.createElement('span');
        sp.className = 'ch';
        sp.textContent = text[i];
        name.appendChild(sp);
        chars.push(sp);
      }
    }
    var titleParts = title ? title.querySelectorAll(':scope > *') : [];
    // remember each part's own resting letter-spacing so the end state is exactly the stylesheet's
    titleParts.forEach(function (el) { var ls = getComputedStyle(el).letterSpacing; el.dataset.ls = ls === 'normal' ? '0px' : ls; });

    // Long, slow settle on the footage runs on its own so the cleanup does not wait for it
    gsap.fromTo('.hero-bg', { scale: 1.22 }, { scale: 1, duration: 3.9, ease: 'power2.out' });
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: done });

    tl
      // 0s  - black veil lifts to reveal a letterboxed strip of moving footage
      .fromTo(veil, { opacity: 1 }, { opacity: 0, duration: 1.4, ease: 'power2.inOut' }, 0)
      .fromTo(shade, { opacity: 0.55 }, { opacity: 0, duration: 2.6, ease: 'power2.inOut' }, 0.4)
      // 0.6s - the bars open to the full card
      .fromTo('.hero-bg', { clipPath: 'inset(38% 0 38% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: 1.9, ease: 'expo.inOut' }, 0.6)
      // 1.7s - the rule draws, then the name rises letter by letter
      .fromTo('.hero-rule', { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 1.7)
      .set(name, { opacity: 1 }, 1.8)
      .fromTo(chars, { yPercent: 115 }, { yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: 0.035 }, 1.8)
      // 2.1s - the title tightens from wide tracking into place
      .set(title, { opacity: 1 }, 2.1)
      .fromTo(titleParts, { opacity: 0, letterSpacing: '0.38em', x: 10 }, { opacity: 1, letterSpacing: function (i, el) { return el.dataset.ls; }, x: 0, duration: 1.5, ease: 'expo.out', stagger: 0.08 }, 2.1)
      // 2.5s - bio and meta settle, tab drops in
      .fromTo('.hero-bio', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 2.5)
      .fromTo('.hero-meta', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, 2.75)
      .fromTo('.nav', { y: -70 }, { y: 0, duration: 1.3, ease: 'expo.out' }, 2.4);

    if (reduceMotion) tl.timeScale(1.8);
    setTimeout(done, 8000);
  }

  /* ---- Scroll-driven motion ----
     Entrance reveals always run. Scrubbed motion (parallax, scale, dimming)
     is skipped when the visitor asks for reduced motion. */
  function initScroll() {
    if (!hasGsap) {
      document.querySelectorAll('.cs').forEach(function (c) { c.style.opacity = 1; });
      return;
    }
    var scrub = !reduceMotion;
    var light = '#d1d6e0';
    var ink = '#424242';
    var once = function (trigger, start) { return { trigger: trigger, start: start || 'top 85%', once: true }; };

    // Hero recedes: content drifts up and fades, footage pushes in
    if (scrub) {
      gsap.to('.hero-line, .hero-foot', {
        y: -70, opacity: 0.15, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 30%', scrub: true }
      });
      gsap.to('.hero-video', {
        scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }

    // Cards settle into the frame as they arrive
    document.querySelectorAll('.card--light').forEach(function (card) {
      if (scrub) {
        gsap.fromTo(card, { scale: 0.965, y: 40 }, {
          scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: card, start: 'top 95%', end: 'top 45%', scrub: 0.5 }
        });
      }
    });

    // Intro statement fills word by word
    var fill = document.querySelector('[data-fill]');
    if (fill) {
      var words = fill.textContent.trim().split(/\s+/);
      fill.innerHTML = words.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
      if (scrub) {
        gsap.to(fill.querySelectorAll('.w'), {
          color: ink, stagger: 0.04, ease: 'none',
          scrollTrigger: { trigger: fill, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 }
        });
      } else {
        gsap.to(fill.querySelectorAll('.w'), { color: ink, stagger: 0.03, duration: 0.6, scrollTrigger: once(fill) });
      }
    }

    // Client index: names darken as they pass the middle
    document.querySelectorAll('.client-row').forEach(function (row) {
      if (scrub) {
        gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 78%', end: 'top 22%', scrub: 0.5 } })
          .fromTo(row, { color: light }, { color: ink, ease: 'none' })
          .to(row, { color: light, ease: 'none' });
      } else {
        gsap.fromTo(row, { color: light }, { color: ink, duration: 0.9, scrollTrigger: once(row, 'top 80%') });
      }
    });

    // Reel grows to full width, then drifts
    var reel = document.querySelector('[data-reel]');
    if (reel && scrub) {
      gsap.fromTo(reel, { scale: 0.42, borderRadius: 18 }, {
        scale: 1, borderRadius: 24, ease: 'none',
        scrollTrigger: { trigger: reel, start: 'top 95%', end: 'top 12%', scrub: 0.4 }
      });
      gsap.fromTo(reel.querySelector('video'), { yPercent: -6 }, {
        yPercent: 6, ease: 'none',
        scrollTrigger: { trigger: reel, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Rows and grids rise in with a slight slide
    document.querySelectorAll('[data-rows]').forEach(function (group) {
      gsap.from(group.children, {
        y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.06, clearProps: 'transform',
        scrollTrigger: once(group)
      });
    });

    // Split headings are animated by js/motion.js

    // About photo parallax
    var about = document.querySelector('.about-photo img');
    if (about && scrub) {
      gsap.fromTo(about, { yPercent: -7 }, {
        yPercent: 7, ease: 'none',
        scrollTrigger: { trigger: about.parentNode, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    }

    // Case studies: parallax footage, dim/bright on approach, lines slide in
    document.querySelectorAll('.cs').forEach(function (card) {
      var media = card.querySelector('.cs-media img, .cs-media video');
      if (scrub) {
        gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 85%', end: 'bottom 15%', scrub: 0.4 } })
          .fromTo(card, { opacity: 0.28 }, { opacity: 1, ease: 'none', duration: 0.35 })
          .to(card, { opacity: 1, duration: 0.3 })
          .to(card, { opacity: 0.28, ease: 'none', duration: 0.35 });
        if (media) {
          gsap.fromTo(media, { yPercent: -8 }, {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true }
          });
        }
      } else {
        card.style.opacity = 1;
      }
      var body = card.querySelector('.cs-body');
      if (body) {
        // kicker, headline letters and description are animated by js/motion.js
        gsap.from(body.querySelector('.cs-meta'), { y: 16, opacity: 0, scaleX: 0.92, transformOrigin: 'left center', duration: 1, ease: 'power3.out', delay: 0.5, scrollTrigger: once(card, 'top 88%') });
      }
    });

    // Pills and the "view all" block
    document.querySelectorAll('.cta-pill, .cases-more').forEach(function (el) {
      gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: once(el, 'top 90%') });
    });

    // Footer
    var footer = document.querySelector('.footer');
    if (footer) {
      gsap.from(footer.querySelectorAll('.footer-grid > *, .footer-bar'), {
        y: 18, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: once(footer, 'top 90%')
      });
    }

    window.addEventListener('load', function () { setTimeout(function () { try { ScrollTrigger.refresh(); } catch (e) {} }, 60); });
  }

  /* ---- Contact form (Formspree AJAX) ---- */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"] span');
      var origText = btn.textContent;
      btn.textContent = 'Sending...';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          btn.textContent = r.ok ? 'Sent!' : 'Error — try again';
          if (r.ok) form.reset();
          setTimeout(function () { btn.textContent = origText; }, 3000);
        })
        .catch(function () {
          btn.textContent = 'Error — try again';
          setTimeout(function () { btn.textContent = origText; }, 3000);
        });
    });
  }

  /* ---- Booking modal (multi-step wizard) ---- */
  function initBookingModal() {
    var modal = document.getElementById('bookingModal');
    var form = document.getElementById('bookingForm');
    if (!modal || !form) return;

    function openBooking(e) {
      if (e) e.preventDefault();
      closeNav();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    }

    function closeBooking() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (lenis) lenis.start();
      setTimeout(function () {
        goToStep(1);
        form.reset();
        document.querySelectorAll('.bk-type').forEach(function (c) { c.classList.remove('selected'); });
        var hidden = document.getElementById('bkProjectType');
        if (hidden) hidden.value = '';
      }, 500);
    }

    function goToStep(step) {
      document.querySelectorAll('.booking-step').forEach(function (s) { s.classList.remove('active'); });
      var target = document.querySelector('.booking-step[data-step="' + step + '"]');
      if (target) target.classList.add('active');

      var bar = document.getElementById('bookingProgressBar');
      var progress = document.getElementById('bookingProgress');
      if (bar && progress) {
        if (step <= 3) {
          progress.style.opacity = '1';
          bar.style.width = (step / 3) * 100 + '%';
        } else {
          progress.style.opacity = '0';
        }
      }
      if (target) {
        target.querySelectorAll('.bk-stagger').forEach(function (el) {
          el.style.animation = 'none';
          void el.offsetHeight;
          el.style.animation = '';
        });
      }
    }

    document.querySelectorAll('.bk-type').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('.bk-type').forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        var hidden = document.getElementById('bkProjectType');
        if (hidden) hidden.value = card.dataset.type;
        setTimeout(function () { goToStep(2); }, 320);
      });
    });

    document.querySelectorAll('.bk-back, .bk-continue:not(.booking-submit-btn)').forEach(function (btn) {
      if (btn.dataset.goto) {
        btn.addEventListener('click', function () { goToStep(parseInt(btn.dataset.goto, 10)); });
      }
    });

    document.querySelectorAll('[data-book-open]').forEach(function (btn) {
      btn.addEventListener('click', openBooking);
    });

    var closeBtn = document.getElementById('bookingClose');
    var backdrop = document.getElementById('bookingBackdrop');
    var doneBtn = document.getElementById('bookingDone');
    if (closeBtn) closeBtn.addEventListener('click', closeBooking);
    if (backdrop) backdrop.addEventListener('click', closeBooking);
    if (doneBtn) doneBtn.addEventListener('click', closeBooking);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeBooking();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('.booking-submit-btn');
      var originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) {
          submitBtn.disabled = false;
          if (r.ok) {
            goToStep(4);
            submitBtn.innerHTML = originalText;
          } else {
            submitBtn.textContent = 'Error — try again';
            setTimeout(function () { submitBtn.innerHTML = originalText; }, 3000);
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Error — try again';
          setTimeout(function () { submitBtn.innerHTML = originalText; }, 3000);
        });
    });
  }

  /* ---- Calendly discovery call ---- */
  function initDiscoveryCall() {
    document.querySelectorAll('[data-calendly-url]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var url = btn.getAttribute('data-calendly-url');
        if (!url) return;
        var modal = document.getElementById('bookingModal');
        if (modal && modal.classList.contains('active')) {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
          if (lenis) lenis.start();
        }
        if (window.Calendly) window.Calendly.initPopupWidget({ url: url });
        else window.open(url, '_blank', 'noopener');
      });
    });
  }

  function init() {
    initBgVideos();
    initIntro();
    initScroll();
    initContactForm();
    initBookingModal();
    initDiscoveryCall();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
