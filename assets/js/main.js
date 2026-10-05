/* ============================================================
   michelelana.it
   Poco lavoro per lo script: il saluto in base all'ora, l'anno nel
   footer, l'ombra dell'header e l'anello di loghi che seguono lo
   scroll, il download dell'APK, il menu mobile e la voce attiva.
   Lo carica solo index.html: gli elementi che cerca ci sono sempre.
   ============================================================ */
(function () {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

  var h = new Date().getHours();
  document.getElementById('greet').textContent =
    h >= 5 && h < 13 ? 'Buongiorno' : h >= 13 && h < 18 ? 'Buon pomeriggio' : 'Buonasera';

  // allo scroll, al massimo una volta per fotogramma: ombra dell'header e,
  // su mobile, angolo dell'anello di loghi (0,3° per pixel)
  var head = document.querySelector('header.top');
  var ring = document.querySelector('.stack');
  var spin = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame = 0;
  function onScroll() {
    frame = 0;
    head.classList.toggle('stuck', window.scrollY > 6);
    if (spin) ring.style.setProperty('--spin', (window.scrollY * 0.3) + 'deg');
  }
  onScroll();
  window.addEventListener('scroll', function () {
    if (!frame) frame = requestAnimationFrame(onScroll);
  }, { passive: true });


  /* ============================================================
     Download dell'APK
     Il collegamento non deve dipendere né dal tag né dal nome del
     file allegato: chiede a GitHub qual è l'ultima release e ne
     prende il primo .apk. La richiesta parte solo quando qualcuno
     mostra di volerci cliccare, non a ogni visita.
     Senza JS, o se l'API non risponde, resta l'indirizzo scritto
     nell'HTML: la pagina delle release, da cui si scarica a mano.
     ============================================================ */
  document.querySelectorAll('a[data-apk]').forEach(function (link) {
    var repo = link.getAttribute('data-apk');
    var risolto = null, inCorso = null;

    function risolvi() {
      if (risolto) return Promise.resolve(risolto);
      if (inCorso) return inCorso;

      inCorso = fetch('https://api.github.com/repos/' + repo + '/releases/latest')
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (d) {
          var apk = (d.assets || []).filter(function (a) {
            return /\.apk$/i.test(a.name);
          });
          if (!apk.length) throw new Error('nessun apk');
          // se ce n'è più d'uno, ha la precedenza quello di release
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

    // si prepara al passaggio del mouse o quando riceve il fuoco da tastiera
    link.addEventListener('pointerenter', risolvi);
    link.addEventListener('focus', risolvi);

    link.addEventListener('click', function (e) {
      if (risolto) return;                       // href già corretto
      e.preventDefault();
      var ripiego = link.getAttribute('href');
      risolvi().then(function (url) { window.location.href = url || ripiego; });
    });
  });

  // menu mobile: si chiude con un collegamento, con Esc o toccando fuori
  var menu = document.querySelector('details.menu');
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.open = false; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu.open = false; });
  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) menu.open = false; });

  // voce attiva: comprende anche i collegamenti del menu mobile, che stanno dentro nav.top-nav
  var anchors = {};
  document.querySelectorAll('nav.top-nav a[href^="#"]').forEach(function (a) {
    var k = a.getAttribute('href').slice(1);
    (anchors[k] = anchors[k] || []).push(a);
  });

  var sections = document.querySelectorAll('main section[id]');
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var list = anchors[e.target.id];
      if (!list || !e.isIntersecting) return;
      Object.keys(anchors).forEach(function (k) {
        anchors[k].forEach(function (a) { a.removeAttribute('aria-current'); });
      });
      list.forEach(function (a) { a.setAttribute('aria-current', 'true'); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (s) { spy.observe(s); });
})();
