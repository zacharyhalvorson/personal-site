// Progressive enhancement for project media: iMessage-style stacks you can
// leaf through inline, plus a fullscreen carousel that morphs from the tapped
// item with a FLIP animation. Neighbours peek from the sides as the swipe /
// tap-to-progress affordance. The only UI chrome is a small close button.
// No dependencies, no build. With JS off, the markup degrades to a native
// scroll-snap strip.

(function () {
  'use strict';

  // ---------- scroll restoration ----------
  // `scroll-snap-type: y mandatory` + the browser's auto scroll-restore is a
  // bad pair: the browser restores the prior scrollY, then images, fonts, and
  // the intro name-collapse animation shift section boundaries, and the
  // mandatory snap yanks to whatever section is now nearest — sometimes a
  // different one further down. Take over: honour an explicit URL hash,
  // otherwise pin to the top. `behavior: 'instant'` is mandatory because
  // `html { scroll-behavior: smooth }` would otherwise turn the pin into a
  // visible glide on every load.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function anchorScroll() {
    var hash = location.hash && location.hash.length > 1 ? location.hash.slice(1) : '';
    if (hash) {
      var el = document.getElementById(hash);
      if (el) { el.scrollIntoView({ block: 'start', inline: 'nearest', behavior: 'instant' }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
  // Initial pin runs as soon as the script executes (defer guarantees the DOM
  // is parsed); the `load` re-pin catches layout shifts from late images, but
  // bails out if the reader has already scrolled, otherwise it would yank
  // them back to the top on a slow connection.
  var userScrolled = false;
  anchorScroll();
  addEventListener('scroll', function () { userScrolled = true; }, { passive: true, once: true });
  window.addEventListener('load', function () {
    if (!userScrolled) anchorScroll();
  });
  // History traversal (back/forward across in-page hash links). Browser-level
  // auto-scroll-to-hash is suppressed by scrollRestoration='manual', so we
  // pick it up explicitly. `popstate` only fires on history navigation, never
  // on plain anchor-link clicks — those still get the CSS smooth-scroll.
  window.addEventListener('popstate', anchorScroll);
  // In-page hash links (Work ↓, rail nav, skip link). The native anchor-click
  // scroll lands instantly on this site — `scroll-snap-type: y mandatory`
  // short-circuits the CSS `scroll-behavior: smooth` animation — so hijack
  // it and drive the scroll from JS with an explicit smooth scrollIntoView.
  // Reduced-motion users still jump.
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { id = hash.slice(1); }
    var target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // Update URL without firing popstate (which would jump instantly via
    // anchorScroll). pushState records the entry so back/forward still work.
    if (location.hash !== hash) history.pushState(null, '', hash);
    // Drop focus from the anchor — but ONLY for rail links. Safari
    // activates :focus-visible on anchor mouse-clicks (Chromium does not),
    // and the rail's expanded dot+label style is shared with :focus-visible;
    // blurring keeps the rail from sticking in the expanded state. Scoping
    // to .rail preserves focus on the skip-link and on the intro's
    // chapter_next so keyboard users can keep Tabbing forward instead of
    // having focus snap back to body after every in-page jump.
    if (a.closest && a.closest('.rail') && typeof a.blur === 'function') {
      a.blur();
    }
  });
  // bfcache restore (iOS Safari / Firefox back from external link). The
  // browser preserves scrollY across bfcache, so we don't re-pin; just
  // re-assert manual restoration in case the browser reset it on the
  // restored entry.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && 'scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  });

  // ---------- title animation: matches the "Zachary" -> "Zach" collapse ----------
  // Mirrors the .display_dim collapse end (CSS: 4.5s delay + 0.6s duration).
  // Skipped on narrow viewports and for reduced-motion users, who see the full
  // name statically in the heading anyway.
  (function () {
    var narrow = window.matchMedia && window.matchMedia('(max-width: 599px)').matches;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (narrow || reduce) return;
    setTimeout(function () { document.title = 'Zach Halvorson — Staff Product Designer'; }, 5100);
  })();

  // ---------- iOS-style squircle corners ----------
  // Approximation: single cubic Bezier per corner with extended influence
  // (smoothing = 1.4) so the curve eases in/out further from the corner than
  // a pure quarter-circle. Reads good enough as a G2 continuous corner.
  function squirclePath(w, h, r) {
    var smooth = 1.4;
    var d = Math.min(r * smooth, Math.min(w, h) / 2);
    var c = d * 0.42;
    var n = function (v) { return v.toFixed(3); };
    return [
      'M', n(d), 0,
      'L', n(w - d), 0,
      'C', n(w - c), 0, n(w), n(c), n(w), n(d),
      'L', n(w), n(h - d),
      'C', n(w), n(h - c), n(w - c), n(h), n(w - d), n(h),
      'L', n(d), n(h),
      'C', n(c), n(h), 0, n(h - c), 0, n(h - d),
      'L', 0, n(d),
      'C', 0, n(c), n(c), 0, n(d), 0,
      'Z',
    ].join(' ');
  }
  function applySquircle(el) {
    var w = el.offsetWidth, h = el.offsetHeight;
    if (!w || !h) return;
    var r = parseFloat(getComputedStyle(el).getPropertyValue('--smooth-r'));
    if (!r) { el.style.clipPath = ''; return; }
    r = Math.min(r, Math.min(w, h) / 2);
    el.style.clipPath = 'path("' + squirclePath(w, h, r) + '")';
  }
  var squircleObserver = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(function (entries) {
    entries.forEach(function (e) { applySquircle(e.target); });
  }) : null;
  function watchSquircle(el) {
    applySquircle(el);
    if (squircleObserver) squircleObserver.observe(el);
  }
  // Unobserve before detaching DOM nodes so the singleton ResizeObserver
  // releases its strong reference. Without this, every lightbox close
  // leaks the just-built itemEls' img/video/controls indefinitely.
  function unwatchSquircle(el) {
    if (squircleObserver && el) squircleObserver.unobserve(el);
  }
  // Apply to everything that exists at load time.
  document.querySelectorAll('.media_item img, .media_item video, .intro_photo img').forEach(watchSquircle);

  // ---------- rail nav: highlight the current section ----------
  // As the user scrolls between scroll-snapped chapters, mark the rail link
  // whose href matches the section currently in view. CSS uses .is-current to
  // make that dash a touch longer and darker than its siblings.
  (function () {
    if (typeof IntersectionObserver === 'undefined') return;
    var links = {};
    document.querySelectorAll('.rail a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var sections = document.querySelectorAll('main section[id]');
    if (!sections.length) return;
    var ratios = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { ratios[e.target.id] = e.intersectionRatio; });
      // Pick the most-visible section and mark its link current.
      var bestId = null, bestR = 0;
      Object.keys(ratios).forEach(function (id) {
        if (ratios[id] > bestR) { bestR = ratios[id]; bestId = id; }
      });
      Object.keys(links).forEach(function (id) {
        links[id].classList.toggle('is-current', id === bestId && bestR > 0.35);
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    sections.forEach(function (s) { io.observe(s); });

    // ---------- rail nav: JS-driven hover ----------
    // Track real cursor presence via pointerenter/pointerleave instead of
    // relying on CSS :hover. CSS :hover can stay stuck after a click in
    // some browsers, and Safari additionally activates :focus-visible on
    // anchor mouse-clicks — the previous CSS shared the expanded style
    // between :hover and :focus-visible, so a clicked link stayed stuck
    // in that state. With JS-driven .is-hovered, the dot+label expansion
    // is exclusively tied to actual cursor presence.
    function clearAllHover() {
      Object.keys(links).forEach(function (id) { links[id].classList.remove('is-hovered'); });
    }
    Object.keys(links).forEach(function (id) {
      var a = links[id];
      a.addEventListener('pointerenter', function (e) {
        // Touch/pen taps are not "hover"; iOS Safari would otherwise leave
        // the class on after a tap. Filter strictly to mouse.
        if (e.pointerType && e.pointerType !== 'mouse') return;
        // Defensive: clear hover from siblings first. Some browsers under
        // rapid pointer movement skip a pointerleave on the previous link
        // when it fires pointerenter on the new one.
        clearAllHover();
        a.classList.add('is-hovered');
      });
      a.addEventListener('pointerleave', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        a.classList.remove('is-hovered');
      });
    });
    // Rail-level safety net — when the cursor truly leaves the rail
    // container, drop is-hovered from every link. Catches the case where
    // a per-link pointerleave was missed (e.g. cursor moves fast enough
    // that the browser collapses events, or the link's bounding box
    // shifted underneath the cursor during a hover-driven width change).
    var rail = document.querySelector('.rail');
    if (rail) {
      rail.addEventListener('pointerleave', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        clearAllHover();
      });
    }
    // Brute-force safety net — on every mousemove, verify that any link
    // currently marked `.is-hovered` still has the cursor in its bounding
    // box. If not, clear the class. Catches Safari's intermittent failure
    // to fire pointerleave when a child element (the dot) is mid-transition
    // and changing dimensions under the cursor. Cheap: only runs the rect
    // check for links that are currently flagged hovered (usually 0 or 1).
    document.addEventListener('mousemove', function (e) {
      Object.keys(links).forEach(function (id) {
        var a = links[id];
        if (!a.classList.contains('is-hovered')) return;
        var r = a.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right ||
            e.clientY < r.top  || e.clientY > r.bottom) {
          a.classList.remove('is-hovered');
        }
      });
    }, { passive: true });

    // Keyboard focus indicator: relies on the browser's :focus-visible
    // heuristic via CSS. We previously gated it on a Tab-keydown modality
    // flag to avoid Safari's click-induced :focus-visible from sticking,
    // but that excluded screen-reader and arrow-key focus moves (no Tab
    // key fires for those paths). The rail-scoped a.blur() in the global
    // click handler above clears focus on mouse activation, so Safari's
    // click-induced :focus-visible can't persist either way.
  })();

  var stacks = [].slice.call(document.querySelectorAll('[data-media]'));
  if (!stacks.length || typeof HTMLDialogElement === 'undefined') return;

  var lightbox = createLightbox();

  stacks.forEach(function (ul) {
    var items = readItems(ul);
    if (items.length === 1) setupSingle(ul, items);
    else if (items.length > 1) setupStack(ul, items);
  });

  // ---- read media descriptors straight from the DOM ----
  function readItems(ul) {
    return [].slice.call(ul.querySelectorAll('.media_item')).map(function (li) {
      var caption = li.getAttribute('data-caption') || '';
      var v = li.querySelector('video');
      if (v) {
        var s = v.querySelector('source');
        return {
          type: 'video',
          src: (s && s.getAttribute('src')) || v.getAttribute('src'),
          poster: v.getAttribute('poster') || '',
          alt: 'Video',
          w: +v.getAttribute('width') || 16,
          h: +v.getAttribute('height') || 9,
          caption: caption,
          el: li,
        };
      }
      var img = li.querySelector('img');
      // Prefer currentSrc so the lightbox loads whatever variant the browser
      // already picked (WebP from <picture><source>, the right responsive
      // width via srcset/sizes). Falls back to the literal src attribute if
      // currentSrc isn't populated yet (e.g., img hasn't been laid out).
      return {
        type: 'image',
        src: img.currentSrc || img.getAttribute('src'),
        alt: img.alt || '',
        w: +img.getAttribute('width') || 4,
        h: +img.getAttribute('height') || 3,
        caption: caption,
        el: li,
      };
    });
  }

  // ---- single item: tap opens fullscreen ----
  function setupSingle(ul, items) {
    var li = items[0].el;
    ul.classList.add('is-zoomable');
    ul.setAttribute('role', 'button');
    ul.setAttribute('tabindex', '0');
    ul.setAttribute('aria-label', 'Expand ' + items[0].type);
    ul.style.setProperty('--active-w', items[0].w);
    ul.style.setProperty('--active-h', items[0].h);
    var sync = function () { /* nothing to do, single item */ };
    ul.addEventListener('click', function () { lightbox.open(items, 0, li, sync); });
    ul.addEventListener('keydown', function (e) {
      // Enter opens, but NOT Space — after closing the lightbox the browser
      // returns focus to the stack, and Space at that point would re-open
      // the previously-viewed video instead of scrolling the page.
      if (e.key === 'Enter') { e.preventDefault(); lightbox.open(items, 0, li, sync); }
    });
  }

  // ---- multiple items: fanned stack, no visible chrome ----
  // The top card follows your finger as you drag (iMessage-style); release
  // past a threshold to leaf. A plain tap opens the fullscreen carousel.
  function setupStack(ul, items) {
    var lis = items.map(function (it) { return it.el; });
    var active = 0;

    ul.classList.add('is-stack');
    ul.setAttribute('role', 'group');
    ul.setAttribute('tabindex', '0');
    ul.setAttribute('aria-roledescription', 'media stack');
    ul.setAttribute('aria-label', items.length + ' items. Drag to browse, tap to expand');

    // Size each card to its own natural aspect, fitting within the stack's
    // bounding box. The stack itself stays at the CSS-fixed size, so swiping
    // never resizes the container, only the card inside changes shape.
    function sizeCards() {
      var r = ul.getBoundingClientRect();
      var boxW = r.width, boxH = r.height;
      if (!boxW || !boxH) return;
      items.forEach(function (it, i) {
        var li = lis[i];
        var aspect = it.w / it.h;
        var w, h;
        if (boxW / aspect <= boxH) {
          w = boxW; h = boxW / aspect;
        } else {
          h = boxH; w = boxH * aspect;
        }
        li.style.width = w + 'px';
        li.style.height = h + 'px';
      });
    }
    function render() {
      // Use the active card's width to compute how far each behind-card must
      // be offset so its edge always peeks past the active. Narrow cards
      // (tall phone screenshots) behind a wider active need a bigger push
      // than the default per-step offset can give.
      var activeW = parseFloat(lis[active].style.width) || lis[active].offsetWidth || 0;
      var peek = 14;
      lis.forEach(function (li, i) {
        var pos = i - active;
        var apos = Math.min(Math.abs(pos), 3);
        li.style.transform = '';
        li.style.opacity = '';
        var selfW = parseFloat(li.style.width) || li.offsetWidth || 0;
        // tx = whichever is larger: linear per-step offset, or just enough
        // to push self's edge past active's edge by N * peek.
        var stepTx = apos * peek;
        var requiredTx = (activeW - selfW) / 2 + apos * peek;
        var tx = Math.max(stepTx, requiredTx);
        if (pos < 0) tx = -tx;
        li.style.setProperty('--stack-tx', tx + 'px');
        li.style.setProperty('--pos', pos);
        li.style.setProperty('--apos', apos);
        li.style.zIndex = items.length - apos;
        li.classList.toggle('is-hidden', apos > 2);
        li.classList.toggle('is-front', pos === 0);
        li.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
    }
    function settle(d) {
      ul.classList.remove('is-dragging');
      void ul.offsetWidth;
      active = Math.min(items.length - 1, Math.max(0, active + d));
      render();
    }
    // External sync, called by the lightbox after a navigation so the
    // in-page stack matches what the user just left on. The morph close
    // then lands on the right (and now visible) source item.
    function setActiveTo(i) {
      active = Math.min(items.length - 1, Math.max(0, i));
      render();
    }

    var x0 = 0, y0 = 0, t0 = 0, moved = false, down = false, horizontal = false;
    ul.addEventListener('dragstart', function (e) { e.preventDefault(); });
    ul.addEventListener('pointerdown', function (e) {
      down = true; moved = false; horizontal = false;
      x0 = e.clientX; y0 = e.clientY;
      t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      try { ul.setPointerCapture(e.pointerId); } catch (_) {}
    });
    ul.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      // Two-stage detection. We need preventDefault to fire early — with
      // `touch-action: pan-y` the browser would otherwise pan vertically
      // during the first frames of a horizontal swipe, and on a mandatory-snap
      // page even a couple of upward pixels can tip the snap to the previous
      // section. But we also can't set `moved` early, because the release path
      // treats `!moved` as a tap (opens the lightbox), and a sloppy tap with
      // a few px of finger drift must still count as a tap. So claim
      // `preventDefault` at 5px of clearly-horizontal motion, but only commit
      // to `moved` at the usual 8px tap/swipe boundary.
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
        if (e.cancelable) e.preventDefault();
      }
      if (!moved && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        moved = true;
        horizontal = Math.abs(dx) > Math.abs(dy);
      }
      if (moved && horizontal) {
        if (e.cancelable) e.preventDefault();
        ul.classList.add('is-dragging');
        var atEdge = (active === 0 && dx > 0) || (active === items.length - 1 && dx < 0);
        var eff = atEdge ? dx * 0.3 : dx;
        var front = lis[active];
        front.style.transform = 'translateX(' + eff + 'px) rotate(' + (eff * 0.02) + 'deg)';
        front.style.opacity = '1';
        front.style.zIndex = items.length + 1;
      }
    });
    function release(e) {
      if (!down) return;
      down = false;
      var dx = e.clientX - x0;
      var dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
      // Distance OR a fast flick commits, same logic as the lightbox track.
      var distOK = Math.abs(dx) > Math.max(28, ul.clientWidth * 0.08);
      var velocity = dt > 0 ? Math.abs(dx) / dt : 0;
      var flickOK = velocity > 0.45 && Math.abs(dx) > 16;
      if (horizontal && (distOK || flickOK)) settle(dx < 0 ? 1 : -1);
      else if (!moved) lightbox.open(items, active, lis[active], setActiveTo);
      else settle(0);
    }
    ul.addEventListener('pointerup', release);
    ul.addEventListener('pointercancel', function () { if (down) { down = false; settle(0); } });

    // Trackpad/Magic-Mouse horizontal flick: same gesture model as the
    // lightbox, accumulate deltaX, commit once per burst, reset on idle.
    // Pure vertical wheel is left alone so the page can scroll-snap.
    var wheelAcc = 0, wheelCommitted = false, wheelIdle = null, horizUntil = 0;
    ul.addEventListener('wheel', function (e) {
      var h = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      var now = Date.now();
      if (h) horizUntil = now + 200;
      if (!h && now > horizUntil) return;        // genuine vertical scroll → let the page have it
      e.preventDefault();
      if (!h) return;                            // momentum tail after a horizontal swipe, swallow

      if (!wheelCommitted) {
        wheelAcc += e.deltaX;
        if (Math.abs(wheelAcc) > 22) {
          settle(wheelAcc > 0 ? 1 : -1);
          wheelCommitted = true;
        }
      }
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(function () {
        wheelAcc = 0;
        wheelCommitted = false;
      }, 160);
    }, { passive: false });

    ul.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); settle(1); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); settle(-1); }
      // Enter opens; Space is intentionally NOT handled so it scrolls the
      // page normally even when the stack still has focus after closing
      // the lightbox.
      else if (e.key === 'Enter') { e.preventDefault(); lightbox.open(items, active, lis[active], setActiveTo); }
    });

    // Re-fit whenever the stack's box actually changes. On a cold cache,
    // Safari can run this defer script before style.css has applied — at
    // that point getBoundingClientRect returns the ul's natural content
    // height (a 1920×1080 video at intrinsic size, say), and sizeCards
    // stamps those huge numbers as inline width/height on every card,
    // overflowing the page until refresh. The fit() gate keeps the stack
    // hidden until the box's height is in its CSS-defined range, and a
    // ResizeObserver re-fires when the stylesheet finally applies (or
    // when the viewport / mobile address bar changes the box).
    ul.style.visibility = 'hidden';
    function fit() {
      var r = ul.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // .media.is-stack pins height to ≤ 520px (52svh). A box dramatically
      // taller than the viewport means CSS hasn't applied yet; defer.
      if (r.height > window.innerHeight) return;
      sizeCards();
      render();
      ul.style.visibility = '';
    }
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fit).observe(ul);
    } else {
      window.addEventListener('resize', fit);
    }
    fit();
  }

  // ---- shared fullscreen carousel lightbox ----
  // Builds a horizontal track of every item in the source stack. Active item
  // is centered; neighbours peek from each edge. Tap a peek or drag to leaf;
  // tap the backdrop or close button to dismiss. Open/close is a FLIP morph
  // from / to the in-page source rect using the Web Animations API.
  function createLightbox() {
    var EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
    var OPEN_MS = 420;
    var CLOSE_MS = 360;
    var NAV_MS = 320;
    // Caption swap timing — three sequential phases per swap so the user
    // never sees text inside a mid-morph pill (which previously read as a
    // flash). Total: FADE_MS + MORPH_MS + FADE_MS = ~600 ms.
    //
    // Timings are sourced from CSS custom properties on :root so the JS
    // and CSS stay in lockstep — see --cap-fade and --cap-morph in
    // style.css. Falls back to the documented defaults if the variables
    // aren't set (older builds, broken CSS load).
    var rootStyle = getComputedStyle(document.documentElement);
    function readMsVar(name, fallback) {
      var raw = (rootStyle.getPropertyValue(name) || '').trim();
      if (!raw) return fallback;
      var m = /^([0-9.]+)(ms|s)?$/.exec(raw);
      if (!m) return fallback;
      var n = parseFloat(m[1]);
      return m[2] === 's' ? n * 1000 : n;
    }
    var CAP_FADE_MS  = readMsVar('--cap-fade', 180);
    var CAP_MORPH_MS = readMsVar('--cap-morph', 240);
    // Add ~1 frame of slack so Phase 2 doesn't kick in while the CSS
    // opacity transition is still finishing — the JS timer measures from
    // BEFORE the class addition triggers the next style flush, so the
    // actual transition completes ~16 ms later than our setTimeout would
    // otherwise fire.
    var FADE_MS = CAP_FADE_MS + 20;
    var MORPH_MS = CAP_MORPH_MS;

    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    // Make the dialog itself focusable so we can pull focus off the first
    // focusable descendant (the active item's play button) on open.
    dlg.tabIndex = -1;
    dlg.innerHTML =
      '<div class="lightbox_track" role="group" aria-roledescription="carousel"></div>' +
      '<div class="lightbox_caption" aria-live="polite"><span class="lightbox_caption_text"></span></div>' +
      // Off-screen ghost, used to measure the natural width of the next caption
      // before we animate the visible pill's width to it. Without this we'd
      // either snap or have to render twice.
      '<div class="lightbox_caption is-ghost" aria-hidden="true"><span class="lightbox_caption_text"></span></div>';
    document.body.appendChild(dlg);

    var track = dlg.querySelector('.lightbox_track');
    var capEl = dlg.querySelector('.lightbox_caption:not(.is-ghost)');
    var capTxt = capEl.querySelector('.lightbox_caption_text');
    var capGhostTxt = dlg.querySelector('.lightbox_caption.is-ghost .lightbox_caption_text');
    var capGhostEl = dlg.querySelector('.lightbox_caption.is-ghost');
    var capSwapTimer = null;
    // Incremented on every syncCaption call. Pending timeouts compare their
    // captured value against the latest — if a newer swap has arrived, the
    // older callback bails. This is how rapid swipes coalesce to the LAST
    // target without intermediate captions ever rendering.
    var swapVersion = 0;
    // Wall-clock time at which the current fade-out phase began. Reset only
    // when no swap is currently in progress, so back-to-back swaps share one
    // fade-out window instead of restarting it on each call.
    var swapStartTime = 0;

    var current = [], idx = 0, sourceEl = null, syncSource = null;
    var itemEls = [];
    var offsets = [];
    var morphing = false;
    // Persist video playback position across navigations and reopens.
    // Keyed by source URL, value is the last currentTime. Saved when a
    // video deactivates and restored when it reactivates so the viewer
    // resumes from where they left off (instead of restarting at 0).
    // Note: we deliberately do NOT persist the paused state. Reopening a
    // video is itself a user action, so the expected UX is "resume
    // playing from where I left off," not "freeze on the same frame the
    // user has to manually un-pause." Also avoids a soft-lock when a
    // browser autoplay block left video.paused === true at save time.
    var videoStates = Object.create(null);
    function saveVideoState(video) {
      if (!video || video.tagName !== 'VIDEO') return;
      var key = video.currentSrc || video.src;
      if (!key) return;
      videoStates[key] = { time: video.currentTime || 0 };
    }

    function inControls(el) {
      return !!(el && el.closest && el.closest('.lightbox_controls'));
    }

    // Per-video controls: a play/pause overlay button (only visible on hover or
    // when paused) and a thin scrub bar pinned to the bottom of the video. The
    // controls live INSIDE each video's .lightbox_item so they morph with the
    // video and have nothing to bind/unbind globally. Click anywhere on the
    // video itself toggles play/pause (handled in handleTap).
    function attachVideoControls(wrap, video) {
      var controls = document.createElement('div');
      controls.className = 'lightbox_controls';
      controls.dataset.state = 'paused';
      controls.innerHTML =
        '<button type="button" class="lightbox_controls_play" aria-label="Play" tabindex="-1">' +
          '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5.5v13a1 1 0 0 0 1.54.84l10-6.5a1 1 0 0 0 0-1.68l-10-6.5A1 1 0 0 0 7 5.5Z" fill="currentColor"/></svg>' +
          '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor"/></svg>' +
        '</button>' +
        // Explicit DOM for the visible bar so its rendering doesn't depend on
        // the slider pseudo-element gradient. The track is the muted base;
        // the fill grows from the left via width: calc(progress * 100%).
        '<div class="lightbox_controls_track" aria-hidden="true">' +
          '<div class="lightbox_controls_fill"></div>' +
        '</div>' +
        // Input is invisible (opacity 0) but handles all interaction —
        // drag-to-scrub and tap-anywhere-on-bar both fire `input` events
        // that drive `video.currentTime`.
        '<input type="range" class="lightbox_controls_scrub" min="0" max="1000" value="0" step="1" aria-label="Seek">';
      wrap.appendChild(controls);
      // Apply the same squircle clip-path used on the video so the scrub bar
      // is clipped along the video's rounded corners, not the simpler
      // circular border-radius curve.
      watchSquircle(controls);

      // Custom knob lives OUTSIDE the squircle-clipped controls so the corner
      // curve can't slice into it. The native input's thumb stays invisible
      // (the input still handles drag/click hit detection). The knob's
      // horizontal position follows --scrub-progress set on the item wrap.
      var knob = document.createElement('div');
      knob.className = 'lightbox_controls_knob';
      wrap.appendChild(knob);

      var playBtn = controls.querySelector('.lightbox_controls_play');
      var scrub = controls.querySelector('.lightbox_controls_scrub');
      var scrubbing = false;

      function setProgress(t, d) {
        if (!isFinite(d) || d <= 0) return;
        var p = Math.max(0, Math.min(1, t / d));
        // Set on the item wrap so both the input's track gradient (inherited)
        // and the knob's `left` calc (also inherited) update together.
        wrap.style.setProperty('--scrub-progress', p);
        if (!scrubbing) scrub.value = String(Math.round(p * 1000));
      }

      video.addEventListener('play', function () {
        controls.dataset.state = 'playing';
        playBtn.setAttribute('aria-label', 'Pause');
      });
      video.addEventListener('pause', function () {
        controls.dataset.state = 'paused';
        playBtn.setAttribute('aria-label', 'Play');
      });
      video.addEventListener('ended', function () {
        controls.dataset.state = 'paused';
        playBtn.setAttribute('aria-label', 'Play');
      });
      video.addEventListener('timeupdate', function () {
        setProgress(video.currentTime, video.duration);
      });
      video.addEventListener('durationchange', function () {
        setProgress(video.currentTime, video.duration);
      });
      video.addEventListener('loadedmetadata', function () {
        setProgress(video.currentTime, video.duration);
      });

      playBtn.addEventListener('click', function () {
        if (video.paused) {
          var p = video.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          video.pause();
        }
      });

      // Seek on every input — keeps the video frame in sync with the scrub
      // position while the user drags. Native range inputs also fire `input`
      // on a single tap of the track (the value jumps to the tapped point),
      // so this same handler covers "tap to seek" too. The `change` event
      // just marks the end of the gesture.
      scrub.addEventListener('input', function () {
        scrubbing = true;
        var d = video.duration;
        if (isFinite(d) && d > 0) {
          var p = parseFloat(scrub.value) / 1000;
          wrap.style.setProperty('--scrub-progress', p);
          try { video.currentTime = p * d; } catch (_) {}
        }
      });
      scrub.addEventListener('change', function () {
        scrubbing = false;
      });
    }

    function build(items) {
      track.textContent = '';
      itemEls = items.map(function (it, i) {
        var wrap = document.createElement('div');
        wrap.className = 'lightbox_item';
        wrap.dataset.index = i;
        wrap.setAttribute('role', 'group');
        wrap.setAttribute('aria-label', (i + 1) + ' of ' + items.length);
        wrap.dataset.w = it.w;
        wrap.dataset.h = it.h;
        sizeItem(wrap, it.w, it.h);
        // Mouse-only hover tracking via pointerenter/leave instead of CSS
        // :hover. Browsers don't re-evaluate :hover after a click until the
        // cursor moves, which would make the play button disappear right
        // after the user clicks it to resume playback. pointerenter/leave
        // fire on bounds entry and the class stays sticky between events.
        wrap.addEventListener('pointerenter', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          wrap.classList.add('is-cursor-over');
        });
        wrap.addEventListener('pointerleave', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          wrap.classList.remove('is-cursor-over');
        });
        var node;
        if (it.type === 'video') {
          node = document.createElement('video');
          node.src = it.src;
          if (it.poster) {
            node.poster = it.poster;
            // CSS background fallback: with preload="metadata", the very first
            // paint of the <video> can flash black before either the poster
            // image or the first video frame is decoded. Painting the poster
            // onto the element's background covers that gap.
            node.style.backgroundImage = 'url("' + it.poster.replace(/"/g, '\\"') + '")';
            node.style.backgroundSize = 'cover';
            node.style.backgroundPosition = 'center';
          }
          node.playsInline = true;
          // Start unmuted, setActive will fall back to muted only if the
          // browser blocks audio autoplay. Opening the lightbox is a user
          // gesture, so most browsers will allow audio.
          node.muted = false;
          node.loop = true;
          node.preload = 'metadata';
        } else {
          node = document.createElement('img');
          // Re-resolve from the in-page img at open time. `it.src` was
          // captured at IIFE init when lazy images may not have selected a
          // source yet (currentSrc was empty), so the cached value can be
          // the JPG/PNG fallback. By open time the in-page img is in
          // viewport — its currentSrc reflects the actually-loaded WebP.
          var srcImg = it.el && it.el.querySelector('img');
          node.src = (srcImg && srcImg.currentSrc) || it.src;
          node.alt = it.alt;
          node.draggable = false;
          node.decoding = 'async';
        }
        node.setAttribute('width', it.w);
        node.setAttribute('height', it.h);
        wrap.appendChild(node);
        if (it.type === 'video') attachVideoControls(wrap, node);
        track.appendChild(wrap);
        watchSquircle(node);
        return wrap;
      });
    }

    function activeMedia() {
      var el = itemEls[idx];
      return el && el.firstChild;
    }
    function sourceMedia() {
      return sourceEl && sourceEl.querySelector('img, video');
    }

    // Compute the visual size of an item from its aspect ratio. The result
    // fits within an 80vw × 84vh box while preserving aspect, so a 9:21 phone
    // screenshot becomes a tall narrow card and a 16:9 hero stays wide.
    function sizeItem(wrap, w, h) {
      var aspect = w / h;
      var maxW = window.innerWidth * 0.80;
      var maxH = Math.min(window.innerHeight * 0.84, window.innerHeight - 96);
      var widthFromH = maxH * aspect;
      var iw, ih;
      if (widthFromH <= maxW) {
        iw = widthFromH; ih = maxH;
      } else {
        iw = maxW; ih = maxW / aspect;
      }
      wrap.style.width = iw + 'px';
      wrap.style.height = ih + 'px';
    }

    function resizeAll() {
      itemEls.forEach(function (el) {
        var w = +el.dataset.w, h = +el.dataset.h;
        if (w && h) sizeItem(el, w, h);
      });
    }

    // Measure each item's center (in viewport coords) with translate cleared.
    // Items are content-sized, so widths vary per aspect ratio. Recompute on
    // resize / build.
    function measure() {
      dlg.style.setProperty('--lb-tx', '0px');
      dlg.style.setProperty('--lb-drag', '0px');
      void track.offsetWidth;
      offsets = itemEls.map(function (el) {
        var r = el.getBoundingClientRect();
        return r.left + r.width / 2;
      });
    }

    function setActive(i, opts) {
      var clamped = Math.max(0, Math.min(current.length - 1, i));
      if (clamped === idx && !(opts && opts.force)) return;
      idx = clamped;
      // Defensive: some browsers auto-scroll the dialog when focus lands on
      // an offscreen child. Reset before measuring so offsets stay accurate.
      dlg.scrollLeft = 0;
      if (offsets.length) {
        var tx = (window.innerWidth / 2) - offsets[idx];
        dlg.style.setProperty('--lb-tx', tx + 'px');
      }
      itemEls.forEach(function (el, j) {
        var on = (j === idx);
        el.classList.toggle('is-active', on);
        var media = el.firstChild;
        if (!media) return;
        if (media.tagName === 'VIDEO') {
          // Custom inline controls handle play/pause + scrub per-item; native
          // controls would collide with our carousel and tap-to-toggle.
          media.controls = false;
          if (on) {
            // Restore prior playback position for this src so the viewer
            // resumes from where they left off (instead of from 0 every
            // time the lightbox rebuilds fresh <video> elements on open).
            var key = media.currentSrc || media.src;
            var state = key && videoStates[key];
            // Type-check, not truthiness: a legitimate stored time of 0
            // is falsy, and `state.time` truthy-checking it would skip
            // the restore. Today this is masked by fresh <video> elements
            // already defaulting to 0, but the check should be semantic.
            if (state && typeof state.time === 'number' && isFinite(state.time)) {
              try { media.currentTime = state.time; } catch (_) {}
            }
            // Muted-first autoplay. Browsers (especially Safari) accept
            // muted autoplay much more reliably than autoplay-with-sound,
            // even from within a user gesture — so we start muted to
            // maximize the chance the video actually starts, then try to
            // unmute once it's playing.
            media.muted = true;
            var attemptUnmute = function () {
              media.muted = false;
              // Re-check on the NEXT frame to catch async pauses that
              // browsers (Safari in particular) can emit after the unmute
              // is allowed initially and then revoked by the autoplay-
              // with-sound policy a tick later. A sync check immediately
              // after `media.muted = false` would miss this.
              requestAnimationFrame(function () {
                if (media.paused && !media.ended) {
                  media.muted = true;
                  var rp = media.play();
                  if (rp && rp.catch) rp.catch(function () {});
                }
              });
            };
            var p = media.play();
            if (p && p.then) {
              p.then(attemptUnmute).catch(function () {
                // Even muted autoplay refused — video stays paused, user
                // can tap the play button.
              });
            } else {
              // Legacy browsers where HTMLMediaElement.play() returns void
              // (older Safari, some WebViews). Schedule the unmute attempt
              // on the next task so the muted play has a tick to engage.
              setTimeout(attemptUnmute, 0);
            }
          } else {
            // Snapshot the position before pausing so the next activation
            // can resume from where the user left off. We deliberately do
            // not persist the paused flag — see the videoStates comment
            // near its declaration for the rationale (resume-on-reopen UX
            // + avoiding a soft-lock when autoplay was previously blocked).
            saveVideoState(media);
            media.pause();
            // Mute when not active so the next play() doesn't double-up audio
            // with whatever video the user navigates to next.
            media.muted = true;
          }
        }
      });
      // Sync the active item's squircle radius to its in-page source so the
      // visual corner radius matches at the morph swap moment. The layout
      // radius scales inversely with the morph's transform scale, so layout
      // R = baseR * (target/source), when scaled by (source/target) at swap,
      // visual R == baseR (== in-page).
      syncActiveSquircle();
      syncCaption(current[idx] && current[idx].caption, opts && opts.force);
    }
    // Smoothly swap captions: width morphs (background stays), old text fades
    // out, new text fades in. instant=true skips animations (initial open).
    // Caption is rendered as HTML so data-caption can contain inline links;
    // values are author-controlled (never user-input), so no sanitization.
    function syncCaption(html, instant) {
      html = html || '';
      capEl.classList.toggle('is-empty', !html);
      if (!html) return;

      capGhostTxt.innerHTML = html;
      void capGhostEl.offsetWidth;
      // Read the ghost's rendered dimensions directly. The ghost has
      // `width: max-content` capped at the visible pill's `max-width`, so:
      //   - Short captions: ghost = natural single-line width (pill hugs).
      //   - Long captions: ghost = max-width with text wrapping inside
      //     (pill shows wrapped layout at the cap).
      //
      // An earlier implementation tried to shrink the pill to the longest
      // wrapped line via Range.getClientRects(), but that returns one rect
      // PER TEXT RUN, not per line. Captions containing an inline <a>
      // (e.g. "...on <a>Kenji's Reels</a> after I DMd him") produced 3
      // separate rects on a single line; the longest rect (~the first
      // text segment) was mistakenly used as the line width, making the
      // pill narrower than the natural text and forcing a 3-line wrap
      // visible in the screenshot above. Mirroring the ghost's box is
      // both correct and simpler.
      var ghostRect = capGhostEl.getBoundingClientRect();
      var newW = Math.ceil(ghostRect.width);
      var newH = Math.ceil(ghostRect.height);

      if (instant) {
        capEl.style.transition = 'none';
        capEl.style.width = newW + 'px';
        capEl.style.height = newH + 'px';
        capTxt.innerHTML = html;
        void capEl.offsetWidth;
        capEl.style.transition = '';
        return;
      }

      // Three-phase sequenced swap:
      //   1. text fades out (FADE_MS)              — pill stays at old size
      //   2. pill morphs to new size (MORPH_MS)    — text is at opacity 0
      //   3. swap innerHTML + fade text in (FADE_MS) — at the new size
      //
      // The morph is gated behind the fade-out so no text is ever visible
      // inside a mid-morph pill — that flash was the artifact the user was
      // seeing when width/height transitioned alongside the text opacity.
      //
      // For rapid swipes (e.g. flicking past several items) the version
      // counter coalesces: every interim call increments swapVersion, every
      // pending timeout checks its captured version and bails if a newer
      // swap has taken over. Only the *latest* target's morph + text-swap
      // actually run, so the pill morphs straight from where it is to the
      // final caption with no intermediate flash of B, C, D content.
      swapVersion++;
      var ver = swapVersion;

      if (!capEl.classList.contains('is-swapping')) {
        // Fresh swap — start the text fade-out clock now.
        swapStartTime = Date.now();
        capEl.classList.add('is-swapping');
      }
      // If we're already mid-fade, don't restart it — the CSS transition is
      // already running. The remaining time is what's left of FADE_MS.
      var elapsed = Date.now() - swapStartTime;
      var remainingFade = Math.max(0, FADE_MS - elapsed);

      clearTimeout(capSwapTimer);
      capSwapTimer = setTimeout(function () {
        if (ver !== swapVersion) return; // superseded
        // Phase 2: text is at opacity 0 — kick off the pill morph.
        capEl.style.width = newW + 'px';
        capEl.style.height = newH + 'px';

        capSwapTimer = setTimeout(function () {
          if (ver !== swapVersion) return; // superseded
          // Phase 3: pill is at new size — swap text (still invisible) and
          // fade it back in by removing .is-swapping.
          capTxt.innerHTML = html;
          capEl.classList.remove('is-swapping');
        }, MORPH_MS);
      }, remainingFade);
    }
    function syncActiveSquircle() {
      var item = itemEls[idx];
      var src = current[idx] && current[idx].el && current[idx].el.querySelector('img, video');
      var tgt = item && item.firstChild;
      if (!item || !src || !tgt) return;
      var sRect = src.getBoundingClientRect();
      var tRect = item.getBoundingClientRect();
      if (sRect.width <= 0 || tRect.width <= 0) return;
      var baseR = parseFloat(getComputedStyle(src).getPropertyValue('--smooth-r')) || 12;
      // Layout-radius scales with the size ratio so the visual radius matches
      // the in-page source at the morph swap moment. Cap it so very-wide
      // videos don't end up with cartoonishly-rounded corners at rest. The
      // morph's visual continuity stays close even when capped because
      // typical ratios stay near 1x–2x.
      var r = Math.min(baseR * (tRect.width / sRect.width), 18);
      tgt.style.setProperty('--smooth-r', r + 'px');
      applySquircle(tgt);
      // Mirror the radius onto the inline controls so the scrub bar follows
      // the same curve at the corners as the video.
      var ctrl = item.querySelector('.lightbox_controls');
      if (ctrl) {
        ctrl.style.setProperty('--smooth-r', r + 'px');
        applySquircle(ctrl);
      }
    }

    // Compute the FLIP transform string that maps `toRect` onto `fromRect`.
    function flipTransform(fromRect, toRect) {
      var fx = fromRect.left - toRect.left;
      var fy = fromRect.top - toRect.top;
      var sx = fromRect.width / toRect.width;
      var sy = fromRect.height / toRect.height;
      return 'translate(' + fx + 'px, ' + fy + 'px) scale(' + sx + ', ' + sy + ')';
    }

    // Pre-place the active media at the source rect SYNCHRONOUSLY, called
    // right after showModal so the very first paint has the morphing element
    // already at the in-page position (no fullscreen-flash on entry).
    function placeAtSource() {
      var src = sourceMedia();
      var tgt = activeMedia();
      if (!src || !tgt) return null;
      sourceEl.classList.add('is-source');
      var sRect = src.getBoundingClientRect();
      var tRect = tgt.getBoundingClientRect();
      var fromT = flipTransform(sRect, tRect);
      tgt.style.transformOrigin = 'top left';
      tgt.style.transform = fromT;
      return { tgt: tgt, fromT: fromT };
    }

    function openMorph(pre) {
      var tgt = pre && pre.tgt;
      var fromT = pre && pre.fromT;
      if (!tgt) return Promise.resolve();
      var anim = tgt.animate(
        [{ transform: fromT }, { transform: 'translate(0, 0) scale(1, 1)' }],
        { duration: OPEN_MS, easing: EASE, fill: 'forwards' }
      );
      morphing = true;
      return anim.finished.catch(function () {}).then(function () {
        // Clear inline + animation so the element rests at identity cleanly.
        tgt.style.transform = '';
        tgt.style.transformOrigin = '';
        anim.cancel();
        morphing = false;
      });
    }

    // Grab the current frame off a playing video as a data URL so the in-page
    // <video> can wear it as a poster, that way the shrink lands on the exact
    // frame the user was watching, with no flicker back to the original poster.
    function captureFrame(video) {
      if (!video || !video.videoWidth) return null;
      try {
        var c = document.createElement('canvas');
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.85);
      } catch (_) {
        return null;  // tainted canvas (cross-origin), fall back to original poster
      }
    }

    function closeMorph() {
      if (morphing) return Promise.resolve();

      // Hide the controls before the close-morph runs — the controls live at
      // the lightbox's final layout position while the video is morphing
      // back toward the in-page card, so without this the scrubber would
      // float untethered above the shrinking video. The `is-closing` class
      // disables their transitions (one-frame hide) so they don't fade +
      // scale + drift alongside the morph — that combo reads as flashing.
      dlg.classList.remove('is-settled');
      dlg.classList.add('is-closing');

      // The in-page stack has per-card transform + opacity transitions. If we
      // sync and immediately measure, getBoundingClientRect returns a
      // mid-transition rect, the morph would land where the stack *is right
      // now*, not where it'll end up. Suppress transform transitions so the
      // syncSource → render() positional update snaps to final positions in
      // one frame. Leave OPACITY transitions enabled: the `.lb-closing` class
      // we add below overrides the `:has(.is-source)` opacity:0 rule for
      // behind cards, and we want that to fade them back in concurrently
      // with the close morph — so the stack is already at its final visible
      // state by the time the dialog dismisses.
      var stackEl = (sourceEl && sourceEl.parentElement && sourceEl.parentElement.matches && sourceEl.parentElement.matches('.media.is-stack'))
        ? sourceEl.parentElement : null;
      var stackKids = stackEl ? [].slice.call(stackEl.children) : [];
      var savedStackT = stackEl ? stackEl.style.transition : '';
      var savedKidT = stackKids.map(function (k) { return k.style.transition; });
      if (stackEl) stackEl.style.transition = 'none';
      // Opacity-only inline transition: matches the close morph duration so
      // behind cards finish fading in just as the morph lands. Transform is
      // omitted from this list, so render()'s --stack-tx changes don't
      // animate — positional shifts snap.
      stackKids.forEach(function (k) {
        k.style.transition = 'opacity ' + (CLOSE_MS / 1000) + 's cubic-bezier(0.2, 0.7, 0.2, 1)';
      });
      // Trigger the override: while .lb-closing is on <html>, behind cards
      // ignore their normal opacity:0 (from :has(.is-source)) and animate
      // back to 1 — concurrent with the close morph, not after it.
      document.documentElement.classList.add('lb-closing');

      if (typeof syncSource === 'function') {
        try { syncSource(idx); } catch (_) {}
      }
      if (stackEl) void stackEl.offsetWidth; // flush layout to final state

      // Move is-source to whatever stack item we'll actually morph back to,
      // otherwise both the old source (.is-source) and the new front are
      // visible simultaneously and the user sees a double-image.
      var nextSource = (current[idx] && current[idx].el) || sourceEl;
      if (sourceEl && sourceEl !== nextSource) sourceEl.classList.remove('is-source');
      if (nextSource) nextSource.classList.add('is-source');
      sourceEl = nextSource;
      var src = sourceMedia();
      var tgt = activeMedia();
      var restoreStack = function () {
        if (stackEl) stackEl.style.transition = savedStackT;
        stackKids.forEach(function (k, i) { k.style.transition = savedKidT[i]; });
      };
      if (!src || !tgt) { restoreStack(); finalize(); return Promise.resolve(); }

      if (tgt.tagName === 'VIDEO') {
        // Snapshot the position before pausing for the close morph so the
        // next reopen resumes from this exact spot. Only currentTime is
        // persisted; see the videoStates comment for why paused isn't.
        saveVideoState(tgt);
        try { tgt.pause(); } catch (_) {}
        tgt.controls = false;
        // Mirror the paused frame onto the in-page <video>'s poster so the
        // hand-off at the end of the shrink is invisible.
        if (src.tagName === 'VIDEO') {
          // Hide the HTML overlays (scrub bar, knob) from layout before
          // drawing the video to canvas. Safari's canvas.drawImage(video)
          // on a hardware-composited <video> pulls in adjacent overlay
          // layers — without this, the paused-state scrub bar gets baked
          // into the captured frame and shows as a stray white line at
          // the bottom of the in-page card after dismiss. Chromium gives
          // a clean capture either way; the toggle is harmless there.
          var tgtItem = tgt.parentNode;
          var ovCtrl = tgtItem && tgtItem.querySelector('.lightbox_controls');
          var ovKnob = tgtItem && tgtItem.querySelector('.lightbox_controls_knob');
          var savedCtrlDisplay = ovCtrl && ovCtrl.style.display;
          var savedKnobDisplay = ovKnob && ovKnob.style.display;
          if (ovCtrl) ovCtrl.style.display = 'none';
          if (ovKnob) ovKnob.style.display = 'none';
          // Force a synchronous layout/composite flush so the hidden
          // state is in effect before the canvas reads pixels.
          if (ovCtrl) void ovCtrl.offsetWidth;
          var frame = captureFrame(tgt);
          if (ovCtrl) ovCtrl.style.display = savedCtrlDisplay || '';
          if (ovKnob) ovKnob.style.display = savedKnobDisplay || '';
          if (frame) src.setAttribute('poster', frame);
        }
      }
      var sRect = src.getBoundingClientRect();
      var tRect = tgt.getBoundingClientRect();
      var fromT = flipTransform(sRect, tRect);
      tgt.style.transformOrigin = 'top left';
      var anim = tgt.animate(
        [{ transform: 'translate(0, 0) scale(1, 1)' }, { transform: fromT }],
        { duration: CLOSE_MS, easing: EASE, fill: 'forwards' }
      );
      morphing = true;
      dlg.classList.remove('is-open');
      return anim.finished.catch(function () {}).then(function () {
        morphing = false;
        // Behind cards have already animated back to opacity:1 during the
        // morph (driven by the .lb-closing override + opacity-only inline
        // transition above), so removing .is-source here is a no-op for
        // their opacity — no post-dismiss fade or pop. The source card's
        // visibility:hidden → visible swap is instant either way.
        restoreStack();
        finalize();
      });
    }

    function finalize() {
      // Clear is-source on every item in the originating stack, not just the
      // current sourceEl, so the user can never end up with a stuck-hidden
      // card after navigating around the lightbox.
      current.forEach(function (it) { if (it.el) it.el.classList.remove('is-source'); });
      if (dlg.open) dlg.close();
    }

    // ---- horizontal drag + tap ----
    // Listen on the DIALOG, not the track. The track has a translateX
    // transform applied (to page between items), which moves its bounding
    // box off-screen. That means backdrop taps in the viewport don't hit
    // the track,`elementFromPoint` returns the dialog instead. Listening
    // on the dialog catches every tap, anywhere in the lightbox.
    var sx0 = 0, sy0 = 0, sxt = 0, dragging = false, mvd = false, hor = false;
    dlg.addEventListener('pointerdown', function (e) {
      // Anchors inside the caption have their own click semantics, don't
      // start a drag/tap (which would dismiss the lightbox under the link
      // navigation).
      if (e.target.closest && e.target.closest('a')) return;
      // The video control bar owns its own pointer interactions (button click,
      // slider drag); don't let the carousel hijack them into a swipe gesture.
      if (inControls(e.target)) return;
      if (morphing) return;
      dragging = true; mvd = false; hor = false;
      sx0 = e.clientX; sy0 = e.clientY;
      sxt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      try { dlg.setPointerCapture(e.pointerId); } catch (_) {}
    });
    dlg.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx0, dy = e.clientY - sy0;
      if (!mvd && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        mvd = true;
        hor = Math.abs(dx) > Math.abs(dy);
        if (hor) dlg.classList.add('is-dragging');
      }
      if (mvd && hor) {
        if (e.cancelable) e.preventDefault();
        var atEdge = (idx === 0 && dx > 0) || (idx === current.length - 1 && dx < 0);
        var eff = atEdge ? dx * 0.3 : dx;
        dlg.style.setProperty('--lb-drag', eff + 'px');
      }
    });
    dlg.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false;
      var dx = e.clientX - sx0;
      var dy = e.clientY - sy0;
      var dt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - sxt;
      dlg.classList.remove('is-dragging');
      dlg.style.setProperty('--lb-drag', '0px');
      // Commit on either a meaningful distance OR a fast flick, the latter
      // lets quick mobile swipes (under the distance threshold) still page.
      var distOK = Math.abs(dx) > Math.max(36, window.innerWidth * 0.07);
      var velocity = dt > 0 ? Math.abs(dx) / dt : 0; // px/ms
      var flickOK = velocity > 0.45 && Math.abs(dx) > 18;
      var totalMove = Math.max(Math.abs(dx), Math.abs(dy));
      if (mvd && hor && (distOK || flickOK)) {
        setActive(idx + (dx < 0 ? 1 : -1));
      } else if (totalMove < 14 || !hor) {
        // Tap, no movement, slight finger jitter, or vertical drag. All
        // count as "off the swipe gesture", so the user expects dismiss /
        // peek-tap behaviour rather than an aborted swipe.
        handleTap(e);
      }
      // else: meaningful horizontal motion that didn't cross threshold → snap back, no-op.
    });
    dlg.addEventListener('pointercancel', function () {
      if (dragging) {
        dragging = false;
        dlg.classList.remove('is-dragging');
        dlg.style.setProperty('--lb-drag', '0px');
      }
    });

    function handleTap(e) {
      // pointer-capture redirects e.target to the track after pointerdown, so
      // resolve the actual element under the release point instead.
      var hit = document.elementFromPoint(e.clientX, e.clientY);
      // Taps on the inline controls (play overlay, scrub) are interactions,
      // not dismisses or toggles — those elements own their own click handling.
      if (hit && hit.closest && hit.closest('.lightbox_controls')) return;
      var itemEl = hit && hit.closest('.lightbox_item');
      // backdrop tap (outside any item) → close
      if (!itemEl) { closeMorph(); return; }
      var i = parseInt(itemEl.dataset.index, 10);
      if (isNaN(i)) return;
      if (i !== idx) {
        setActive(i);              // tap on a peek → navigate
        return;
      }
      // Tap on the active item: videos toggle play/pause, images dismiss.
      var media = itemEl.firstChild;
      if (media && media.tagName === 'VIDEO') {
        if (media.paused) {
          var pp = media.play();
          if (pp && pp.catch) pp.catch(function () {});
        } else {
          media.pause();
        }
      } else {
        closeMorph();
      }
    }

    // Browser <dialog> Escape → cancel. We hijack it so the close morphs.
    dlg.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeMorph();
    });

    dlg.addEventListener('keydown', function (e) {
      // When the active video's scrub slider has focus, native range
      // keystrokes (arrows, Home/End, PgUp/PgDn) step the value — don't
      // poach them for carousel navigation.
      if (e.target && e.target.classList && e.target.classList.contains('lightbox_controls_scrub')) return;
      var av = activeMedia();
      if (e.key === ' ' && av && av.tagName === 'VIDEO') {
        e.preventDefault();
        if (av.paused) {
          var pp = av.play();
          if (pp && pp.catch) pp.catch(function () {});
        } else {
          av.pause();
        }
        return;
      }
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(idx - 1); }
    });

    // ----- trackpad / Magic Mouse / mouse-wheel navigation -----
    // Mac trackpad horizontal swipes fire as a burst of wheel events with
    // small deltaX values, then trail off into inertia. Treat one continuous
    // burst as one gesture: accumulate deltaX, commit once when it crosses
    // the threshold, and reset on idle (≥160 ms with no wheel event). That
    // way a single two-finger swipe pages once, inertia events don't keep
    // pushing through several items.
    var wheelAcc = 0, wheelCommitted = false, wheelIdle = null;
    dlg.addEventListener('wheel', function (e) {
      if (morphing) return;
      // Don't page the carousel when the user spins over the controls bar.
      if (inControls(e.target)) return;
      var h = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      // Vertical wheel inside the modal can't scroll anything, swallow it.
      if (!h) { e.preventDefault(); return; }
      e.preventDefault();

      if (!wheelCommitted) {
        wheelAcc += e.deltaX;
        // Threshold: roughly one "noticeable swipe" on a Mac trackpad.
        var threshold = 28;
        if (Math.abs(wheelAcc) > threshold) {
          setActive(idx + (wheelAcc > 0 ? 1 : -1));
          wheelCommitted = true;
        }
      }
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(function () {
        wheelAcc = 0;
        wheelCommitted = false;
      }, 160);
    }, { passive: false });

    dlg.addEventListener('close', function () {
      // Detach the squircle observer from every per-item DOM node before
      // we drop them from the tree — otherwise the ResizeObserver keeps
      // strong refs and detached HTMLVideoElement / IMG instances leak
      // across opens (each carrying a decoded buffer on iOS).
      itemEls.forEach(function (el) {
        var media = el.firstChild;
        if (media) unwatchSquircle(media);
        var ctrl = el.querySelector('.lightbox_controls');
        if (ctrl) unwatchSquircle(ctrl);
      });
      // Invalidate any caption-swap timers still in flight from the
      // just-closed session: clear the pending timeout, drop the
      // is-swapping class (otherwise the next open's caption renders at
      // opacity 0 until a stale phase-3 fires and removes it), and bump
      // swapVersion so even a setTimeout we somehow missed will bail.
      clearTimeout(capSwapTimer);
      capSwapTimer = null;
      capEl.classList.remove('is-swapping');
      swapVersion++;
      track.textContent = '';
      itemEls = [];
      offsets = [];
      current = [];
      sourceEl = null;
      syncSource = null;
      dlg.classList.remove('is-open');
      dlg.classList.remove('is-closing');
      document.documentElement.classList.remove('lb-closing');
      dlg.style.removeProperty('--lb-tx');
      dlg.style.removeProperty('--lb-drag');
    });

    // recompute on resize so swipes still snap to centers
    window.addEventListener('resize', function () {
      if (!dlg.open || !itemEls.length) return;
      track.style.transition = 'none';
      resizeAll();
      measure();
      var tx = (window.innerWidth / 2) - offsets[idx];
      dlg.style.setProperty('--lb-tx', tx + 'px');
      // After resize, target rect changes → squircle radius (derived from
      // target/source size ratio) is stale on the active video and its
      // controls. Recompute so the scrub bar's clip path keeps following
      // the video's corner curve at the new dimensions.
      syncActiveSquircle();
      void track.offsetWidth;
      track.style.transition = '';
    });

    return {
      open: function (items, index, trigger, sync) {
        current = items;
        sourceEl = trigger;
        syncSource = sync || null;
        build(items);
        if (!dlg.open) dlg.showModal();
        // showModal auto-focuses the first focusable descendant — the active
        // item's play button — which would leave the play overlay visible
        // via :focus-visible even after the video starts playing. Pull focus
        // back to the dialog itself so keyboard nav still works (the dialog
        // owns the keydown handler) without revealing the overlay.
        dlg.focus({ preventScroll: true });
        // Disable carousel transition while we measure + position; otherwise
        // the very first setActive would animate from 0 → centered.
        track.style.transition = 'none';
        idx = -1;                   // force setActive to apply
        measure();
        setActive(index || 0, { force: true });
        void track.offsetWidth;
        track.style.transition = '';

        // Pre-place the active media at the source rect IN THE SAME FRAME as
        // showModal, when the browser paints the dialog for the first time,
        // the morphing element is already at the in-page position, so the
        // user sees no fullscreen-then-shrink flash.
        var pre = placeAtSource();

        requestAnimationFrame(function () {
          dlg.classList.add('is-open');
          openMorph(pre).then(function () {
            // Only reveal the inline controls AFTER the morph settles —
            // during the morph the video is transforming from source rect
            // to target rect, but the controls element doesn't transform
            // with it, so showing controls during the morph leaves the
            // scrubber floating above the still-morphing video.
            dlg.classList.add('is-settled');
          });
        });
      },
    };
  }
})();
