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
  if (!reduceMotion) {
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

  /* ---- 3. Adaptive tint for the nav tab ---- */
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
