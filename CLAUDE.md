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
| `script.js` | Footer-Jahr, Sticky-Nav (`.scrolled` ab 50px), Mobile-Menü (`.nav-toggle`/`.nav-links.open`), Reveal-Animation (`.reveal` → `.visible` per IntersectionObserver), Smooth-Scroll per `scrollIntoView` (ohne eigenen Offset, nutzt `scroll-padding-top`), Anker-„Pin“ (`pinTo()`: hält das Ziel nach Hash-Aufruf/Anker-Klick per `ResizeObserver` fest, bis `load` + `fonts.ready` + 1,5 s, max. 15 s; Abbruch bei wheel/touchstart/keydown/mousedown; nicht bei Reload/Zurück), `handleSubmit()` (globale Funktion, Formular öffnet `mailto:`), Lightbox-IIFE |
| `assets/` | `logo.svg` (Hero), `profile.svg` (Favicon + Footer), `og-image.png` (OG/Apple-Touch), `michael-portrait.jpeg`, `gallery/*.jpg` |
| `tools/` | `index.html` (Übersicht mit `.tool-card`-Karten, lädt `../styles.css`; darunter Abschnitt „Downloads“ `.tools-downloads` mit je einer `.tool-card` pro PDF, `href="../downloads/….pdf" download`), `metronom.html`, `stimmgeraet.html`, `delay-rechner.html`, `raummoden-rechner.html`. Die Tool-Seiten sind eigenständig (eigenes `<style>` mit Kopie der `:root`-Variablen, eigenes `<script>`) und haben oben `<nav class="subnav">` mit Links nach `./` (Tools) und `../` (Startseite) |
| `raumakustik/` | `index.html`: eigenständige Seite im selben Muster wie die Tool-Seiten, Crumbs-Link nach `../`; verlinkt auf `../tools/raummoden-rechner.html` und `../#kontakt` |
| `services/` | `recording-mixing-production/index.html` und `mastering/index.html`: Service-Unterseiten im Muster von `raumakustik/index.html` (Pfade mit `../../`), Crumbs-Link „← Services“ nach `../../#services`. Fehlende Fakten sind im HTML als `<!-- FAKT FEHLT: … -->` markiert |
| `impressum/`, `datenschutz/` | `index.html`: Impressum (§ 5 DDG, § 18 Abs. 2 MStV) und Datenschutzerklärung, eigenständige Seiten im Muster von `raumakustik/index.html`, nicht in der Haupt-Nav. Unsichere Aussagen sind als `<!-- PRÜFEN: … -->` markiert. Die Datenschutzerklärung beschreibt die tatsächlichen Datenflüsse (GitHub Pages, Hetzner-DNS, Google Fonts, SoundCloud-Embeds, mailto-Formular/Gmail, `localStorage` der Tools, Mikrofon im Stimmgerät) — **bei jedem neuen externen Dienst, Embed, Cookie oder Formular-Backend mitändern** und das „Stand“-Datum aktualisieren |
| `subnav.css` | Einzige Quelle für die Rücklink-Leiste der Unterseiten (`<nav class="subnav" aria-label="Zurück">`): Pills mit 1px `--brass-deep`-Rahmen, min. 44px hoch, JetBrains Mono 1rem (≤ 480px 0.9rem), `--cream`, Hover/Fokus `--brass-bright`. Geladen von allen Unterseiten nach den Google Fonts (`../subnav.css` bzw. `../../subnav.css`). Liegt bewusst nicht in `styles.css`, weil die eigenständigen Seiten `styles.css` nicht laden (globaler Reset würde ihr Layout ändern). Nutzt die Variablen `--font-mono`, `--cream`, `--brass-deep`, `--brass-bright`, `--radius` der Seite |
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
- Jede Seite hat `<html lang="de">`, eigenes `<title>` (ca. 60 Zeichen, mit „Solve Records“), eigene `<meta name="description">` (ca. 155 Zeichen), `<link rel="canonical">` und Open-Graph-Tags (`og:title`, `og:description`, `og:type`, `og:url`, `og:image` = `assets/og-image.png`), alle mit absoluter URL `https://solverecords.de/…`. Neue Seiten zusätzlich in `sitemap.xml` eintragen.
- **Anker-Offset nur über `--header-h`/`scroll-padding-top`.** In `styles.css` `:root`: `--header-h` (Höhe der fixen `.nav` im gescrollten Zustand, 60px) und `--anchor-gap` (12px, ≤ 900px 10px); `html { scroll-padding-top: calc(var(--header-h) + var(--anchor-gap)) }` ist der einzige Offset. **Kein `scroll-behavior: smooth` auf `html`**: sonst animiert der Browser auch den Hash-Sprung beim Laden (`../#services`) zu einer Position, die nach dem Nachladen der Webfonts veraltet ist. Smooth-Scroll für Klicks macht `script.js`, das außerdem nach Hash-Aufruf und Anker-Klick das Ziel festhält, solange Webfonts das Layout noch verschieben (Font-Swap beim ersten Besuch: `#services` ca. 50px, `#kontakt` ca. 125px; Safari gleicht das nicht aus). Ohne eigenen Offset. Bilder oberhalb von Anker-Zielen haben `width`/`height`, Hero nutzt `min-height: 100svh` (Fallback `100vh`). Keine `scroll-margin-top`, keine JS-Offsets. Anker-IDs der Startseite sitzen auf dem `.container` direkt in der Sektion (Oberkante = `.section-head`), nicht auf `<section>` (deren `--section-pad` würde sich addieren). Neue Sektionen genauso. Ändert sich die Nav-Höhe, nur `--header-h` anpassen.
- **Unterseiten-Nav über Klasse `subnav`** (`subnav.css`), keine eigenen Inline-Styles für Rücklinks. Abstand zum ersten Inhalt: Standard `clamp(24px, 4vw, 36px)`; Tools-Seiten (`tools/index.html`, `tools/*.html`) nutzen `subnav subnav--tight` (`clamp(14px, 1.4vw, 20px)`), `tools/index.html` hat dafür kein eigenes `padding-top` an `.tools-page`.
- Footer-Links „Impressum“ und „Datenschutz“ stehen auf **jeder** Seite, klein in `--font-mono` (`.legal-links`): Startseite in `.footer-bottom`, `tools/index.html` in `<footer class="container legal-foot">` (CSS jeweils in `styles.css`), eigenständige Seiten in `<footer class="wrap legal">` direkt nach `</main>` mit eigenem CSS im `<style>`. Neue Seiten bekommen diesen Footer mit relativen Pfaden passend zur Tiefe (`impressum/`, `../impressum/`, `../../impressum/`).

## Deploy

- **GitHub Pages**, Source: *Deploy from a branch → `main` → `/ (root)`*.
- Repo: `https://github.com/SOLVE-Records/solve-records` (öffentlich).
- Live-URL: `https://solverecords.de/` (eigene Domain, Hauptadresse ohne www). Die Seite liegt im Domain-Root.
- `CNAME` im Repo-Root enthält genau eine Zeile `solverecords.de`. **Nicht löschen oder ändern** — ohne sie verliert GitHub Pages die Custom Domain.
- Jeder Push auf `main` geht nach ca. 1 Minute live. Es gibt keine Staging-Umgebung — vor dem Push lokal im Browser prüfen.
- **Nur relative Pfade** verwenden (`assets/…`, `../styles.css`, nicht `/assets/…`), damit die Seite lokal per Datei/`http.server` und unabhängig vom Hosting-Pfad funktioniert.
- Bisher wurde über die GitHub-Weboberfläche committet („Add files via upload“, „Update index.html“). Lokal vorher `git pull`, um Konflikte zu vermeiden.

## Bekannte offene Punkte (Stand 2026-11-10)

- Alle absoluten URLs (Canonical, `og:url`, `og:image`, JSON-LD, Sitemap, robots.txt) zeigen auf `https://solverecords.de/`. Bei einem erneuten Domainwechsel dort und in `CNAME` mitändern.
- Impressum und Datenschutzerklärung sind angelegt, die `<!-- PRÜFEN -->`-Stellen sind noch rechtlich zu klären. Google Fonts werden weiterhin extern von `fonts.googleapis.com`/`fonts.gstatic.com` geladen, die SoundCloud-Player laden sofort beim Seitenaufruf (beides Datenschutz-relevant, bewusst unverändert).
- Das Kontaktformular hat kein Backend, es öffnet nur das Mailprogramm (mailto). Hinweis im Code: Formspree o. Ä. wäre der nächste Schritt.
