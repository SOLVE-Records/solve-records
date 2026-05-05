# Solve Records — Website

Statische Website für das Recording Studio Solve Records. Single-Page-Design mit Fokus auf Brass- und Hip-Hop-Produktionen, Stil angelehnt an die Logo-Identität.

## 📁 Struktur

```
solve-records-website/
├── index.html           ← Hauptseite
├── styles.css           ← Komplettes Styling
├── script.js            ← Interaktivität
├── assets/
│   ├── logo.svg         ← Hauptlogo (für Hero)
│   ├── profile.svg      ← Rundes Profil-Logo (Footer, Favicon)
│   └── og-image.png     ← Social Media Preview-Bild
└── README.md
```

## 🚀 Deployment auf GitHub Pages

### Schritt 1 — GitHub Repository anlegen

1. Auf [github.com](https://github.com) einloggen
2. Oben rechts auf **+** → **New repository**
3. Repository-Name: `solve-records` (oder beliebig)
4. **Public** wählen (Pages gibt's bei Free nur für Public)
5. **Create repository** klicken

### Schritt 2 — Dateien hochladen

**Option A — Über die Web-Oberfläche (am einfachsten):**

1. Im neuen Repo auf **uploading an existing file** klicken
2. Alle Dateien aus diesem Ordner per Drag & Drop in den Browser ziehen
3. Wichtig: Den `assets/`-Ordner mitsamt Inhalt
4. Unten **Commit changes** klicken

**Option B — Mit Git (für Fortgeschrittene):**

```bash
cd solve-records-website
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/solve-records.git
git push -u origin main
```

### Schritt 3 — GitHub Pages aktivieren

1. Im Repository auf **Settings** klicken (oben rechts)
2. Links im Menü auf **Pages**
3. Unter **Source** den Branch **main** wählen, Folder bleibt **/ (root)**
4. **Save** klicken
5. Nach ein paar Minuten ist die Site live unter:

```
https://DEIN-USERNAME.github.io/solve-records/
```

### Schritt 4 — Eigene Domain einrichten (optional)

Falls du eine eigene Domain wie `solve-records.com` hast:

1. Bei deinem Domain-Anbieter folgende DNS-Einträge setzen:
   - **A-Record** auf `185.199.108.153`
   - **A-Record** auf `185.199.109.153`
   - **A-Record** auf `185.199.110.153`
   - **A-Record** auf `185.199.111.153`
   - Optional **CNAME**-Record `www` → `DEIN-USERNAME.github.io`

2. In GitHub unter **Settings → Pages → Custom domain** die Domain eintragen
3. **Enforce HTTPS** aktivieren (kostenlos)

## ✏️ Inhalte anpassen

Alle Texte und Daten findest du direkt in `index.html`. Suche nach:

- **Künstler/Werke** → Sektion `<!-- ===== WORKS / PORTFOLIO ===== -->` (aktuell mit Platzhaltern!)
- **Equipment-Liste** → Sektion `<!-- ===== EQUIPMENT ===== -->`
- **Kontaktdaten** → Sektion `<!-- ===== KONTAKT / BOOKING ===== -->`
  - Email, Telefon, Adresse, Öffnungszeiten

## 📧 Form-Backend (wichtig!)

Das Kontaktformular öffnet aktuell den lokalen Email-Client (mailto-Fallback). Für ein echtes Backend ohne Server kann man kostenlos einrichten:

- **Formspree** ([formspree.io](https://formspree.io)) — 50 Submissions/Monat gratis
- **Netlify Forms** — wenn du später zu Netlify wechselst
- **Web3Forms** ([web3forms.com](https://web3forms.com)) — auch kostenlos

In `script.js` die Funktion `handleSubmit()` entsprechend anpassen.

## 🎨 Farben anpassen

Alle Farben sind als CSS-Variablen am Anfang von `styles.css` definiert:

```css
--brass: #d4a24a;        /* Hauptakzent */
--brass-bright: #f4cc6f; /* Highlights */
--tube: #ff7a2e;         /* Glühen */
--cream: #f3e7c8;        /* Haupttext */
--bg: #0a0705;           /* Hintergrund */
```

## 🔧 Lokale Vorschau

Einfach `index.html` im Browser öffnen — alles funktioniert ohne Server.

Für eine "echte" Server-Vorschau (empfohlen für Form-Tests):

```bash
# Mit Python
python3 -m http.server 8000

# Dann im Browser: http://localhost:8000
```

---

**Tech-Stack:** Pures HTML, CSS und JavaScript. Keine Build-Tools, kein Framework, keine Dependencies. Funktioniert überall.
