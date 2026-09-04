/* ============================================
   CREATEXODUS — Text motion
   The intro's typographic language, applied site-wide on scroll:
   - display lines rise letter by letter from a mask
   - headings and paragraphs rise word by word
   - small labels tighten from wide tracking into place
   Runs once per element as it enters the viewport.
   ============================================ */

(function () {
  'use strict';
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=force/.test(location.search);
  var speed = reduce ? 0.6 : 1;
  var small = window.matchMedia('(max-width: 768px)').matches;

  var SEL = {
    chars: '.proj-hero-title, .proj-prev-title, .proj-next-title, .cs-l1 > span, .cs-l2 > span',
    words: '.split-title, .prose, .cs-desc, .footer-blurb, .proj-detail-value, .proj-media-heading, .gfx-chapter-title, .gfx-chapter-sub, .gfx-feature-text, .wk-intro, .cta-pill-text, .client-row > span',
    track: '.eyebrow, .cs-kicker, .proj-hero-label, .proj-detail-label, .proj-prev-label, .proj-next-label, .gfx-pair-label, .cases-more-text, .wk-count, .footer-name'
  };

  /* Wrap text nodes into masked units; element children are left intact */
  function split(el, mode) {
    if (el.dataset.split) return el.querySelectorAll('.mi');
    var nodes = Array.prototype.slice.call(el.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType !== 3) return;
      var text = node.nodeValue;
      if (!text.trim()) return;
      var frag = document.createElement('span');
      frag.className = 'ms';
      if (mode === 'chars') {
        text.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var word = document.createElement('span');
          word.className = 'mword';
          for (var i = 0; i < part.length; i++) word.appendChild(unit(part[i]));
          frag.appendChild(word);
        });
      } else {
        var parts = text.split(/(\s+)/);
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(' '));
          else frag.appendChild(unit(p));
        });
      }
      node.parentNode.replaceChild(frag, node);
    });
    el.dataset.split = mode;
    return el.querySelectorAll('.mi');
  }
  function unit(text) {
    var m = document.createElement('span');
    m.className = 'mw';
    var i = document.createElement('span');
    i.className = 'mi';
    i.textContent = text;
    m.appendChild(i);
    return m;
  }

  function trigger(el, start) {
    return { trigger: el, start: start || 'top 88%', toggleActions: 'play none none none' };
  }

  /* Letter rise */
  document.querySelectorAll(SEL.chars).forEach(function (el) {
    if (el.closest('.hero') || el.dataset.split) return;
    var units = split(el, small ? 'words' : 'chars');
    if (!units.length) return;
    gsap.fromTo(units, { yPercent: 115 }, {
      yPercent: 0, duration: (small ? 0.9 : 1.05) * speed, ease: 'expo.out',
      stagger: Math.min(small ? 0.08 : 0.035, 0.7 / units.length),
      scrollTrigger: trigger(el.closest('.cs') || el)
    });
  });

  /* Word rise */
  document.querySelectorAll(SEL.words).forEach(function (el) {
    if (el.closest('.hero') || el.dataset.split || el.hasAttribute('data-fill')) return;
    var units = split(el, 'words');
    if (!units.length) return;
    gsap.fromTo(units, { yPercent: 110, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.95 * speed, ease: 'expo.out',
      stagger: Math.min(0.03, 0.55 / units.length),
      scrollTrigger: trigger(el.closest('.cs') || el, el.closest('.cs') ? 'top 88%' : 'top 90%')
    });
  });

  /* Tracking tighten */
  document.querySelectorAll(SEL.track).forEach(function (el) {
    if (el.closest('.hero') || el.closest('.nav')) return;
    if (small) {
      // letter-spacing tweens jitter on phones: plain rise instead
      gsap.fromTo(el, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 * speed, ease: 'power3.out',
        scrollTrigger: trigger(el.closest('.cs') || el, 'top 92%') });
      return;
    }
    var finalLs = getComputedStyle(el).letterSpacing;
    var px = parseFloat(finalLs) || 0;
    gsap.fromTo(el, { opacity: 0, letterSpacing: (px * 3 + 5) + 'px', x: 6 }, {
      opacity: 1, letterSpacing: finalLs === 'normal' ? '0px' : finalLs, x: 0,
      duration: 1.3 * speed, ease: 'expo.out',
      scrollTrigger: trigger(el.closest('.cs') || el, 'top 92%')
    });
  });

})();
