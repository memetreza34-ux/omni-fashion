# Omni Fashion – KI-Kleidungsanalyse

## Ziel

Ein hochgeladenes Kleidungsfoto soll nicht durch einen Fake-Timer, sondern durch einen nachvollziehbaren, sicheren und austauschbaren Analyseprozess in strukturierte Wardrobe-Daten überführt werden.

Die KI ist dabei **kein eigener Datenbestand**. Sie reichert das zentrale `WardrobeItem` an.

```text
WardrobeItem
→ Analyse anfordern
→ Trusted Backend
→ Vision Provider
→ validiertes Ergebnis
→ WardrobeItem aktualisieren
→ Nutzer prüft/korrigiert
```

---

# 1. Sicherheitsgrenze

## Client darf

- eine Analyse für ein eigenes Wardrobe Item anfordern
- den aktuellen Analysezustand lesen
- normale editierbare Kleidungsfelder später selbst korrigieren

## Client darf NICHT

- AI Provider Secrets besitzen
- direkt ein Vision-Modell mit geheimem API-Key aufrufen
- `aiStatus = completed` setzen
- Confidence erfinden
- Modell-/Prompt-Version erfinden
- Analysezeitpunkt fälschen
- fremde Wardrobe Items analysieren

Diese Systemfelder sind deshalb bereits über Firestore Rules clientseitig gesperrt:

```text
aiStatus
aiConfidence
aiModelVersion
aiPromptVersion
aiAnalyzedAt
aiErrorCode
```

---

# 2. Client Contract

Aktueller Code:

```text
src/features/ai/garment-analysis/types.ts
src/features/ai/garment-analysis/parse-response.ts
src/features/ai/garment-analysis/garment-analysis-service.ts
```

Request:

```text
analyzeWardrobeItem({
  wardrobeItemId,
  schemaVersion: 1
})
```

Transport:

```text
Firebase callable Function
```

Die App bekommt keine provider-spezifische Antwort zurück.

---

# 3. Ergebnis-Schema

Analyseergebnis:

```text
category
subcategory
color
secondaryColors[]
brand
material
season
styleTags[]
confidence
fieldConfidence
modelVersion
promptVersion
schemaVersion
```

`fieldConfidence` enthält getrennte Zuverlässigkeiten für:

```text
category
subcategory
color
brand
material
season
styleTags
```

Warum getrennte Confidence?

Eine KI kann z. B. sehr sicher erkennen:

```text
Kategorie = Jacke
Farbe = Schwarz
```

aber gleichzeitig unsicher sein bei:

```text
Marke = ?
Material = Leder?
```

Ein einziger Gesamtscore reicht deshalb nicht.

---

# 4. Runtime Validation im Client

Die Antwort wird niemals direkt als vertrauenswürdiger TypeScript-Typ behandelt.

Aktueller Parser prüft unter anderem:

- Objektform
- erlaubte Kategorien
- erlaubte Saisonwerte
- String-Längen
- maximale Array-Längen
- Confidence zwischen 0 und 1
- exakte Schema-Version
- Request- und Response-Item-ID müssen übereinstimmen

Damit führt eine kaputte oder veraltete Backend-Antwort nicht still zu falschen App-Daten.

---

# 5. Trusted Backend – Zieltechnologie

Für den aktuellen Stack ist vorgesehen:

```text
Firebase Cloud Functions 2nd Gen
TypeScript
Node.js 22
```

Grund:

- vorhandene Firebase-Architektur
- Auth-Kontext kann serverseitig geprüft werden
- Firestore/Storage Admin-Zugriff
- Callable Functions passen zum Client-Contract
- AI Secrets bleiben serverseitig
- Trade-/Notification-/Account-Cleanup-Commands können später dieselbe Trusted-Backend-Schicht nutzen

Die endgültige Functions-Region wird mit dem realen Firebase-Projekt festgelegt.

Der Client besitzt aktuell den konfigurierbaren Wert:

```text
EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION
```

Provisorischer EU-Default:

```text
europe-west1
```

Dieser Default ist noch keine endgültige Produktionsentscheidung.

---

# 6. `analyzeWardrobeItem` – vollständiger Serverablauf

Die Function soll später exakt folgende Schritte abarbeiten:

```text
1. Callable Request empfangen
2. Auth vorhanden?
3. Request-Schema validieren
4. Wardrobe Item laden
5. Item existiert?
6. ownerId == auth.uid?
7. imagePath vorhanden und zum Nutzer gehörig?
8. laufende/zu frische Analyse erkennen
9. aiStatus serverseitig auf pending setzen
10. Bild sicher aus Storage lesen
11. Dateityp/Größe nochmals serverseitig validieren
12. AI Provider Adapter aufrufen
13. Provider-Output als unknown behandeln
14. Server-Schema validieren
15. Normalisierung / erlaubte Werte
16. Confidence berechnen/übernehmen
17. Ergebnis + Modell-/Prompt-Version speichern
18. aiStatus = completed
19. aiAnalyzedAt = Server Timestamp
20. Response an Client
```

Fehlerpfad:

```text
Provider/Validation/Timeout Fehler
→ aiStatus = failed
→ aiErrorCode = interner stabiler Fehlercode
→ keine Provider-Secrets/Raw-Fehler an Client
→ Retry später möglich
```

---

# 7. Idempotenz / Doppelklick

Ein Nutzer kann mehrfach auf „Analysieren“ tippen oder das Netzwerk kann Requests wiederholen.

Deshalb darf die Function nicht blind mehrfach teure Modellaufrufe starten.

Geplantes Verhalten:

```text
completed + gleiche Bildversion + aktuelle Analyseversion
→ vorhandenes Resultat zurückgeben

pending + noch innerhalb Timeout-Fenster
→ keinen zweiten Modellaufruf starten

failed / veraltete Version
→ kontrollierter Retry erlaubt
```

Später kann zusätzlich eine `imageRevision` oder ein Hash eingeführt werden, wenn Nutzer das Bild ersetzen dürfen.

---

# 8. Provider-Abstraktion

Omni Fashion soll nicht an einen einzelnen KI-Anbieter gekoppelt sein.

Zielinterface serverseitig:

```text
GarmentVisionProvider
  analyze(input)
  → ProviderGarmentResult
```

Mögliche Implementierungen können später ausgetauscht werden, ohne Client und Firestore-Modell neu zu schreiben.

Regel:

```text
Provider Response
≠ App Domain Response
```

Dazwischen liegt immer:

```text
Provider Adapter
→ Validation
→ Normalization
→ Omni Fashion Domain Result
```

---

# 9. Prompt-Versionierung

Jede produktive Analyse erhält eine Prompt-Version, z. B.:

```text
garment-v1
```

Wenn sich die Instruktion ändert:

```text
garment-v2
```

Warum?

Sonst können wir später nicht unterscheiden, ob Qualitätsunterschiede durch:

- Modellwechsel
- Promptwechsel
- Bildqualität
- Nutzerkorrektur

entstanden sind.

Gespeichert werden deshalb:

```text
aiModelVersion
aiPromptVersion
aiAnalyzedAt
```

---

# 10. Nutzerkorrektur

KI-Ausgabe ist ein Vorschlag, keine unumstößliche Wahrheit.

Ziel-UX:

```text
Analyse abgeschlossen
→ erkannte Daten im Kleidungsstück anzeigen
→ unsichere Felder kennzeichnen
→ Nutzer bestätigt oder korrigiert
→ korrigierte Domain-Daten speichern
```

Nutzerkorrekturen sind später wertvolles Qualitätsfeedback, dürfen aber nicht still als neues „KI-Ergebnis“ ausgegeben werden.

Langfristig unterscheiden wir daher bei Bedarf:

```text
AI prediction
User-confirmed value
```

Für MVP reicht zunächst, dass der Nutzer die normalen Wardrobe-Felder bearbeiten kann, während die AI-Metadaten unverändert nachvollziehbar bleiben.

---

# 11. Confidence-Regeln

Vor Produktionsstart werden Schwellen anhand echter Tests festgelegt.

Nicht willkürlich jetzt behaupten:

```text
0.8 = immer richtig
```

Geplante Logik:

```text
hohe Confidence
→ normal vorausfüllen

mittlere Confidence
→ vorausfüllen + Nutzer zur Prüfung auffordern

niedrige Confidence
→ Feld leer/unsicher lassen statt halluzinieren
```

Marke ist besonders konservativ zu behandeln.

Wenn keine zuverlässige Marke erkennbar ist:

```text
brand = null
```

statt eine Marke zu erfinden.

---

# 12. Kostenkontrolle

Pro Analyse sollen später mindestens gemessen werden:

```text
provider
modelVersion
latencyMs
success/failure
retry count
```

Serverseitig zusätzlich intern:

```text
Input-/Output-Kosten bzw. provider-spezifische Usage
```

Produktmetriken:

```text
Kosten pro Wardrobe Upload
Kosten pro erfolgreicher Analyse
Analyse-Fehlerrate
Nutzer-Korrekturrate pro Feld
```

Kein unbegrenzter Retry-Loop.

---

# 13. Timeout / Retry

Der Client bekommt einen stabilen Zustand, nicht einen endlosen Spinner.

Zielzustände:

```text
not_requested
pending
completed
failed
```

Mögliche interne Fehlercodes:

```text
IMAGE_NOT_FOUND
IMAGE_INVALID
RATE_LIMITED
PROVIDER_TIMEOUT
PROVIDER_UNAVAILABLE
INVALID_PROVIDER_OUTPUT
UNSUPPORTED_SCHEMA
INTERNAL_ERROR
```

Raw Provider-Fehlermeldungen und Secrets werden nicht in Firestore oder dem Client angezeigt.

---

# 14. Moderation / ungeeignete Bilder

Die Funktion darf nicht davon ausgehen, dass jeder Upload wirklich ein Kleidungsstück zeigt.

Vor bzw. während der Analyse muss geprüft werden:

```text
ist ein analysierbares Kleidungsstück erkennbar?
```

Wenn nein:

```text
failed
aiErrorCode = IMAGE_NOT_GARMENT
```

Später kann bei Marketplace-Listing zusätzlich eine getrennte Content-/Safety-Prüfung erforderlich sein.

---

# 15. Teststrategie

## Unit

- Response Parser
- Enum Validation
- Confidence Bounds
- String/Array Limits
- Schema Versions
- Error Mapping

## Backend Unit/Integration

- unauthenticated denied
- falscher Owner denied
- fehlendes Item
- fehlendes Bild
- bereits pending
- idempotentes completed result
- valid Provider Output
- invalid Provider Output
- Provider Timeout
- Firestore completed update
- Firestore failed update

## E2E später

```text
Foto hinzufügen
→ Cloud Upload
→ Analyse starten
→ pending sehen
→ completed sehen
→ erkannte Daten anzeigen
→ Nutzer korrigiert Feld
→ Änderung bleibt gespeichert
```

---

# 16. AI Evaluation Dataset

Vor einer Aussage wie „unsere KI erkennt Kleidung sehr gut“ brauchen wir ein reproduzierbares Testset.

Später anlegen:

```text
tests/fixtures/garments/
```

mit bewusst unterschiedlichen:

- Kategorien
- Farben
- Materialien
- Mustern
- Marken sichtbar/nicht sichtbar
- Hintergründen
- Lichtbedingungen
- Fotoqualitäten

Bewertung pro Feld statt nur „Gesamtergebnis richtig/falsch“.

---

# 17. Was aktuell bereits implementiert ist

- [x] Fake-AI-Timer aus Wardrobe entfernt
- [x] AI-Status im zentralen Wardrobe-Modell
- [x] AI-Confidence
- [x] Modell-Version
- [x] Prompt-Version
- [x] Analysezeitpunkt
- [x] stabiler Fehlercode
- [x] AI-Systemfelder durch Client-Rules geschützt
- [x] Callable-Client-Service vorbereitet
- [x] Request-/Response-Contract
- [x] Runtime Response Validation
- [x] Functions-Region konfigurierbar
- [x] Security Tests gegen Client-Fälschung

---

# 18. Noch offen

- [ ] echtes Functions-Paket mit reproduzierbarem Lockfile
- [ ] `analyzeWardrobeItem` Cloud Function
- [ ] Provider Adapter Interface
- [ ] ersten Vision Provider auswählen
- [ ] Server-Schema Validator
- [ ] Secret Management
- [ ] Rate Limits / Abuse Schutz
- [ ] Timeout / Retry
- [ ] Idempotenz
- [ ] Kosten-/Latenztelemetrie
- [ ] AI Unit Tests
- [ ] Backend Emulator Tests
- [ ] echte Bildanalyse mit Dev-Firebase
- [ ] UI für Analysezustände / Retry
- [ ] Nutzerkorrektur UX für unsichere Felder
- [ ] Evaluation Dataset

---

# Definition of Done

Phase KI-Kleidungsanalyse ist erst ✅, wenn:

- ein echter angemeldeter Nutzer ein eigenes Cloud-Wardrobe-Item analysieren kann
- kein fremdes Item analysiert werden kann
- kein AI Secret im Expo Client liegt
- Provider-Ausgabe serverseitig validiert wird
- schlechte/ungültige Bilder einen verständlichen Fehlerzustand erzeugen
- AI-Systemfelder nur vom Trusted Backend geändert werden
- Modell/Prompt/Schema nachvollziehbar versioniert sind
- Retry nicht doppelte unkontrollierte Kosten erzeugt
- mindestens ein reproduzierbares Evaluation-/Integration-Testset vorhanden ist
- Android/iOS End-to-End-Flow mit echtem Dev-Backend geprüft wurde
