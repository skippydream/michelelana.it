#!/usr/bin/env python3
"""Server locale per michelelana.it con cache disabilitata.

Uso: python3 tools/serve-nocache.py [porta]
Silenzia completamente la cache del browser: ogni richiesta rilegge i file
dal disco, così le modifiche a HTML/CSS/JS/immagini sono visibili subito.
"""
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    print("Servo %s su http://localhost:%d/ (cache disabilitata)" % (ROOT, port), flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
