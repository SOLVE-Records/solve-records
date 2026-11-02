# CLAUDE.md — Solve Records Website

Statische One-Page-Website für das Recording Studio „Solve Records“ (Michael Solf, Radolfzell). Sprache der Inhalte: **Deutsch**.

## Stack

- Reines HTML/CSS/Vanilla-JS. **Kein Build, kein npm, kein Framework, keine Tests.**
- Externe Abhängigkeiten nur: Google Fonts (Bodoni Moda, Oswald, JetBrains Mono) und SoundCloud-iframes.
- Lokal ansehen: `index.html` im Browser öffnen, oder `python -m http.server 8000` im Repo-Root.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Die gesamte Seite. Sektionen in Reihenfolge: Nav → Hero (`#top`) → 01 Studio + Founder (`#studio`) → 02 Services (`#services`) → 03 Equipment (`#equipment`) → 04 Galerie (`#galerie`) + Lightbox → 05 Arbeiten/SoundCloud (`#works`) → 06 Booking (`#kontakt`) → Footer |
| `styles.css` | Design-Tokens in `:root` (Farben `--brass*`, `--tube*`, `--cream*`, Fonts, Spacing). Danach Blöcke pro Sektion; Galerie, Lightbox, Audio und Founder sind später angehängt (ab ca. Zeile 1026) und haben eigene `@media`-Blöcke. Breakpoints: 900 / 800 / 700 / 480 px |
| `script.js` | Footer-Jahr, Sticky-Nav (`.scrolled` ab 50px), Mobile-Menü (`.nav-toggle`/`.nav-links.open`), Reveal-Animation (`.reveal` → `.visible` per IntersectionObserver), Smooth-Scroll mit 80px Offset, `handleSubmit()` (globale Funktion, Formular öffnet `mailto:`), Lightbox-IIFE |
| `assets/` | `logo.svg` (Hero), `profile.svg` (Favicon + Footer), `og-image.png` (OG/Apple-Touch), `michael-portrait.jpeg`, `gallery/*.jpg` |

## Konventionen

- Neue Elemente, die einblenden sollen, bekommen die Klasse `reveal`.
- Sektionskopf-Muster: `.section-head` mit `.section-num` (01, 02 …), `.section-label`, `.section-line`. Bei neuen Sektionen die Nummerierung fortführen und Nav + Footer-Links ergänzen.
- Akzentwörter in Überschriften mit `<em>` (wird brass-farbig/kursiv gestylt).
- Galerie: jedes Bild ist ein `<a class="gallery-item gallery-tile-N" href="…" data-caption="…">` mit `<img>` und `.gallery-overlay`. Die Lightbox liest `href` und `data-caption`. Layout hängt an `gallery-tile-1` … `gallery-tile-5` in `styles.css`.
- SoundCloud-Embeds: `.audio-item` mit `.audio-meta` + `.audio-embed`; URL-Parameter `&color=%23d4a24a&inverse=true` beibehalten (Brass-Optik).
- Bilder vor dem Commit komprimieren (Ziel < 500 KB, JPG, Querformat).
- Farben immer über die CSS-Variablen, keine neuen Hex-Werte verstreuen.

## Deploy

- **GitHub Pages**, Source: *Deploy from a branch → `main` → `/ (root)`*.
- Repo: `https://github.com/SOLVE-Records/solve-records` (öffentlich).
- Live-URL: `https://solve-records.github.io/solve-records/` (kein CNAME / keine eigene Domain konfiguriert).
- Jeder Push auf `main` geht nach ca. 1 Minute live. Es gibt keine Staging-Umgebung — vor dem Push lokal im Browser prüfen.
- Weil die Seite unter dem Unterpfad `/solve-records/` liegt: **nur relative Pfade** verwenden (`assets/…`, nicht `/assets/…`).
- Bisher wurde über die GitHub-Weboberfläche committet („Add files via upload“, „Update index.html“). Lokal vorher `git pull`, um Konflikte zu vermeiden.

## Bekannte offene Punkte (Stand 2026-11-02)

- SoundCloud-Profil-Link in `.works-note` zeigt noch auf `href="#"`.
- Galerie-Caption „Control Room … Pro Tools“, im Equipment steht aber Cubase.
- `og:image` ist absolut auf die Pages-URL gesetzt. Bei Umzug auf eine eigene Domain dort mitändern.
- Das Kontaktformular hat kein Backend, es öffnet nur das Mailprogramm (mailto). Hinweis im Code: Formspree o. Ä. wäre der nächste Schritt.
