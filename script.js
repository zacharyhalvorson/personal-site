// Progressive enhancement for project media: iMessage-style stacks you can
// leaf through inline, plus a fullscreen lightbox. No dependencies, no build.
// With JS off, the markup degrades to a native scroll-snap strip.

(function () {
  'use strict';

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
      var v = li.querySelector('video');
      if (v) {
        var s = v.querySelector('source');
        return { type: 'video', src: (s && s.getAttribute('src')) || v.getAttribute('src'), poster: v.getAttribute('poster') || '', alt: 'Video' };
      }
      var img = li.querySelector('img');
      return { type: 'image', src: img.getAttribute('src'), alt: img.alt || '' };
    });
  }

  // ---- single item: just make it open fullscreen ----
  function setupSingle(ul, items) {
    ul.classList.add('is-zoomable');
    ul.setAttribute('role', 'button');
    ul.setAttribute('tabindex', '0');
    ul.setAttribute('aria-label', 'Expand ' + items[0].type);
    ul.addEventListener('click', function () { lightbox.open(items, 0, ul); });
    ul.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox.open(items, 0, ul); }
    });
  }

  // ---- multiple items: fanned stack, no visible chrome ----
  // The top card follows your finger as you drag (iMessage-style); release
  // past a threshold to leaf, otherwise it springs back. A plain tap/click
  // opens the fullscreen lightbox, where the nav buttons live.
  function setupStack(ul, items) {
    var lis = [].slice.call(ul.querySelectorAll('.media_item'));
    var active = 0;

    ul.classList.add('is-stack');
    ul.setAttribute('role', 'group');
    ul.setAttribute('tabindex', '0');
    ul.setAttribute('aria-roledescription', 'media stack');
    ul.setAttribute('aria-label', items.length + ' items — drag to browse, click to expand');

    function render() {
      lis.forEach(function (li, i) {
        var pos = i - active;                       // signed: <0 already seen, >0 upcoming
        var apos = Math.min(Math.abs(pos), 3);
        li.style.transform = '';
        li.style.opacity = '';
        li.style.setProperty('--pos', pos);
        li.style.setProperty('--apos', apos);
        li.style.zIndex = items.length - apos;
        li.classList.toggle('is-hidden', apos > 2);
        li.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
    }
    // settle: re-enable transitions, flush so the dragged position is the
    // animation's start frame, then advance (or snap back with d === 0).
    function settle(d) {
      ul.classList.remove('is-dragging');
      void ul.offsetWidth;
      active = Math.min(items.length - 1, Math.max(0, active + d));
      render();
    }

    // ----- pointer drag (mouse + touch) -----
    var x0 = 0, y0 = 0, moved = false, down = false, horizontal = false;
    ul.addEventListener('dragstart', function (e) { e.preventDefault(); });
    ul.addEventListener('pointerdown', function (e) {
      down = true; moved = false; horizontal = false;
      x0 = e.clientX; y0 = e.clientY;
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
        if (e.cancelable) e.preventDefault();        // don't let the drag scroll the page
        ul.classList.add('is-dragging');
        var atEdge = (active === 0 && dx > 0) || (active === items.length - 1 && dx < 0);
        var eff = atEdge ? dx * 0.3 : dx;            // resistance at the ends
        var front = lis[active];
        front.style.transform = 'translateX(' + eff + 'px) rotate(' + (eff * 0.02) + 'deg)';
        front.style.opacity = '1';
        front.style.zIndex = items.length + 1;
      }
    });
    function release(e) {
      if (!down) return;
      down = false;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      var threshold = Math.max(36, ul.clientWidth * 0.10);
      if (horizontal && Math.abs(dx) > threshold) settle(dx < 0 ? 1 : -1);
      else if (!moved) lightbox.open(items, active, ul);
      else settle(0);
    }
    ul.addEventListener('pointerup', release);
    ul.addEventListener('pointercancel', function () { if (down) { down = false; settle(0); } });

    // ----- trackpad / wheel horizontal swipe -----
    // A horizontal two-finger swipe fires wheel events; claim them so they
    // leaf the stack instead of leaking into the page's vertical scroll-snap.
    var wheelAcc = 0, wheelLock = false, wheelTimer, horizUntil = 0;
    ul.addEventListener('wheel', function (e) {
      var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      var now = Date.now();
      if (horizontal) horizUntil = now + 220;
      // Genuine vertical scroll (no recent horizontal swipe) → let the page move.
      if (!horizontal && now > horizUntil) return;
      // Otherwise claim it: horizontal swipes AND their momentum tail, so an
      // edge swipe can never leak into the page's vertical scroll-snap.
      e.preventDefault();
      if (wheelLock || !horizontal) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) > 30) {
        settle(wheelAcc > 0 ? 1 : -1);
        wheelAcc = 0;
        wheelLock = true;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () { wheelLock = false; }, 450);
      }
    }, { passive: false });

    // ----- keyboard -----
    ul.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); settle(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); settle(-1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lightbox.open(items, active, ul); }
    });

    render();
  }

  // ---- shared fullscreen lightbox (native <dialog>) ----
  function createLightbox() {
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.innerHTML =
      '<button class="lightbox_close" type="button" aria-label="Close">×</button>' +
      '<button class="lightbox_nav -prev" type="button" aria-label="Previous">‹</button>' +
      '<div class="lightbox_stage" aria-live="polite"></div>' +
      '<button class="lightbox_nav -next" type="button" aria-label="Next">›</button>' +
      '<p class="lightbox_counter"></p>';
    document.body.appendChild(dlg);

    var stage = dlg.querySelector('.lightbox_stage');
    var counter = dlg.querySelector('.lightbox_counter');
    var btnPrev = dlg.querySelector('.-prev');
    var btnNext = dlg.querySelector('.-next');
    var current = [], idx = 0, opener = null;

    function render() {
      stage.textContent = '';
      var it = current[idx], node;
      if (it.type === 'video') {
        node = document.createElement('video');
        node.src = it.src;
        if (it.poster) node.poster = it.poster;
        node.controls = true; node.playsInline = true; node.autoplay = true; node.muted = true;
      } else {
        node = document.createElement('img');
        node.src = it.src; node.alt = it.alt;
      }
      node.className = 'lightbox_media';
      stage.appendChild(node);
      counter.textContent = (idx + 1) + ' / ' + current.length;
      var multi = current.length > 1;
      btnPrev.hidden = btnNext.hidden = counter.hidden = !multi;
    }
    function nav(d) { idx = (idx + d + current.length) % current.length; render(); }

    btnPrev.addEventListener('click', function () { nav(-1); });
    btnNext.addEventListener('click', function () { nav(1); });
    dlg.querySelector('.lightbox_close').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') nav(1);
      else if (e.key === 'ArrowLeft') nav(-1);
    });
    dlg.addEventListener('close', function () {
      stage.textContent = '';
      if (opener && opener.focus) opener.focus();
    });

    var sx = 0, sdown = false;
    stage.addEventListener('pointerdown', function (e) { sdown = true; sx = e.clientX; });
    stage.addEventListener('pointerup', function (e) {
      if (!sdown) return; sdown = false;
      var dx = e.clientX - sx;
      if (current.length > 1 && Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1);
    });

    return {
      open: function (items, index, trigger) {
        current = items; idx = index || 0; opener = trigger || null;
        render();
        if (!dlg.open) dlg.showModal();
        btnNext.focus({ preventScroll: true });
      }
    };
  }
})();
