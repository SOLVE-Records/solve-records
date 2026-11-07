Galerie-Bilder

Hier liegen die Studio-/Equipment-Fotos der Galerie.
index.html verwendet diese Dateien (Reihenfolge = Position im Raster):

  Reihe 1, groß:
  studio-live-room.jpg       — Live-Room (gallery-tile-1, oben links)
  studio-control-room.jpg    — Control Room (gallery-tile-2, oben Mitte)
  studio-recording-room.jpg  — Recording Room (gallery-tile-3, oben rechts)
                               DERZEIT PLATZHALTER: echtes Foto unter genau
                               diesem Namen ablegen, dann wird es automatisch
                               verwendet.

  Reihe 2, klein:
  equipment-rack.jpg         — Outboard-Rack (gallery-tile-4, unten links)
  equipment-manley.jpg       — Manley Force (gallery-tile-5, unten Mitte)
  studio-mics.jpg            — Mic-Locker (gallery-tile-6, unten rechts)

BILD AUSTAUSCHEN:
- Neue Datei unter gleichem Namen speichern, oder in index.html
  beim passenden <a class="gallery-item ...">-Block href UND img src ändern.
- Die Bildunterschrift für die Vergrößerung steht in data-caption.

BILD HINZUFÜGEN/ENTFERNEN:
- Das Raster in styles.css (Abschnitt GALERIE) hat genau sechs Positionen
  (gallery-tile-1 bis gallery-tile-6). Für ein siebtes Bild dort eine
  Klasse gallery-tile-7 anlegen, auch in den @media-Blöcken für Mobilgeräte.

EMPFEHLUNGEN:
- Format: JPG, Querformat (16:9 oder 4:3)
- Auflösung mindestens 1600x1200 für die großen Tiles, 1200x900 für die kleinen
- Die großen Tiles werden auf dem Desktop etwa quadratisch zugeschnitten
  (object-fit: cover): das Motiv sollte in der Bildmitte liegen.
- Dateigröße unter 500 KB pro Bild, z.B. mit https://squoosh.app oder TinyPNG.com
