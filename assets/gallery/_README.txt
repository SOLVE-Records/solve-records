Galerie-Bilder

Hier liegen die Studio-/Equipment-Fotos der Galerie.
index.html verwendet diese Dateien (Reihenfolge = Position im Raster):

  studio-live-room.jpg     — Live-Room (gallery-tile-1, oben, doppelt breit)
  equipment-rack.jpg       — Outboard-Rack (gallery-tile-2, oben rechts)
  equipment-manley.jpg     — Manley Force (gallery-tile-3, unten links)
  studio-mics.jpg          — Mic-Locker (gallery-tile-4, unten Mitte)
  studio-control-room.jpg  — Control Room (gallery-tile-5, unten rechts)

BILD AUSTAUSCHEN:
- Neue Datei unter gleichem Namen speichern, oder in index.html
  beim passenden <a class="gallery-item ...">-Block href UND img src ändern.
- Die Bildunterschrift für die Vergrößerung steht in data-caption.

BILD HINZUFÜGEN/ENTFERNEN:
- Das Raster in styles.css (Abschnitt GALERIE) hat genau fünf Positionen
  (gallery-tile-1 bis gallery-tile-5). Für ein sechstes Bild dort eine
  Klasse gallery-tile-6 anlegen, auch in den @media-Blöcken für Mobilgeräte.

EMPFEHLUNGEN:
- Format: JPG, Querformat (16:9 oder 4:3)
- Auflösung mindestens 1600x1200 für das große Tile, 1200x900 für die kleinen
- Dateigröße unter 500 KB pro Bild, z.B. mit https://squoosh.app oder TinyPNG.com
