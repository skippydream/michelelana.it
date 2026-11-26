/* ============================================================
   michelelana.it — lingue: italiano / inglese.
   All'apertura la lingua segue il browser (it → italiano, altrimenti
   inglese); il pulsante accanto al tema la alterna e salva la scelta.
   Nessun build step: le traduzioni sono dentro questo file.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'michelelana-lang';
  var EVENT = 'michelelana:langchange';

  var DICT = {
    it: {
      meta: {
        title: 'Michele Lana',
        description: 'Michele Lana. Sviluppo siti, piattaforme gestionali e app per macOS e Android, consulenza sulla privacy digitale. Torino, solo da remoto.',
        ogTitle: 'Michele Lana',
        ogDescription: 'Siti, piattaforme gestionali e applicazioni per macOS e Android. Consulenza sulla privacy digitale. Da Torino, solo da remoto.',
        ogImageAlt: 'Michele Lana, sviluppo siti, piattaforme gestionali e applicazioni',
        locale: 'it_IT',
        jobTitle: 'Sviluppatore web e consulente di privacy digitale'
      },
      error: {
        title: 'Pagina non trovata | Michele Lana',
        text: 'Questa pagina non esiste.',
        home: 'Torna alla home'
      },
      nav: {
        works: 'Lavori',
        about: 'Chi sono',
        career: 'Percorso',
        contact: 'Contatti',
        label: 'Navigazione',
        labelGallery: 'Lavori, slideshow',
        goTo: 'Vai a un lavoro',
        help: `Galleria di undici progetti. Con il mouse usa lo scroll orizzontale della rotellina o del trackpad, le frecce sinistra e destra o il trascinamento per cambiare progetto; usa lo scroll verticale verso l'alto, la freccia su, la barra spaziale o Invio per entrare nel progetto, e lo scroll verso il basso, la freccia giù, Escape o un altro clic per uscire. Sul touch fai swipe left o right per cambiare progetto, swipe up per entrare e swipe down per uscire, oppure tocca il dispositivo; se hai un progetto o un pannello aperto, scorri dal bordo sinistro o usa il pulsante indietro del browser per tornare ai lavori. Puoi anche usare le miniature in basso per scegliere un progetto.`,
        brandBack: 'Torna ai lavori',
        backTimeline: 'Torna alla timeline'
      },
      theme: {
        prefix: 'Tema: ',
        action: '. Attiva per passare a ',
        auto: 'Auto',
        light: 'Chiaro',
        dark: 'Scuro'
      },
      lang: {
        it: 'Italiano',
        en: 'Inglese',
        title: 'Lingua: ',
        aria: '. Attiva per passare a '
      },
      link: { newTab: ' (si apre in una nuova scheda)' },
      hint: {
        swipeChange: 'Swipe per cambiare',
        swipeOpen: 'Swipe up, entra',
        swipeClose: 'Swipe down, esci',
        scrollChange: 'Scroll per cambiare',
        scrollOpen: 'Scroll up, entra',
        scrollClose: 'Scroll down, esci'
      },
      slide: {
        1: 'Lavoro 1 di 11: Torino Sul Filo',
        2: 'Lavoro 2 di 11: Gestionale Torino Sul Filo',
        3: 'Lavoro 3 di 11: Biglietto Valle Orco Highline Festival',
        4: 'Lavoro 4 di 11: Pachamar Yoga',
        5: 'Lavoro 5 di 11: Appunti',
        6: 'Lavoro 6 di 11: Frushío',
        7: 'Lavoro 7 di 11: Strati',
        8: 'Lavoro 8 di 11: Sun Seeker',
        9: 'Lavoro 9 di 11: One Piece Watcher',
        10: 'Lavoro 10 di 11: Unsplash',
        11: 'Lavoro 11 di 11: SoundCloud'
      },
      s1: {
        sub2: 'Sito e piattaforma biglietti',
        role: 'Associazione',
        detail: 'Responsabile digitale',
        d1: 'Tesseramento, biglietteria con PDF,',
        d2: 'check-in agli eventi e schede dei corsi.',
        alt: 'Homepage del sito torinosulfilo.it'
      },
      s2: {
        title: 'Gestionale Torino Sul Filo',
        sub2: 'Gestionale React',
        detail: 'Gestionale su misura',
        d1: 'Flusso di cassa, tesseramenti e iscrizioni,',
        d2: 'biglietti, libro soci e verbali d\'assemblea.',
        alt: 'Gestionale Torino Sul Filo'
      },
      s3: {
        title: 'Biglietto con QR',
        cat: 'Eventi',
        sub2: 'Biglietto nominativo',
        detail: 'Check-in con scansione',
        d1: 'Biglietto personale, QR code e',
        d2: 'ingresso verificato allo staff.',
        alt: 'Biglietto dimostrativo del Valle Orco Highline Festival: nome fittizio e QR non valido',
        thumb: 'Biglietto Valle Orco Highline Festival'
      },
      s4: {
        sub2: 'Sito multi-pagina · IT/EN/ES',
        detail: 'Progetto di Nuri',
        d1: 'Vinyasa, Yin e Teoria Polivagale,',
        d2: 'mentoring e ritiro a Tenerife.',
        alt: 'Homepage del sito pachamaryoga.com',
        altMobile: 'Versione mobile del sito Pachamar Yoga'
      },
      s5: {
        sub2: 'App web di studio',
        role: 'Studio',
        detail1: 'Dispense in schede',
        detail2: 'Roadmap e ripasso',
        d1: 'Tracciamento dell\'avanzamento, timer,',
        d2: 'temi chiaro e scuro, offline.',
        alt: 'Homepage dell\'app web Appunti'
      },
      s6: {
        sub2: 'Lavori in corso',
        role: 'Collettivo',
        detail: 'Cofondatore',
        d1: 'Sito e piattaforma serate: prenotazioni,',
        d2: 'ricevute, check-in, archivio.',
        alt: 'Homepage desktop del sito Frushío'
      },
      s7: {
        role: 'Gioco',
        detail1: 'Domande filosofiche',
        detail2: 'Livelli di profondità',
        d1: 'Domande organizzate per tema e profondità,',
        d2: 'in italiano e inglese.',
        apk: 'Scarica l\'APK',
        alt: 'Schermata dell\'app Strati con il suo marchio'
      },
      s8: {
        role: 'Meteo',
        detail1: 'Ore di sole misurate',
        detail2: 'Sette giorni',
        d1: 'Alba, tramonto, golden hour, ora blu,',
        d2: 'dettaglio ora per ora e fasi lunari.',
        alt: 'Schermata dell\'app Sun Seeker con le previsioni solari per Torino (45,07°N 7,69°E)'
      },
      s9: {
        role: 'Lettore',
        detail1: 'Ripresa al minuto',
        detail2: 'Sincronia fra Mac',
        d1: 'Lettore integrato, posizione salvata',
        d2: 'e riproduzione offline.',
        alt: 'Schermata dell\'app One Piece Watcher dal README del progetto'
      },
      s10: {
        cat: 'Fotografia',
        sub2: 'Il mio profilo',
        role: 'Profilo',
        detail: 'Paesaggi, viaggi, highline',
        d1: 'Le foto che scatto tra montagne,',
        d2: 'viaggi e arrampicate.',
        alt: 'Griglia di foto dal profilo Unsplash di Michele Lana'
      },
      s11: {
        cat: 'Musica',
        sub2: 'Il mio profilo',
        role: 'Profilo',
        detail: 'Le mie tracce',
        d1: 'Musica elettronica autoprodotta, dal mix al master, ',
        d2: 'usando Ableton Live. Genere prevalentemente techno, ma non solo.',
        alt: 'Griglia delle copertine delle mie tracce dal profilo SoundCloud di Michele Lana'
      },
      about: {
        aria: 'Chi sono',
        p1: 'Ciao! Mi chiamo Michele, ho 28 anni e vivo a Torino. Sono sviluppatore freelance e lavoro soprattutto con associazioni e collettivi.',
        p2: 'Li conosco da dentro: sono responsabile digitale di Torino Sul Filo e cofondatore di Frushío, un collettivo sportivo, artistico e culturale.',
        p3: 'Mi occupo anche di privacy digitale. Fuori dallo schermo mi trovo tra highline, arrampicata e sci alpinismo.'
      },
      career: {
        aria: 'Percorso',
        tabsLabel: 'Sezioni del percorso',
        tabExperience: 'Esperienza',
        tabEducation: 'Formazione',
        tabSkills: 'Competenze',
        hExperience: 'Esperienza',
        hEducation: 'Formazione',
        hSkills: 'Competenze'
      },
      cv: {
        y2025: '2025 – oggi',
        y2024: '2024 – oggi',
        y2018: '2018 – 2019',
        y2022: '2022 – 2026',
        y2013: '2013 – 2017',
        today: 'Oggi',
        before: 'Prima',
        job1: 'Sviluppatore freelance',
        job1d: 'Siti, piattaforme di gestione, app Android e macOS.',
        job2: 'Consulente privacy digitale',
        job2d: 'Protezione di account, dispositivi e dati personali.',
        job3: 'Torino Sul Filo · Frushío',
        job3d: 'Responsabile digitale: sito, tesseramento e biglietteria. Cofondatore del collettivo.',
        job4d: 'Biglietteria online con QR code, marketing e infografiche dell\'evento.',
        job5: 'LineageOS per LG G5',
        job5d: 'Build dai sorgenti e rilasci pubblici, circa 4000 download. ',
        job6: 'Altri lavori',
        job6d: 'Vendite, ristorazione, eventi, consegne e lavori agricoli.',
        edu1: 'Scienze e Tecnologie Agrarie',
        edu1d: 'Agrobiotecnologie, Università di Torino',
        edu2: 'Liceo scientifico',
        edu2d: 'Liceo Scientifico “A. Volta”, Torino',
        sys: 'Sistemi',
        sysd: 'Linux, macOS, Android, bootloader e UEFI.',
        music: 'Musica',
        musicd: 'Ableton Live, produzione elettronica, mix e master.',
        photo: 'Fotografia',
        photod: 'Grafica e ritocco in Lightroom, Photoshop e Illustrator; paesaggi e viaggi.',
        events: 'Eventi',
        eventsd: 'Biglietteria online con QR code, vendita e marketing.',
        langs: 'Lingue',
        langsd: 'Italiano madrelingua, inglese B2, spagnolo B2, francese A2.',
        sports: 'Sport',
        sportsd: 'Highline (Slackline), Arrampicata (Sportiva 7a+, Trad, Multipitch 6c, Boulder Indoor 7b+ e Outdoor)'
      },
      contact: {
        aria: 'Contatti',
        p1: 'Hai un progetto in mente? Scrivimi.',
        availability: 'Disponibile per progetti',
        copy: 'Copia',
        copyAria: 'Copia indirizzo email',
        note: 'Torino, Italia · solo da remoto',
        copied: 'Copiato ✓',
        copyFailed: 'Copia non riuscita',
        copiedStatus: 'Indirizzo email copiato negli appunti.',
        copyFailedStatus: 'Non è stato possibile copiare l\'indirizzo email.'
      },
      apk: { version: 'Versione ' }
    },
    en: {
      meta: {
        title: 'Michele Lana',
        description: 'Michele Lana. Websites, management platforms and apps for macOS and Android, digital privacy consulting. Based in Turin, remote only.',
        ogTitle: 'Michele Lana',
        ogDescription: 'Websites, management platforms and apps for macOS and Android. Digital privacy consulting. From Turin, working remotely.',
        ogImageAlt: 'Michele Lana, websites, management platforms and apps',
        locale: 'en_US',
        jobTitle: 'Web developer and digital privacy consultant'
      },
      error: {
        title: 'Page not found | Michele Lana',
        text: 'This page doesn’t exist.',
        home: 'Back to home'
      },
      nav: {
        works: 'Work',
        about: 'About',
        career: 'Career',
        contact: 'Contact',
        label: 'Navigation',
        labelGallery: 'Work, slideshow',
        goTo: 'Go to a project',
        help: `A gallery of eleven projects. With a mouse, use horizontal scrolling on the wheel or trackpad, the left and right arrow keys, or drag to change project; use vertical scroll up, the up arrow, Space or Enter to open a project, and scroll down, the down arrow, Escape or another click to close it. On touch, swipe left or right to change project, swipe up to open and swipe down to close, or tap the device; if a project or panel is open, swipe from the left edge or use the browser's back button to return to the work. You can also use the thumbnails at the bottom to pick a project.`,
        brandBack: 'Back to work',
        backTimeline: 'Back to timeline'
      },
      theme: {
        prefix: 'Theme: ',
        action: '. Click to switch to ',
        auto: 'Auto',
        light: 'Light',
        dark: 'Dark'
      },
      lang: {
        it: 'Italian',
        en: 'English',
        title: 'Language: ',
        aria: '. Click to switch to '
      },
      link: { newTab: ' (opens in a new tab)' },
      hint: {
        swipeChange: 'Swipe to browse',
        swipeOpen: 'Swipe up to open',
        swipeClose: 'Swipe down to close',
        scrollChange: 'Scroll to browse',
        scrollOpen: 'Scroll up to open',
        scrollClose: 'Scroll down to close'
      },
      slide: {
        1: 'Project 1 of 11: Torino Sul Filo',
        2: 'Project 2 of 11: Torino Sul Filo admin dashboard',
        3: 'Project 3 of 11: Valle Orco Highline Festival ticket',
        4: 'Project 4 of 11: Pachamar Yoga',
        5: 'Project 5 of 11: Appunti',
        6: 'Project 6 of 11: Frushío',
        7: 'Project 7 of 11: Strati',
        8: 'Project 8 of 11: Sun Seeker',
        9: 'Project 9 of 11: One Piece Watcher',
        10: 'Project 10 of 11: Unsplash',
        11: 'Project 11 of 11: SoundCloud'
      },
      s1: {
        sub2: 'Website and ticketing platform',
        role: 'Association',
        detail: 'Digital manager',
        d1: 'Membership, PDF ticketing,',
        d2: 'event check-in and course pages.',
        alt: 'Homepage of torinosulfilo.it'
      },
      s2: {
        title: 'Torino Sul Filo admin dashboard',
        sub2: 'React admin dashboard',
        detail: 'Custom-built dashboard',
        d1: 'Cash flow, memberships and sign-ups,',
        d2: 'tickets, member register and meeting minutes.',
        alt: 'Torino Sul Filo admin dashboard'
      },
      s3: {
        title: 'QR ticket',
        cat: 'Events',
        sub2: 'Named ticket',
        detail: 'Scan-based check-in',
        d1: 'Personal ticket, QR code and',
        d2: 'entry verified by staff.',
        alt: 'Demo ticket for Valle Orco Highline Festival: fictional name and invalid QR code',
        thumb: 'Valle Orco Highline Festival ticket'
      },
      s4: {
        sub2: 'Multi-page website · IT/EN/ES',
        detail: 'A project by Nuri',
        d1: 'Vinyasa, Yin and Polyvagal Theory,',
        d2: 'mentoring and a retreat in Tenerife.',
        alt: 'Homepage of pachamaryoga.com',
        altMobile: 'Mobile version of Pachamar Yoga'
      },
      s5: {
        sub2: 'Study web app',
        role: 'Study',
        detail1: 'Notes as flashcards',
        detail2: 'Roadmaps and review',
        d1: 'Progress tracking, timer,',
        d2: 'light and dark themes, offline.',
        alt: 'Homepage of the Appunti web app'
      },
      s6: {
        sub2: 'Work in progress',
        role: 'Collective',
        detail: 'Co-founder',
        d1: 'Website and event platform: bookings,',
        d2: 'receipts, check-in, archive.',
        alt: 'Desktop homepage of Frushío'
      },
      s7: {
        role: 'Game',
        detail1: 'Philosophical questions',
        detail2: 'Depth levels',
        d1: 'Questions organised by topic and depth,',
        d2: 'in Italian and English.',
        apk: 'Download the APK',
        alt: 'Screenshot of the Strati app with its logo'
      },
      s8: {
        role: 'Weather',
        detail1: 'Measured sunshine hours',
        detail2: 'Seven days',
        d1: 'Sunrise, sunset, golden hour, blue hour,',
        d2: 'hour-by-hour detail and moon phases.',
        alt: 'Screenshot of the Sun Seeker app showing the solar forecast for Turin (45.07°N, 7.69°E)'
      },
      s9: {
        role: 'Reader',
        detail1: 'Minute-level resume',
        detail2: 'Sync across Macs',
        d1: 'Built-in player, saved position',
        d2: 'and offline playback.',
        alt: 'Screenshot of the One Piece Watcher app from the project README'
      },
      s10: {
        cat: 'Photography',
        sub2: 'My profile',
        role: 'Profile',
        detail: 'Landscapes, travel, highlining',
        d1: 'Photos I take among mountains,',
        d2: 'travel and climbing.',
        alt: 'Grid of photos from Michele Lana’s Unsplash profile'
      },
      s11: {
        cat: 'Music',
        sub2: 'My profile',
        role: 'Profile',
        detail: 'My tracks',
        d1: 'Self-produced electronic music, from mixing to mastering,',
        d2: 'using Ableton Live. Mostly techno, but not only.',
        alt: 'Grid of cover art from my tracks on Michele Lana’s SoundCloud profile'
      },
      about: {
        aria: 'About',
        p1: 'Hi! I’m Michele, I’m 28 and I live in Turin. I’m a freelance developer and mostly work with associations and collectives.',
        p2: 'I know them from the inside: I’m the digital manager for Torino Sul Filo and a co-founder of Frushío, a sports, arts and cultural collective.',
        p3: 'I also work on digital privacy. Away from the screen, you’ll find me highlining, climbing and ski touring.'
      },
      career: {
        aria: 'Career',
        tabsLabel: 'Career sections',
        tabExperience: 'Experience',
        tabEducation: 'Education',
        tabSkills: 'Skills',
        hExperience: 'Experience',
        hEducation: 'Education',
        hSkills: 'Skills'
      },
      cv: {
        y2025: '2025 – present',
        y2024: '2024 – present',
        y2018: '2018 – 2019',
        y2022: '2022 – 2026',
        y2013: '2013 – 2017',
        today: 'Present',
        before: 'Earlier',
        job1: 'Freelance developer',
        job1d: 'Websites, management platforms, Android and macOS apps.',
        job2: 'Digital privacy consultant',
        job2d: 'Protecting accounts, devices and personal data.',
        job3: 'Torino Sul Filo · Frushío',
        job3d: 'Digital manager: website, membership and ticketing. Co-founder of the collective.',
        job4d: 'Online ticketing with QR codes, marketing and event infographics.',
        job5: 'LineageOS for LG G5',
        job5d: 'Builds from source and public releases, around 4,000 downloads. ',
        job6: 'Other jobs',
        job6d: 'Sales, hospitality, events, deliveries and farm work.',
        edu1: 'Agricultural Science and Technology',
        edu1d: 'Agrobiotechnology, University of Turin',
        edu2: 'Science high school',
        edu2d: 'A. Volta Science High School, Turin',
        sys: 'Systems',
        sysd: 'Linux, macOS, Android, bootloaders and UEFI.',
        music: 'Music',
        musicd: 'Ableton Live, electronic production, mixing and mastering.',
        photo: 'Photography',
        photod: 'Editing and retouching in Lightroom, Photoshop and Illustrator; landscapes and travel.',
        events: 'Events',
        eventsd: 'Online ticketing with QR codes, sales and marketing.',
        langs: 'Languages',
        langsd: 'Native Italian, English B2, Spanish B2, French A2.',
        sports: 'Sports',
        sportsd: 'Highlining (slacklining), climbing (sport 7a+, trad, multi-pitch 6c, indoor bouldering 7b+ and outdoor)'
      },
      contact: {
        aria: 'Contact',
        p1: 'Have a project in mind? Get in touch.',
        availability: 'Available for projects',
        copy: 'Copy',
        copyAria: 'Copy email address',
        note: 'Turin, Italy · remote only',
        copied: 'Copied ✓',
        copyFailed: 'Copy failed',
        copiedStatus: 'Email address copied to clipboard.',
        copyFailedStatus: 'Couldn’t copy the email address.'
      },
      apk: { version: 'Version ' }
    }
  };

  /* Indice inverso: ogni stringa italiana del dizionario diventa la chiave
     per riconoscere il testo nell'HTML. Così l'HTML resta leggibile in
     italiano e non serve un attributo su ogni singolo span. */
  var SOURCE = {};
  function indexSources(table, prefix) {
    Object.keys(table).forEach(function (key) {
      var value = table[key];
      var path = prefix ? prefix + '.' + key : key;
      if (value && typeof value === 'object') indexSources(value, path);
      else if (typeof value === 'string') {
        var source = value.trim();
        if (source && !SOURCE[source]) SOURCE[source] = path;
      }
    });
  }
  indexSources(DICT.it, '');

  var lang = 'en';
  var bodyApplied = false;
  var toggleBound = false;
  var textEntries = [];
  var attrEntries = [];

  function detect() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved === 'it' || saved === 'en') return saved;
    var codes = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < codes.length; i++) {
      if (String(codes[i]).toLowerCase().indexOf('it') === 0) return 'it';
    }
    return 'en';
  }

  function lookup(table, parts) {
    var value = table;
    for (var i = 0; i < parts.length && value; i++) value = value[parts[i]];
    return value;
  }

  function t(key) {
    var parts = String(key).split('.');
    var value = lookup(DICT[lang], parts);
    if (typeof value !== 'string') value = lookup(DICT.en, parts);
    return typeof value === 'string' ? value : key;
  }

  function setText(el, key) {
    if (el) el.textContent = t(key);
  }

  function setAttr(el, name, key) {
    if (el) el.setAttribute(name, t(key));
  }

  function syncToggle() {
    var button = document.querySelector('[data-lang-toggle]');
    if (!button) return;
    var other = lang === 'it' ? 'en' : 'it';
    var label = button.querySelector('.lang-toggle__label');
    if (label) label.textContent = lang.toUpperCase();
    button.setAttribute('data-state', lang);
    button.setAttribute('title', t('lang.title') + t('lang.' + lang));
    button.setAttribute('aria-label', t('lang.title') + t('lang.' + lang) + t('lang.aria') + t('lang.' + other));
  }

  function applyHead() {
    document.documentElement.setAttribute('lang', lang);
    var title = document.querySelector('title');
    if (title) setText(title, title.getAttribute('data-i18n-key') || 'meta.title');
    var description = document.querySelector('meta[name="description"]');
    if (description) setAttr(description, 'content', description.getAttribute('data-i18n-key') || 'meta.description');
    setAttr(document.querySelector('meta[property="og:title"]'), 'content', 'meta.ogTitle');
    setAttr(document.querySelector('meta[property="og:description"]'), 'content', 'meta.ogDescription');
    setAttr(document.querySelector('meta[property="og:image:alt"]'), 'content', 'meta.ogImageAlt');
    setAttr(document.querySelector('meta[property="og:locale"]'), 'content', 'meta.locale');
  }

  function collectBody() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentNode;
        if (!parent || parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE' || parent.nodeName === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        return SOURCE[node.nodeValue.trim()] ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      var raw = node.nodeValue;
      var source = raw.trim();
      var start = raw.indexOf(source);
      textEntries.push({
        node: node, key: SOURCE[source],
        leading: raw.slice(0, start), trailing: raw.slice(start + source.length)
      });
    }
    ['aria-label', 'title', 'alt'].forEach(function (name) {
      Array.prototype.forEach.call(document.querySelectorAll('[' + name + ']'), function (el) {
        var original = el.getAttribute(name) || '';
        var key = SOURCE[original.trim()];
        /* Serve anche senza chiave: current() restituisce il valore iniziale
           per gli attributi riscritti poi da main.js (tooltip delle miniature). */
        attrEntries.push({ el: el, name: name, key: key || null, original: original });
      });
    });
  }

  function translateDom() {
    textEntries.forEach(function (entry) {
      entry.node.nodeValue = entry.leading + t(entry.key) + entry.trailing;
    });
    attrEntries.forEach(function (entry) {
      if (entry.key) entry.el.setAttribute(entry.name, t(entry.key));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      setText(el, el.getAttribute('data-i18n'));
    });
    ['aria-label', 'title', 'alt'].forEach(function (name) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-' + name + ']'), function (el) {
        setAttr(el, name, el.getAttribute('data-i18n-' + name));
      });
    });
    var schema = document.getElementById('schema-person');
    if (schema) {
      try {
        var data = JSON.parse(schema.textContent);
        data.jobTitle = t('meta.jobTitle');
        schema.textContent = JSON.stringify(data, null, 1);
      } catch (e) {}
    }
    syncToggle();
  }

  function applyBody() {
    if (bodyApplied || !document.body) return;
    bodyApplied = true;
    collectBody();
    var button = document.querySelector('[data-lang-toggle]');
    if (button && !toggleBound) {
      toggleBound = true;
      button.addEventListener('click', function () {
        setLang(lang === 'it' ? 'en' : 'it', true);
      });
    }
    translateDom();
  }

  function setLang(next, save) {
    if (next !== 'it' && next !== 'en') return;
    var changed = next !== lang;
    lang = next;
    if (save) { try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {} }
    applyHead();
    if (bodyApplied) translateDom();
    if (changed) {
      document.dispatchEvent(new CustomEvent(EVENT, { detail: { lang: lang } }));
    }
  }

  /* current(el, attr) restituisce la traduzione corrente di un attributo
     presente nell'HTML prima che altri script lo riscrivano (per esempio
     l'aria-label delle miniature, che main.js trasforma in tooltip). Se il
     testo non è nel dizionario restituisce il valore iniziale dell'attributo. */
  function current(el, name) {
    for (var i = 0; i < attrEntries.length; i++) {
      if (attrEntries[i].el !== el || attrEntries[i].name !== name) continue;
      return attrEntries[i].key ? t(attrEntries[i].key) : attrEntries[i].original;
    }
    return null;
  }

  window.MicheleI18n = {
    t: t,
    current: current,
    lang: function () { return lang; },
    setLang: setLang,
    applyHead: applyHead,
    applyBody: applyBody,
    event: EVENT
  };

  lang = detect();
  applyHead();
  document.addEventListener('DOMContentLoaded', applyBody);
})();
