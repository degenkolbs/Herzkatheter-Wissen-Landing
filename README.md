# Herzkatheter Wissen – Landingpage

Öffentliche, statische Übergangsseite für `herzkatheterwissen.de`.

## Zweck

Die eigentliche WordPress-Seite von Herzkatheter Wissen wird derzeit lokal/offline aufgebaut. Dieses Repository enthält bewusst nur eine kleine öffentliche Landingpage für GitHub Pages.

## GitHub Pages

Empfohlene Einstellung:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
- Custom domain: `herzkatheterwissen.de`
- HTTPS erzwingen, sobald GitHub das Zertifikat bereitgestellt hat

## DNS

Die Domain bleibt beim bestehenden DNS-Anbieter. Für GitHub Pages werden die von GitHub dokumentierten Apex-A-Records gesetzt; optional kann `www` per CNAME auf die GitHub-Pages-Adresse zeigen.

## Dateien

- `index.html` – Inhalt der Landingpage
- `style.css` – HKW-Design
- `CNAME` – Custom Domain für GitHub Pages

Die vollständigen Fachinhalte, Artikelentwürfe und internen Dokumente gehören **nicht** in dieses öffentliche Repository.
