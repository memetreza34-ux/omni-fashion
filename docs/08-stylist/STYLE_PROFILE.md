# Omni Fashion – StyleProfile / Style-DNA

## Ziel

Style-DNA ist kein zufälliger KI-Name, sondern ein persistentes Profil aus:

```text
expliziten Nutzerpräferenzen
+ echtem Kleiderschrank
+ KI-erkannten Wardrobe-Tags
+ späterem Outfit-Feedback
```

Der Archetyp ist nur eine verständliche Darstellung. Die eigentlichen Ranking-Daten bleiben strukturiert.

## Aktueller produktiver MVP-Pfad

```text
Profil öffnen
→ Stilrichtungen wählen
→ Lieblings-/Avoid-Farben
→ Passform
→ Casual/Formal
→ Minimal/Bold
→ Wardrobe-Signale ableiten
→ StyleProfile speichern
→ Summary + Wardrobe Intelligence anzeigen
```

## Canonical Model

`styleProfiles/{uid}` enthält:

- userId
- questionnaire
  - preferredStyles[]
  - preferredColors[]
  - avoidedColors[]
  - fitPreferences[]
  - formalVsCasual 0..1
  - minimalVsBold 0..1
  - questionnaireVersion
- wardrobeSignals
  - dominantCategories[]
  - dominantColors[]
  - dominantStyleTags[]
  - analyzedItemCount
  - totalItemCount
- summary
  - title
  - archetype
  - description
  - topStyles[]
- createdAt
- updatedAt
- schemaVersion

## Gewichtung

Explizite Nutzerwahl ist stärker als automatisch erkannte Tags.

Aktuell:

```text
gewählte Stilrichtung = starkes Signal
Wardrobe Style Tag    = ergänzendes Signal
Minimal/Bold-Achse    = leichtes Signal
Casual/Formal-Achse   = leichtes Signal
```

Das verhindert, dass ein einzelnes falsch erkanntes Kleidungsstück die komplette Style-DNA überschreibt.

## Wardrobe Refresh

Wenn sich:

- Anzahl Items
- analysierte Items
- dominante Farben
- dominante Style-Tags

ändern, wird `wardrobeNeedsRefresh` gesetzt.

Der Nutzer kann dann den Schrank neu auswerten. Seine eigenen Präferenzen bleiben unverändert.

## Development / Production

```text
echter Firebase User
→ Firestore styleProfiles/{uid}

Development Demo User
→ AsyncStorage Fallback
```

Beide Pfade benutzen denselben Runtime-Validator.

## Security

Security Rules prüfen:

- Owner-only Read/Create/Update/Delete
- Dokument-ID muss Nutzer-ID entsprechen
- erlaubte Style-/Color-/Fit-Werte
- Achsen nur 0..1
- Signalgrößen
- analyzedItemCount <= totalItemCount
- unveränderliche userId
- unveränderliche createdAt bei Update

Automatisierte Emulator-Tests prüfen diese Invarianten.

## Bewusst entfernt

Der alte Flow:

```text
Foto/Video wählen
→ 3 Sekunden warten
→ zufälliges Dummy-Profil
```

ist entfernt.

Auch ein vermeintlicher 3D-Avatar wird nicht als fertige Funktion dargestellt.

## Später

Foto-/Video-Style-Analyse kann später als **zusätzliches Signal** ergänzt werden, wenn sie real implementiert und evaluiert ist.

Weitere spätere Signale:

- Outfit gespeichert
- Outfit verworfen
- Outfit getragen
- häufig genutzte Kleidungsstücke
- bewusst vermiedene Kombinationen

## Definition of Done für diesen MVP-Block

- [x] strukturiertes StyleProfile Domain Model
- [x] deterministische StyleProfile Engine
- [x] Cloud Service
- [x] lokaler Development-Fallback
- [x] gemeinsamer Runtime Validator
- [x] Context mit Wardrobe-Integration
- [x] echte Profil-UI statt Zufallsscan
- [x] Wardrobe Intelligence
- [x] Security Rules
- [x] Emulator Security Tests
- [x] TypeScript / Zero-any / Security CI grün
- [ ] echtes Firebase-Dev-Projekt real testen
- [ ] Outfit-Feedback als Signal ergänzen
