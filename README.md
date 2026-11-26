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
tools/                strumenti locali (server, verifica UI, anteprima OG)
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

Il tema parte da `prefers-color-scheme`: su sistema chiaro sfondo `#ffffff`,
testo nero e testi secondari al 55% di nero; su sistema scuro sfondo `#14161a`,
testo `#f2f3f5` e testi secondari al 55% di bianco. Le stesse variabili
(`--ink`, `--mut`, `--line`, `--bg`) valgono per `index.html` e `404.html`, oltre
al colore della barra del browser. L'icona accanto alla navigazione permette di
scegliere **Chiaro** o **Scuro**: la scelta è salvata e vale anche sulla 404.

## La galleria

Come nella reference ci sono **due stati**, su desktop e su mobile:

- **Zoom out (timeline).** I progetti sono card allineate in basso: su tablet e
  desktop è il **visuale** della card attiva a stare esattamente al centro dello
  schermo, prima e dopo lo scorrimento (il riquadro della slide può essere
  spostato di conseguenza). Si vede solo l'immagine, senza titolo, e le card
  lontane si schiariscono. Le card si sovrappongono di ~650 px: tra un'immagine
  e l'altra resta uno spazio di circa 60 px. Si scorre **lateralmente** con
  rotellina/trackpad orizzontale, trascinamento con mouse/dito/penna, swipe,
  frecce `←`/`→` o `Home`/`End`. La card segue il puntatore in tempo reale; al
  rilascio conta la velocità (flick) o la distanza. Alle estremità non si avvolge:
  la card oppone resistenza e **rimbalza** con una molla.
- **Zoom in (gallery).** Cliccando l'immagine di una card (o con rotellina
  verticale, freccia `↑`, swipe verso l'alto, barra spaziale/Invio) la card si apre a schermo intero: a
  sinistra compaiono titolo, sottotitolo, dettagli e link, a destra il progetto
  dentro un frame **ThinkPad** o **Google Pixel 10a**, entrambi in CSS puro.
  I dettagli esistono solo in questo stato. `Escape`, un altro clic, la rotellina
  verticale contraria, la freccia `↓` o lo swipe verso il basso riportano alla timeline.

Lo zoom non scatta e non gonfia l'immagine: `.slide__inner` ha **sempre** la
dimensione finale (`--inner-w`, 1641 px su desktop) e in timeline viene solo
scalato tramite `--k` con `transform`, esattamente come nella reference. I due
valori sono stati invertiti rispetto alla prova precedente: la card della
striscia è più piccola (`--card-w`, ~1238 px a 1440 px, ~259 px a 390 px di
larghezza) e l'elemento aperto è più grande. L'apertura è un **FLIP**
sull'inner: la geometria viene scambiata a transizioni spente e l'immagine viene
riportata al suo rettangolo di partenza, poi rilasciata sulla curva esponenziale
(`--ease`, 520 ms). Così la card cresce dov'è, senza lo scorrimento del track;
anche padding e scala dei telefoni (Strati e Pachamar) sono animati insieme. Il FLIP è
interrompibile e i dettagli entrano in ritardo senza spostare l'immagine.
Filmstrip, pannelli, frecce e cursore usano la stessa curva, con tempi più
lunghi sulle aperture e più corti sugli hover.
L'anno nell'header non è fisso: `apply()` legge
il `.slide__date` della slide attiva, quindi passa da 2026 a 2025 su One Piece
Watcher, a 2020 su Unsplash e a 2018 su SoundCloud. Ogni cifra è uno span a sé: quando
l'anno cambia scatta solo la cifra (o le cifre) che è davvero cambiata, senza
far lampeggiare quelle uguali. La rotellina verticale comanda lo zoom, quella orizzontale il paging;
da tastiera `←`/`→` fanno il paging, mentre `↑` entra nella card e `↓` ne esce,
come gli swipe verticali. Sul touch vale la stessa distinzione tra swipe verticale
e orizzontale, più il pizzico. Gesti e rotellina sono bloccati sull'asse scelto al
primo movimento: un gesto produce **una sola azione** e si riarma dopo 90 ms di
silenzio, senza cooldown fissi. In basso la
**timeline** di miniature resta disponibile nello zoom-in: un clic apre direttamente
il progetto scelto e torna allo zoom-out. Nello zoom-in le slide inattive hanno
`inert` e `aria-hidden="true"`.

Sotto l'hint c'è una **barra di avanzamento** minima (2 px, lunghezza
proporzionale a `index + 1 / numero di slide`) che indica la posizione; lo
screen reader riceve lo stesso stato in un `#gallery-status` con `aria-live`.
Etichette delle slide e testo d'aiuto sono generati da `slides.length`, quindi
non c'è più nessun «11» scritto a mano. Appena si cambia slide le immagini delle
due card vicine passano a `loading="eager"`, così lo scatto successivo non
aspetta il caricamento.

### Responsive: desktop ≥ 1241 px, tablet 601–1240 px, telefono sotto i 600 px

Tre viewport. Sopra i 1240 px la griglia desktop conserva le misure fisse; tra
601 e 1240 px scatta la **viewport tablet**: stessa struttura (testo a sinistra,
dispositivo a destra, header e filmstrip dove sono su desktop) ma ogni misura è
fluida via `clamp()` e cinque variabili (`--pad-top`, `--pad-bottom`,
`--gutter`, `--content-w`, `--timeline-w`). Le 11 miniature della filmstrip, in
particolare, sono calcolate dallo spazio realmente disponibile
(`clamp(36px, …/var(--slide-count), 120px)`) invece di restare fisse a 120 px:
non vengono più tagliate sul lato sinistro quando la finestra si restringe, e
scalano anche su desktop per restare dentro la larghezza utile.

Tutte le misure usate da `main.js` (`--inner-w`, `--card-w`, `--dev-w`,
`--phone-w`, `--col1`, `--gap`, `--pair-gap`, `--extra`, `--overlap-floor`,
`--pad-top`, `--pad-bottom`, `--desktop`, `--pv-start`) sono dichiarate nel CSS
con `@property` e lette con `getComputedStyle`: non esistono più due copie delle
stesse soglie e formule. JS conserva solo i calcoli derivati (k, overlap,
allineamento del visuale). Il resize è limitato a un `requestAnimationFrame`,
quindi anche un trascinamento della finestra non produce più un ricalcolo per
ogni evento.

In landscape compatto (altezza ≤ 520 px) si riducono i font, si sposta la
freccia e cresce il padding inferiore; i dispositivi sono limitati dall'altezza
utile della slide, così non finiscono sotto la filmstrip.

Sia su tablet che su desktop `main.js` centra il visuale di ogni card con un
offset `--px` calcolato dalla geometria della griglia (nessuna misura del DOM,
quindi funziona anche a metà FLIP); il track resta allineato alla slide attiva.
Le card con un visual diverso dal laptop — Pachamar (laptop + telefono) e le
due card con il solo telefono, biglietto e Strati — ricevono lo stesso offset
più la correzione della loro larghezza, così mantengono il passo orizzontale
delle altre (60 px sul desktop). Sui tablet più stretti lo scale del telefono
viene limitato alla larghezza della colonna: il bordo destro non finisce più
sotto l'`overflow:hidden` della card. Pachamar, invece, ha già lo spazio
necessario nel passo tra le card: su tablet, in timeline la sua slide ha
`overflow:visible`, così il telefono accanto al laptop può uscire dal riquadro
senza venire croppato e resta dentro il gap riservato. In zoom l'overflow torna
`hidden`, gli offset inline vengono rimossi e `--pv` torna a 1. Sotto i 600 px
il layout mobile resta invariato.

Sotto i 600 px in portrait il layout segue invece il reference: la card diventa
una colonna singola con `flex-direction:column-reverse`, quindi **dispositivo
sopra e testo sotto**, entrambi centrati e larghi quanto la colonna utile
(`viewport - 2×gutter`, ~281 px a 390 px). L'header è impilato come «Michele
Lana / 2026» con la nav sotto a ~16 px e scompare con una dissolvenza quando il
progetto è aperto. I font del testo salgono a ~15 px e l'hint sparisce (il gesto
è ovvio sul touch); la freccia torna in alto a sinistra in un riquadro da 72 px.
La geometria FLIP non cambia: `main.js` misura sempre il rettangolo di
`.slide__inner`, dentro il quale il layout è semplicemente diverso.

Nella schermata iniziale restano le **anteprime dei progetti** (i dispositivi
sono cliccabili); la filmstrip di miniature è nascosta come su desktop e appare
solo quando un progetto è aperto, in fondo e senza coprire il testo. Si apre
toccando il dispositivo o con lo swipe verticale. A progetto aperto l'inner è
spostato verso il basso di un offset proporzionale all'altezza utile (0 px a
360×640, 60 px alle altezze maggiori), così i frame non restano attaccati al bordo
superiore. La filmstrip è a tutta larghezza su telefono, con miniature omogenee ingrandite da
~78 px a 390 px (proporzione 16:10 su tutti gli elementi, sia `<img>` sia `<picture>`),
gap compatto da 4 px e scroll orizzontale automatico che mantiene la miniatura attiva
sempre al centro della viewport. In tablet le miniature scalano in base alla
larghezza della finestra; su desktop restano sotto i 120 px per far stare tutte
le 11 card nella striscia.

L'inner aperto resta largo `viewport - 40` (1641 px su desktop); la card della
striscia è il 74% dell'inner (minimo 220 px), quindi `k < 1` e l'apertura è un
vero enlargement anche su telefono. `--pv` è 1.6 dappertutto tranne che in
portrait sotto i 600 px, dove scende a 1.1 per non far crescere troppo i telefoni
nell'anteprima.
Pachamar Yoga è l'unico caso con frame diverso per viewport: su desktop mostra
il laptop con `pachamar.jpg` affiancato al telefono; in portrait sotto i 600 px
il laptop è nascosto via CSS e resta solo il telefono, con lo stesso `--pv` di
Strati. Anche la sua miniatura nel filmstrip usa un `<picture>` con la versione
mobile sotto i 600 px e quella desktop sopra.

La card del biglietto (subito dopo il gestionale) usa lo stesso frame Pixel con
lo screenshot anonimizzato del biglietto del Valle Orco Highline Festival:
la barra in alto originale è preservata, mentre nome del file, partecipante e
codice sono sostituiti da valori dimostrativi e il QR non è valido. Con il tema
scuro compare `biglietto-vohf-dark.jpg`: non è un sito ricreato, ma la stessa
cattura con le sole alte luci compresse, così il bianco pieno non abbaglia.

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
chiudono con la freccia (nella colonna del testo, in alto a sinistra sul telefono),
con `Escape` o cliccando «Lavori».
Mentre un pannello è aperto la galleria diventa `inert`: il pannello è un
`role="dialog"` con `aria-modal="true"`, riceve il focus appena si apre,
intrappola `Tab` al suo interno e restituisce il focus al pulsante che l'ha
aperto quando si chiude.

Il pannello **Percorso** è diviso in tre gruppi: Esperienza, Formazione e
Competenze. Su desktop e tablet sono una griglia a due colonne, con Formazione
sopra Competenze a destra; sotto i 600 px diventano tre tab, così anche il
contenuto più lungo resta dentro la viewport senza scorrere. Senza JavaScript
le tab non compaiono e i tre gruppi restano tutti visibili.

Senza JavaScript un foglio dentro `<noscript>` riporta tutto a scorrimento
normale, impila le slide una sotto l'altra e mostra i pannelli in fondo: la
pagina resta leggibile.

## Dettagli minimi

- La history del browser ha una sola voce «away» per progetto e pannello
  insieme (`{ slide, panel }`): Back torna sempre ai lavori, Forward ripristina
  entrambi. Durante il ripristino non viene scritta alcuna voce, altrimenti il
  Forward successivo verrebbe cancellato.
- Le miniature della filmstrip mostrano un tooltip con titolo e anno al passaggio
  del mouse o al focus da tastiera; su telefono non compaiono.
- In **Contatti** c'è il badge «Disponibile per progetti» e il pulsante **Copia**
  accanto all'email, con feedback visivo e un messaggio per gli screen reader.
- L'icona del tema parte da **Auto**: al primo clic passa al tema opposto a
  quello mostrato dal sistema e da lì alterna solo **Chiaro / Scuro**. Su tablet
  e desktop è appena a sinistra della navigazione, su telefono sta in alto a
  destra. L'SVG cambia stato (mezzo cerchio, sole, luna) e l'`aria-label` annuncia
  il tema attuale e il prossimo. La scelta è salvata in `localStorage` con la
  chiave `michelelana-theme`; finché non viene scelta, `Auto` segue
  `prefers-color-scheme`. Il tema aggiorna variabili CSS, il `src` delle immagini
  con `data-light`/`data-dark` e `<meta name="theme-color">`. Uno script nell'`<head>`
  imposta `data-theme` e i meta prima del primo paint; uno in fondo sceglie le
  immagini una volta che il DOM esiste. L'indirizzo copiato è letto dal link
  mailto, quindi va aggiornato un solo punto.

## La lingua

Il sito è **italiano/inglese**. All'apertura `assets/js/i18n.js` legge
`navigator.languages`: se una delle lingue è `it` (o `it-IT`, `it-CH`, …) mostra
l'italiano, altrimenti l'inglese. Finché non si clicca il pulsante non viene
salvato nulla: cambiando lingua del sistema cambia anche il sito. Dopo un clic
la scelta resta in `localStorage` con la chiave `michelelana-lang` e ha la
precedenza sulle impostazioni del sistema.

Il pulsante **IT / EN** sta a sinistra di quello del tema, sulla stessa riga;
su telefono è in alto a destra, accanto al tema. Il `title` e l'`aria-label`
sono tradotti e annunciano la lingua attuale e quella successiva.

Tutte le traduzioni stanno nei due dizionari in `assets/js/i18n.js`: lo script
indicizza le stringhe italiane e traduce i nodi di testo e gli attributi
`alt`, `title` e `aria-label` senza bisogno di un attributo su ogni elemento.
L'HTML resta quindi leggibile in italiano; senza JavaScript resta in italiano.
Prima del primo paint lo script aggiorna `lang`, `<title>`, description,
`og:title`, `og:description`, `og:image:alt`, `og:locale` e il `jobTitle` dei
dati strutturati. Anche `404.html` usa lo stesso modulo e segue la lingua
salvata o quella del sistema (senza pulsante di cambio). Le etichette create
dal JavaScript (tema, tooltip delle miniature, copia email, versione APK) si
aggiornano all'evento `michelelana:langchange`.

Per aggiungere o cambiare una traduzione basta una voce con la stessa chiave
in `it` e `en`; il valore italiano deve corrispondere al testo nell'HTML.
Gli screenshot dentro i frame restano nelle loro lingue originali: sono
catture reali dei progetti, non testi del sito.

- `tools/check-ui.py` verifica le etichette in EN e IT (back, miniature, slide e
  aiuto con il numero giusto), il ciclo del tema, la persistenza dopo il reload,
  la 404, le varianti delle immagini, frecce rapide e focus sulle miniature,
  rimbalzo ai bordi, drag live e flick, progress bar, annuncio e preload, focus e trap dei dialog,
  il layout su desktop/tablet/telefono e il Back/Forward del browser. Serve
  `websocket-client` e avvia da sé Firefox headless e un server locale:
  `python3 tools/check-ui.py`. Con `python3 tools/check-ui.py --shots DIR` salva
  anche tre screenshot (desktop, tablet, telefono) da guardare a occhio.

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
  con **attesa reale dopo `load`** (5–12 secondi) e scroll per le immagini lazy:
  `torinosulfilo.jpg`, `sunseeker.jpg` (da
  `skippydream.github.io/SunSeeker`, con una posizione finta iniettata prima del
  caricamento per far apparire le previsioni; il sito è dark di default) e
  `frushio-app.jpg` (da `localhost:8788`, con la scrollbar nascosta per eliminare
  la barra nera di 15 px a destra);
- `pachamar.jpg`: sito live ricatturato con la scrollbar nascosta prima dello
  scatto; ha una sola variante, usata in entrambi i temi;
- `pachamar-mobile.jpg`: versione mobile, 390×844;
- `strati-app.jpg`: screenshot dal README di `skippydream/Strati`, nel Pixel;
- `biglietto-vohf-light.jpg` e `biglietto-vohf-dark.jpg`: screenshot fornito,
  con la barra in alto originale; nome del file, partecipante e codice sono
  fittizi e il QR è dimostrativo. La variante dark comprime solo i bianchi
  (255 → 200) e i grigi chiari (192 → 152), lasciando intatti neri, testo e
  moduli del QR;
- `appunti-light.jpg` e `appunti-dark.jpg`: due catture reali dello stesso sito,
  che supporta `prefers-color-scheme` — chiaro (`#f5f7f9`/bianco) e scuro
  (`#0a0d12`). Quella scura è la vecchia `appunti.jpg`; entrambe hanno la
  scrollbar nascosta;
- `one-piece-watcher-light.jpg` e `one-piece-watcher-dark.jpg`: stesso screenshot
  originale `Developer/opwatcher/Images/5.png` composto rispettivamente su
  bianco e su `#14161a`, senza inversione dei colori, così lo sfondo non è più
  bianco in dark e la scena resta leggibile in entrambi i temi;
- `unsplash-light.jpg` e `unsplash-dark.jpg`: collage di sei foto dal profilo
  [unsplash.com/michelelana](https://unsplash.com/michelelana), con una testata
  che mostra «Michele Lana / @michelelana». La variante dark **non inverte** i
  colori: applica allo screenshot originale la stessa attenuazione del
  biglietto (bianco 255→200, grigio 192→152, neri intatti). Come SoundCloud, è
  una card non legata a un progetto: il link porta al profilo Unsplash.
- `soundcloud-light.jpg` e `soundcloud-dark.jpg`: collage di otto copertine di
  tracce caricate da
  [soundcloud.com/snizemusic](https://soundcloud.com/snizemusic), con la testata
  «Michele Lana / @snizemusic». Stessa attenuazione del biglietto, senza
  inversione: i contenuti restano riconoscibili. Sono solo brani propri con
  artwork dedicato: niente repost e niente immagini prese da altri artisti.
  Anche qui il link porta al profilo, non a un progetto.

Il logo del servizio è doppio: un badge in basso a destra dello schermo del
laptop, ben visibile sia in timeline sia in zoom, e una versione accanto al
titolo nel pannello aperto. Quello di Unsplash segue il colore del testo,
quello di SoundCloud resta arancione. In dark è disattivato il riflesso
diagonale solo su queste due card, così l'attenuazione non viene alterata.

Gli screenshot seguono il tema scelto dove esiste una variante (`appunti-*`,
`one-piece-watcher-*`, `unsplash-*` e `soundcloud-*`) o dove il tema è parte del
disegno (`biglietto-*`): ogni `<img>` ha `data-light` e `data-dark`, e lo script
in fondo alla pagina imposta `src` prima che il browser scarichi una variante
sbagliata. Con JavaScript disattivato un `<noscript>` accanto a ogni immagine
mostra la versione chiara. Anche `gestionale-torinosulfilo-*` usa questo sistema.
Gli altri progetti (Torino Sul Filo, Frushío, Strati, SunSeeker e Pachamar)
hanno una sola immagine, identica nei due temi: non ha senso fabbricare varianti
sintetiche di siti che non le offrono. Torino Sul Filo ha pure `data-theme`, ma
l'hero resta scuro in entrambi i casi, quindi le due catture sarebbero quasi
identiche.

Le immagini sono salvate come JPEG baseline, non progressivi, così non compaiono
a strisce durante il caricamento. Le miniature in basso seguono la stessa regola:
ritagli 128×80 in `assets/img/thumbs/`, con coppie `*-light.jpg`/`*-dark.jpg` per
Appunti, One Piece Watcher, Unsplash, SoundCloud e il biglietto del Valle Orco.

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

- [x] Undici card con titoli, anni, screenshot e link (l'ultima: SoundCloud)
- [x] `alt` scritto su ogni immagine
- [x] Email: `info@michelelana.it` (nessun numero di telefono sul sito)
- [x] Link al sito solo dove il sito esiste
- [x] `canonical`, `og:url`, `og:image` assoluti su `michelelana.it`
- [x] `assets/img/og-image.jpg` (1200×630) aggiornata con foto e consulenza
- [x] `404.html` allineata al resto del sito
- [x] Tema chiaro e scuro automatico (`prefers-color-scheme`)
- [x] Lingue italiano/inglese con rilevamento automatico e pulsante di cambio
- [ ] Progetto Cloudflare Pages creato, dominio `michelelana.it` collegato, HTTPS attivo
- [ ] Provato almeno una volta da telefono vero, non solo restringendo la finestra
- [ ] Decidere se tenere l'icona di One Piece Watcher (marchio non tuo)
