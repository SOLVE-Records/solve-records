# Solve Records — Website

Single-Page-Website für das Recording Studio. Inhalte: Hero, Studio (mit „Der Mensch hinter dem Studio“), Services, Equipment, Galerie, Arbeiten (SoundCloud-Embeds), Kontakt.

Reines HTML/CSS/JavaScript, kein Build-Schritt. Zum Ansehen `index.html` im Browser öffnen.

## Unterseiten

| Pfad | Inhalt |
|---|---|
| `tools/` | Übersicht der kostenlosen Tools, darunter der Abschnitt „Downloads“ mit PDF-Vorlagen |
| `tools/metronom.html` | Metronom |
| `tools/stimmgeraet.html` | Stimmgerät |
| `tools/delay-rechner.html` | Delay-Rechner |
| `tools/raummoden-rechner.html` | Raummoden-Rechner |
| `raumakustik/` | Raumakustik: Ablauf, Raummoden-Rechner, Kontakt |
| `services/recording-mixing-production/` | Recording, Mixing & Production: Ablauf, Leistungsumfang, Kontakt |
| `services/mastering/` | Mastering: Ablauf, Leistungsumfang, Kontakt |
| `impressum/` | Impressum (Angaben nach § 5 DDG, § 18 Abs. 2 MStV) |
| `datenschutz/` | Datenschutzerklärung (Hosting, DNS, Google Fonts, SoundCloud, Kontakt, lokale Tool-Einstellungen) |
| `downloads/` | PDF-Vorlagen zum Ausdrucken (Notenblätter Violin-, Bassschlüssel, Klavier, Quintenzirkel). PDFs werden außerhalb des Repos erzeugt und hier abgelegt. |

Der Services-Abschnitt der Startseite hat drei Kacheln: Recording, Mixing und Production, Mastering (ab 80 €) und Raumakustik (ab 300 €). Jede Kachel ist ein Link auf die jeweilige Unterseite mit der Aktionszeile „Mehr erfahren →“.

`sitemap.xml` listet alle Seiten, `robots.txt` verweist darauf. Neue Seiten dort eintragen und mit `<title>`, Description, Canonical und Open-Graph-Tags versehen.

Footer: Jede Seite verlinkt unten klein (Mono-Schrift) auf `impressum/` und `datenschutz/`. Auf der Startseite sitzen die Links in `.footer-bottom`, in `tools/index.html` in `footer.legal-foot` (beides `.legal-links` aus `styles.css`), auf den eigenständigen Seiten in `footer.legal` mit eigenem CSS im `<style>`. Neue Seiten bekommen diesen Footer mit passenden relativen Pfaden (`../`, `../../`). Wenn sich Dienste ändern (z. B. Schriften lokal statt Google Fonts, andere Embeds, Formular-Backend), muss `datenschutz/index.html` mitgeändert werden.

Hinweis: Die Links auf `tools/`, `raumakustik/`, `services/…`, `impressum/` und `datenschutz/` öffnen die jeweilige `index.html` nur über einen Webserver (GitHub Pages oder lokal `python -m http.server 8000`), nicht bei direkt geöffneter Datei.

## Galerie

Sechs Bilder mit Lightbox: Klicken zum Vergrößern, Pfeiltasten zum Navigieren, ESC zum Schließen.

Die Bilder liegen in `assets/gallery/`:

| Datei | Tile | Position |
|---|---|---|
| `studio-live-room.jpg` | `gallery-tile-1` | oben links, groß |
| `studio-control-room.jpg` | `gallery-tile-2` | oben Mitte, groß |
| `studio-recording-room.jpg` | `gallery-tile-3` | oben rechts, groß (derzeit Platzhalter) |
| `equipment-rack.jpg` | `gallery-tile-4` | unten links, klein |
| `equipment-manley.jpg` | `gallery-tile-5` | unten Mitte, klein |
| `studio-mics.jpg` | `gallery-tile-6` | unten rechts, klein |

Auf dem Tablet (bis 700px) stehen die drei großen Bilder untereinander über die volle Breite, die drei kleinen darunter nebeneinander. Auf dem Handy (bis 480px) steht alles in einer Spalte.

`studio-recording-room.jpg` ist ein selbst erzeugter Platzhalter. Zum Ersetzen das echte Foto unter genau diesem Namen ablegen.

**Bild austauschen:** Neue Datei unter gleichem Namen ablegen, oder in `index.html` beim passenden `<a class="gallery-item …">` sowohl `href` als auch `src` des `<img>` ändern. Die Bildunterschrift in der Lightbox steht in `data-caption`.

**Bild hinzufügen oder entfernen:** Das Raster ist in `styles.css` (Abschnitt GALERIE) fest auf 3 Spalten × 2 Reihen mit sechs Positionen `gallery-tile-1` bis `gallery-tile-6` ausgelegt (Reihe 1 groß, Reihe 2 klein). Für ein siebtes Bild muss dort eine neue Klasse `gallery-tile-7` und eine weitere Reihe angelegt werden, auch in den `@media`-Blöcken für Mobilgeräte.

Empfehlung: JPG im Querformat, mindestens 1600×1200 für das große Tile, unter 500 KB pro Bild (z.B. mit https://squoosh.app oder TinyPNG verkleinern).

## Audio-Referenzen (SoundCloud)

Im Bereich „Arbeiten“ stehen fünf SoundCloud-Player, jeweils als `<div class="audio-item">` mit Jahr, Genre und `iframe`.

**Track austauschen oder hinzufügen:**

1. Track auf SoundCloud öffnen → **Share → Embed** → Code kopieren
2. In `index.html` einen bestehenden `audio-item`-Block kopieren bzw. anpassen
3. Im `src` des `iframe` die Track-ID ersetzen (die Zahl nach `soundcloud%253Atracks%253A`)
4. Die Parameter `&color=%23d4a24a&inverse=true` beibehalten — sie sorgen für die Brass-Optik
5. Jahr (`audio-year`) und Genre (`audio-genre`) anpassen

Alternativ gehen auch Spotify- oder Bandcamp-Embeds.

## Deployment auf GitHub Pages

Die Seite wird über GitHub Pages direkt aus dem Branch `main` veröffentlicht
(`Settings → Pages → Source: Deploy from a branch → main → / (root)`).

Live: https://solverecords.de/ (eigene Domain, Hauptadresse ohne www; die Seite liegt im Domain-Root).
Früher lief die Seite unter https://solve-records.github.io/solve-records/ — GitHub leitet diese Adresse auf die eigene Domain um.

Die Datei `CNAME` im Repo-Root (Inhalt: `solverecords.de`) verbindet GitHub Pages mit der Domain. **Nicht löschen**, sonst ist die Seite nicht mehr unter solverecords.de erreichbar.

Jede Änderung auf `main` ist nach etwa einer Minute online. Pfade zu Dateien immer relativ angeben (`assets/…`, `../styles.css`, nicht `/assets/…`), damit die Seite auch lokal und unabhängig vom Hosting-Pfad funktioniert. Absolute URLs (Canonical, Open Graph, JSON-LD, Sitemap) beginnen mit `https://solverecords.de/`.
