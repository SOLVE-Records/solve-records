# Solve Records — Website

Single-Page Website für das Recording Studio. Inhalte: Hero, Studio, Services, Equipment, Galerie, Arbeiten (mit SoundCloud-Embeds), Booking.

## Neue Sektionen seit letztem Update

### Galerie

Sechs Bilder-Tiles mit Lightbox. Klicken zum Vergrößern, Pfeiltasten zum Navigieren, ESC zum Schließen.

**Bilder einfügen:** Eigene Studio- und Equipment-Fotos in `assets/gallery/` ablegen. Die HTML erwartet diese Dateinamen:

- `studio-01.jpg` (groß), `studio-02.jpg`, `studio-03.jpg`
- `equipment-01.jpg`, `equipment-02.jpg`, `equipment-03.jpg` (groß)

Auflösung idealerweise 1600×1200 (oder größer), Format JPG. Optimal vor dem Upload mit https://squoosh.app oder TinyPNG verkleinern (Ziel: <500 KB pro Bild).

Die mitgelieferten Platzhalter sind generierte SVG-Bilder im Logo-Look — einfach durch echte Fotos überschreiben.

### Audio-Referenzen (SoundCloud)

Drei Hörproben-Plätze mit SoundCloud-Embeds. So fügst du echte Tracks ein:

1. Track auf SoundCloud öffnen
2. **Share → Embed → "Copy Code"**
3. In `index.html` den `iframe`-Block suchen (`PLATZHALTER` markiert die Stellen)
4. Den `src`-URL deines kopierten Codes einsetzen
5. Den Parameter `&color=%23d4a24a&inverse=true` lassen — sorgt für die Brass-farbige Optik im Logo-Stil

**Beispiel:** Wo `PLATZHALTER` steht, kommt dann z.B. `123456789` (deine Track-ID) hin.

Alternativ kannst du auch Spotify-Embeds nutzen (für offiziell veröffentlichte Tracks) oder Bandcamp.

## Deployment auf GitHub Pages

Wie zuvor: Dateien hochladen, `Settings → Pages → Source: Deploy from a branch → main → / (root) → Save`.

