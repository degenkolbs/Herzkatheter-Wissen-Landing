# Herzkatheterwissen – Landingpage

Öffentliche Landingpage für **herzkatheterwissen.de** während der Aufbauphase von Herzkatheterwissen.

## Zweck

Diese Seite dient als neutrale öffentliche Präsenz für die Domain, bis die eigentliche WordPress-Seite veröffentlicht wird.

## Enthalten

- Landingpage (`index.html`)
- Impressum (`impressum.html`)
- Styles (`style.css`, `legal.css`)
- Logo und Favicon
- `CNAME` für `herzkatheterwissen.de`

## Datenschutz / Impressum

Die öffentlichen Anbieterangaben werden nicht direkt im Git-Repository gespeichert. Das Impressum lädt die öffentlichen Angaben über einen vorgeschalteten Worker.

## Google / Analytics – Setup nach Merge von PR #1

1. Prüfen, ob `https://herzkatheterwissen.de/robots.txt` und `https://herzkatheterwissen.de/sitemap.xml` erreichbar sind.
2. In Google Search Console eine **Domain-Property** `herzkatheterwissen.de` anlegen.
3. Den von Google erzeugten DNS-TXT-Eintrag in Cloudflare DNS hinzufügen und die Property bestätigen.
4. In Search Console unter **Sitemaps** `sitemap.xml` einreichen.
5. `https://herzkatheterwissen.de/` über die **URL-Prüfung** testen und bei Bedarf **Indexierung beantragen**.
6. In Cloudflare **Web Analytics** für `herzkatheterwissen.de` aktivieren. Bei einer über Cloudflare geproxied Domain ist kein zusätzlicher Tracking-Code auf der Seite nötig, wenn die automatische Einrichtung verwendet wird.

Die aktuelle Sitemap enthält bewusst nur die Landingpage. Beim späteren Website-Launch muss sie durch die Sitemap der eigentlichen Website ersetzt bzw. erweitert werden.
