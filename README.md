# Sito personale — Michele Lana

Sito personale statico. Nessun framework, nessun build step: sono file che il
browser apre così come sono.

```
index.html            la pagina
404.html              pagina di errore
assets/css/style.css  stile e token del design
assets/js/main.js     saluto in base all'ora, anno nel footer, ombra dell'header,
                      voce di menu attiva, download dell'APK
assets/img/           schede dei lavori, foto (michele.jpg) e anteprima social
favicon.svg           icona della scheda
robots.txt sitemap.xml
tools/                strumenti per rigenerare immagini (fuori dal sito)
```

## Il design

Impianto morbido: angoli ampi, linee che sfumano ai bordi invece di tagliare
netto, archi leggeri sullo sfondo dell'intro, header come pastiglia sospesa.
Le misure stanno tutte nei token in cima a `assets/css/style.css` — cambiare
`--r-xl`, `--r-lg`, `--r` e `--sh` cambia la morbidezza di tutto il sito.

I lavori sono **schede affiancate, tutte visibili**: niente da aprire, niente
da scoprire al passaggio del mouse. Due colonne da 700 px in su, una sotto.
Ogni scheda con un sito o un repo è **cliccabile per intero**: il collegamento
principale ha la classe `card__go` e stende un `::after` su tutta la scheda; gli
altri pulsanti (es. «Scarica l'APK») restano sopra e cliccabili. Le schede senza
link (One Piece Watcher, Frushío) non lo sono.

## Hero e Percorso

In cima c'è un saluto che cambia con l'ora (`#greet`: buongiorno 5–13, buon
pomeriggio 13–18, buonasera il resto; senza JavaScript resta «Ciao»), la foto in
cornice circolare (`assets/img/michele.jpg`, 480×480, ritaglio quadrato sul viso)
e due pulsanti: «Vedi i lavori» e «Mail».

La sezione **Percorso** (esperienza, formazione, competenze) è scritta a mano in
`index.html`. Le attività in corso hanno «oggi» come data di fine.

## I badge sulle schede

In alto a destra di ogni immagine c'è la piattaforma: **Web**, **macOS** o
**Android**, icona più etichetta. L'etichetta non è ridondante — un'icona a
laptop da sola non distingue macOS da una web app aperta sul portatile.

In alto a sinistra, sui lavori non finiti, la classe `card--wip` sulla scheda
aggiunge l'etichetta e spegne l'immagine (desaturata al 18%, opacità 50%) senza
toccare la leggibilità del testo. Al passaggio del mouse l'immagine si riprende.
Per marcarne un altro: aggiungi `card--wip` all'`<article>` e il `<p class="wip">`
dentro `.card__shot`.

## Il download dell'APK

Il pulsante sulla scheda di Strati **non dipende né dal tag né dal nome del
file**. Nell'HTML c'è solo il repository:

```html
<a class="primary" data-apk="skippydream/Strati"
   href="https://github.com/skippydream/Strati/releases/latest" download>
```

Quando qualcuno passa sopra al pulsante o gli arriva sopra con la tastiera,
`assets/js/main.js` chiede a `api.github.com` qual è l'ultima release, prende il
primo allegato che finisce in `.apk` e riscrive `href`. Se ce n'è più d'uno ha
la precedenza quello con «release» nel nome. Il numero di versione finisce nel
`title` del pulsante.

La richiesta parte **solo al passaggio del mouse o al fuoco da tastiera**, non a
ogni visita: l'API di GitHub senza autenticazione concede 60 chiamate all'ora
per indirizzo IP, e caricarla a ogni apertura di pagina la sprecherebbe.

**Se JavaScript è spento o l'API non risponde**, resta l'indirizzo scritto
nell'HTML: la pagina dell'ultima release, da cui si scarica a mano. Il pulsante
non si rompe mai, al massimo fa un passaggio in più.

Per aggiungere lo stesso pulsante a un altro progetto basta l'attributo
`data-apk="utente/repo"`: lo script lo trova da solo.

## Le immagini dei lavori

Non sono screenshot dell'interfaccia. Sono **schede di design**: marchio reale
del progetto, il suo carattere tipografico e la sua palette, presi dai
rispettivi repository. Così restano leggibili anche a 290 px, che è la misura
massima a cui il sito le mostra.

Per rigenerarle:

```bash
python3 tools/demo-assets.py
```

```bash
python3 -m http.server 4325
```

```bash
/Applications/Chromium.app/Contents/MacOS/Chromium --headless=new --hide-scrollbars --virtual-time-budget=15000 --window-size=1200,6400 --screenshot=strip.png http://127.0.0.1:4325/tools/demo-cards.html
```

```bash
python3 tools/slice-cards.py strip.png assets/img
```

La composizione delle sette schede è in `tools/demo-cards.html`: colori,
caratteri ed emblemi sono quelli veri di ogni progetto.

## L'anteprima social

`assets/img/og-image.jpg` (1200×630) si rigenera da `tools/og.html` con lo
stesso Chromium, finestra `1200,760`, poi ritagliata a 630 di altezza
(`--screenshot=og.png file://$PWD/tools/og.html`, poi ritaglio dei primi 630 px).
La cartella `tools/_demo/` non è nel repo: la ricrea `tools/demo-assets.py`.

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

- [x] Sette lavori con titoli, anni, schede di design e funzionalità
- [x] `alt` scritto su ogni immagine
- [x] Email: `michelelana12@gmail.com` (nessun numero di telefono sul sito)
- [x] Link al sito solo dove il sito esiste
- [x] `canonical`, `og:url`, `og:image` assoluti su `michelelana.it`
- [x] `assets/img/og-image.jpg` (1200×630) aggiornata con foto e consulenza
- [x] `404.html` allineata al resto del sito
- [ ] Progetto Cloudflare Pages creato, dominio `michelelana.it` collegato, HTTPS attivo
- [ ] Provato almeno una volta da telefono vero, non solo restringendo la finestra
- [ ] Decidere se tenere l'icona di One Piece Watcher (marchio non tuo)
