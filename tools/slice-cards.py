#!/usr/bin/env python3
"""Taglia la striscia resa da demo-cards.html in sette immagini 900x675.

La striscia va resa a 1200 px di larghezza: ogni scheda è 1200x900 nella
composizione, e viene poi ridotta a 900x675 perché sul sito non supera
mai i 340 px di larghezza.
"""
from PIL import Image
import os, sys

strip = sys.argv[1] if len(sys.argv) > 1 else "strip.png"
dest  = sys.argv[2] if len(sys.argv) > 2 else "assets/img"

im = Image.open(strip).convert("RGB")
scala = im.width // 1200
for i in range(7):
    card = im.crop((0, i * 900 * scala, 1200 * scala, (i + 1) * 900 * scala))
    card = card.resize((900, 675), Image.LANCZOS)
    p = os.path.join(dest, f"lavoro-{i + 1}.jpg")
    card.save(p, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"  {p}  {os.path.getsize(p) // 1024} KB")
