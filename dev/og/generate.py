"""Share-Bilder (Open Graph, 1200 x 630) für solverecords.de erzeugen.

Aufruf im Repo-Root:   python dev/og/generate.py
Voraussetzung:         pip install playwright pillow  und  python -m playwright install chromium
Ausgabe:               assets/og/og-*.png  (Ziel: je < 300 KB)

Rendert dev/og/template.html per Playwright (Chromium) als Screenshot.
Schriften: Bodoni Moda, Oswald und JetBrains Mono werden als @fontsource-woff2
(über cdn.jsdelivr.net) einmalig in ein Temp-Verzeichnis geladen und lokal
eingebunden. Die Schrifteinbindung der Website (Google Fonts) bleibt davon unberührt.
Farben kommen aus den :root-Variablen in styles.css.
Neue Seite: Eintrag in IMAGES ergänzen, Skript laufen lassen, og:image der Seite setzen.
"""
import pathlib, re, tempfile, urllib.request, io
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "og"
TEMPLATE = pathlib.Path(__file__).with_name("template.html")
FONT_DIR = pathlib.Path(tempfile.gettempdir()) / "solve-records-og-fonts"

FONTS = {  # Dateiname -> @fontsource-Paket
    "bodoni-moda-latin-700-italic.woff2": "bodoni-moda",
    "bodoni-moda-latin-700-normal.woff2": "bodoni-moda",
    "oswald-latin-300-normal.woff2": "oswald",
    "oswald-latin-400-normal.woff2": "oswald",
    "jetbrains-mono-latin-500-normal.woff2": "jetbrains-mono",
}

# Datei, Eyebrow, Titel, Untertitel
IMAGES = [
    ("og-default.png", "Recording Studio seit 1996", "Solve Records", "Brass &amp; Hip-Hop · Bodensee"),
    ("og-tools.png", "Solve Records · Tools", "Kostenlose Tools", "für Musiker und Homestudio"),
    ("og-raumakustik.png", "Solve Records · Service", "Raumakustik", "Raum ausmessen und planen · Bodensee"),
    ("og-mastering.png", "Solve Records · Service", "Mastering", "Persönlich und analog · Bodensee"),
    ("og-recording.png", "Solve Records · Service", "Recording, Mixing &amp; Production", "Brass, Hip-Hop und mehr · Bodensee"),
    ("og-metronom.png", "Solve Records · Tools", "Metronom", "Online, mit Tap-Tempo · 40 bis 240 BPM"),
    ("og-stimmgeraet.png", "Solve Records · Tools", "Stimmgerät", "Gitarre, Ukulele, E-Bass und chromatisch"),
    ("og-delay-rechner.png", "Solve Records · Tools", "Delay-Rechner", "BPM in Millisekunden und Hertz"),
    ("og-raummoden-rechner.png", "Solve Records · Tools", "Raummoden-Rechner", "Moden aus Länge, Breite und Höhe"),
]


def fetch_fonts():
    FONT_DIR.mkdir(exist_ok=True)
    for name, pkg in FONTS.items():
        f = FONT_DIR / name
        if not f.exists():
            url = f"https://cdn.jsdelivr.net/npm/@fontsource/{pkg}@5/files/{name}"
            with urllib.request.urlopen(url, timeout=30) as r:
                f.write_bytes(r.read())


def tokens():
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    root = css[css.index(":root"):css.index("}", css.index(":root"))]
    return dict(re.findall(r"--([\w-]+):\s*([^;]+);", root))


def optimize(png_bytes, path):
    img = Image.open(io.BytesIO(png_bytes)).convert("RGB")
    # 256 Farben mit Dithering: flache, dunkle Flächen bleiben sauber, Datei wird klein
    img.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(path, optimize=True)


def main():
    fetch_fonts()
    t = tokens()
    tpl = TEMPLATE.read_text(encoding="utf-8")
    for k, v in t.items():
        tpl = tpl.replace("{{" + k + "}}", v.strip())
    tpl = tpl.replace("{{fontdir}}", FONT_DIR.as_uri())
    tpl = tpl.replace("{{logo}}", (ROOT / "assets" / "profile.svg").as_uri())
    OUT.mkdir(parents=True, exist_ok=True)
    work = pathlib.Path(tempfile.gettempdir()) / "solve-records-og.html"
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={"width": 1200, "height": 630})
        for fname, eyebrow, title, sub in IMAGES:
            html = tpl.replace("{{eyebrow}}", eyebrow).replace("{{title}}", title).replace("{{sub}}", sub)
            work.write_text(html, encoding="utf-8")
            page.goto(work.as_uri())
            page.evaluate("document.fonts.ready")
            page.evaluate("window.fit && window.fit()")
            optimize(page.screenshot(type="png"), OUT / fname)
            print(f"{fname}: {(OUT / fname).stat().st_size // 1024} KB")
        b.close()


if __name__ == "__main__":
    main()
