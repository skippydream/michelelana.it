/* ============================================================
   michelelana.it
   Poco lavoro per lo script: le schede sono statiche e tutto è
   già visibile. Restano l'anno nel footer, l'ombra dell'header
   quando la pagina scorre e la voce di menu attiva.
   ============================================================ */
(function () {
  'use strict';

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  var head = document.querySelector('header.top');
  if (head) {
    var mark = function () { head.classList.toggle('stuck', window.scrollY > 6); };
    mark();
    window.addEventListener('scroll', mark, { passive: true });
  }

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
