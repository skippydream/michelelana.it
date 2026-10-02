/* ============================================================
   michelelana.it
   Poco lavoro per lo script: le schede sono statiche e tutto è
   già visibile. Restano il saluto in base all'ora, l'anno nel footer,
   l'ombra dell'header quando la pagina scorre e la voce di menu attiva.
   ============================================================ */
(function () {
  'use strict';

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var g = document.getElementById('greet');
  if (g) {
    var h = new Date().getHours();
    g.textContent = h >= 5 && h < 13 ? 'Buongiorno' : h >= 13 && h < 18 ? 'Buon pomeriggio' : 'Buonasera';
  }

  var head = document.querySelector('header.top');
  if (head) {
    var mark = function () { head.classList.toggle('stuck', window.scrollY > 6); };
    mark();
    window.addEventListener('scroll', mark, { passive: true });
  }


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

  var anchors = {};
  document.querySelectorAll('nav.top-nav a[href^="#"]').forEach(function (a) {
    anchors[a.getAttribute('href').slice(1)] = a;
  });

  var sections = document.querySelectorAll('main section[id]');
  if (!sections.length || !('IntersectionObserver' in window)) return;

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var a = anchors[e.target.id];
      if (!a || !e.isIntersecting) return;
      Object.keys(anchors).forEach(function (k) {
        anchors[k].removeAttribute('aria-current');
      });
      a.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(function (s) { spy.observe(s); });
})();
