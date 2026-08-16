# Omni Fashion – Cloud Wardrobe

## Ziel

Der digitale Kleiderschrank ist die zentrale Source of Truth von Omni Fashion.

Ein Kleidungsstück wird nicht getrennt für Stylist, OmniSwap oder Shopping neu modelliert. Alle späteren Features referenzieren denselben Wardrobe-Datensatz.

```text
WardrobeItem
  ├─ Stylist / Outfit Engine
  ├─ AI Garment Analysis
  ├─ OmniSwap Listing
  ├─ Style-DNA Signals
  └─ Smart Shopping / Gap Analysis
```

---

# 1. Aktueller Stand

Produktiver Cloud-Pfad ist im Code vorbereitet:

```text
src/features/wardrobe/types.ts
src/features/wardrobe/services/wardrobe-service.ts
src/features/wardrobe/services/wardrobe-storage-service.ts
src/features/wardrobe/services/local-wardrobe-service.ts
src/context/WardrobeContext.tsx
src/app/index.tsx
src/components/ItemDetailsModal.tsx
```

Security:

```text
firestore.rules
storage.rules
tests/security/firestore.rules.integration.mjs
tests/security/storage.rules.integration.mjs
```

---

# 2. Canonical WardrobeItem

Das aktuelle MVP-Schema enthält:

```text
id
ownerId
imagePath
imageUrl              # nur Runtime, nicht Source of Truth
name
category
subcategory
color
secondaryColors[]
brand
material
size
season
condition
styleTags[]
source
aiStatus
aiConfidence
aiModelVersion
isListedForSwap
swapListingId
createdAt
updatedAt
schemaVersion
```

## Warum bestehende Felder wie `category`, `color`, `season` erhalten bleiben

Die aktuelle UI benutzt diese Felder bereits.

Wir ersetzen nicht grundlos das komplette Frontend durch ein theoretisch perfektes Datenmodell. Stattdessen wurde das vorhandene Modell erweitert, damit die App schrittweise produktionsreif werden kann.

---

# 3. Bildarchitektur

## Falsch

```text
Firestore
→ lokale file:// URI als dauerhafte Bildquelle
```

Eine lokale URI funktioniert nur auf dem Gerät, auf dem das Bild ausgewählt wurde.

## Richtig

```text
Image Picker
→ lokale URI
→ Bild validieren
→ Firebase Storage
→ imagePath in Firestore
→ Download URL bei Laufzeit auflösen
```

Der kanonische Pfad lautet:

```text
users/{uid}/wardrobe/{itemId}/original.{extension}
```

`imageUrl` wird nur für die Anzeige im laufenden Client benutzt und nicht als persistente Source of Truth behandelt.

---

# 4. Upload-Regeln

Aktuell:

- nur Bild-Dateitypen
- kleiner als 10 MB
- Storage-Pfad gehört zum angemeldeten Nutzer
- fremde Nutzer dürfen private Wardrobe-Bilder weder lesen noch überschreiben
- Public Listing Media ist clientseitig schreibgeschützt

Der Upload-Service verwendet den Expo-57-konformen Fetch/Blob-Pfad aus dem installierten `expo`-Paket.

Noch auf echten Geräten zu validieren:

- Kamera URI → Blob auf Android
- Galerie URI → Blob auf Android
- Kamera URI → Blob auf iOS
- Galerie URI → Blob auf iOS
- HEIC/HEIF Verhalten
- große Bilder / Speicherverbrauch
- langsame Verbindung

---

# 5. Firestore Service

Der Client greift nicht direkt überall auf Firestore zu.

Zentral:

```text
createWardrobeItemId()
subscribeToWardrobe(ownerId)
createCloudWardrobeItem(...)
updateCloudWardrobeItem(...)
deleteCloudWardrobeItem(...)
```

Die UI kennt dadurch keine Firestore-Query-Details.

---

# 6. Cloud Query

Aktuell:

```text
wardrobeItems
where ownerId == currentUser.uid
```

Sortierung nach `createdAt` erfolgt derzeit clientseitig.

Grund:

Für den ersten MVP vermeiden wir einen unnötigen Composite Index nur für die Sortierung einer privaten Wardrobe-Liste.

Wenn Nutzer später sehr große Kleiderschränke haben, werden Pagination und serverseitige Sortierung ergänzt.

---

# 7. Development-Fallback

Solange noch keine echten Firebase-Projektwerte im Repo/Environment vorhanden sind, bleibt der Development-Demo-Pfad benutzbar.

```text
Echter Firebase User
→ Cloud Wardrobe

Development Demo User
→ AsyncStorage
```

Der lokale Speicher wurde von:

```text
@wardrobe_items
```

auf ein neues V2-Schema migriert.

Bestehende alte Items werden einmalig normalisiert.

Production darf nicht auf diesen Demo-Pfad zurückfallen.

---

# 8. Kein Fake-AI-Timer mehr

Der ursprüngliche Screen simulierte Upload/KI mit:

```text
setTimeout(..., 1000)
```

Dieser Pfad wurde entfernt.

Aktuell bedeutet ein Upload nur:

```text
Bild speichern
→ neutrales Kleidungsstück anlegen
→ Nutzer kann Metadaten korrigieren
```

`aiStatus` beginnt mit:

```text
not_requested
```

Erst die echte AI-Pipeline darf den AI-Zustand ändern.

---

# 9. Geschützte Systemfelder

Folgende Felder dürfen nicht von einem manipulierten normalen Client frei gesetzt werden:

```text
aiStatus
aiConfidence
aiModelVersion
isListedForSwap
swapListingId
```

Warum:

- AI-Ergebnis soll vom Trusted Backend stammen.
- Swap-Verknüpfung soll nur durch einen validierten Listing-/Trade-Flow entstehen.
- ein Nutzer darf nicht durch direkten Firestore-Zugriff Systemzustände fälschen.

Firestore Rules prüfen diese Invarianten.

---

# 10. Löschen

Aktueller Client-Flow:

```text
Firestore-Dokument löschen
→ Storage-Datei best effort löschen
```

Wenn Storage Cleanup fehlschlägt, bleibt schlimmstenfalls eine verwaiste Datei statt eines sichtbaren Kleidungsstücks mit kaputtem Bild.

Später ergänzt das Trusted Backend einen Cleanup-/Maintenance-Job für verwaiste Dateien.

Für Accountlöschung wird ohnehin ein serverseitiger vollständiger Cleanup benötigt.

---

# 11. Item Editor

Der Editor unterstützt inzwischen zusätzlich:

- Name
- Farbe
- Marke
- Größe
- Material
- Kategorie
- Saison
- Zustand

Die Felder sind bewusst dieselben, die später für AI-Korrektur, Outfit-Ranking und OmniSwap relevant sind.

---

# 12. Security Tests

CI prüft mit Firebase Emulator Suite mindestens:

## Firestore

- Owner kann eigenes gültiges Wardrobe Item erstellen/lesen/ändern
- Fremder kann privates Item nicht lesen
- Fremder kann privates Item nicht ändern/löschen
- `ownerId` kann nicht transferiert werden
- `imagePath` kann nicht auf fremden Nutzer umgebogen werden
- Client kann AI-Zustand nicht fälschen
- Client kann Swap-Verknüpfung nicht fälschen
- aktive Marketplace Listings sind separat öffentlich lesbar
- SwapOffer / Transaction Writes bleiben server-only
- unbekannte Collections bleiben default-deny

## Storage

- Owner kann eigenes Kleidungsbild schreiben/lesen
- Fremder kann es nicht lesen/überschreiben
- Nicht-Bild-Dateien werden abgewiesen
- Avatar ist für eingeloggte Nutzer sichtbar
- anonyme Nutzer lesen Avatar nicht
- Public Listing Media kann nicht direkt vom Client geschrieben werden

---

# 13. Noch offene Wardrobe-Arbeit

Vor Status ✅ produktionsreif fehlen noch:

- [ ] echter Firebase-Dev-Account verbunden
- [ ] Android Upload real getestet
- [ ] iOS Upload real getestet
- [ ] Offline-/Reconnect-Verhalten validiert
- [ ] Upload-Fortschritt statt nur globalem Spinner
- [ ] Bildkompression/Resize vor Upload
- [ ] Retry / Cancel bei Upload
- [ ] Storage Rules Max-Size Test
- [ ] echte Firestore-Service-Integrationtests
- [ ] Pagination bei Bedarf
- [ ] Cloud Item Delete + Storage Cleanup real validiert
- [ ] Account-Cleanup im Trusted Backend

---

# 14. Nächster Block

Nach dem stabilen Cloud-Schrank:

```text
Wardrobe Image
→ Trusted AI Command
→ Vision Model
→ Schema Validation
→ Confidence
→ sichere Systemfeld-Aktualisierung
→ Nutzer bestätigt/korrigiert
```

Das ist die Grundlage für die echte KI-Kleidungsanalyse.
