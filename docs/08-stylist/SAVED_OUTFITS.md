# Omni Fashion – Gespeicherte Outfits & Feedback

## Ziel

Ein Outfit darf nicht nur für eine Sekunde auf dem Stylist-Screen existieren.

Gespeicherte Outfits liefern drei wichtige Produktwerte:

1. Nutzer finden gute Kombinationen wieder.
2. Omni Fashion lernt aus echtem Feedback.
3. Spätere Style-DNA-/Ranking-Versionen können gegen reales Verhalten ausgewertet werden.

## Datenmodell

`outfits/{id}`:

```text
ownerId
itemIds[]
occasion
season
score
scoreBreakdown
reasons[]
feedback
createdAt
updatedAt
schemaVersion
```

## Feedback

Aktuelle Werte:

```text
none
liked
disliked
worn
```

`worn` ist langfristig besonders wertvoll, weil es stärker ist als ein reines Like: Der Nutzer hat die Kombination tatsächlich verwendet.

## Source of Truth

Ein gespeichertes Outfit dupliziert keine Kleidungsstücke.

```text
SavedOutfit
→ itemIds[]
→ WardrobeItem
```

Wenn ein Kleidungsstück später gelöscht wird, bleibt das gespeicherte Outfit historisch vorhanden, kann aber anzeigen, dass ein Teil fehlt.

## Cloud / Development

```text
echter Firebase User
→ Firestore outfits/{id}

Development Demo User
→ AsyncStorage
```

## Security

Der Nutzer darf nur eigene Outfits lesen/erstellen/ändern/löschen.

Nach Erstellung sind folgende Felder unveränderlich:

- itemIds
- occasion
- season
- score
- scoreBreakdown
- reasons
- createdAt
- schemaVersion

Änderbar bleibt im normalen Client nur:

- feedback
- updatedAt

Damit kann ein manipulierter Client nicht im Nachhinein seine ursprüngliche Empfehlungsbewertung umschreiben.

## Produktfluss

```text
Stylist Recommendation
→ Outfit speichern
→ Saved Outfit
→ Like / Dislike / Worn
→ später Ranking-/StyleProfile-Signal
```

## Aktuelle Grenzen

Noch offen:

- Feedback fließt noch nicht automatisch zurück in den Ranking-Score.
- Outfit-Historie besitzt noch keine Kalender-/Wear-Logik.
- Item-Löschung erzeugt noch keinen Cleanup-Workflow.
- Saved Outfit Sharing ist kein MVP-Ziel.

## Definition of Done

- [x] SavedOutfit Domain Model
- [x] Firestore Service
- [x] Development-Fallback
- [x] Context
- [x] Duplicate Combination Guard
- [x] Feedbackwerte
- [x] Saved-Outfits UI
- [x] Delete
- [x] Firestore Security Rules geplant/angebunden
- [x] Emulator-Testdatei
- [ ] finalen gemeinsamen CI-Lauf bestätigen
- [ ] Feedback in Ranking lernen lassen
