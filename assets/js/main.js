/* ============================================================
   michelelana.it — galleria in stile mikematas.com
   Timeline di miniature e progetto aperto: due stati soltanto.
   L'apertura usa un FLIP: l'immagine cresce dove si trova, senza
   lo scorrimento del track. In timeline ricevono il click solo i
   dispositivi, perché le card si sovrappongono.
   ============================================================ */
(function () {
  'use strict';

  var yearEl = document.getElementById('year');

  var gallery = document.querySelector('.gallery');
  var viewport = gallery.querySelector('.gallery__viewport');
  var track = gallery.querySelector('.gallery__track');
  var slides = Array.prototype.slice.call(gallery.querySelectorAll('.slide'));
  var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('.timeline button'));
  var navButtons = Array.prototype.slice.call(document.querySelectorAll('.nav button[data-panel]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var back = document.querySelector('.back');
  var cursor = document.querySelector('.cursor');
  var hint = gallery.querySelector('.gallery__hint');

  var index = 0;
  var zoomed = false;
  var locked = false;       // solo per il paging orizzontale
  var activePanel = null;
  var LOCK = 300;           // cooldown reattivo tra uno scatto e l'altro
  var FLY = 520;            // durata scattante e fluida dell'enlargement (GPU composited)
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var touchX = null, touchY = null;
  var pinchDist = null;
  var flipAnim = null, fadeAnims = [];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  var lastSlideTime = 0;
  var lastWheelTime = 0;
  var yearTimer;
  var prevDeltaX = 0;
  var prevDeltaY = 0;
  var wheelAccumX = 0;
  var wheelAccumY = 0;

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  /* ---------- galleria ---------- */
  function innerWidth() {
    var w = window.innerWidth;
    if (w <= 600) return w - 40;
    if (w <= 900) return w - 40;
    return clamp(w - 120, 1000, 1440);
  }

  function cardWidth() {
    var w = window.innerWidth;
    if (w <= 600) return Math.round(w * 0.78);
    if (w <= 900) return Math.max(220, Math.round((w - 40) * 0.74));
    // la card è una frazione dell'inner: k<1 rende visibile l'enlargement
    var iw = innerWidth();
    return clamp(Math.round(iw * 0.78), 780, 1120);
  }

  // il dispositivo è limitato dall'altezza utile; sui compact lo scala in JS
  function visualMax() {
    var w = window.innerWidth, h = window.innerHeight;
    if (w <= 900) return Math.min(700, Math.round(h * 1.1));
    return 700;
  }

  // le card si sovrappongono: resta un piccolo spazio tra le immagini
  function overlap(cw, iw) {
    var w = window.innerWidth;
    if (w <= 600) return -16; // 16px di spazio pulito tra card in mobile portrait
    var dev = visualMax() * cw / iw;
    return Math.max(0, Math.round(cw - dev - 60));
  }

  // Strati ha solo il telefono su desktop/tablet: la card si compatta di più
  // Su mobile portrait tutte le card hanno larghezza e spaziatura uniformi
  function isPhoneSlide(s) {
    if (window.innerWidth <= 600) return false;
    return s.classList.contains('slide--phone');
  }

  function extraPhone() {
    if (window.innerWidth <= 600) return 0;
    return window.innerWidth <= 900 ? 50 : 134;
  }

  function centerActiveThumb(i) {
    if (i < 0 || i >= thumbs.length) return;
    var thumb = thumbs[i];
    var tl = gallery.querySelector('.timeline');
    if (!thumb || !tl) return;
    if (tl.scrollWidth > tl.clientWidth) {
      var target = thumb.offsetLeft - (tl.clientWidth - thumb.clientWidth) / 2;
      tl.scrollTo({ left: Math.max(0, target), behavior: reduce.matches ? 'auto' : 'smooth' });
    }
  }

  function apply() {
    var cw = cardWidth(), iw = innerWidth();
    var k = cw / iw;
    var vw = window.innerWidth, vh = window.innerHeight;
    var ov = overlap(cw, iw);
    // il telefono in timeline resta ingrandito; su telefono in portrait lo si
    // riduce perché la filmstrip sta al centro e il telefono alto la coprirebbe
    var pv = window.matchMedia('(max-width:600px) and (orientation:portrait)').matches ? 1.1 : 1.6;
    var extra = extraPhone();
    gallery.style.setProperty('--card-w', cw + 'px');
    gallery.style.setProperty('--inner-w', iw + 'px');
    gallery.style.setProperty('--overlap', ov + 'px');
    gallery.style.setProperty('--extra', extra + 'px');
    gallery.style.setProperty('--pv', zoomed ? '1' : String(pv));
    gallery.style.setProperty('--k', zoomed ? '1' : k.toFixed(4));
    gallery.style.setProperty('--slide-w', (zoomed ? vw : cw) + 'px');
    gallery.style.setProperty('--slide-h', Math.round(vh) + 'px');
    // posizioni cumulative: Strati occupa meno spazio dei vicini su desktop
    var pos = 0, offsets = [0];
    for (var j = 0; j < slides.length - 1; j++) {
      if (!zoomed) {
        var ej = isPhoneSlide(slides[j]) ? extra : 0;
        var en = isPhoneSlide(slides[j + 1]) ? extra : 0;
        pos += cw - ov - ej - en;
      } else {
        pos += vw;
      }
      offsets.push(pos);
    }
    var center = zoomed ? 0 : (vw - cw) / 2;
    track.style.transform = 'translate3d(' + Math.round(center - offsets[index]) + 'px,0,0)';
    gallery.classList.toggle('is-zoomed', zoomed);
    var date = slides[index].querySelector('.slide__date');
    var newYear = date ? date.textContent.trim() : '';
    if (yearEl) {
      clearTimeout(yearTimer);
      if (!yearEl.textContent) {
        yearEl.textContent = newYear;
      } else if (yearEl.textContent !== newYear) {
        yearEl.classList.add('is-changing');
        yearTimer = setTimeout(function () {
          yearEl.textContent = newYear;
          yearEl.classList.remove('is-changing');
        }, 140);
      } else {
        yearEl.classList.remove('is-changing');
      }
    }
    if (back) {
      back.hidden = !zoomed && !activePanel;
      back.setAttribute('aria-label', activePanel ? 'Torna ai lavori' : 'Torna alla timeline');
    }
    slides.forEach(function (s, i) {
      var on = i === index;
      s.style.zIndex = zoomed ? '' : String(slides.length - i);
      s.style.setProperty('--d', Math.min(Math.abs(i - index), 4));
      s.classList.toggle('is-active', on);
      s.toggleAttribute('inert', zoomed && !on);
      s.setAttribute('aria-hidden', (zoomed && !on) ? 'true' : 'false');
      s.querySelector('.slide__text').toggleAttribute('inert', !zoomed);
    });
    thumbs.forEach(function (b, i) {
      if (i === index) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    centerActiveThumb(index);
  }

  function lock() {
    locked = true;
    window.setTimeout(function () { locked = false; }, reduce.matches ? 120 : LOCK);
  }

  /* Apre/chiude (e/o cambia progetto) con FLIP sull'inner: è lui che contiene
     l'immagine e che cambia posizione/scala tra timeline e aperto. Viene
     misurato prima, la geometria viene scambiata a transizioni spente,
     poi l'inner è riportato al rettangolo iniziale e rilasciato.
     Il track non scorre: la card cresce esattamente dov'è. */
  function transitionTo(to, open) {
    to = clamp(to, 0, slides.length - 1);
    open = !!open;
    if (activePanel || (to === index && open === zoomed)) return false;

    var target = slides[to];
    var inner = target.querySelector('.slide__inner');
    var canFlip = !reduce.matches && typeof inner.animate === 'function';
    var before = canFlip ? inner.getBoundingClientRect() : null;
    var beforeOp = canFlip ? slides.map(function (s) { return getComputedStyle(s).opacity; }) : null;
    var pvBefore = gallery.style.getPropertyValue('--pv') || '1';

    if (canFlip) gallery.classList.add('no-transitions');
    index = to;
    zoomed = open;
    apply();

    if (canFlip) {
      // obbliga il browser a registrare la nuova geometria a transizioni spente,
      // altrimenti rimettendole riparte la transizione del track (lo scorrimento)
      void gallery.offsetWidth;
      var after = inner.getBoundingClientRect();
      var afterOp = slides.map(function (s) { return getComputedStyle(s).opacity; });
      gallery.classList.remove('no-transitions');

      if (flipAnim) { flipAnim.cancel(); flipAnim = null; }
      fadeAnims.forEach(function (a) { a.cancel(); });
      fadeAnims = [];

      var iw = inner.offsetWidth, ih = inner.offsetHeight;
      var sx = after.width ? before.width / after.width : 1;
      var sy = after.height ? before.height / after.height : 1;
      var dx = (before.left + before.width / 2) - (after.left + after.width / 2) + (sx - 1) * iw / 2;
      var dy = (before.top + before.height / 2) - (after.top + after.height / 2) + (sy - 1) * ih / 2;
      var moved = Math.abs(sx - 1) > .01 || Math.abs(sy - 1) > .01 ||
                  Math.abs(dx) > 1 || Math.abs(dy) > 1;
      var base = 'translate(-50%,-50%) scale(' + (gallery.style.getPropertyValue('--k') || '1') + ')';

      // la trasformazione CSS di partenza è sempre translate(-50%,-50%) scale(k):
      // il FLIP si compone davanti, con transform-origin al centro (quello di default)
      var start = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(' + sx + ',' + sy + ') ' + base;
      flipAnim = inner.animate(
        [{ transform: moved ? start : base }, { transform: base }],
        { duration: FLY, easing: EASE, fill: 'none' }
      );
      flipAnim.onfinish = flipAnim.oncancel = function () {
        if (flipAnim && flipAnim.playState !== 'running') flipAnim = null;
      };

      // Strati (e Pachamar su telefono) ha il telefono ingrandito in timeline:
      // accompagno anche quel cambio di scala, altrimenti l'immagine si accorcia
      // di colpo all'inizio
      var visual = target.querySelector('.slide__visual--phone');
      if (!visual && isPhoneSlide(target)) visual = target.querySelector('.slide__visual');
      var pvAfter = gallery.style.getPropertyValue('--pv') || '1';
      if (visual && pvBefore !== pvAfter) {
        visual.style.transformOrigin = 'center center';
        var pvAnim = visual.animate(
          [{ transform: 'scale(' + pvBefore + ')' }, { transform: 'scale(' + pvAfter + ')' }],
          { duration: FLY, easing: EASE, fill: 'none' }
        );
        pvAnim.onfinish = pvAnim.oncancel = function () { visual.style.transformOrigin = ''; };
        fadeAnims.push(pvAnim);
      }

      slides.forEach(function (s, i) {
        if (beforeOp[i] === afterOp[i]) return;
        fadeAnims.push(s.animate(
          [{ opacity: beforeOp[i] }, { opacity: afterOp[i] }],
          { duration: 650, easing: EASE, fill: 'none' }
        ));
      });
    }
    return true;
  }

  function setZoom(on) { return transitionTo(index, on); }

  function move(to) {
    var dest = clamp(to, 0, slides.length - 1);
    if (dest === index) return false;
    index = dest;
    apply();
    return true;
  }

  function step(dir) {
    if (locked || activePanel) return;
    if (!move(index + dir)) return;
    lock();
  }

  function distance(touches) {
    var dx = touches[0].clientX - touches[1].clientX;
    var dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function wheel(e) {
    if (activePanel || e.ctrlKey) return;

    var now = performance.now();
    var timeSinceLastSlide = now - lastSlideTime;
    var timeSinceLastEvent = now - lastWheelTime;
    lastWheelTime = now;

    var dx = e.deltaX, dy = e.deltaY;
    if (e.deltaMode === 1) { dx *= 20; dy *= 20; }
    else if (e.deltaMode === 2) { dx *= window.innerWidth; dy *= window.innerHeight; }

    var absX = Math.abs(dx);
    var absY = Math.abs(dy);

    // Se l'utente si è fermato per più di 150ms, azzera l'accumulo e lo stato precedente
    if (timeSinceLastEvent > 150) {
      wheelAccumX = 0;
      wheelAccumY = 0;
      prevDeltaX = 0;
      prevDeltaY = 0;
    }

    // Durante la transizione dello scatto (primi 450ms), assorbi l'evento
    if (timeSinceLastSlide < 450) {
      prevDeltaX = absX;
      prevDeltaY = absY;
      e.preventDefault();
      return;
    }

    // Se arrivano eventi della coda di inerzia con velocità decrescente (< prevDelta),
    // sono la scia dello stesso gesto: ignorali per evitare il doppio scatto
    var isDecayingX = prevDeltaX > 0 && absX <= prevDeltaX && timeSinceLastEvent < 100;
    var isDecayingY = prevDeltaY > 0 && absY <= prevDeltaY && timeSinceLastEvent < 100;

    prevDeltaX = absX;
    prevDeltaY = absY;

    // Asse verticale prevalente: Zoom
    if (absY > absX * 1.3) {
      if (isDecayingY) {
        e.preventDefault();
        return;
      }
      wheelAccumY += dy;
      if (Math.abs(wheelAccumY) > 48) {
        setZoom(wheelAccumY > 0);
        lastSlideTime = now;
        wheelAccumX = 0;
        wheelAccumY = 0;
        prevDeltaX = 0;
        prevDeltaY = 0;
      }
      e.preventDefault();
    } else if (absX > 4) {
      // Asse orizzontale: Paging della timeline
      if (isDecayingX) {
        e.preventDefault();
        return;
      }
      wheelAccumX += dx;
      if (Math.abs(wheelAccumX) > 35) {
        var dir = wheelAccumX > 0 ? 1 : -1;
        move(index + dir);
        lastSlideTime = now;
        wheelAccumX = 0;
        wheelAccumY = 0;
        prevDeltaX = 0;
        prevDeltaY = 0;
      }
      e.preventDefault();
    }
  }
  viewport.addEventListener('wheel', wheel, { passive: false });

  viewport.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      pinchDist = distance(e.touches);
      touchX = touchY = null;
      return;
    }
    pinchDist = null;
    if (e.touches.length !== 1) return;
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
  }, { passive: true });

  viewport.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2 && pinchDist !== null) {
      var d = distance(e.touches);
      if (Math.abs(d - pinchDist) > 40) {
        setZoom(d > pinchDist);
        pinchDist = d;
      }
    }
  }, { passive: true });

  viewport.addEventListener('touchend', function (e) {
    if (pinchDist !== null && e.touches.length < 2) { pinchDist = null; return; }
    if (touchX === null || !e.changedTouches.length) return;
    var dx = e.changedTouches[0].clientX - touchX;
    var dy = e.changedTouches[0].clientY - touchY;
    touchX = touchY = null;
    if (activePanel) return;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) { setZoom(dy < 0); return; }
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // drag-to-pan orizzontale con mouse sulla timeline
  var isMouseDown = false;
  var dragStartX = 0, dragStartY = 0;
  var hasDragged = false;
  var dragAccum = 0;

  viewport.addEventListener('mousedown', function (e) {
    if (activePanel || zoomed || e.button !== 0) return;
    if (e.target.closest('a,button')) return;
    isMouseDown = true;
    hasDragged = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragAccum = 0;
  });

  window.addEventListener('mousemove', function (e) {
    if (!isMouseDown) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    if (!hasDragged && (Math.abs(dx) > 12 || Math.abs(dy) > 12)) {
      hasDragged = true;
      viewport.classList.add('is-dragging');
      if (cursor) cursor.classList.add('is-dragging');
    }
    if (hasDragged && !locked) {
      dragAccum += dx;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      if (Math.abs(dragAccum) > 48) {
        var dir = dragAccum > 0 ? -1 : 1;
        if (move(index + dir)) lock();
        dragAccum = 0;
      }
    }
  });

  window.addEventListener('mouseup', function (e) {
    if (!isMouseDown) return;
    isMouseDown = false;
    viewport.classList.remove('is-dragging');
    if (cursor) cursor.classList.remove('is-dragging');
    if (hasDragged) {
      setTimeout(function () { hasDragged = false; }, 60);
    }
  });

  // click sull'immagine (in timeline solo lei riceve il click: le card si sovrappongono)
  slides.forEach(function (s, i) {
    s.addEventListener('click', function (e) {
      if (activePanel || hasDragged) return;
      if (e.target.closest('a,button')) return;
      transitionTo(i, i !== index || !zoomed);
    });
  });

  thumbs.forEach(function (b) {
    b.addEventListener('click', function () {
      var to = Number(b.getAttribute('data-go'));
      if (to === index && !zoomed) return;
      transitionTo(to, false);
    });
  });

  /* ---------- pannelli ---------- */
  function setNav(id) {
    navButtons.forEach(function (b) {
      if (b.getAttribute('data-panel') === id) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function openPanel(id) {
    if (id === 'lavori') { closePanel(); return; }
    var panel = document.getElementById(id);
    if (!panel || activePanel === id) return;
    if (activePanel) {
      var old = document.getElementById(activePanel);
      old.classList.remove('is-open');
      old.hidden = true;
    }
    activePanel = id;
    panel.hidden = false;
    void panel.offsetWidth; // fa partire la transizione dallo stato chiuso
    panel.classList.add('is-open');
    back.hidden = false;
    gallery.toggleAttribute('inert', true);
    setNav(id);
  }

  function closePanel() {
    if (!activePanel) return;
    var panel = document.getElementById(activePanel);
    var id = activePanel;
    panel.classList.remove('is-open');
    window.setTimeout(function () { if (activePanel !== id) panel.hidden = true; }, reduce.matches ? 20 : 750);
    activePanel = null;
    back.hidden = !zoomed;
    if (zoomed) back.setAttribute('aria-label', 'Torna alla timeline');
    gallery.removeAttribute('inert');
    setNav('lavori');
  }

  navButtons.forEach(function (b) {
    b.addEventListener('click', function () { openPanel(b.getAttribute('data-panel')); });
  });
  back.addEventListener('click', function () {
    if (activePanel) closePanel();
    else if (zoomed) setZoom(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'Escape') {
      if (activePanel) closePanel();
      else if (zoomed) setZoom(false);
      return;
    }
    if (activePanel) return;
    var el = document.activeElement;
    if (el && el !== document.body && el !== document.documentElement &&
        el.closest('a,button,input,textarea,select,[contenteditable="true"]')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setZoom(!zoomed); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(slides.length - 1); }
  });

  window.addEventListener('resize', apply);
  if (hint && window.matchMedia('(hover:none)').matches) {
    hint.textContent = 'Scorri per esplorare · tocca per aprire';
  }
  apply();

  /* ---------- cursore invertito, solo con mouse ---------- */
  if (cursor && !/[?&]nocursor=1/.test(location.search) &&
      window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduce.matches) {
    var tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    var cx = tx, cy = ty, raf = 0, last = performance.now();
    var isDrawing = false;

    // inerzia indipendente dal refresh rate: si addormenta quando il cursore è fermo
    function draw(now) {
      var dt = Math.min(3, (now - last) / 16.667) || 1;
      last = now;
      var a = 1 - Math.pow(.82, dt);
      cx += (tx - cx) * a;
      cy += (ty - cy) * a;
      cursor.style.transform = 'translate3d(' + (cx - 24) + 'px,' + (cy - 24) + 'px,0)';
      if (Math.abs(tx - cx) > 0.15 || Math.abs(ty - cy) > 0.15) {
        raf = requestAnimationFrame(draw);
      } else {
        cx = tx; cy = ty;
        cursor.style.transform = 'translate3d(' + (cx - 24) + 'px,' + (cy - 24) + 'px,0)';
        isDrawing = false;
      }
    }

    function wake() {
      if (!isDrawing) {
        isDrawing = true;
        last = performance.now();
        raf = requestAnimationFrame(draw);
      }
    }

    wake();
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      wake();
      var el = e.target;
      var isInteractive = el && el.closest && (
        el.closest('a, button, [role="button"], .brand') ||
        (!zoomed && el.closest('.device, .slide.is-active'))
      );
      cursor.classList.toggle('is-over', !!isInteractive);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; wake(); });
    window.addEventListener('blur', function () { cursor.style.opacity = '0'; });
    window.addEventListener('focus', function () { cursor.style.opacity = '1'; wake(); });
  }

  /* ---------- download APK ---------- */
  document.querySelectorAll('a[data-apk]').forEach(function (link) {
    var repo = link.getAttribute('data-apk');
    var risolto = null, inCorso = null;

    function risolvi() {
      if (risolto) return Promise.resolve(risolto);
      if (inCorso) return inCorso;
      inCorso = fetch('https://api.github.com/repos/' + repo + '/releases/latest')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          var apk = (d.assets || []).filter(function (a) { return /\.apk$/i.test(a.name); });
          if (!apk.length) throw new Error('nessun apk');
          apk.sort(function (a, b) {
            return (/release/i.test(b.name) ? 1 : 0) - (/release/i.test(a.name) ? 1 : 0);
          });
          risolto = apk[0].browser_download_url;
          link.href = risolto;
          if (d.tag_name) link.title = 'Versione ' + d.tag_name;
          return risolto;
        })
        .catch(function () { inCorso = null; return null; });
      return inCorso;
    }

    link.addEventListener('pointerenter', risolvi);
    link.addEventListener('focus', risolvi);
  });
})();
