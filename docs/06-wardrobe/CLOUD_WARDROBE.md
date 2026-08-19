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
src/features/wardrobe/services/wardrobe-command-service.ts
src/features/wardrobe/services/wardrobe-image-preparation-service.ts
src/features/wardrobe/services/wardrobe-storage-service.ts
src/features/wardrobe/services/local-wardrobe-service.ts
src/context/WardrobeContext.tsx
src/app/index.tsx
src/components/ItemDetailsModal.tsx
functions/src/callables/delete-wardrobe-item.ts
functions/src/wardrobe/delete-policy.ts
functions/src/maintenance/wardrobe-storage-cleanup.ts
```

Security:

```text
firestore.rules
storage.rules
tests/security/firestore.rules.integration.mjs
tests/security/storage.rules.integration.mjs
functions/test/wardrobe-delete-policy.test.mjs
```

Der technische Upload-Kern unterstützt lokale Bildaufbereitung, Fortschritt, Nutzerabbruch und gezielten Retry. Destruktive Cloud-Löschungen laufen über einen Trusted-Backend-Command mit Recovery-Auftrag. Reale Android-/iOS-/Firebase-Dev-Validierung bleibt davon getrennt offen.

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
→ lokale URI + width/height
→ expo-image-manipulator
→ längste Seite maximal 2048 px
→ JPEG mit kontrollierter Kompression
→ lokale vorbereitete Cache-Datei
→ expo/fetch + Blob-Validierung
→ resumable Firebase Storage Upload
→ Firestore WardrobeItem
→ imagePath als persistente Source of Truth
→ Download URL bei Laufzeit auflösen
```

Kleine Bilder werden nicht hochskaliert. Auch HEIC/HEIF-Quellen werden vor dem Cloud-Upload in einen kontrollierten JPEG-Pfad überführt; das reale Verhalten auf Android/iOS muss trotzdem auf Geräten validiert werden.

Der kanonische Storage-Pfad lautet:

```text
users/{uid}/wardrobe/{itemId}/original.{extension}
```

`imageUrl` wird nur für die Anzeige im laufenden Client benutzt. Persistiert wird `imagePath`.

---

# 4. Lokale Bildaufbereitung

`wardrobe-image-preparation-service.ts` kapselt die Vorverarbeitung.

Aktuelle Regeln:

```text
maximale lange Seite: 2048 px
keine Hochskalierung
Ausgabeformat: JPEG
Kompressionsfaktor: 0.82
```

Die vom Expo Image Picker gelieferten Dimensionen werden in `CreateWardrobeItemInput` bis zum Preparation Service weitergereicht. Fehlende oder ungültige Dimensionen blockieren den Flow nicht; in diesem Fall wird nicht dimensionsbasiert verkleinert, aber weiterhin kontrolliert als JPEG gespeichert.

Ein Vorbereitungsfehler erhält den stabilen App-Fehlercode:

```text
WARDROBE_IMAGE_PREPARATION_FAILED
```

Er wird nicht als transienter Netzwerkfehler behandelt und startet keine sinnlose Retry-Schleife mit demselben nicht dekodierbaren Bild.

---

# 5. Resumable Upload

Der Cloud-Upload verwendet Firebase `uploadBytesResumable`.

```text
vorbereitete lokale URI
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

# 6. Cancel-Verhalten

Ein Nutzerabbruch läuft über einen `AbortController`.

```text
UI Abbrechen
→ AbortSignal
→ Preparation stoppt an der nächsten sicheren Grenze
→ Firebase UploadTask.cancel(), falls Transfer bereits läuft
→ stabiler App-Cancel-Fehler
→ kein falscher Fehlerdialog
```

Wenn ein Abort genau am Ende des Uploads eintrifft, versucht der Service die eventuell bereits geschriebene Storage-Datei wieder zu entfernen. Ein Abbruch darf kein erfolgreiches Firestore-Item erzeugen.

---

# 7. Retry- und Fehlerklassifizierung

Nicht automatisch retrybar:

```text
Bildvorbereitung fehlgeschlagen
Bild >= 10 MB nach Vorbereitung
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

Bei retrybaren Fehlern kann der Nutzer `Erneut versuchen` wählen. Derselbe Picker-Asset-Kontext inklusive URI und Dimensionen wird erneut durch Preparation und Upload gegeben.

---

# 8. Upload-Regeln / Defense in Depth

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

Die Security-Emulator-Suite prüft auch die harte Grenze: Ein Bild mit exakt 10 MB muss abgewiesen werden.

---

# 9. Firestore / Command Services

Normale Reads und nicht-kritische User-Metadatenänderungen bleiben hinter einem zentralen Firestore-Service.

```text
createWardrobeItemId()
subscribeToWardrobe(ownerId)
createCloudWardrobeItem(...)
updateCloudWardrobeItem(...)
```

Destruktive Cloud-Löschung ist dagegen ein Trusted Command:

```text
deleteCloudWardrobeItem(...)
→ requestCloudWardrobeItemDelete(...)
→ Callable deleteWardrobeItem
```

Ein neues Cloud-Item wird erst nach erfolgreich bestätigtem Storage-Upload erstellt. Wenn die Firestore-Erstellung danach scheitert, versucht der Client die bereits hochgeladene, noch keinem persistenten Item zugeordnete Datei wieder zu löschen.

---

# 10. Cloud Query

Aktuell:

```text
wardrobeItems
where ownerId == currentUser.uid
```

Sortierung nach `createdAt` erfolgt derzeit clientseitig. Pagination wird erst ergänzt, wenn reale Nutzungsdaten bzw. große Wardrobes sie rechtfertigen.

---

# 11. Development-Fallback

```text
Echter Firebase User
→ Cloud Wardrobe

Development Demo User
→ AsyncStorage
```

Der lokale Speicher verwendet das migrierte V2-Schema. Production darf nicht auf diesen Demo-Pfad zurückfallen.

---

# 12. Echte AI nach erfolgreichem Cloud-Upload

```text
Storage Upload erfolgreich
→ Firestore WardrobeItem
→ Trusted analyzeWardrobeItem Command
→ pending
→ Structured AI Result
→ completed oder failed
```

Der lokale Development-Demo-Pfad simuliert keine KI. Ein AI-Fehler zerstört das erfolgreich gespeicherte Kleidungsstück nicht.

---

# 13. Geschützte Systemfelder

Normale Clients dürfen diese Felder nicht frei setzen:

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

Firestore Rules prüfen diese Invarianten.

---

# 14. Trusted Cloud Delete

Direkte Client-Löschung von `wardrobeItems` ist vollständig gesperrt:

```text
allow delete: if false
```

Der normale App-Flow ruft `deleteWardrobeItem` als Callable auf.

Der Backend-Command prüft:

```text
Auth
→ Owner
→ Item-ID
→ isListedForSwap / swapListingId
→ swapLocks/{itemId}
→ aktive SwapTransactions, in denen das Item referenziert wird
→ privater imagePath muss exakt unter users/{ownerId}/wardrobe/{itemId}/ liegen
```

Als aktive Trade-Zustände gelten auch `disputed` und alle nicht-terminalen Zustände. Nur `completed` und `cancelled` blockieren die spätere Löschung nicht mehr.

Damit kann weder der normale Client noch ein manipulierter Client ein Kleidungsstück während eines aktiven OmniSwap-Vorgangs aus dem Wardrobe entfernen.

---

# 15. Delete + Storage Recovery

Firestore und Cloud Storage besitzen keine gemeinsame atomare Transaktion. Der Backend-Flow verwendet deshalb einen recoverbaren Zwei-Phasen-Ansatz:

```text
Firestore Transaction
→ Item + Lock erneut lesen
→ Policy prüfen
→ server-only wardrobeStorageCleanupTask schreiben
→ WardrobeItem löschen
→ Commit

anschließend
→ private Storage-Datei sofort idempotent löschen
→ bei Erfolg Cleanup-Task löschen
→ bei Fehler Task = retry
```

Ein Scheduler verarbeitet `pending/retry` Cleanup-Aufträge erneut. Unsichere oder inkonsistente Pfade werden nicht blind gelöscht, sondern als `needs_review` markiert.

Der Client führt nach erfolgreichem Trusted Command keinen zweiten direkten Storage-Delete mehr aus.

---

# 16. Item Editor

Der Editor unterstützt unter anderem Name, Farbe, Marke, Größe, Material, Kategorie, Saison und Zustand. Diese Felder werden gemeinsam von AI-Korrektur, Outfit-Ranking und OmniSwap genutzt.

---

# 17. Security / Unit Tests

## Firestore Emulator

- Owner kann eigenes gültiges Wardrobe Item erstellen/lesen/ändern
- Fremder kann privates Item nicht lesen oder verändern
- **auch der Owner kann das Dokument nicht direkt löschen**
- `ownerId` und `imagePath` können nicht manipuliert transferiert werden
- Client kann AI-/Swap-Systemfelder nicht fälschen
- unbekannte Collections bleiben default-deny

## Storage Emulator

- Owner kann eigenes Kleidungsbild schreiben/lesen
- Fremder kann es nicht lesen/überschreiben
- Nicht-Bild-Dateien werden abgewiesen
- Bilder an der 10-MB-Grenze werden abgewiesen
- Public Listing Media kann nicht direkt vom Client geschrieben werden

## Functions Unit Test

`wardrobe-delete-policy.test.mjs` deckt die deterministische Delete-Policy ab:

- erlaubtes eigenes Item
- Fremdeigentum
- Listing / Lock / aktiver Trade
- sichere vs. fremde/abweichende Storage-Pfade
- terminale vs. aktive Trade-Status

---

# 18. Noch offene Wardrobe-Arbeit

Vor echter Production-Freigabe fehlen weiterhin reale Infrastruktur-/Device-Schritte:

- [ ] echter Firebase-Dev-Account verbunden
- [ ] Android Upload real getestet
- [ ] iOS Upload real getestet
- [ ] Offline-/Reconnect-Verhalten validiert
- [x] echter Upload-Fortschritt
- [x] Nutzer-Cancel
- [x] gezielter Retry + Fehlerklassifizierung
- [x] Storage Rules Max-Size Regression
- [x] Bildkompression/Resize vor Upload
- [ ] HEIC/HEIF auf echten Geräten validiert
- [ ] echte Firestore-/Callable-Integration gegen Dev-Projekt
- [ ] Pagination bei realem Bedarf
- [x] Trusted Cloud Item Delete + recoverbarer Storage Cleanup
- [ ] Cloud Item Delete + Storage Cleanup real validiert
- [ ] Account-Cleanup gegen reales Dev-Projekt validiert

---

# 19. Nächster sinnvoller Wardrobe-Schritt

Der intern implementierbare Wardrobe-Core ist weitgehend geschlossen. Der nächste belastbare Fortschritt ist reale Integration:

```text
Firebase Dev
→ Rules + Functions deployen
→ echtes Konto
→ Kamera/Galerie Android + iOS
→ HEIC/HEIF
→ langsamer Upload + Cancel + Retry
→ Offline/Reconnect
→ Trusted Delete + Cleanup Worker
→ Zwei-Geräte/OmniSwap Regression
```

Solange diese Infrastruktur fehlt, werden keine Device-/Cloud-Ergebnisse als erledigt markiert.
