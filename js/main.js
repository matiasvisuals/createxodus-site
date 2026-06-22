/* ============================================
   CREATEXODUS — Cinematic Interactions
   ============================================ */

(function () {
  'use strict';

  /* ---- Register GSAP + ScrollTrigger unconditionally ---- */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---- Lenis Smooth Scroll ---- */
  let lenis;
  var gateEl = document.getElementById('password-gate');
  var gateVisible = gateEl && gateEl.style.display !== 'none';

  function initLenis() {
    if (lenis || typeof Lenis === 'undefined') return;
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  /* Only init Lenis after gate is gone — its event listeners block native scroll */
  if (gateVisible) {
    window.addEventListener('gate-dismissed', initLenis, { once: true });
  } else {
    initLenis();
  }

  /* ---- Init animations immediately ---- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimations);
  } else {
    initAnimations();
  }

  /* ---- Scroll Progress Bar ---- */
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = progress + '%';
    });
  }

  /* ---- Navigation ---- */
  const navbar = document.getElementById('navbar');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-cta');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
      if (lenis) {
        mobileMenu.classList.contains('active') ? lenis.stop() : lenis.start();
      }
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      });
    });
  }

  /* ---- Smooth Scroll for Anchors ---- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        if (lenis) {
          lenis.scrollTo(top);
        } else {
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }
    });
  });

  /* ---- (Portfolio is now desktop folder grid — no carousel needed) ---- */

  /* ---- (Testimonials removed) ---- */

  /* ---- Client Logo Marquee (auto-scroll + drag) ---- */
  var marqueeInner = document.querySelector('.marquee-inner');
  if (marqueeInner) {
    var mOffset = 0;
    var mSpeed = 1.5;
    var mDragging = false;
    var mStartX = 0;
    var mDragStart = 0;
    var mVelocity = 0;
    var mLastX = 0;
    var mLastTime = 0;
    var mMomentum = 0;
    var mHalfWidth = marqueeInner.scrollWidth / 2;

    function wrapOffset() {
      if (mOffset > 0) mOffset -= mHalfWidth;
      if (mOffset <= -mHalfWidth) mOffset += mHalfWidth;
    }

    function marqueeLoop() {
      if (!mDragging) {
        // Apply momentum from swipe, decaying over time
        if (Math.abs(mMomentum) > 0.2) {
          mOffset += mMomentum;
          mMomentum *= 0.95;
        } else {
          mMomentum = 0;
          mOffset -= mSpeed;
        }
      }
      wrapOffset();
      marqueeInner.style.transform = 'translateX(' + mOffset + 'px)';
      requestAnimationFrame(marqueeLoop);
    }
    requestAnimationFrame(marqueeLoop);

    marqueeInner.addEventListener('pointerdown', function (e) {
      mDragging = true;
      mMomentum = 0;
      mStartX = e.clientX;
      mLastX = e.clientX;
      mLastTime = Date.now();
      mDragStart = mOffset;
      marqueeInner.setPointerCapture(e.pointerId);
    });

    marqueeInner.addEventListener('pointermove', function (e) {
      if (!mDragging) return;
      var now = Date.now();
      var dt = now - mLastTime;
      if (dt > 0) mVelocity = (e.clientX - mLastX) / dt * 16;
      mLastX = e.clientX;
      mLastTime = now;
      mOffset = mDragStart + (e.clientX - mStartX);
      wrapOffset();
    });

    function endDrag() {
      if (!mDragging) return;
      mDragging = false;
      mMomentum = mVelocity;
    }

    marqueeInner.addEventListener('pointerup', endDrag);
    marqueeInner.addEventListener('pointercancel', endDrag);
  }

  /* ---- Hero Video Trim (loop before Mercedes logo) ---- */
  var heroVid = document.querySelector('.hero-video');
  if (heroVid) {
    var MAX_TIME = 43;
    heroVid.addEventListener('timeupdate', function () {
      if (heroVid.currentTime >= MAX_TIME) {
        heroVid.currentTime = 0;
      }
    });
  }

  /* ---- Contact Form (Formspree AJAX) ---- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = contactForm.querySelector('button[type="submit"] span');
      var origText = btn.textContent;
      btn.textContent = 'Sending...';
      fetch('https://formspree.io/f/mpqygjgo', {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      }).then(function(r) {
        if (r.ok) {
          btn.textContent = 'Sent!';
          contactForm.reset();
          setTimeout(function(){ btn.textContent = origText; }, 3000);
        } else {
          btn.textContent = 'Error — try again';
          setTimeout(function(){ btn.textContent = origText; }, 3000);
        }
      }).catch(function() {
        btn.textContent = 'Error — try again';
        setTimeout(function(){ btn.textContent = origText; }, 3000);
      });
    });
  }

  /* ---- Globe is initialized via ES module in index.html ---- */

  /* Hero logo + buttons are static (CSS-only fade-in). No scroll morph. */
  function initLogoMorph() { /* intentionally empty — morph removed */ }

  /* ---- Animations ---- */
  function initAnimations() {
    // Counter Animation (numbers count up when scrolled into view)
    var statNumbers = document.querySelectorAll('.stat-num[data-count]');
    if ('IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      statNumbers.forEach(function(el) { counterObserver.observe(el); });
    } else {
      statNumbers.forEach(function(el) { animateCounter(el); });
    }

    // Safety net: trigger counters after 5s if observer didn't fire
    setTimeout(function () {
      statNumbers.forEach(function(el) {
        if (el.textContent === '0') animateCounter(el);
      });
    }, 5000);

    // GSAP — hero parallax only (scrub-based, no visibility control)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      try {
        gsap.to('.hero-video', {
          scale: 1.1,
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });

        // Hero CE logo morphs into nav pill slot; buttons fade out
        initLogoMorph();

        gsap.to('.hero-scroll', {
          opacity: 0,
          scrollTrigger: {
            trigger: '#hero',
            start: '20% top',
            end: '40% top',
            scrub: 1,
          },
        });

        setTimeout(function () { ScrollTrigger.refresh(); }, 500);
      } catch(e) { /* hero parallax failed — no big deal */ }
    }
  }

  /* ---- Counter Animation ---- */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const start = performance.now();

    function update(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * target);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(update);
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

  /* ---- Easter Egg ---- */
  const footerLogo = document.getElementById('footer-logo');
  if (footerLogo) {
    let clickCount = 0;
    let clickTimer;

    footerLogo.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 2000);

      if (clickCount >= 5) {
        clickCount = 0;
        triggerExplosion();
      }
    });
  }

  function triggerExplosion() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const parts = [];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 4 + 1,
        alpha: 1,
        color: Math.random() > 0.5 ? '#B8C4D0' : '#E0E2E8',
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      parts.forEach((p) => {
        if (p.alpha <= 0) return;
        alive = true;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.alpha -= 0.012;
      });

      if (alive) requestAnimationFrame(animate);
      else canvas.remove();
    }

    animate();
  }

  // ===== PORTFOLIO: Category Filters + Hover Video Previews =====
  const pfTabs = document.querySelectorAll('.pf-tab');
  const pfCards = document.querySelectorAll('.pf-card');

  if (pfTabs.length && pfCards.length) {
    // Filter behavior — matches on data-services (space-separated service slugs),
    // falls back to data-cat for legacy cards (e.g. the websites card).
    function cardMatches(card, filter) {
      if (filter === 'all') return true;
      const services = (card.dataset.services || '').split(/\s+/).filter(Boolean);
      if (services.includes(filter)) return true;
      return card.dataset.cat === filter;
    }
    pfTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        pfTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        pfCards.forEach(card => {
          card.classList.toggle('is-hidden', !cardMatches(card, filter));
        });
      });
    });

    // Lazy-load video sources as cards enter the viewport (saves bandwidth)
    const lazyLoadVideo = (video) => {
      if (video.dataset.loaded || !video.dataset.src) return;
      const source = document.createElement('source');
      source.src = video.dataset.src;
      source.type = 'video/mp4';
      video.appendChild(source);
      video.load();
      video.dataset.loaded = '1';
    };

    // Each card shows a static poster image (.pf-card-poster) as its idle
    // state. Video is loaded and played only on hover; leaving the card
    // pauses and resets the video so the poster re-covers it.
    pfCards.forEach(card => {
      const vid = card.querySelector('video.pf-card-media');
      if (!vid) return;
      card.addEventListener('mouseenter', () => {
        lazyLoadVideo(vid);
        const p = vid.play();
        if (p !== undefined) p.catch(() => { /* autoplay blocked — ignore */ });
      });
      card.addEventListener('mouseleave', () => {
        vid.pause();
        try { vid.currentTime = 0; } catch(e) { /* ignore */ }
      });
    });

    // Website preview iframes are intentionally never loaded — no hover preview.
    // Each card stays a clean gradient tile with its corner labels; clicking the
    // card still opens the live site in a new tab.
  }

  /* ============================================
     BOOKING MODAL — Multi-step wizard
     (Deferred: modal HTML appears AFTER this script in index.html)
     ============================================ */
  function initBookingModal() {
    var modal = document.getElementById('bookingModal');
    var form = document.getElementById('bookingForm');
    if (!modal || !form) return;

    var currentStep = 1;
    var selectedType = '';

    function openBooking(e) {
      if (e) e.preventDefault();
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeBooking() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(function () {
        goToStep(1);
        selectedType = '';
        form.reset();
        document.querySelectorAll('.bk-type').forEach(function (c) { c.classList.remove('selected'); });
        var hidden = document.getElementById('bkProjectType');
        if (hidden) hidden.value = '';
      }, 500);
    }

    function goToStep(step) {
      currentStep = step;
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

      // Re-trigger stagger
      if (target) {
        target.querySelectorAll('.bk-stagger').forEach(function (el) {
          el.style.animation = 'none';
          void el.offsetHeight; // reflow to restart animation
          el.style.animation = '';
        });
      }
    }

    // Type selection → auto-advance
    document.querySelectorAll('.bk-type').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('.bk-type').forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        selectedType = card.dataset.type;
        var hidden = document.getElementById('bkProjectType');
        if (hidden) hidden.value = selectedType;
        setTimeout(function () { goToStep(2); }, 320);
      });
    });

    // Back / Continue navigation
    document.querySelectorAll('.bk-back, .bk-continue:not(.booking-submit-btn)').forEach(function (btn) {
      if (btn.dataset.goto) {
        btn.addEventListener('click', function () { goToStep(parseInt(btn.dataset.goto, 10)); });
      }
    });

    // Open triggers — hero Book button + nav pill Book
    document.querySelectorAll('[data-book-open]').forEach(function (btn) {
      btn.addEventListener('click', openBooking);
    });

    // Close triggers
    var closeBtn = document.getElementById('bookingClose');
    var backdrop = document.getElementById('bookingBackdrop');
    var doneBtn = document.getElementById('bookingDone');
    if (closeBtn) closeBtn.addEventListener('click', closeBooking);
    if (backdrop) backdrop.addEventListener('click', closeBooking);
    if (doneBtn) doneBtn.addEventListener('click', closeBooking);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeBooking();
    });

    // Submit via Formspree AJAX — matches the gate contact form pattern
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var submitBtn = form.querySelector('.booking-submit-btn');
      var originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        if (r.ok) {
          goToStep(4);
        } else {
          submitBtn.innerHTML = 'Error — try again';
          setTimeout(function () { submitBtn.innerHTML = originalText; }, 3000);
        }
      }).catch(function () {
        submitBtn.innerHTML = 'Error — try again';
        setTimeout(function () { submitBtn.innerHTML = originalText; }, 3000);
      }).finally(function () {
        submitBtn.disabled = false;
        if (submitBtn.innerHTML === 'Sending...') submitBtn.innerHTML = originalText;
      });
    });
  }

  function initDiscoveryCall() {
    // Matches both the standalone section button and the in-modal option
    var triggers = document.querySelectorAll('[data-calendly-url]');
    if (!triggers.length) return;
    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var url = btn.getAttribute('data-calendly-url');
        if (!url) return;

        // Close the booking modal first if it's open (so Calendly's popup takes over cleanly)
        var modal = document.getElementById('bookingModal');
        if (modal && modal.classList.contains('active')) {
          modal.classList.remove('active');
          modal.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
        }

        if (window.Calendly) {
          window.Calendly.initPopupWidget({ url: url });
        } else {
          // Calendly script hasn't loaded yet — fall back to a new tab
          window.open(url, '_blank', 'noopener');
        }
      });
    });
  }

  // Booking modal + categories section + discovery call need DOM to be parsed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initBookingModal();
      initCategoriesSection();
      initDiscoveryCall();
    });
  } else {
    initBookingModal();
    initCategoriesSection();
    initDiscoveryCall();
  }

  /* ============================================
     CATEGORIES SECTION — Senti-style hover rows
     Clicking a row scrolls to #work and activates that portfolio filter
     ============================================ */
  function initCategoriesSection() {
    var cards = document.querySelectorAll('.cat-card');
    if (!cards.length) return;

    function lazyLoadCardVideo(card) {
      var vid = card.querySelector('video.cat-card-video');
      if (!vid) return null;
      var src = vid.querySelector('source[data-src]');
      if (src && !src.getAttribute('src')) {
        src.setAttribute('src', src.getAttribute('data-src'));
        vid.load();
      }
      return vid;
    }

    cards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        var vid = lazyLoadCardVideo(card);
        if (!vid) return;
        var p = vid.play();
        if (p !== undefined) p.catch(function () { /* autoplay blocked — ignore */ });
      });
      card.addEventListener('mouseleave', function () {
        var vid = card.querySelector('video.cat-card-video');
        if (!vid) return;
        vid.pause();
        try { vid.currentTime = 0; } catch (e) { /* ignore */ }
      });

      card.addEventListener('click', function (e) {
        e.preventDefault();
        var filter = card.getAttribute('data-filter');
        var workSection = document.getElementById('work');
        if (!workSection) return;

        // Reset the card's hover state — pause/reset the video and drop focus
        // so the poster re-covers and the button doesn't stay visually "pressed".
        var vid = card.querySelector('video.cat-card-video');
        if (vid) {
          vid.pause();
          try { vid.currentTime = 0; } catch (_) {}
        }
        if (card.blur) card.blur();

        var tabs = document.querySelectorAll('.pf-tab');
        var pfCardsEls = document.querySelectorAll('.pf-card');
        tabs.forEach(function (t) {
          t.classList.toggle('active', t.getAttribute('data-filter') === filter);
        });
        pfCardsEls.forEach(function (c) {
          var matches = filter === 'all';
          if (!matches) {
            var services = (c.getAttribute('data-services') || '').split(/\s+/).filter(Boolean);
            matches = services.indexOf(filter) !== -1 || c.getAttribute('data-cat') === filter;
          }
          c.classList.toggle('is-hidden', !matches);
        });

        // Compute target after filter reflow (getBoundingClientRect forces
        // synchronous layout), then scroll via Lenis to match the anchor-link
        // pattern. Native scrollIntoView fights Lenis and lands in random spots.
        var top = workSection.getBoundingClientRect().top + window.scrollY - 80;
        if (lenis) {
          lenis.scrollTo(top);
        } else {
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

})();
