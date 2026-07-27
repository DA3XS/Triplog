# Triplog

Persönliches Trip-Tagebuch für psychedelische Substanzen (Mushrooms, Truffles, 1D-LSD, ...).

- **Neue Trips erfassen**: Substanz, Menge (z. B. 2.5 g) und Zeitpunkt eintragen.
- **Verlaufskurve**: Eintrittsphase, Wirkdauer und Nachwirkung als Kurve, live mit "Jetzt"-Marker.
- **Kalender mit Afterglow**: Vergangene Trips im Monatskalender, mit ausblendender Einfärbung für die
  mentale Nachwirkung (Afterglow) und die Psilocybin-Toleranz-Erholung, plus einem Datum "frühestens
  wieder sinnvoll".
- **Import**: Bestehende Daten aus der Openmind-App (JSON-Export) übernehmen.
- **Backup**: Alle Daten als JSON exportieren/importieren.

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
}
```
