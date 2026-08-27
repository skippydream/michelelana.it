# Sito personale — Michele Lana

Sito personale statico. Nessun framework, nessun build step: sono file che il
browser apre così come sono.

```
index.html            la pagina
404.html              pagina di errore
assets/css/style.css  stile e token del design
assets/js/main.js     anno nel footer, ombra dell'header, voce di menu attiva
assets/img/           schede dei lavori e anteprima social
favicon.svg           icona della scheda
CNAME                 dominio (serve solo con GitHub Pages)
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
Lo script fa pochissimo: anno nel footer, ombra dell'header, voce di menu attiva.

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

La scheda di Strati punta a:

```
https://github.com/skippydream/Strati/releases/latest/download/Strati-release.apk
```

`latest/download/` è un indirizzo stabile: GitHub redirige sempre all'ultima
release. **Non va aggiornato a ogni rilascio**, a una condizione — che il file
allegato continui a chiamarsi `Strati-release.apk`. Se cambi il nome dell'asset
il collegamento restituisce 404, quindi tienilo costante nella build.

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
stesso Chromium, finestra `1200,760`, poi ritagliata a 630 di altezza.

## Vedere il sito in locale

```bash
python3 -m http.server 4325
```

Poi apri `http://localhost:4325`. Per provare la versione da telefono usa la modalità
dispositivo degli strumenti da sviluppatore: restringere e basta la finestra
non riproduce l'assenza del mouse.

## Mettere online

Il dominio `michelelana.it` non è ancora tuo, quindi il sito per ora va su un
indirizzo gratuito del servizio che scegli. Non c'è nessun file da preparare:
è una cartella di file statici.

**Netlify** — la via più corta, senza git: vai su
[app.netlify.com/drop](https://app.netlify.com/drop) e trascina questa cartella.
Ti dà subito un indirizzo tipo `nome-a-caso.netlify.app`, rinominabile dalle
impostazioni del sito.

**Cloudflare Pages** — *Create a project* → *Direct Upload*, stessa cosa, con
indirizzo `nome.pages.dev`.

**GitHub Pages** — crea un repo, carica i file, *Settings* → *Pages* → branch
`main`. Esce su `USERNAME.github.io/NOME-REPO`.

Funziona anche in sottocartella perché **tutti i percorsi sono relativi**
(`assets/...`, non `/assets/...`). Se aggiungi risorse, tienile relative:
un percorso che comincia con `/` punta alla radice del dominio, cioè fuori dal
tuo progetto, e si rompe solo su GitHub Pages — in locale sembrerebbe a posto.

L'unico limite è `404.html`: da un indirizzo profondo tipo `/repo/a/b/c` i
percorsi relativi risolvono male e la pagina esce senza stile. Il caso normale,
`/repo/qualcosa`, funziona: il sito non ha sottocartelle.

## Quando comprerai il dominio

Quattro cose, in quest'ordine:

1. Nel pannello del servizio, aggiungi il dominio personalizzato e imposta i DNS
   che ti indica.
2. In `index.html` rimetti gli indirizzi assoluti: c'è già un commento con le
   righe pronte, sopra `og:image`. Senza `og:url` e `og:image` assoluti,
   l'anteprima quando condividi il link può uscire senza immagine.
3. Ricrea `sitemap.xml` con dentro il tuo indirizzo, e aggiungi in `robots.txt`
   la riga `Sitemap: https://TUO-DOMINIO/sitemap.xml`. Li ho tolti perché
   entrambi richiedono indirizzi assoluti, e puntare a un dominio non tuo fa
   più danno che non averli.
4. Solo con GitHub Pages: ricrea il file `CNAME` con dentro il dominio, una riga
   sola. L'ho cancellato: se resta in un repo pubblico dichiara un dominio che
   non controlli.

## Prima di pubblicare

- [x] Sette lavori con titoli, anni, schede di design e funzionalità
- [x] `alt` scritto su ogni immagine
- [x] Email: `michelelana12@gmail.com`
- [x] Nessun rimando a GitHub né ai social
- [x] Link al sito solo dove il sito esiste (per ora: torinosulfilo.it)
- [x] Titolo, Info, formazione e lista strumenti scritti
- [x] `assets/img/og-image.jpg` (1200×630) per l'anteprima social
- [x] Nessun riferimento a un dominio non ancora posseduto
- [ ] Quando comprerai il dominio: rimettere indirizzi assoluti, sitemap e CNAME
- [ ] Decidere se tenere l'icona di One Piece Watcher (marchio non tuo)
- [ ] Provato almeno una volta da telefono vero, non solo restringendo la finestra
