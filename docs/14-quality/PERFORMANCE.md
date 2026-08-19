# Omni Fashion – Performance Foundation

Status: **erste reale Engpässe behoben; vollständiges Device-Profiling noch offen**

## Warum dieser Block jetzt existiert

Die ursprüngliche Prototype-UI war für kleine Demo-Datenmengen gebaut. Mit realem Cloud-Wardrobe, Marketplace und Notifications wachsen Datenmengen und Live-Snapshots dauerhaft.

Performance wird deshalb nicht erst beim Store-Release behandelt.

---

## Wardrobe Grid

Vorher:

```text
ScrollView
  -> items.map(...)
```

Damit wurden alle Kleidungsstücke gleichzeitig gerendert.

Jetzt:

- `FlatList`
- zwei Spalten
- `initialNumToRender=8`
- `maxToRenderPerBatch=8`
- `windowSize=7`
- `removeClippedSubviews`

Die bestehende Card-Optik und Item-Interaktion bleiben erhalten.

Wardrobe-Daten selbst werden weiterhin vollständig geladen, weil der Stylist den eigenen Schrank als Source of Truth benötigt.

---

## Activity Inbox

Vorher:

- unlimitierte Firestore Live Query
- clientseitige Sortierung
- `ScrollView + map`

Jetzt:

- serverseitig `createdAt DESC`
- maximal 100 neueste Notifications
- expliziter Firestore Composite Index
- virtualisierte `FlatList`

Damit wächst die aktive Inbox nicht unbegrenzt im App-Speicher.

---

## OmniSwap Marketplace

Vorher:

- alle aktiven Listings als unlimitierte Live Query
- eigene Listings unlimitiert
- Download URL für jedes öffentliche Bild bei jedem Snapshot erneut aufgelöst

Jetzt:

- maximal 100 neueste aktive Listings
- maximal 100 eigene Listings
- serverseitig `createdAt DESC`
- Composite Indizes für `status + createdAt` und `ownerId + createdAt`
- öffentlicher Storage-URL-Cache pro `publicImagePath`

Die globale Marketplace-Datenmenge wächst damit nicht mehr direkt mit jedem Listing im System.

---

## Production Bundle Smoke

CI besitzt jetzt zusätzlich:

```text
npx expo export --platform web --output-dir dist-ci
```

Dieser reale Production-Bundle-Test hat bereits einen vorhandenen NativeWind-v4-Konfigurationsfehler gefunden, den TypeScript nicht erkennen konnte.

Behoben wurden:

- `nativewind/babel` als Preset statt falschem Plugin
- `babel-preset-expo` mit `jsxImportSource: nativewind`
- `nativewind/preset` in Tailwind
- `withNativeWind` in Metro
- echte `@tailwind` Direktiven in `src/global.css`
- Web-Bundler explizit auf Metro

Nach dieser Korrektur lief der Production-Webexport erfolgreich.

---

## Fake-Shop entfernt

Der bisherige Shop enthielt harte Demo-Marken, Preise und Unsplash-Bilder. Das war kein Performance-Feature, aber ein Production-Wahrheitsproblem.

Der Tab ist jetzt standardmäßig hinter:

```text
shopPartnerFeed = false
```

verborgen. Der Shop-Screen selbst zeigt bei direktem Zugriff keine erfundenen Produkte mehr.

---

## Noch offene Performance-Arbeit

### OmniSwap Offers / Transactions

Die Live Queries sind pro Nutzer gefiltert, aber noch nicht paginiert/begrenzt. Das ist weniger kritisch als der globale Marketplace, muss vor großer Historie aber nachgezogen werden.

### Bilder

Noch prüfen:

- Upload Resize/Compression
- HEIC/HEIF
- Thumbnail-Varianten
- Cache-Policy
- Memory-Verhalten auf Low-End Android
- große öffentliche Listing-Bilder

### Stylist

Noch messen:

- Outfit-Kombinatorik bei großen Wardrobes
- Memoization / recomputation
- Ranking-Zeit

### Device Profiling

Vor Release auf echten Geräten:

- Startzeit
- Navigation
- Wardrobe 50/250/1000 Items
- Marketplace 100 Items
- Activity 100 Items
- Memory
- JS thread stalls
- Bild-Decoding
- Android Low-/Mid-End
- iPhone ältere Generation

## Regel

Performance-Optimierung soll reale Engpässe lösen. Omni Fashion soll keine komplexe Cache-/Pagination-Infrastruktur nur für theoretische Probleme einbauen.
