# CLAUDE.md — Solve Records Website

Statische One-Page-Website für das Recording Studio „Solve Records“ (Michael Solf, Radolfzell). Sprache der Inhalte: **Deutsch**.

## Stack

- Reines HTML/CSS/Vanilla-JS. **Kein Build, kein npm, kein Framework, keine Tests.**
- Externe Abhängigkeiten nur: Google Fonts (Bodoni Moda, Oswald, JetBrains Mono) und SoundCloud-iframes.
- Lokal ansehen: `index.html` im Browser öffnen, oder `python -m http.server 8000` im Repo-Root.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Die gesamte Seite. Sektionen in Reihenfolge: Nav → Hero (`#top`) → 01 Studio + Founder (`#studio`) → 02 Services (`#services`) → 03 Equipment (`#equipment`) → 04 Galerie (`#galerie`) + Lightbox → 05 Arbeiten/SoundCloud (`#works`) → 06 Kontakt (`#kontakt`) → Footer. Die Nav verlinkt zusätzlich auf `tools/` und `raumakustik/`. Services: genau drei Kacheln (`a.service-card`, fest dreispaltig, ≤ 800px einspaltig) in der Reihenfolge Recording, Mixing und Production → `services/recording-mixing-production/`, Mastering → `services/mastering/`, Raumakustik → `raumakustik/`; je Kachel unten `.service-meta` (Preis bzw. Hinweis) und `.service-more` („Mehr erfahren →“). Nav: ab 901px stehen Marke und Menüpunkte auf einer Mittellinie (`.nav-links li` als Flex); 901–1279px kompakter (kleinere Abstände, Schriftzug „Solve Records“ ausgeblendet); ≤ 900px Mobile-Menü. Im `<head>` JSON-LD (schema.org `LocalBusiness`, einen Typ `RecordingStudio` gibt es nicht) |
| `styles.css` | Design-Tokens in `:root` (Farben `--brass*`, `--tube*`, `--cream*`, Fonts, Spacing). Danach Blöcke pro Sektion; Galerie, Lightbox, Audio und Founder sind später angehängt (ab ca. Zeile 1026) und haben eigene `@media`-Blöcke. Breakpoints: 900 / 800 / 700 / 480 px |
| `script.js` | Footer-Jahr, Sticky-Nav (`.scrolled` ab 50px), Mobile-Menü (`.nav-toggle`/`.nav-links.open`), Reveal-Animation (`.reveal` → `.visible` per IntersectionObserver), Smooth-Scroll mit 80px Offset, `handleSubmit()` (globale Funktion, Formular öffnet `mailto:`), Lightbox-IIFE |
| `assets/` | `logo.svg` (Hero), `profile.svg` (Favicon + Footer), `og-image.png` (OG/Apple-Touch), `michael-portrait.jpeg`, `gallery/*.jpg` |
| `tools/` | `index.html` (Übersicht mit `.tool-card`-Karten, lädt `../styles.css`; darunter Abschnitt „Downloads“ `.tools-downloads` mit je einer `.tool-card` pro PDF, `href="../downloads/….pdf" download`), `metronom.html`, `stimmgeraet.html`, `delay-rechner.html`, `raummoden-rechner.html`. Die Tool-Seiten sind eigenständig (eigenes `<style>` mit Kopie der `:root`-Variablen, eigenes `<script>`) und haben oben `<nav class="crumbs">` mit Links nach `./` (Tools) und `../` (Startseite) |
| `raumakustik/` | `index.html`: eigenständige Seite im selben Muster wie die Tool-Seiten, Crumbs-Link nach `../`; verlinkt auf `../tools/raummoden-rechner.html` und `../#kontakt` |
| `services/` | `recording-mixing-production/index.html` und `mastering/index.html`: Service-Unterseiten im Muster von `raumakustik/index.html` (Pfade mit `../../`), Crumbs-Link „← Services“ nach `../../#services`. Fehlende Fakten sind im HTML als `<!-- FAKT FEHLT: … -->` markiert |
| `sitemap.xml`, `robots.txt` | Sitemap mit allen Seiten (absolute URLs, keine `#`-Fragmente); `robots.txt` verweist auf die Sitemap |
| `downloads/` | PDF-Vorlagen (A4), verlinkt aus dem Abschnitt „Downloads“ in `tools/index.html`: `notenblatt-violinschluessel.pdf`, `notenblatt-bassschluessel.pdf`, `notenblatt-klavier.pdf`, `quintenzirkel.pdf`. PDFs werden außerhalb des Repos erzeugt und hier abgelegt. Neue PDF: Datei hier ablegen und eine Kachel in `tools/index.html` ergänzen |

## Konventionen

- Neue Elemente, die einblenden sollen, bekommen die Klasse `reveal`.
- Sektionskopf-Muster: `.section-head` mit `.section-num` (01, 02 …), `.section-label`, `.section-line`. Bei neuen Sektionen die Nummerierung fortführen und Nav + Footer-Links ergänzen.
- Akzentwörter in Überschriften mit `<em>` (wird brass-farbig/kursiv gestylt).
- Galerie: jedes Bild ist ein `<a class="gallery-item gallery-tile-N" href="…" data-caption="…">` mit `<img>` und `.gallery-overlay`. Die Lightbox liest `href` und `data-caption`. Layout hängt an `gallery-tile-1` … `gallery-tile-6` in `styles.css`: 1–3 groß (Reihe 1: `studio-live-room.jpg`, `studio-control-room.jpg`, `studio-recording-room.jpg`), 4–6 klein (Reihe 2: `equipment-rack.jpg`, `equipment-manley.jpg`, `studio-mics.jpg`). ≤ 700px: große Tiles je volle Breite, kleine dreispaltig; ≤ 480px: eine Spalte. `studio-recording-room.jpg` ist ein Platzhalter und wird 1:1 durch das echte Foto ersetzt.
- SoundCloud-Embeds: `.audio-item` mit `.audio-meta` + `.audio-embed`; URL-Parameter `&color=%23d4a24a&inverse=true` beibehalten (Brass-Optik).
- Bilder vor dem Commit komprimieren (Ziel < 500 KB, JPG, Querformat).
- Farben immer über die CSS-Variablen, keine neuen Hex-Werte verstreuen.
- Jede Seite hat `<html lang="de">`, eigenes `<title>` (ca. 60 Zeichen, mit „Solve Records“), eigene `<meta name="description">` (ca. 155 Zeichen), `<link rel="canonical">` und Open-Graph-Tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image` = `assets/og-image.png`), alle mit absoluter URL `https://solve-records.github.io/solve-records/…`. Neue Seiten zusätzlich in `sitemap.xml` eintragen.

## Deploy

- **GitHub Pages**, Source: *Deploy from a branch → `main` → `/ (root)`*.
- Repo: `https://github.com/SOLVE-Records/solve-records` (öffentlich).
- Live-URL: `https://solve-records.github.io/solve-records/` (kein CNAME / keine eigene Domain konfiguriert).
- Jeder Push auf `main` geht nach ca. 1 Minute live. Es gibt keine Staging-Umgebung — vor dem Push lokal im Browser prüfen.
- Weil die Seite unter dem Unterpfad `/solve-records/` liegt: **nur relative Pfade** verwenden (`assets/…`, nicht `/assets/…`).
- Bisher wurde über die GitHub-Weboberfläche committet („Add files via upload“, „Update index.html“). Lokal vorher `git pull`, um Konflikte zu vermeiden.

## Bekannte offene Punkte (Stand 2026-11-02)

- `og:image` ist absolut auf die Pages-URL gesetzt. Bei Umzug auf eine eigene Domain dort mitändern.
- Das Kontaktformular hat kein Backend, es öffnet nur das Mailprogramm (mailto). Hinweis im Code: Formspree o. Ä. wäre der nächste Schritt.
