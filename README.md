# Triplog

Persönliches Trip-Tagebuch für psychedelische Substanzen (Mushrooms, Truffles, 1D-LSD, ...).

- **Neue Trips erfassen**: Substanz, Menge (z. B. 2.5 g) und Zeitpunkt eintragen.
- **Verlaufskurve**: Eintrittsphase, Wirkdauer und Nachwirkung als Kurve, live mit "Jetzt"-Marker.
- **Kalender mit Afterglow**: Vergangene Trips im Monatskalender, mit ausblendender Einfärbung für die
  mentale Nachwirkung (Afterglow) und die Psilocybin-Toleranz-Erholung, plus einem Datum "frühestens
  wieder sinnvoll".
- **Import**: Bestehende Daten aus der Openmind-App (JSON-Export) übernehmen.
- **Backup**: Alle Daten als JSON exportieren/importieren.
- **Offline nutzbar**: Als installierbare PWA mit Service Worker – funktioniert auch ganz ohne Netz.

## Datenschutz

Alle Daten werden **ausschliesslich lokal im Browser** gespeichert (IndexedDB) – es gibt kein Backend
und keinen Cloud-Sync. Nutze die Backup-Funktion in den Einstellungen, um Daten zu sichern oder auf ein
anderes Gerät zu übertragen.

Die hinterlegten Afterglow-/Toleranz-Tage sind persönliche Richtwerte (Harm-Reduction-Heuristik), keine
medizinische Beratung. Sie lassen sich in den Einstellungen pro Substanz anpassen.

## Entwicklung

```bash
npm install
npm run dev      # Dev-Server
npm run build    # Produktions-Build nach dist/
npm run preview  # Build lokal ansehen
npm run lint     # oxlint
```

## Deployment

Die App ist eine reine statische Single-Page-App (kein Backend, kein eigenes Client-Routing) und kann
auf jede Art von Webserver deployed werden.

### GitHub Pages

Ein GitHub-Actions-Workflow (`.github/workflows/deploy.yml`) baut die App bei jedem Push auf `main` und
deployed sie als statische Seite auf GitHub Pages (Repo-Einstellungen → Pages → Source: GitHub Actions).

### Eigener Server mit Docker

```bash
docker compose up -d --build
```

Läuft danach auf Port 8080 (siehe `docker-compose.yml`, anpassbar). Baut die App in einer Node-Stage
und serviert sie anschliessend mit nginx (`nginx.conf`).

Ohne Compose direkt mit Docker:

```bash
docker build -t triplog .
docker run -d --name triplog -p 8080:80 --restart unless-stopped triplog
```

### Eigener Server ohne Docker (nginx/Apache)

```bash
npm install
npm run build
```

Den entstehenden Ordner `dist/` auf den Server kopieren und mit einem beliebigen statischen Webserver
ausliefern, z. B. nginx:

```nginx
server {
    listen 80;
    server_name triplog.deine-domain.ch;
    root /var/www/triplog;
    index index.html;
    location / {
        try_files $uri $uri/ =404;
    }

    # index.html nie cachen, damit Updates sofort ankommen (siehe unten) -
    # die gehashten Dateien in /assets/ dürfen dagegen ewig gecacht werden.
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
    # Der Service Worker (und sein Workbox-Helper) müssen ebenfalls immer
    # frisch geprüft werden, sonst merkt der Browser nie, dass es ein Update gibt.
    location ~ ^/(sw|workbox-.*)\.js$ {
        add_header Cache-Control "no-cache";
    }
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

Auf klassischem Shared Hosting (per FTP, Apache/LiteSpeed) übernimmt das automatisch die mitgelieferte
`public/.htaccess` (landet beim Build in `dist/.htaccess` – beim Hochladen nicht vergessen, sie ist eine
versteckte Datei, im FTP-Client ggf. "versteckte Dateien anzeigen" aktivieren).

**Wichtig ohne diese Cache-Regeln**: Browser (und v.a. iOS "Zum Home-Bildschirm hinzufügen"-Apps) können
`index.html` und den Service Worker sehr hartnäckig cachen. Da jeder Build neue Dateinamen für JS/CSS
erzeugt, zeigt eine gecachte alte `index.html` dann dauerhaft die vorherige Version, obwohl neue Dateien
hochgeladen wurden.

## Offline-Nutzung (PWA)

Die App registriert einen Service Worker ([`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/)), der
den App-Code beim ersten Besuch für die Offline-Nutzung zwischenspeichert. Deine Daten liegen ohnehin
immer lokal (IndexedDB) und sind unabhängig davon offline verfügbar.

- Wird eine neue Version erkannt, erscheint unten ein dezentes Banner "Neue Version verfügbar" mit einem
  Button – die App lädt **nicht** automatisch neu, damit kein unbeabsichtigt offener Eintrag verloren geht.
- Über "Zum Home-Bildschirm hinzufügen" (iOS) bzw. "App installieren" (Android/Desktop-Chrome) startet
  sie im eigenen Fenster ohne Browserleiste, inkl. App-Icon.
