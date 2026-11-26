#!/usr/bin/env python3
"""Verifica lingua, tema, galleria, layout e Back/Forward del browser.

Avvia un Firefox headless e un piccolo server locale, poi controlla:
- in EN e IT back, miniature, etichette e testo aiuto hanno il numero giusto;
- il primo click va al tema opposto al sistema, poi alterna chiaro/scuro;
- dopo il reload la scelta resta e le immagini già prese sono quelle giuste;
- la stessa scelta vale sulla 404 e non si scaricano entrambe le varianti;
- rotellina e drag muovono il track in continuo e si agganciano alla card
  più vicina al centro, con focus sulle miniature, progress bar e preload;
- i pannelli sono dialog con focus intrappolato e ripristinato;
- Back/Forward riaprono progetto e pannello;
- desktop/tablet/telefono non sbandano; con --shots salva gli screenshot.

Uso: python3 tools/check-ui.py [--shots DIR]
richiede il modulo Python websocket-client (pip install websocket-client).
"""
import argparse
import base64
import functools
import http.server
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import threading
import time

try:
    import websocket
except ImportError:
    sys.exit("Serve websocket-client: pip install websocket-client")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FIREFOX = os.environ.get(
    "FIREFOX", "/Applications/Firefox.app/Contents/MacOS/firefox")
STATE = """JSON.stringify((function () {
  var root = document.documentElement;
  var button = document.querySelector('[data-theme-toggle]');
  var image = document.querySelector('.timeline button[data-go="10"] img');
  var metas = [].map.call(document.querySelectorAll('meta[name="theme-color"]'), function (m) {
    return m.getAttribute('media');
  });
  return {
    theme: root.getAttribute('data-theme'),
    state: button ? button.getAttribute('data-state') : null,
    label: button ? button.getAttribute('aria-label') : '',
    image: image ? image.currentSrc.split('/').pop().split('?')[0] : null,
    metas: metas,
    stored: localStorage.getItem('michelelana-theme'),
    systemDark: matchMedia('(prefers-color-scheme: dark)').matches,
    bodyBg: getComputedStyle(document.body).backgroundColor
  };
})())"""

LANG_STATE = """JSON.stringify((function () {
  return {
    lang: document.documentElement.lang,
    stored: localStorage.getItem('michelelana-lang'),
    nav: [].map.call(document.querySelectorAll('.nav button'), function (b) {
      return b.textContent.trim();
    }),
    back: document.querySelector('.back').getAttribute('aria-label'),
    slide: document.querySelector('.slide').getAttribute('aria-label'),
    help: document.getElementById('gallery-help').textContent,
    thumbs: [].map.call(document.querySelectorAll('.timeline button'), function (b) {
      return b.getAttribute('aria-label');
    })
  };
})())"""


def fail(message):
    print("FAIL " + message)
    sys.exit(1)


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class Client:
    def __init__(self, url):
        self.seq = 0
        self.sid = None
        self.ctx = None
        self.ws = websocket.create_connection(url, timeout=20, suppress_origin=True)
        self.call("session.new", {"capabilities": {"alwaysMatch": {"browserName": "firefox"}}})
        self.sid = self.result["result"]["sessionId"]
        self.ctx = self.call("browsingContext.getTree", {})["result"]["contexts"][0]["context"]

    def call(self, method, params=None):
        self.seq += 1
        payload = {"id": self.seq, "method": method, "params": params or {}}
        if self.sid and method != "session.new":
            payload["sessionId"] = self.sid
        self.ws.send(json.dumps(payload))
        while True:
            message = json.loads(self.ws.recv())
            if message.get("id") == self.seq:
                self.result = message
                if "error" in message:
                    fail(method + ": " + json.dumps(message["error"])[:200])
                return message

    def go(self, url):
        self.call("browsingContext.navigate", {"context": self.ctx, "url": url})
        for _ in range(40):
            if self.eval("document.readyState") == "complete":
                return
            time.sleep(0.1)
        fail("la pagina non ha finito di caricare: " + url)

    def eval(self, expression):
        response = self.call("script.evaluate", {
            "expression": expression,
            "target": {"context": self.ctx},
            "awaitPromise": False,
            "resultOwnership": "root",
        })
        return response["result"]["result"].get("value")

    def state(self):
        return json.loads(self.eval(STATE))

    def lang_state(self):
        return json.loads(self.eval(LANG_STATE))

    def ui_state(self):
        expression = """JSON.stringify((function () {
          var gallery = document.querySelector('.gallery');
          var slides = [].slice.call(gallery.querySelectorAll('.slide'));
          var index = slides.findIndex(function (s) { return s.classList.contains('is-active'); });
          var away = history.state && history.state.michelelanaView === 'away';
          var fill = gallery.querySelector('.gallery__progress-fill');
          var neighbour = function (i) {
            var s = slides[i];
            if (!s) return null;
            return [].every.call(s.querySelectorAll('img'), function (img) {
              return img.loading === 'eager';
            });
          };
          return {
            zoom: gallery.classList.contains('is-zoomed'),
            panel: [].filter.call(document.querySelectorAll('.panel'), function (p) {
              return p.classList.contains('is-open');
            }).map(function (p) { return p.id; }),
            index: index,
            view: away ? (history.state.panel ? 'panel' :
              (typeof history.state.slide === 'number' ? 'slide' :
               (history.state.view ? history.state.view.type : null))) : null,
            progress: fill ? parseFloat(fill.style.width) || 0 : -1,
            status: (document.getElementById('gallery-status') || {}).textContent || '',
            slideLabel: slides[index] ? slides[index].getAttribute('aria-label') : '',
            preloaded: [neighbour(index - 1), neighbour(index + 1)],
            inlineX: Math.round(new DOMMatrixReadOnly(
              gallery.querySelector('.gallery__track').style.transform || 'none').m41),
            scrolling: gallery.querySelector('.gallery__viewport').classList.contains('is-scrolling'),
            focus: document.activeElement ?
              (document.activeElement.getAttribute('data-go') || document.activeElement.id ||
               document.activeElement.tagName) : null
          };
        })())"""
        return json.loads(self.eval(expression))

    def settle_track(self, timeout=3.0):
        """Aspetta che la transizione di snap finisca davvero (i frame headless
        non avanzano da soli): il gesto successivo deve leggere la posizione
        visibile, non un transform ancora in viaggio."""
        end = time.time() + timeout
        while time.time() < end:
            state = json.loads(self.eval("""JSON.stringify((function () {
              var t = document.querySelector('.gallery__track');
              var inline = new DOMMatrixReadOnly(t.style.transform || 'none').m41;
              var computed = new DOMMatrixReadOnly(getComputedStyle(t).transform || 'none').m41;
              return {diff: Math.abs(inline - computed),
                      scrolling: document.querySelector('.gallery__viewport')
                        .classList.contains('is-scrolling')};
            })())"""))
            if state["diff"] <= 2 and not state["scrolling"]:
                return
            time.sleep(0.05)

    def press(self, key):
        self.eval("(function(){var e=new KeyboardEvent('keydown',{key:%s,bubbles:true,cancelable:true});"
                  "(document.activeElement||document).dispatchEvent(e);})()" % json.dumps(key))

    def viewport(self, width, height):
        self.call("browsingContext.setViewport", {
            "context": self.ctx,
            "viewport": {"width": width, "height": height},
        })

    def shot(self, path):
        data = self.call("browsingContext.captureScreenshot", {"context": self.ctx})
        with open(path, "wb") as handle:
            handle.write(base64.b64decode(data["result"]["data"]))

    def close(self):
        try:
            self.call("session.end", {})
        except Exception:
            pass
        self.ws.close()


def check(condition, message):
    if not condition:
        fail(message)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shots", metavar="DIR",
                        help="salva screenshot desktop/tablet/phone in DIR")
    args = parser.parse_args()
    if args.shots:
        os.makedirs(args.shots, exist_ok=True)

    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = "http://127.0.0.1:%d/" % server.server_port

    port = free_port()
    profile = tempfile.mkdtemp(prefix="ff-check-theme-")
    browser = subprocess.Popen([
        FIREFOX, "--headless", "--remote-debugging-port", str(port),
        "--profile", profile, "about:blank",
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    client = None
    try:
        endpoint = os.path.join(profile, "WebDriverBiDiServer.json")
        for _ in range(80):
            if os.path.exists(endpoint):
                with open(endpoint) as handle:
                    info = json.load(handle)
                break
            time.sleep(0.1)
        else:
            fail("Firefox non ha aperto la porta BiDi")

        client = Client("ws://%s:%d/session" % (info["ws_host"], info["ws_port"]))
        client.go(origin + "?nocursor=1&t=%d" % int(time.time()))
        client.eval("localStorage.clear()")
        client.go(origin + "?nocursor=1&t=%d" % int(time.time()))

        # Lingua: in EN e in IT il pulsante back e le miniature devono avere un nome
        client.eval("localStorage.setItem('michelelana-lang','en')")
        client.go(origin + "?nocursor=1&t=%d" % int(time.time()))
        en = client.lang_state()
        check(en["lang"] == "en" and en["stored"] == "en", "lingua inglese non applicata")
        check(en["nav"] == ["Work", "About", "Career", "Contact"],
              "navigazione EN sbagliata: " + json.dumps(en["nav"]))
        check(en["back"] == "Back to timeline", "etichetta back EN: " + str(en["back"]))
        check(all(label and label.find(" · ") > 0 for label in en["thumbs"]),
              "miniature senza nome in EN: " + json.dumps(en["thumbs"]))
        check(en["thumbs"][0].startswith("Torino Sul Filo"),
              "prima miniatura EN sbagliata: " + str(en["thumbs"][0]))
        check(en["slide"].startswith("Project 1 of 11: ") and " of 11 " in en["help"],
              "etichette/help EN senza numero: " + en["slide"] + " / " + en["help"][:40])

        client.eval("document.querySelector('[data-lang-toggle]').click()")
        it = client.lang_state()
        check(it["lang"] == "it" and it["stored"] == "it", "switch alla lingua italiana non salvato")
        check(it["nav"] == ["Lavori", "Chi sono", "Percorso", "Contatti"],
              "navigazione IT sbagliata: " + json.dumps(it["nav"]))
        check(it["back"] == "Torna alla timeline", "etichetta back IT: " + str(it["back"]))
        check(all(label and label.find(" · ") > 0 for label in it["thumbs"]),
              "miniature senza nome in IT: " + json.dumps(it["thumbs"]))
        check(it["slide"].startswith("Lavoro 1 di 11: ") and " di 11 " in it["help"],
              "etichette/help IT senza numero: " + it["slide"] + " / " + it["help"][:40])

        client.eval("localStorage.setItem('michelelana-lang','en')")
        client.go(origin + "?nocursor=1&t=%d" % int(time.time()))

        start = client.state()
        first = "light" if start["systemDark"] else "dark"
        second = "dark" if first == "light" else "light"
        check(start["state"] == "auto", "lo stato iniziale non è Auto")

        expected = [first, second, first]
        for i, want in enumerate(expected):
            client.eval("document.querySelector('[data-theme-toggle]').click()")
            time.sleep(0.2)
            state = client.state()
            check(state["state"] == want, "click %d: atteso %s, ottenuto %s" % (i + 1, want, state["state"]))
            check(state["stored"] == want, "click %d: localStorage non corretto" % (i + 1))
            check(state["image"] == "soundcloud-%s.jpg" % want, "click %d: immagine sbagliata" % (i + 1))

        # reload con tema salvato: deve partire già con l'immagine giusta
        client.eval("localStorage.setItem('michelelana-theme','dark')")
        client.go(origin + "?nocursor=1&t=%d" % int(time.time()))
        saved = client.state()
        check(saved["state"] == "dark" and saved["image"] == "soundcloud-dark.jpg",
              "il tema salvato non è applicato al reload")
        check(saved["bodyBg"] == "rgb(20, 22, 26)", "sfondo scuro non applicato")

        resources = client.eval("JSON.stringify(performance.getEntriesByType('resource').map(function (r) { return r.name.split('/').pop().split('?')[0]; }))")
        fetched = json.loads(resources)
        wrong = "soundcloud-light.jpg" if saved["systemDark"] else "soundcloud-dark.jpg"
        check(wrong not in fetched, "sono state scaricate entrambe le varianti di soundcloud")

        # Galleria: progresso, annuncio, preload, focus, tasti rapidi e rimbalzo
        client.eval("document.querySelector('.brand').click();"
                    "document.querySelector('.timeline button[data-go=\"3\"]').focus()")
        before = client.ui_state()
        check(abs(before["progress"] - 100.0 / 11) < 1,
              "progress bar sbagliata: " + str(before["progress"]))
        check(before["status"].startswith("Project 1 of 11: "),
              "annuncio slide sbagliato: " + before["status"])
        check(before["preloaded"] == [None, True],
              "immagini vicine non precaricate: " + json.dumps(before["preloaded"]))
        client.press("ArrowUp")
        time.sleep(0.25)
        check(client.ui_state()["zoom"], "ArrowUp con il focus su una miniatura non apre la card")
        client.press("ArrowDown")
        time.sleep(0.25)
        check(not client.ui_state()["zoom"], "ArrowDown con il focus su una miniatura non chiude la card")
        client.press("ArrowRight")
        time.sleep(0.25)
        after = client.ui_state()
        check(after["index"] == before["index"] + 1,
              "ArrowRight con il focus su una miniatura non cambia progetto")
        check(after["focus"] == str(after["index"]),
              "il focus non segue la miniatura attiva: " + str(after["focus"]))
        check(after["progress"] > before["progress"] and
              after["preloaded"] == [True, True],
              "progress/preload non aggiornati: " + json.dumps(after))

        client.press("Home")
        time.sleep(0.35)
        client.press("ArrowRight")
        time.sleep(0.35)
        client.press("ArrowRight")
        time.sleep(0.25)
        check(client.ui_state()["index"] == 2,
              "le frecce non cambiano progetto: " + json.dumps(client.ui_state()))

        client.press("Home")
        client.settle_track()
        # Rotellina: il track segue il delta, poi si aggancia alla card più vicina.
        home_x = client.ui_state()["inlineX"]
        client.eval("""(function () {
          document.querySelector('.gallery__viewport').dispatchEvent(
            new WheelEvent('wheel', {deltaX: 400, deltaY: 0, bubbles: true,
              cancelable: true}));
        })()""")
        moving = client.ui_state()
        check(moving["scrolling"] and moving["index"] == 0 and
              home_x - moving["inlineX"] > 300,
              "la rotellina non muove il track in continuo (base %s): %s" %
              (home_x, json.dumps(moving)))
        client.settle_track()
        snapped = client.ui_state()
        check(snapped["index"] == 1 and not snapped["scrolling"],
              "la rotellina non si aggancia alla card centrale: " + json.dumps(snapped))

        # Drag: stesso gesto continuo, snap al rilascio.
        client.eval("""(function () {
          var vp = document.querySelector('.gallery__viewport');
          vp.dispatchEvent(new MouseEvent('mousedown', {button: 0, clientX: 600,
            clientY: 300, bubbles: true, cancelable: true}));
          window.dispatchEvent(new MouseEvent('mousemove', {clientX: 200,
            clientY: 300, bubbles: true, cancelable: true}));
        })()""")
        held = client.ui_state()
        check(held["scrolling"] and held["index"] == 1 and
              snapped["inlineX"] - held["inlineX"] > 300,
              "il drag non muove il track in continuo (base %s): %s" %
              (snapped["inlineX"], json.dumps(held)))
        client.eval("""window.dispatchEvent(new MouseEvent('mouseup', {button: 0,
          clientX: 200, clientY: 300, bubbles: true, cancelable: true}))""")
        client.settle_track()
        dragged = client.ui_state()
        check(dragged["index"] == 2 and not dragged["scrolling"] and
              dragged["status"].startswith("Project 3 of 11: "),
              "il drag non si aggancia alla card centrale: " + json.dumps(dragged))
        client.press("Home")
        client.settle_track()

        # I pannelli sono dialog: focus dentro, Tab intrappolato, focus restituito
        client.eval("document.querySelector('[data-panel=contatti]').click()")
        time.sleep(0.25)
        dialog = json.loads(client.eval("""JSON.stringify((function () {
          var p = document.querySelector('.panel.is-open');
          return {role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'),
                  inside: !!document.activeElement.closest('.panel')};
        })())"""))
        check(dialog == {"role": "dialog", "modal": "true", "inside": True},
              "pannello senza semantica/focus: " + json.dumps(dialog))
        wrapped = client.eval("""(function () {
          var p = document.querySelector('.panel.is-open');
          var f = [].slice.call(p.querySelectorAll('a[href],button:not([disabled])'));
          f[f.length - 1].focus();
          return f[0] === f[f.length - 1];
        })()""")
        if not wrapped:
            client.press("Tab")
            check(client.eval("""(function () {
              var p = document.querySelector('.panel.is-open');
              var f = [].slice.call(p.querySelectorAll('a[href],button:not([disabled])'));
              return document.activeElement === f[0];
            })()"""), "Tab non resta dentro il pannello")
        client.press("Escape")
        time.sleep(0.25)
        check(client.eval("document.activeElement.getAttribute('data-panel')") == "contatti",
              "focus non restituito al pulsante del pannello")

        # Back/Forward: la vista aperta deve tornare con Forward
        client.eval("document.activeElement.blur();"
                    "document.querySelector('.slide.is-active .device').click()")
        time.sleep(0.25)
        check(client.ui_state()["zoom"] and client.ui_state()["view"] == "slide",
              "il progetto aperto non è salvato nella history")
        client.eval("history.back()")
        time.sleep(0.25)
        check(not client.ui_state()["zoom"], "Back non chiude il progetto")
        client.eval("history.forward()")
        time.sleep(0.25)
        check(client.ui_state()["zoom"] and client.ui_state()["view"] == "slide",
              "Forward non riapre il progetto")

        client.press("Escape")
        time.sleep(0.25)
        client.eval("document.querySelector('[data-panel=contatti]').click()")
        time.sleep(0.25)
        client.eval("history.back()")
        time.sleep(0.25)
        check(not client.ui_state()["panel"], "Back non chiude il pannello")
        client.eval("history.forward()")
        time.sleep(0.25)
        check(client.ui_state()["panel"] == ["contatti"] and client.ui_state()["view"] == "panel",
              "Forward non riapre il pannello")

        # Stessi controlli su tre viewport: il test resta programmatico, ma con
        # --shots salva anche gli screenshot da guardare a occhio.
        client.press("Escape")
        time.sleep(0.25)
        for width, height, name in ((1440, 900, "desktop"),
                                    (800, 900, "tablet"),
                                    (390, 844, "phone")):
            client.viewport(width, height)
            time.sleep(0.25)
            layout = json.loads(client.eval("""JSON.stringify((function () {
              var bar = document.querySelector('.gallery__progress');
              return {
                overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                bar: bar.getBoundingClientRect().width,
                barOpacity: parseFloat(getComputedStyle(bar.parentNode).opacity),
                thumbs: document.querySelectorAll('.timeline button').length,
                inner: document.querySelector('.slide.is-active .slide__inner').getBoundingClientRect().width
              };
            })())"""))
            check(layout["overflow"] <= 1 and layout["bar"] > 0 and
                  layout["barOpacity"] > 0 and layout["thumbs"] == 11 and
                  layout["inner"] > 0,
                  "layout %s sbagliato: %s" % (name, json.dumps(layout)))
            # le card con il solo telefono devono restare centrate come le altre
            client.eval("document.querySelector('.timeline button[data-go=\\\"2\\\"]').click()")
            # in headless le transizioni avanzano solo quando arrivano eval/frame
            off = None
            for _ in range(25):
                time.sleep(0.1)
                off = int(client.eval("""(function () {
                  var d = document.querySelector('.slide.is-active .device').getBoundingClientRect();
                  return Math.round(d.left + d.width / 2 - innerWidth / 2);
                })()"""))
                if abs(off) <= 2:
                    break
            check(abs(off) <= 2, "card con solo telefono decentrata su %s: %d px" % (name, off))
            if args.shots:
                client.shot(os.path.join(args.shots, name + ".png"))
        client.viewport(1440, 900)

        client.go(origin + "404.html?t=%d" % int(time.time()))
        error = client.state()
        check(error["bodyBg"] == "rgb(20, 22, 26)", "la 404 ignora il tema salvato")
        check(error["metas"] == ["not all", "all"], "i meta theme-color della 404 sono sbagliati")

        print("OK: lingua EN/IT, tema %s/%s/%s, reload, 404, immagini, frecce, scroll continuo, "
              "snap, dialog, progress, preload, layout e Back/Forward." % (first, second, first))
    finally:
        if client:
            client.close()
        browser.terminate()
        try:
            browser.wait(timeout=5)
        except subprocess.TimeoutExpired:
            browser.kill()
        shutil.rmtree(profile, ignore_errors=True)
        server.shutdown()


if __name__ == "__main__":
    main()
