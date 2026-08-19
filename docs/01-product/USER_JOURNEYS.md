# Omni Fashion – Core User Journeys

Diese Datei beschreibt nicht nur Screens, sondern vollständige Abläufe inklusive Daten, Fehlerfällen, Sicherheit und Abnahmekriterien.

---

# Journey 1 – Erster Start und Account

## Nutzerziel

Ein neuer Nutzer will Omni Fashion öffnen, ein Konto anlegen und schnell zum ersten echten Nutzen kommen.

## Happy Path

```text
App öffnen
→ kurze Value Proposition
→ Registrieren
→ E-Mail + Passwort
→ E-Mail-Verifizierung
→ Datenschutz / Terms Links
→ Style-Onboarding
→ erstes Kleidungsstück hinzufügen
→ erste Analyse bestätigen
→ erste Outfit-Empfehlung
```

## Daten

Erzeugt werden mindestens:

```text
AuthUser
UserProfile
StyleProfile
UserSettings
```

## Fehlerfälle

- E-Mail bereits registriert
- ungültige E-Mail
- schwaches Passwort
- kein Netz
- Verifizierungsmail kommt nicht an
- Nutzer beendet Onboarding
- App wird während Onboarding geschlossen

## Verhalten

- Onboarding-Fortschritt muss wiederaufnehmbar sein.
- Keine Style-Antwort darf nur lokal verloren gehen.
- Nutzer darf nicht in eine Endlosschleife zwischen Login und Onboarding geraten.

## Security / Privacy

- Passwort wird ausschließlich über Auth-Provider verarbeitet.
- Keine Passwörter in Firestore, Logs oder Analytics.
- optionale Daten werden als optional gekennzeichnet.

## Analytics

Mögliche Events:

```text
onboarding_started
signup_completed
email_verified
style_onboarding_completed
first_wardrobe_item_started
first_wardrobe_item_completed
first_outfit_generated
```

## Definition of Done

- neuer Nutzer kann Journey ohne Entwicklerhilfe abschließen
- App-Neustart erhält korrekten Zustand
- verifizierter Account funktioniert auf zweitem Gerät
- Auth-Fehler sind verständlich
- keine Dummy-Session

---

# Journey 2 – Kleidungsstück hinzufügen

## Nutzerziel

Ein reales Kleidungsstück soll schnell und korrekt in den digitalen Schrank gelangen.

## Happy Path

```text
Schrank
→ +
→ Kamera oder Galerie
→ Bild wählen
→ Bild prüfen/komprimieren
→ Upload
→ Analyse startet
→ Kategorie/Farbe/etc. werden vorgeschlagen
→ Nutzer bestätigt oder korrigiert
→ speichern
→ Item erscheint im Schrank
```

## Empfohlene Analysefelder

```text
category
subcategory
colors[]
pattern
material[]
brand?
size?
season[]
styleTags[]
formality
```

Nicht zuverlässig erkennbare Werte müssen leer bleiben dürfen.

## Datenfluss

```text
Local Image
→ Image Validation
→ Compression
→ Storage Upload
→ Server AI Analysis
→ Schema Validation
→ Draft WardrobeItem
→ User Confirmation
→ Firestore WardrobeItem
```

## Fehlerfälle

- Fotozugriff verweigert
- ungültiger Dateityp
- Datei zu groß
- Upload bricht ab
- Storage nicht erreichbar
- AI Timeout
- AI liefert ungültiges Schema
- AI erkennt nichts sinnvoll
- Nutzer schließt App während Analyse

## Fallback

Wenn AI fehlschlägt:

```text
Bild bleibt erhalten
→ Nutzer kann Daten manuell eingeben
→ Retry optional
```

AI darf niemals verhindern, dass ein Kleidungsstück manuell gespeichert werden kann.

## Security

- Upload-Pfad gehört zum eingeloggten Nutzer.
- fremde Nutzer dürfen private Wardrobe-Bilder nicht lesen.
- erlaubte Dateitypen und Größen serverseitig/regelbasiert beschränken.

## Analytics

```text
wardrobe_upload_started
wardrobe_upload_failed
ai_analysis_started
ai_analysis_completed
ai_analysis_failed
ai_suggestion_corrected
wardrobe_item_created
```

## Qualitätsmetriken

- Upload Success Rate
- AI Success Rate
- Anteil korrigierter AI-Felder
- mittlere Analysezeit
- Abbruchrate

## Definition of Done

- reales Foto funktioniert auf Android und iOS
- Item erscheint nach Neustart weiterhin
- Item erscheint auf zweitem Gerät
- AI-Fehler hat manuellen Fallback
- privates Bild ist für fremden Nutzer nicht abrufbar

---

# Journey 3 – Schrank verwalten

## Nutzerziel

Eigene Kleidung schnell finden, korrigieren und organisieren.

## Happy Path

```text
Schrank
→ Liste/Grid
→ Filter oder Suche
→ Item öffnen
→ Details
→ bearbeiten / favorisieren / löschen / Swap starten
```

## Funktionen

- Kategorie
- Farbe
- Saison
- Favorit
- Suche
- Sortierung
- später Nutzungshäufigkeit

## Löschen

Löschen ist keine reine UI-Aktion.

Vor Löschung prüfen:

- ist Item in gespeichertem Outfit referenziert?
- ist Item in aktivem SwapListing?
- ist Item Teil eines offenen Trades?

Ein Item in aktivem Trade darf nicht unkontrolliert verschwinden.

## Definition of Done

CRUD funktioniert cloudbasiert, konsistent und mit referenzierten Objekten sicher.

---

# Journey 4 – Outfit generieren

## Nutzerziel

Ein sinnvolles Outfit aus dem eigenen Kleiderschrank finden.

## Happy Path

```text
Stylist
→ Anlass wählen
→ optional Wetter/Ort
→ Regeln filtern ungeeignete Items
→ Ranking kombiniert passende Items
→ Outfit anzeigen
→ Erklärung
→ speichern / Alternative / gefällt nicht
```

## Inputs

```text
WardrobeItems
StyleProfile
Occasion
Weather
Temperature
Season
UserFeedbackHistory
```

## Verarbeitung

Empfohlen:

```text
Eligibility Filter
→ Candidate Generation
→ Compatibility Scoring
→ Preference Scoring
→ Weather Scoring
→ Diversity Rules
→ Ranked Outfit
→ AI/Template Explanation
```

LLM nicht als alleinige Entscheidungslogik verwenden.

## Fehlerfälle

- zu wenige Wardrobe Items
- keine passenden Schuhe
- kein Wetter verfügbar
- keine valide Kombination
- AI-Erklärung fällt aus

## Fallbacks

- klare Meldung „Für diesen Anlass fehlen noch X Kategorien“
- Wetter kann manuell ignoriert werden
- Outfit kann auch ohne generative Erklärung angezeigt werden

## Feedback

Nutzeraktionen:

```text
save
like
 dislike
regenerate
wore_it
```

Diese Signale verbessern später das Ranking.

## Definition of Done

- kein Outfit enthält fremde oder Mock-Items
- jede Item-ID existiert im echten Wardrobe
- dieselben Inputs liefern nachvollziehbare Ergebnisse
- kein LLM-Ausfall zerstört die Kernfunktion

---

# Journey 5 – Wardrobe Item auf OmniSwap anbieten

## Nutzerziel

Ein eigenes, ungenutztes Kleidungsstück direkt aus dem Schrank anbieten.

## Happy Path

```text
Wardrobe Item
→ Auf OmniSwap anbieten
→ Listing-Daten prüfen
→ Zustand
→ Größe
→ Beschreibung
→ Standort grob
→ Austauschoption
→ veröffentlichen
```

## Datenmodell-Prinzip

```text
WardrobeItem
  ↓ referenced by
SwapListing
```

Listing kopiert nur Felder, die für Marketplace-Suche/Anzeige bewusst denormalisiert werden müssen.

## Vorbedingungen

- Nutzer besitzt das Item
- Item ist nicht bereits aktiv gelistet
- Item ist nicht Teil eines laufenden Trades
- Item erfüllt Marketplace-Regeln

## Privacy

Private Wardrobe-Daten dürfen nicht automatisch öffentlich werden.

Ein Listing veröffentlicht nur ausdrücklich freigegebene Felder.

Beispiel:

```text
public:
image
brand
category
size
condition
approximate location
listing description

private:
purchase price
private wardrobe notes
exact address
internal AI metadata
```

## Definition of Done

- Listing ist mit Original-WardrobeItem verbunden
- fremder Nutzer kann Original-Privatdaten nicht lesen
- Listing kann pausiert und entfernt werden

---

# Journey 6 – OmniSwap entdecken und Angebot senden

## Nutzerziel

Ein anderes Kleidungsstück finden und ein eigenes Teil zum Tausch anbieten.

## Happy Path

```text
OmniSwap
→ Feed / Swipe
→ Listing ansehen
→ Swap anfragen
→ eigenes verfügbares Item wählen
→ Angebot prüfen
→ senden
→ Besitzer erhält Notification
```

## Regeln

Nicht erlaubt:

- eigenes Listing sich selbst anbieten
- bereits gehandeltes Item anbieten
- deaktiviertes Listing anfragen
- dasselbe offene Angebot beliebig duplizieren

## Definition of Done

Trade Proposal wird serverseitig konsistent erzeugt und ist für beide Parteien sichtbar.

---

# Journey 7 – Angebot annehmen und Trade abschließen

## Akteure

```text
Requester
Owner
```

## Happy Path

```text
Owner erhält Angebot
→ prüft angebotenes Item
→ akzeptiert
→ beide Items werden für konkurrierende Trades gesperrt
→ Austausch organisieren
→ Versand/Übergabe bestätigen
→ beide bestätigen Erhalt
→ Trade COMPLETED
→ Listings schließen
→ Wardrobe-Zustand aktualisieren
→ Review freischalten
```

## Kritische Konsistenz

Akzeptieren muss atomar bzw. serverseitig kontrolliert werden.

Es darf nicht passieren:

```text
2 konkurrierende Angebote
→ beide werden gleichzeitig akzeptiert
→ dasselbe Item ist zweimal vergeben
```

## Dispute

Vor größerem Launch definieren:

- Paket nicht angekommen
- falsches Item
- Zustand weicht stark ab
- Nutzer reagiert nicht
- persönliche Übergabe fehlgeschlagen

## Definition of Done

- Statusübergänge sind rollenbasiert validiert
- konkurrierende Trades werden verhindert
- Historie bleibt nachvollziehbar

---

# Journey 8 – Melden und Blockieren

## Nutzerziel

Unsichere oder unangemessene Nutzer/Listings verlassen können.

## Flow

```text
Profil oder Listing
→ Melden
→ Grund
→ optional Beschreibung
→ senden
→ Report-ID
```

Blockieren:

```text
Block User
→ gegenseitige Sichtbarkeit/Interaktion gemäß Policy reduzieren
→ keine neuen Angebote/Nachrichten
```

## Admin

Reports brauchen internen Status:

```text
OPEN
IN_REVIEW
ACTION_TAKEN
DISMISSED
```

## Definition of Done

Melden ist nicht nur ein Button; Report landet in einem echten Moderationsprozess.

---

# Journey 9 – Smart Shopping / Wardrobe Gap

## Status

MVP+; nicht vor dem Kernprodukt priorisieren.

## Ziel

Nicht „beliebte Produkte“ empfehlen, sondern konkrete Schranklücken.

## Flow

```text
Wardrobe analysieren
→ fehlende Kategorie/Utility erkennen
→ Kandidaten bewerten
→ zeigen, wie viele neue Outfits möglich werden
→ OmniSwap nach passendem Item durchsuchen
→ optional Shop Partner
```

## Kernmetrik

```text
Incremental Outfit Utility
```

Nicht bloß ein hardcodierter Match-Prozentwert.

---

# Journey 10 – Account löschen

## Nutzerziel

Eigene Daten und Konto kontrollieren.

## Flow

```text
Profil
→ Einstellungen
→ Account
→ Account löschen
→ Auswirkungen erklären
→ Re-Authentication falls nötig
→ bestätigte Löschaktion
→ aktive Trades prüfen
→ personenbezogene Daten löschen/anonymisieren
→ Storage Cleanup
→ Auth löschen
→ Abschluss
```

## Sonderfall aktive Trades

Ein laufender Trade darf nicht durch sofortige blinde Löschung inkonsistent werden.

Dafür wird eine Policy benötigt, z. B.:

- neue Trades blockieren
- laufende Trades abschließen/abbrechen
- notwendige Transaktionsdaten rechtlich/operativ ggf. anonymisiert aufbewahren

## Definition of Done

- gelöschter Nutzer kann nicht erneut mit alter Session zugreifen
- private Bilder sind entfernt
- öffentlich notwendige historische Daten sind nach Policy anonymisiert
- keine verwaisten sensiblen Datensätze

---

# Journey 11 – Fehler und Offline

Omni Fashion braucht einen globalen Umgang mit schlechter Verbindung.

## Fälle

- Start ohne Netz
- Netz fällt während Upload aus
- Firestore Query Timeout
- AI Dienst nicht verfügbar
- Notification Token fehlerhaft
- Trade-Aktion wird doppelt gesendet

## Regeln

- idempotente kritische Aktionen, wo möglich
- verständliche Fehlermeldungen
- Retry nicht endlos
- keine doppelten Listings/Trades durch Mehrfach-Taps
- lokale Daten nicht als erfolgreich synchronisiert anzeigen, wenn Backend fehlgeschlagen ist

---

# Journey 12 – App Update / alte Version

Produktionsnutzer aktualisieren nicht gleichzeitig.

Backend muss daher mindestens während eines Migrationsfensters alte und neue App-Versionen tolerieren.

Bei inkompatibler Version:

```text
App startet
→ Remote Minimum Version prüfen
→ Update Hinweis
→ nur bei wirklich inkompatibler Version blockieren
```

Feature Flags können neue Funktionen stufenweise aktivieren.

---

# Abschluss

Diese Journeys sind die Grundlage für:

- Datenmodell
- API-/Service-Design
- Security Rules
- Analytics
- Tests
- UI States
- Release-Abnahme

Eine neue Kernfunktion wird erst gebaut, wenn ihr Journey-Verhalten mindestens auf diesem Niveau definiert ist.
