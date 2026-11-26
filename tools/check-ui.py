#!/usr/bin/env python3
"""Verifica lingua, tema, tasti della galleria e Back/Forward del browser.

Avvia un Firefox headless e un piccolo server locale, poi controlla:
- in EN e IT il back e le miniature hanno un nome, e il switch salva la scelta;
- il primo click va al tema opposto al sistema, poi alterna chiaro/scuro;
- dopo il reload la scelta resta e le immagini già prese sono quelle giuste;
- la stessa scelta vale sulla 404 e non si scaricano entrambe le varianti;
- le frecce funzionano anche con il focus su una miniatura;
- Forward riapre il progetto o il pannello chiuso da Back.

Uso: python3 tools/check-ui.py
richiede il modulo Python websocket-client (pip install websocket-client).
"""
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
          return {
            zoom: gallery ? gallery.classList.contains('is-zoomed') : false,
            panel: [].filter.call(document.querySelectorAll('.panel'), function (p) {
              return p.classList.contains('is-open');
            }).map(function (p) { return p.id; }),
            index: gallery ? [].findIndex.call(gallery.querySelectorAll('.slide'), function (s) {
              return s.classList.contains('is-active');
            }) : -1,
            view: history.state && history.state.view ? history.state.view.type : null
          };
        })())"""
        return json.loads(self.eval(expression))

    def press(self, key):
        self.eval("(function(){var e=new KeyboardEvent('keydown',{key:%s,bubbles:true,cancelable:true});"
                  "(document.activeElement||document).dispatchEvent(e);})()" % json.dumps(key))

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

        client.eval("document.querySelector('[data-lang-toggle]').click()")
        it = client.lang_state()
        check(it["lang"] == "it" and it["stored"] == "it", "switch alla lingua italiana non salvato")
        check(it["nav"] == ["Lavori", "Chi sono", "Percorso", "Contatti"],
              "navigazione IT sbagliata: " + json.dumps(it["nav"]))
        check(it["back"] == "Torna alla timeline", "etichetta back IT: " + str(it["back"]))
        check(all(label and label.find(" · ") > 0 for label in it["thumbs"]),
              "miniature senza nome in IT: " + json.dumps(it["thumbs"]))

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

        # Tasti della galleria con il focus su una miniatura
        client.eval("document.querySelector('.brand').click();"
                    "document.querySelector('.timeline button[data-go=\"3\"]').focus()")
        before = client.ui_state()
        client.press("ArrowUp")
        time.sleep(0.25)
        check(client.ui_state()["zoom"], "ArrowUp con il focus su una miniatura non apre la card")
        client.press("ArrowDown")
        time.sleep(0.25)
        check(not client.ui_state()["zoom"], "ArrowDown con il focus su una miniatura non chiude la card")
        client.press("ArrowRight")
        time.sleep(0.25)
        check(client.ui_state()["index"] == before["index"] + 1,
              "ArrowRight con il focus su una miniatura non cambia progetto")

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

        client.eval("document.querySelector('[data-panel=contatti]').click()")
        time.sleep(0.25)
        client.eval("history.back()")
        time.sleep(0.25)
        check(not client.ui_state()["panel"], "Back non chiude il pannello")
        client.eval("history.forward()")
        time.sleep(0.25)
        check(client.ui_state()["panel"] == ["contatti"] and client.ui_state()["view"] == "panel",
              "Forward non riapre il pannello")

        client.go(origin + "404.html?t=%d" % int(time.time()))
        error = client.state()
        check(error["bodyBg"] == "rgb(20, 22, 26)", "la 404 ignora il tema salvato")
        check(error["metas"] == ["not all", "all"], "i meta theme-color della 404 sono sbagliati")

        print("OK: lingua EN/IT, tema %s/%s/%s, reload, 404, immagini, frecce e Back/Forward." %
              (first, second, first))
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
