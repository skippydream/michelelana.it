#!/usr/bin/env python3
"""Copia dai repo i marchi usati nelle schede dei lavori.

Le schede non sono screenshot: mostrano gli elementi di design di ogni
progetto — marchio, palette, carattere — così restano leggibili anche
in miniatura. Questo script prepara solo gli asset; la composizione è
in tools/demo-cards.html.
"""
from PIL import Image
import os, shutil

H   = os.path.expanduser("~/Documents")
OUT = os.path.join(os.path.dirname(__file__), "_demo")
os.makedirs(OUT, exist_ok=True)

DIRETTI = {
    "tsf.png":      f"{H}/torinosulfilo.it/img/logo-white.png",
    "opw.png":      f"{H}/opwatcher/opwatcher/Assets.xcassets/logo.png",
    "appunti.png":  f"{H}/appunti/icons/icon-512.png",
    "pachamar.png": f"{H}/pachamaryoga/brand/pachamar-emblema.png",
}
for nome, src in DIRETTI.items():
    shutil.copy(src, os.path.join(OUT, nome))

# Strati: l'icona è nera su bianco. Ne estraggo la sagoma e la ricoloro
# con l'azzurro chiaro del tema dell'app, su fondo trasparente.
src = Image.open(f"{H}/Strati/app/src/main/ic_launcher-playstore.png").convert("L")
w, h = src.size
out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
ps, po = src.load(), out.load()
for y in range(h):
    for x in range(w):
        v = ps[x, y]
        if v < 140:
            po[x, y] = (0xD9, 0xE2, 0xF5, int(255 * (1 - v / 140)))
out.save(os.path.join(OUT, "strati.png"))

print("asset pronti in", OUT)
