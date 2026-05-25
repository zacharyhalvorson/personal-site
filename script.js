// Progressive enhancement for project media: iMessage-style stacks you can
// leaf through inline, plus a fullscreen carousel that morphs from the tapped
// item with a FLIP animation. Neighbours peek from the sides as the swipe /
// tap-to-progress affordance. The only UI chrome is a small close button.
// No dependencies, no build. With JS off, the markup degrades to a native
// scroll-snap strip.

(function () {
  'use strict';

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
      return {
        type: 'image',
        src: img.getAttribute('src'),
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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox.open(items, 0, li, sync); }
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
    ul.setAttribute('aria-label', items.length + ' items — drag to browse, tap to expand');

    // Size each card to its own natural aspect, fitting within the stack's
    // bounding box. The stack itself stays at the CSS-fixed size, so swiping
    // never resizes the container — only the card inside changes shape.
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
    // External sync — called by the lightbox after a navigation so the
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
      // Distance OR a fast flick commits — same logic as the lightbox track.
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
    // lightbox — accumulate deltaX, commit once per burst, reset on idle.
    // Pure vertical wheel is left alone so the page can scroll-snap.
    var wheelAcc = 0, wheelCommitted = false, wheelIdle = null, horizUntil = 0;
    ul.addEventListener('wheel', function (e) {
      var h = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      var now = Date.now();
      if (h) horizUntil = now + 200;
      if (!h && now > horizUntil) return;        // genuine vertical scroll → let the page have it
      e.preventDefault();
      if (!h) return;                            // momentum tail after a horizontal swipe — swallow

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
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox.open(items, active, lis[active], setActiveTo); }
    });

    // Re-fit cards whenever the stack's bounding box could have changed.
    window.addEventListener('resize', sizeCards);
    sizeCards();
    render();
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

    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
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

    var current = [], idx = 0, sourceEl = null, syncSource = null;
    var itemEls = [];
    var offsets = [];
    var morphing = false;

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
        var node;
        if (it.type === 'video') {
          node = document.createElement('video');
          node.src = it.src;
          if (it.poster) node.poster = it.poster;
          node.playsInline = true;
          // Start unmuted — setActive will fall back to muted only if the
          // browser blocks audio autoplay. Opening the lightbox is a user
          // gesture, so most browsers will allow audio.
          node.muted = false;
          node.loop = true;
          node.preload = 'metadata';
        } else {
          node = document.createElement('img');
          node.src = it.src;
          node.alt = it.alt;
          node.draggable = false;
          node.decoding = 'async';
        }
        node.setAttribute('width', it.w);
        node.setAttribute('height', it.h);
        wrap.appendChild(node);
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
          // No native controls — the entire fullscreen frame is dismiss-on-tap,
          // and a control strip would steal touches from the active media.
          media.controls = false;
          if (on) {
            // Try with audio first; if the browser blocks autoplay-with-sound
            // (rare since opening the lightbox is a user gesture), fall back
            // to muted so the video still plays.
            media.muted = false;
            var p = media.play();
            if (p && p.catch) {
              p.catch(function () {
                media.muted = true;
                var p2 = media.play();
                if (p2 && p2.catch) p2.catch(function () {});
              });
            }
          } else {
            media.pause();
            // Mute when not active so the next play() doesn't double-up audio
            // with whatever video the user navigates to next.
            media.muted = true;
            try { media.currentTime = 0; } catch (_) {}
          }
        }
      });
      // Sync the active item's squircle radius to its in-page source so the
      // visual corner radius matches at the morph swap moment. The layout
      // radius scales inversely with the morph's transform scale, so layout
      // R = baseR * (target/source) — when scaled by (source/target) at swap,
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
      var newW = capGhostEl.offsetWidth;

      if (instant) {
        capEl.style.transition = 'none';
        capEl.style.width = newW + 'px';
        capTxt.innerHTML = html;
        void capEl.offsetWidth;
        capEl.style.transition = '';
        return;
      }
      // Start width morph + fade text out simultaneously.
      capEl.style.width = newW + 'px';
      capEl.classList.add('is-swapping');
      clearTimeout(capSwapTimer);
      capSwapTimer = setTimeout(function () {
        capTxt.innerHTML = html;
        capEl.classList.remove('is-swapping');
      }, 180);
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
      var r = baseR * (tRect.width / sRect.width);
      tgt.style.setProperty('--smooth-r', r + 'px');
      applySquircle(tgt);
    }

    // Compute the FLIP transform string that maps `toRect` onto `fromRect`.
    function flipTransform(fromRect, toRect) {
      var fx = fromRect.left - toRect.left;
      var fy = fromRect.top - toRect.top;
      var sx = fromRect.width / toRect.width;
      var sy = fromRect.height / toRect.height;
      return 'translate(' + fx + 'px, ' + fy + 'px) scale(' + sx + ', ' + sy + ')';
    }

    // Pre-place the active media at the source rect SYNCHRONOUSLY — called
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
    // <video> can wear it as a poster — that way the shrink lands on the exact
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
        return null;  // tainted canvas (cross-origin) — fall back to original poster
      }
    }

    function closeMorph() {
      if (morphing) return Promise.resolve();

      // The in-page stack has `transition: aspect-ratio 0.38s` plus per-card
      // transitions. If we sync and immediately measure, getBoundingClientRect
      // returns a mid-transition rect — the morph would land where the stack
      // *is right now*, not where it'll end up. The lightbox covers the stack
      // so transitions during close are invisible anyway; snap them off,
      // measure on the final layout, then restore once the morph is done.
      var stackEl = (sourceEl && sourceEl.parentElement && sourceEl.parentElement.matches && sourceEl.parentElement.matches('.media.is-stack'))
        ? sourceEl.parentElement : null;
      var stackKids = stackEl ? [].slice.call(stackEl.children) : [];
      var savedStackT = stackEl ? stackEl.style.transition : '';
      var savedKidT = stackKids.map(function (k) { return k.style.transition; });
      if (stackEl) stackEl.style.transition = 'none';
      stackKids.forEach(function (k) { k.style.transition = 'none'; });

      if (typeof syncSource === 'function') {
        try { syncSource(idx); } catch (_) {}
      }
      if (stackEl) void stackEl.offsetWidth; // flush layout to final state

      // Move is-source to whatever stack item we'll actually morph back to —
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
        try { tgt.pause(); } catch (_) {}
        tgt.controls = false;
        // Mirror the paused frame onto the in-page <video>'s poster so the
        // hand-off at the end of the shrink is invisible.
        if (src.tagName === 'VIDEO') {
          var frame = captureFrame(tgt);
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
    // the track — `elementFromPoint` returns the dialog instead. Listening
    // on the dialog catches every tap, anywhere in the lightbox.
    var sx0 = 0, sy0 = 0, sxt = 0, dragging = false, mvd = false, hor = false;
    dlg.addEventListener('pointerdown', function (e) {
      // Anchors inside the caption have their own click semantics — don't
      // start a drag/tap (which would dismiss the lightbox under the link
      // navigation).
      if (e.target.closest && e.target.closest('a')) return;
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
      // Commit on either a meaningful distance OR a fast flick — the latter
      // lets quick mobile swipes (under the distance threshold) still page.
      var distOK = Math.abs(dx) > Math.max(36, window.innerWidth * 0.07);
      var velocity = dt > 0 ? Math.abs(dx) / dt : 0; // px/ms
      var flickOK = velocity > 0.45 && Math.abs(dx) > 18;
      var totalMove = Math.max(Math.abs(dx), Math.abs(dy));
      if (mvd && hor && (distOK || flickOK)) {
        setActive(idx + (dx < 0 ? 1 : -1));
      } else if (totalMove < 14 || !hor) {
        // Tap — no movement, slight finger jitter, or vertical drag. All
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
      var itemEl = hit && hit.closest('.lightbox_item');
      // backdrop tap (outside any item) → close
      if (!itemEl) { closeMorph(); return; }
      var i = parseInt(itemEl.dataset.index, 10);
      if (isNaN(i)) return;
      if (i !== idx) {
        setActive(i);              // tap on a peek → navigate
      } else {
        closeMorph();              // tap on the active media → dismiss
      }
    }

    // Browser <dialog> Escape → cancel. We hijack it so the close morphs.
    dlg.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeMorph();
    });

    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); setActive(idx + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(idx - 1); }
    });

    // ----- trackpad / Magic Mouse / mouse-wheel navigation -----
    // Mac trackpad horizontal swipes fire as a burst of wheel events with
    // small deltaX values, then trail off into inertia. Treat one continuous
    // burst as one gesture: accumulate deltaX, commit once when it crosses
    // the threshold, and reset on idle (≥160 ms with no wheel event). That
    // way a single two-finger swipe pages once — inertia events don't keep
    // pushing through several items.
    var wheelAcc = 0, wheelCommitted = false, wheelIdle = null;
    dlg.addEventListener('wheel', function (e) {
      if (morphing) return;
      var h = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      // Vertical wheel inside the modal can't scroll anything — swallow it.
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
      track.textContent = '';
      itemEls = [];
      offsets = [];
      current = [];
      sourceEl = null;
      syncSource = null;
      dlg.classList.remove('is-open');
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
        // Disable carousel transition while we measure + position; otherwise
        // the very first setActive would animate from 0 → centered.
        track.style.transition = 'none';
        idx = -1;                   // force setActive to apply
        measure();
        setActive(index || 0, { force: true });
        void track.offsetWidth;
        track.style.transition = '';

        // Pre-place the active media at the source rect IN THE SAME FRAME as
        // showModal — when the browser paints the dialog for the first time,
        // the morphing element is already at the in-page position, so the
        // user sees no fullscreen-then-shrink flash.
        var pre = placeAtSource();

        requestAnimationFrame(function () {
          dlg.classList.add('is-open');
          openMorph(pre);
        });
      },
    };
  }
})();
