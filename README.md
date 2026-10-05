# Herzkatheterwissen Landingpage

Statische Landingpage für `herzkatheterwissen.de`.

## Inhalt

- `index.html` – öffentliche Startseite
- `impressum.html` – Impressum
- `style.css` – Styles der Startseite
- `legal.css` – Styles der rechtlichen Seite
- `hkw-imprint.js` – clientseitiges Laden der Impressumsdaten
- `CNAME` – Custom Domain für GitHub Pages

## Deployment

Die Seite wird über GitHub Pages veröffentlicht und ist unter `https://herzkatheterwissen.de` erreichbar.

Die eigentliche WordPress-Seite wird separat aufgebaut und später die Landingpage ablösen.

## Sicherheit

Private Anbieter- und Kontaktdaten gehören nicht direkt in dieses öffentliche Repository. Das Impressum lädt diese Daten über einen vorgeschalteten Worker.
