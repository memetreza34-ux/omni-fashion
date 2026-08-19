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

Der Cloud-Pfad ist im Code produktionsorientiert vorbereitet:

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

Der technische Upload-Kern unterstützt inzwischen Fortschritt, Nutzerabbruch und gezielten Retry. Reale Android-/iOS-Device-Validierung bleibt davon getrennt offen.

---

# 2. Canonical WardrobeItem

Das aktuelle MVP-Schema enthält unter anderem:

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
aiFieldConfidence
aiModelVersion
aiPromptVersion
aiAnalyzedAt
aiErrorCode
isListedForSwap
swapListingId
createdAt
updatedAt
schemaVersion
```

Bestehende UI-Felder wie `category`, `color` und `season` bleiben bewusst erhalten. Das vorhandene Produkt wird schrittweise gehärtet statt durch einen unnötigen Big-Bang-Datenmodellwechsel ersetzt.

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
→ lokale Datei lesen
→ Größe / Content-Type validieren
→ resumable Firebase Storage Upload
→ Firestore WardrobeItem
→ imagePath als persistente Source of Truth
→ Download URL bei Laufzeit auflösen
```

Der kanonische Pfad lautet:

```text
users/{uid}/wardrobe/{itemId}/original.{extension}
```

`imageUrl` wird nur für die Anzeige im laufenden Client benutzt. Persistiert wird `imagePath`.

---

# 4. Resumable Upload

Der Cloud-Upload verwendet Firebase `uploadBytesResumable`.

Damit besitzt der Client einen echten Upload-Task statt eines blind abgewarteten One-shot-Uploads.

Aktueller Flow:

```text
lokale URI
→ expo/fetch + AbortSignal
→ Blob
→ UploadTask
→ state_changed
→ bytesTransferred / totalBytes
→ UI-Prozentwert
→ Upload abgeschlossen
→ Firestore Item erstellen
```

Die UI zeigt:

- echten Prozentwert
- semantischen Progressbar-State
- sichtbaren Fortschrittsbalken
- `Abbrechen`-Aktion
- blockierten Add-Button während eines laufenden Uploads

Der `WardrobeContext` erlaubt absichtlich nur einen aktiven Cloud-Upload gleichzeitig. Bei Owner-Wechsel bzw. Provider-Unmount wird ein aktiver Upload abgebrochen.

---

# 5. Cancel-Verhalten

Ein Nutzerabbruch läuft über einen `AbortController`.

```text
UI Abbrechen
→ AbortSignal
→ Firebase UploadTask.cancel()
→ stabiler App-Cancel-Fehler
→ kein falscher Fehlerdialog
```

Wenn ein Abort genau am Ende des Uploads eintrifft, versucht der Service die eventuell bereits geschriebene Storage-Datei wieder zu entfernen. Ein Abbruch darf kein erfolgreiches Firestore-Item erzeugen.

---

# 6. Retry- und Fehlerklassifizierung

Cloud-Uploadfehler werden nicht mehr alle mit derselben pauschalen Meldung behandelt.

Nicht automatisch retrybar:

```text
Bild >= 10 MB
leere Datei
lokale Datei nicht lesbar
nicht authentifiziert
Storage-Zugriff nicht erlaubt
Storage-Quota erschöpft
fehlende/falsche Bucket- oder Projektkonfiguration
Nutzerabbruch
```

Gezielt retrybar:

```text
storage/retry-limit-exceeded
storage/invalid-checksum
storage/server-file-wrong-size
storage/cannot-slice-blob
storage/unknown
unbekannter transienter Transferfehler
```

Bei retrybaren Fehlern kann der Nutzer `Erneut versuchen` wählen. Derselbe lokale URI-/Source-Kontext wird erneut in den normalen Upload-Flow gegeben. Nicht retrybare Fehler erhalten eine konkrete Meldung statt einer sinnlosen Retry-Schleife.

---

# 7. Upload-Regeln / Defense in Depth

Client und Storage Rules schützen dieselbe Grenze:

- nur Bild-Dateitypen
- kleiner als 10 MB
- Storage-Pfad gehört zum angemeldeten Nutzer
- fremde Nutzer dürfen private Wardrobe-Bilder weder lesen noch überschreiben
- Public Listing Media ist clientseitig schreibgeschützt

Client:

```text
blob.size < 10 MB
```

Storage Rules:

```text
request.resource.size < 10 * 1024 * 1024
request.resource.contentType.matches('image/.*')
```

Die Security-Emulator-Suite prüft inzwischen auch die harte Grenze: Ein Bild mit exakt 10 MB muss abgewiesen werden.

---

# 8. Firestore Service

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

Ein neues Cloud-Item wird erst nach erfolgreich bestätigtem Storage-Upload erstellt. Wenn die Firestore-Erstellung danach scheitert, versucht der Client die bereits hochgeladene Datei wieder zu löschen.

---

# 9. Cloud Query

Aktuell:

```text
wardrobeItems
where ownerId == currentUser.uid
```

Sortierung nach `createdAt` erfolgt derzeit clientseitig.

Für den ersten MVP vermeiden wir einen unnötigen Composite Index nur für die Sortierung einer privaten Wardrobe-Liste. Pagination wird erst ergänzt, wenn reale Nutzungsdaten bzw. große Wardrobes sie rechtfertigen.

---

# 10. Development-Fallback

Solange noch keine echten Firebase-Projektwerte im Environment vorhanden sind, bleibt der Development-Demo-Pfad benutzbar.

```text
Echter Firebase User
→ Cloud Wardrobe

Development Demo User
→ AsyncStorage
```

Der lokale Speicher verwendet das migrierte V2-Schema. Production darf nicht auf diesen Demo-Pfad zurückfallen.

---

# 11. Echte AI nach erfolgreichem Cloud-Upload

Der ursprüngliche Fake-Timer ist entfernt.

Der reale Cloud-Flow lautet inzwischen:

```text
Storage Upload erfolgreich
→ Firestore WardrobeItem
→ Trusted analyzeWardrobeItem Command
→ pending
→ Structured AI Result
→ completed oder failed
```

Der lokale Development-Demo-Pfad simuliert keine KI.

Ein Fehler der automatischen AI-Analyse zerstört das erfolgreich gespeicherte Kleidungsstück nicht. Das Item bleibt im Wardrobe und kann über den realen Analysepfad erneut analysiert werden.

Geschützte AI-Systemfelder werden nicht direkt vom normalen Client frei geschrieben.

---

# 12. Geschützte Systemfelder

Folgende Felder dürfen nicht von einem manipulierten normalen Client frei gesetzt werden:

```text
aiStatus
aiConfidence
aiFieldConfidence
aiModelVersion
aiPromptVersion
aiAnalyzedAt
aiErrorCode
isListedForSwap
swapListingId
```

Warum:

- AI-Ergebnisse stammen vom Trusted Backend.
- Swap-Verknüpfungen entstehen ausschließlich über validierte Listing-/Trade-Flows.
- direkter Firestore-Zugriff darf Systemzustände nicht fälschen.

Firestore Rules prüfen diese Invarianten.

---

# 13. Löschen

Aktueller Client-Flow:

```text
Firestore-Dokument löschen
→ Storage-Datei best effort löschen
```

Wenn Storage Cleanup fehlschlägt, bleibt schlimmstenfalls eine verwaiste private Datei statt eines sichtbaren Kleidungsstücks mit kaputtem Bild.

Für Accountlöschung existiert zusätzlich ein serverseitiger Cleanup-Lifecycle. Ein späterer Maintenance-Job kann allgemeine verwaiste Dateien zusätzlich bereinigen.

---

# 14. Item Editor

Der Editor unterstützt unter anderem:

- Name
- Farbe
- Marke
- Größe
- Material
- Kategorie
- Saison
- Zustand

Diese Felder werden gemeinsam von AI-Korrektur, Outfit-Ranking und OmniSwap genutzt.

---

# 15. Security Tests

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
- Bilder an der 10-MB-Grenze werden abgewiesen
- Avatar ist für eingeloggte Nutzer sichtbar
- anonyme Nutzer lesen Avatar nicht
- Public Listing Media kann nicht direkt vom Client geschrieben werden

---

# 16. Noch offene Wardrobe-Arbeit

Vor echter Production-Freigabe fehlen weiterhin reale Infrastruktur-/Device-Schritte:

- [ ] echter Firebase-Dev-Account verbunden
- [ ] Android Upload real getestet
- [ ] iOS Upload real getestet
- [ ] Offline-/Reconnect-Verhalten validiert
- [x] echter Upload-Fortschritt
- [x] Nutzer-Cancel
- [x] gezielter Retry + Fehlerklassifizierung
- [x] Storage Rules Max-Size Regression
- [ ] Bildkompression/Resize vor Upload
- [ ] HEIC/HEIF auf echten Geräten validiert
- [ ] echte Firestore-Service-Integration gegen Dev-Projekt
- [ ] Pagination bei realem Bedarf
- [ ] Cloud Item Delete + Storage Cleanup real validiert
- [ ] Account-Cleanup gegen reales Dev-Projekt validiert

---

# 17. Nächster interner Wardrobe-Block

Ohne reales Firebase-/Device-Setup ist der nächste sinnvolle interne Schritt:

```text
lokales Picker-Bild
→ sichere Dimensionen bestimmen
→ Resize / Kompression
→ Upload-Blob unter kontrollierter Größe
→ bestehender resumable Upload
```

Danach müssen Kamera, Galerie, HEIC/HEIF, langsame Verbindung, Cancel und Reconnect auf echten Android-/iOS-Builds validiert werden.
