# Sito personale, Michele Lana

Sito personale statico. Nessun framework, nessun build step: sono file che il
browser apre così come sono.

```
index.html            la pagina
404.html              pagina di errore
assets/css/style.css  stile e token del design
assets/js/main.js     anno, paging, pannelli, cursore, download dell'APK
assets/img/           screenshot nei frame, foto (michele.jpg) e anteprima social;
                      screens/ ha gli screenshot, thumbs/ le miniature della timeline
favicon.svg           icona della scheda
robots.txt sitemap.xml
tools/                strumenti locali (fuori dal sito)
```

## Il design

È un **clone integrale** di [mikematas.com](https://mikematas.com/), con i miei
contenuti: pagina fissa a schermo intero, niente scroll verticale e niente
scrollbar, bianco e nero con tema scuro automatico, Geist a tutte le misure (la variabile 100–900), testi
leggeri, griglia centrata di 1000 px, header con nome e anno in colonna a sinistra
(come nella reference: nome a 116 px dal bordo superiore, anno subito sotto) e
navigazione in colonna a destra, cursore cerchio che inverte lo sfondo. Il font di Mike
(Lab Grotesque) non è stato copiato: uso Geist, che è open source.

Il cursore compare solo con mouse preciso (`hover:hover` e `pointer:fine`); con
`prefers-reduced-motion` o `?nocursor=1` resta quello del browser e le animazioni
si accorciano.

Il tema segue `prefers-color-scheme`: su sistema chiaro sfondo `#ffffff` e testo
nero, su sistema scuro sfondo `#14161a` e testo `#f2f3f5`. Non c'è un interruttore:
basta il tema del sistema. Anche `404.html` e il colore della barra del browser
seguono la stessa preferenza.

## La galleria

Come nella reference ci sono **due stati**, su desktop e su mobile:

- **Zoom out (timeline).** I progetti sono card allineate in basso, centrate
  sull'attiva; si vede solo l'immagine, senza titolo, e le card lontane si
  schiariscono. Le card si sovrappongono di ~650 px: tra un'immagine e l'altra
  resta uno spazio di circa 60 px. La miniatura di Strati (solo telefono) è
  ridimensionata e centrata per non sovrapporsi a Pachamar. Si scorre **lateralmente** con rotellina/trackpad orizzontale,
  swipe, frecce `←`/`→` o `Home`/`End`.
- **Zoom in (gallery).** Cliccando l'immagine di una card (o con rotellina
  verticale, swipe verso l'alto, barra spaziale/Invio) la card si apre a schermo intero: a
  sinistra compaiono titolo, sottotitolo, dettagli e link, a destra il progetto
  dentro un frame **ThinkPad** o **Google Pixel 10a**, entrambi in CSS puro.
  I dettagli esistono solo in questo stato. `Escape`, un altro clic, la rotellina
  verticale contraria o lo swipe verso il basso riportano alla timeline.

Lo zoom non scatta e non gonfia l'immagine: `.slide__inner` ha **sempre** la
dimensione finale (`--inner-w`, 1641 px su desktop) e in timeline viene solo
scalato tramite `--k` con `transform`, esattamente come nella reference. I due
valori sono stati invertiti rispetto alla prova precedente: la card della
striscia è più piccola (`--card-w`, ~1238 px a 1440 px, 350 px su telefono,
520 px in landscape) e l'elemento aperto è più grande. L'apertura è un **FLIP**
sull'inner: la geometria viene scambiata a transizioni spente e l'immagine viene
riportata al suo rettangolo di partenza, poi rilasciata sulla curva esponenziale
(`--ease`, 950 ms). Così la card cresce dov'è, senza lo scorrimento del track;
anche padding e scala del telefono di Strati sono animati insieme. Il FLIP è
interrompibile e i dettagli entrano in ritardo senza spostare l'immagine.
Filmstrip, pannelli, frecce e cursore usano la stessa curva, con tempi più
lunghi sulle aperture e più corti sugli hover.
L'anno nell'header non è fisso: `apply()` legge
il `.slide__date` della slide attiva, quindi passa da 2026 a 2025 su One Piece
Watcher. La rotellina verticale comanda lo zoom, quella orizzontale il paging;
sul touch vale la stessa distinzione tra swipe verticale e orizzontale, più il
pizzico. `main.js` blocca solo il paging per 300 ms (120 ms con reduced motion)
e assorbe la rotellina per 450 ms dopo uno scatto, mentre lo zoom resta sempre
cliccabile. In basso la
**timeline** di miniature resta disponibile nello zoom-in: un clic apre direttamente
il progetto scelto e torna allo zoom-out. Nello zoom-in le slide inattive hanno
`inert` e `aria-hidden="true"`.

### Mobile e tablet

Fino a 900 px di larghezza (e in landscape con altezza ≤ 520 px) l'inner aperto
è largo `viewport - 40`, così tutto resta dentro lo schermo: niente immagini
fuori riquadro su iPad in verticale. La card della striscia è il 74% dell'inner
(minimo 220 px), quindi `k < 1` e l'apertura è un vero enlargement anche su
telefono: per esempio a 390×844 l'immagine passa da 237 a 320 px. Su mobile non
c'è lo zoom extra dell'anteprima (`--pv: 1`): è il FLIP a ingrandire ogni
dispositivo in modo uniforme. Il testo resta in alto, il dispositivo sotto e la
filmstrip in basso; l'hint dice «tocca per aprire» quando non c'è hover.

I frame sono CSS puro: laptop con lid, cinturino e base arrotondata, Pixel con
corpo in alluminio e tasti laterali; nessuna scritta «ThinkPad» e nessun notch.
Le immagini dei due layer non vengono mai ricreate durante l'animazione.

Per aggiungere un lavoro: copia un `<article class="slide">`, aggiorna testi e
immagine, poi aggiungi un `<button data-go="N">` con la miniatura dentro
`<nav class="timeline">`. L'ordine dei bottoni deve seguire quello delle slide.
Il tipo di slide è rilevato da `main.js` dalla presenza di `.device--laptop` e
`.device--phone`: non va scritto a mano.

## I pannelli

Chi sono, Percorso e Contatti non sono più sotto lo slideshow: sono **pannelli**
sovrapposti che si aprono dalla navigazione in alto (come l'About di Mike) e si
chiudono con la freccia in basso a sinistra, con `Escape` o cliccando «Lavori».
Mentre un pannello è aperto la galleria diventa `inert`.

Senza JavaScript un foglio dentro `<noscript>` riporta tutto a scorrimento
normale, impila le slide una sotto l'altra e mostra i pannelli in fondo: la
pagina resta leggibile.

## Il download dell'APK

Il pulsante sulla scheda di Strati **non dipende né dal tag né dal nome del
file**. Nell'HTML c'è solo il repository:

```html
<a data-apk="skippydream/Strati"
   href="https://github.com/skippydream/Strati/releases/latest">
```

Quando qualcuno passa sopra al pulsante o gli arriva sopra con la tastiera,
`assets/js/main.js` chiede a `api.github.com` qual è l'ultima release, prende il
primo allegato che finisce in `.apk` e riscrive `href`. Se ce n'è più d'uno ha
la precedenza quello con «release» nel nome. Il numero di versione finisce nel
`title` del pulsante.

La richiesta parte **solo al passaggio del mouse o al fuoco da tastiera**, non a
ogni visita: l'API di GitHub senza autenticazione concede 60 chiamate all'ora
per indirizzo IP, e caricarla a ogni apertura di pagina la sprecherebbe.

**Se JavaScript è spento, l'API non risponde o si è su touch**, resta l'indirizzo
scritto nell'HTML: la pagina dell'ultima release, da cui si scarica a mano. Il
pulsante non si rompe mai, al massimo fa un passaggio in più.

Per aggiungere lo stesso pulsante a un altro progetto basta l'attributo
`data-apk="utente/repo"`: lo script lo trova da solo.

## Le immagini dei lavori

Dentro gli schermi ci sono **screenshot reali**, in `assets/img/screens/`:

- siti live catturati con Firefox headless via WebDriver BiDi a 1280×800,
  con **5 secondi di attesa reale** dopo `load` e scroll per le immagini lazy:
  `torinosulfilo.jpg`, `sunseeker.jpg` (da
  `skippydream.github.io/SunSeeker`, con una posizione finta iniettata prima del
  caricamento per far apparire le previsioni; il sito è dark di default) e
  `frushio-app.jpg` (da `localhost:8788`, con la scrollbar nascosta per eliminare
  la barra nera di 15 px a destra);
- `pachamar.jpg` e `appunti.jpg`: altri siti live, entrambi ricatturati con la
  scrollbar nascosta prima dello scatto (su Appunti la barra scura di 15 px a
  destra era la scrollbar del browser, non parte del sito); Appunti è stato
  ricatturato con il tema scuro, coerente con il tema dark del sito;
- `pachamar-mobile.jpg`: versione mobile, 390×844;
- `strati-app.jpg`: screenshot dal README di `skippydream/Strati`, nel Pixel;
- `one-piece-watcher.jpg`: screenshot originale
  `Developer/opwatcher/Images/5.png` composto su `#14161a`, senza inversione dei
  colori, così lo sfondo non è più bianco e la scena resta leggibile.

Le immagini sono salvate come JPEG baseline, non progressivi, così non compaiono
a strisce durante il caricamento. Le miniature in basso sono ritagli 128×80 degli
stessi screenshot, in `assets/img/thumbs/`.

## L'anteprima social

`assets/img/og-image.jpg` (1200×630) si rigenera da `tools/og.html` con Firefox
in headless, finestra `1200,630`:

```bash
/Applications/Firefox.app/Contents/MacOS/firefox --headless --profile /tmp/ff-og --screenshot og.png --window-size=1200,630 file://$PWD/tools/og.html
```

Poi salva `og.png` come `assets/img/og-image.jpg` (convertendolo in JPEG).

## Vedere il sito in locale

```bash
python3 -m http.server 4325
```

Poi apri `http://localhost:4325`. Per provare la versione da telefono usa la modalità
dispositivo degli strumenti da sviluppatore: restringere e basta la finestra
non riproduce l'assenza del mouse.

## Mettere online

Il dominio è `michelelana.it`, servito da **Cloudflare Pages**. Il dominio ha i
nameserver di Cloudflare (registrar: OVH), quindi i record DNS li crea Cloudflare
da solo quando si aggiunge il dominio al progetto.

1. *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → repo
   `skippydream/michelelana.it`, branch `main`.
2. Build command: vuoto. Output directory: `/` (la radice). Nessun build step.
3. Nel progetto: *Custom domains* → *Set up a custom domain* → `michelelana.it`
   (poi anche `www.michelelana.it`, che reindirizza). HTTPS è automatico.

Ogni push su `main` ripubblica il sito. `404.html` viene usata da Pages da sola.
Non serve il file `CNAME` (era solo per GitHub Pages).

Gli indirizzi nella pagina sono assoluti dove serve (`canonical`, `og:url`,
`og:image`, `twitter:image`, dati strutturati) e relativi per il resto. `404.html`
usa percorsi che iniziano con `/`: va bene perché il sito sta sulla radice del dominio.

`sitemap.xml` e `robots.txt` contengono già l'indirizzo `https://michelelana.it/`.

## Prima di pubblicare

- [x] Sette lavori con titoli, anni, screenshot e funzionalità
- [x] `alt` scritto su ogni immagine
- [x] Email: `info@michelelana.it` (nessun numero di telefono sul sito)
- [x] Link al sito solo dove il sito esiste
- [x] `canonical`, `og:url`, `og:image` assoluti su `michelelana.it`
- [x] `assets/img/og-image.jpg` (1200×630) aggiornata con foto e consulenza
- [x] `404.html` allineata al resto del sito
- [x] Tema chiaro e scuro automatico (`prefers-color-scheme`)
- [ ] Progetto Cloudflare Pages creato, dominio `michelelana.it` collegato, HTTPS attivo
- [ ] Provato almeno una volta da telefono vero, non solo restringendo la finestra
- [ ] Decidere se tenere l'icona di One Piece Watcher (marchio non tuo)
