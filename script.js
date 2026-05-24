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

  // ---- multiple items: fanned stack with inline leafing ----
  function setupStack(ul, items) {
    var lis = [].slice.call(ul.querySelectorAll('.media_item'));
    var active = 0;

    var wrap = document.createElement('div');
    wrap.className = 'media_wrap';
    ul.parentNode.insertBefore(wrap, ul);
    wrap.appendChild(ul);

    ul.classList.add('is-stack');
    ul.setAttribute('role', 'group');
    ul.setAttribute('tabindex', '0');
    ul.setAttribute('aria-roledescription', 'media stack');
    ul.setAttribute('aria-label', items.length + ' items — swipe or use arrow keys, click to expand');

    var nav = document.createElement('div');
    nav.className = 'media_nav';
    var prev = makeBtn('‹', 'Previous');
    var counter = document.createElement('span');
    counter.className = 'media_counter';
    var next = makeBtn('›', 'Next');
    nav.append(prev, counter, next);
    wrap.appendChild(nav);

    function render() {
      lis.forEach(function (li, i) {
        var pos = i - active;
        li.style.setProperty('--pos', Math.max(0, Math.min(pos, 3)));
        li.style.zIndex = pos < 0 ? 0 : items.length - pos;
        li.classList.toggle('is-behind', pos < 0);
        li.classList.toggle('is-deep', pos > 2);
        li.setAttribute('aria-hidden', pos === 0 ? 'false' : 'true');
      });
      counter.textContent = (active + 1) + ' / ' + items.length;
      prev.disabled = active === 0;
      next.disabled = active === items.length - 1;
    }
    function go(d) { active = Math.min(items.length - 1, Math.max(0, active + d)); render(); }

    prev.addEventListener('click', function (e) { e.stopPropagation(); go(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); go(1); });

    // tap to expand vs. horizontal drag to leaf
    var x0 = 0, y0 = 0, moved = false, down = false;
    ul.addEventListener('pointerdown', function (e) { down = true; moved = false; x0 = e.clientX; y0 = e.clientY; });
    ul.addEventListener('pointermove', function (e) {
      if (down && (Math.abs(e.clientX - x0) > 10 || Math.abs(e.clientY - y0) > 10)) moved = true;
    });
    ul.addEventListener('pointerup', function (e) {
      if (!down) return;
      down = false;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      else if (!moved) lightbox.open(items, active, ul);
    });
    ul.addEventListener('pointercancel', function () { down = false; });
    ul.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
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

  function makeBtn(glyph, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'media_btn';
    b.setAttribute('aria-label', label);
    b.textContent = glyph;
    return b;
  }
})();
