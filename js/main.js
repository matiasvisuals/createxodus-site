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
  var gateVisible = document.getElementById('password-gate') && document.getElementById('password-gate').style.display !== 'none';
  if (typeof Lenis !== 'undefined') {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    /* Stop Lenis while password gate is active so gate can scroll natively */
    if (gateVisible) lenis.stop();

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

  /* Start Lenis when password gate is dismissed */
  if (lenis && gateVisible) {
    window.addEventListener('gate-dismissed', function() { lenis.start(); }, { once: true });
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

  /* ---- Contact Form ---- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('#c-name').value;
      var email = contactForm.querySelector('#c-email').value;
      var type = contactForm.querySelector('#c-type').value;
      var budget = contactForm.querySelector('#c-budget').value;
      var msg = contactForm.querySelector('#c-msg').value;

      var subject = encodeURIComponent('New Project Inquiry from ' + name);
      var body = encodeURIComponent(
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Project Type: ' + type + '\n' +
        'Budget: ' + budget + '\n\n' +
        'Message:\n' + msg
      );

      window.location.href = 'mailto:matias@createxodus.com?subject=' + subject + '&body=' + body;
    });
  }

  /* ---- Globe is initialized via ES module in index.html ---- */

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

        gsap.to('.hero-inner', {
          y: -80,
          opacity: 0,
          scrollTrigger: {
            trigger: '#hero',
            start: '60% top',
            end: 'bottom top',
            scrub: 1,
          },
        });

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

})();
