/* ============================================
   CREATEXODUS — Liquid Glass runtime
   1. Ambient backdrop: a tiny blurred loop of the hero footage behind the page,
      so the glass frame has moving light to refract.
   2. Edge lensing: an SVG displacement filter (Chromium) that bends the
      backdrop at the rim of the nav tab, the way Apple's glass does.
   3. Adaptive tint: the tab switches to light glass with dark text while it
      floats over a light card.
   ============================================ */

(function () {
  'use strict';

  var root = /\/work\//.test(location.pathname) ? '../' : '';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !/motion=force/.test(location.search);

  /* ---- 1. Ambient video ---- */
  var smallScreen = window.matchMedia('(max-width: 768px)').matches;
  if (!reduceMotion && !smallScreen) {
    var amb = document.createElement('video');
    amb.className = 'ambient';
    amb.muted = true; amb.loop = true; amb.playsInline = true; amb.autoplay = true;
    amb.setAttribute('muted', ''); amb.setAttribute('playsinline', ''); amb.setAttribute('aria-hidden', 'true');
    amb.src = root + 'assets/ambient.mp4';
    document.body.prepend(amb);
    var playAmb = function () { var p = amb.play(); if (p && p.catch) p.catch(function () {}); };
    playAmb();
    window.addEventListener('load', playAmb);
    window.addEventListener('pointerdown', playAmb, { once: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) playAmb(); });
  }

  /* ---- 2. Lens filter (displacement map drawn on a canvas) ---- */
  function buildLensMap(w, h, band, radius) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    // Signed distance to a rounded rectangle (negative inside)
    function sdf(px, py) {
      var hx = w / 2 - radius, hy = h / 2 - radius;
      var qx = Math.abs(px - w / 2) - hx, qy = Math.abs(py - h / 2) - hy;
      var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - radius;
    }
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var dist = sdf(x + 0.5, y + 0.5);
        var t = 1 + dist / band;               // 0 deep inside, 1 at the edge
        if (t < 0) t = 0; if (t > 1) t = 1;
        var mag = t * t * t;                    // ease-in toward the rim
        // outward normal from the SDF gradient
        var e = 0.75;
        var nx = sdf(x + e, y) - sdf(x - e, y);
        var ny = sdf(x, y + e) - sdf(x, y - e);
        var len = Math.sqrt(nx * nx + ny * ny) || 1;
        nx /= len; ny /= len;
        d[i] = Math.round(128 + nx * mag * 127);
        d[i + 1] = Math.round(128 + ny * mag * 127);
        d[i + 2] = 128;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL('image/png');
  }

  function injectLens() {
    if (!CSS.supports('backdrop-filter', 'url(#x)') && !CSS.supports('-webkit-backdrop-filter', 'url(#x)')) return;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.innerHTML =
      '<filter id="lg-lens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
        '<feImage href="' + buildLensMap(480, 150, 34, 36) + '" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G" result="lens"/>' +
        '<feGaussianBlur in="lens" stdDeviation="0.4"/>' +
      '</filter>' +
      '<filter id="lg-lens-pill" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
        '<feImage href="' + buildLensMap(960, 60, 18, 30) + '" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="14" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter>';
    document.body.prepend(svg);
    document.documentElement.classList.add('has-lens');
  }
  injectLens();

  /* ---- 3. Nav outline: one clip-path (shoulders + rounded bottom), resized live ---- */
  var navEl = document.getElementById('nav');
  if (navEl) {
    var isWebKit = navigator.vendor === 'Apple Computer, Inc.';
    var clipNav = function () {
      var W = navEl.offsetWidth, H = navEl.offsetHeight;
      var r = Math.min(25, H / 2);
      var d = 'M0 0 H' + W + ' A' + r + ' ' + r + ' 0 0 0 ' + (W - r) + ' ' + r +
        ' V' + (H - r) + ' A' + r + ' ' + r + ' 0 0 1 ' + (W - 2 * r) + ' ' + H + ' H' + (2 * r) +
        ' A' + r + ' ' + r + ' 0 0 1 ' + r + ' ' + (H - r) + ' V' + r + ' A' + r + ' ' + r + ' 0 0 0 0 0 Z';
      if (isWebKit) {
        // WebKit does not clip a backdrop-filtered layer with clip-path; a mask of the same shape does the job
        var svg = "url(\"data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "'><path d='" + d + "' fill='#000'/></svg>") + "\")";
        navEl.style.webkitMaskImage = svg;
        navEl.style.maskImage = svg;
        navEl.style.webkitMaskSize = '100% 100%';
        navEl.style.maskSize = '100% 100%';
        navEl.style.webkitMaskRepeat = 'no-repeat';
        navEl.style.maskRepeat = 'no-repeat';
        navEl.style.webkitClipPath = 'none';
        navEl.style.clipPath = 'none';
      } else {
        navEl.style.clipPath = "path('" + d + "')";
      }
    };
    clipNav();
    if ('ResizeObserver' in window) new ResizeObserver(clipNav).observe(navEl);
    window.addEventListener('resize', clipNav);
  }

  /* ---- 4. Phone menu sheet: built from the tab's links, toggled with a class on <html> ---- */
  var navForSheet = document.getElementById('nav');
  if (navForSheet) {
    var sheet = document.createElement('div');
    sheet.className = 'menu-sheet';
    sheet.setAttribute('aria-hidden', 'true');
    var links = navForSheet.querySelectorAll('.nav-link');
    var idx = 0;
    links.forEach(function (l, i) {
      var a = document.createElement('a');
      a.href = l.getAttribute('href') || '#contact';
      a.textContent = l.textContent.trim();
      a.style.setProperty('--i', idx++);
      if (l.hasAttribute('data-book-open')) a.setAttribute('data-book-open', '');
      sheet.appendChild(a);
      if (i === 2) { var rule = document.createElement('span'); rule.className = 'menu-sheet-rule'; sheet.appendChild(rule); }
    });
    var closeZone = document.createElement('div'); closeZone.className = 'menu-sheet-close'; sheet.appendChild(closeZone);
    document.body.appendChild(sheet);

    var htmlEl = document.documentElement;
    var setOpen = function (open) {
      htmlEl.classList.toggle('menu-open', open);
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    var toggle = document.getElementById('navToggle');
    if (toggle) toggle.addEventListener('click', function (e) { e.stopPropagation(); setOpen(!htmlEl.classList.contains('menu-open')); });
    closeZone.addEventListener('click', function () { setOpen(false); });
    sheet.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      setOpen(false);
      if (a.hasAttribute('data-book-open')) { e.preventDefault(); var b = navForSheet.querySelector('[data-book-open]'); if (b) setTimeout(function () { b.click(); }, 350); }
      // in-page anchors are handled by the page's own anchor logic (main.js / project.js)
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.__closeMenu = function () { setOpen(false); };
  }

  /* ---- 5. Adaptive tint for the nav tab ---- */
  var nav = document.getElementById('nav');
  if (nav) {
    var lightSel = '.card--light, .proj-media, .gfx-stack, .wk-section';
    var ticking = false;
    function check() {
      ticking = false;
      var x = window.innerWidth / 2, y = 36;
      var stack = document.elementsFromPoint(x, y);
      var onLight = false;
      for (var i = 0; i < stack.length; i++) {
        var el = stack[i];
        if (el === nav || nav.contains(el)) continue;
        if (el.matches && el.matches(lightSel)) { onLight = true; break; }
        if (el.matches && el.matches('.card, .cs, .proj-hero, .proj-nav-bottom, .footer, section, main, body')) break;
      }
      nav.classList.toggle('on-light', onLight);
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(check, 50);
    setTimeout(check, 600);
  }
})();
