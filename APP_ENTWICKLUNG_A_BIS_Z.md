# Omni Fashion – App-Entwicklung von A bis Z

> Zentrale Master-Anleitung für die Entwicklung von Omni Fashion – von der ersten Produktdefinition bis zur Veröffentlichung im Apple App Store und Google Play Store.
>
> **Stand:** 16. August 2026
>
> Diese Datei ist absichtlich nicht nur eine Feature-Liste. Sie ist unsere Entwicklungs-Roadmap, Qualitäts-Checkliste und Release-Anleitung. Wir arbeiten die Phasen der Reihe nach ab und markieren Fortschritt direkt hier.

---

## 1. Ziel dieser Anleitung

Omni Fashion soll nicht nur wie eine fertige App aussehen, sondern technisch, rechtlich und organisatorisch wirklich veröffentlichungsfähig werden.

Die App soll langfristig diese Kernschleife bilden:

```text
Nutzer
  ↓
Style-Profil / Style-DNA
  ↓
Digitaler Kleiderschrank
  ↓
KI versteht Kleidung + Nutzer + Anlass + Wetter
  ↓
Outfit-Empfehlungen
  ↓
Fehlende Kleidungsstücke erkennen
  ↓
Shop ODER OmniSwap
  ↓
Neue Kleidungsstücke fließen zurück in den Schrank
  ↓
Empfehlungen werden besser
```

Der wichtigste Grundsatz lautet daher:

> **Nicht mehr einzelne Demo-Features bauen. Die bestehenden Bereiche müssen zu einem gemeinsamen System verbunden werden.**

---

## 2. Status-Legende

| Status | Bedeutung |
|---|---|
| ✅ VORHANDEN | Ist im aktuellen Repo vorhanden und grundsätzlich nutzbar |
| 🟡 TEILWEISE | Oberfläche oder Grundstruktur vorhanden, aber noch nicht produktionsreif |
| 🔴 OFFEN | Muss noch gebaut oder eingerichtet werden |
| ⚪ SPÄTER | Nicht für MVP erforderlich |

---

# TEIL A – PRODUKT UND PLANUNG

## Phase 0 – Produktdefinition

### Ziel
Bevor weitere Technik gebaut wird, muss exakt feststehen, was Omni Fashion beim ersten Release leisten soll.

### Aufgaben

- [ ] Hauptproblem definieren, das Omni Fashion löst.
- [ ] Primäre Zielgruppe definieren.
- [ ] Sekundäre Zielgruppen definieren.
- [ ] Kernversprechen in einem Satz formulieren.
- [ ] Haupt-USP festlegen.
- [ ] MVP-Umfang einfrieren.
- [ ] Features festlegen, die bewusst erst nach Release kommen.
- [ ] Monetarisierungsmodell festlegen.
- [ ] Erfolgskennzahlen definieren.

### Empfohlener MVP für Omni Fashion

Der erste echte Release sollte nur Funktionen enthalten, die zusammen eine starke Produkt-Schleife ergeben:

1. Benutzerkonto
2. Digitaler Kleiderschrank
3. Kleidungsstück fotografieren/hochladen
4. Kleidungsstück automatisch analysieren
5. Kleidungsstücke bearbeiten
6. Style-Profil
7. KI-Outfit-Empfehlungen aus dem eigenen Schrank
8. OmniSwap-Listing aus einem eigenen Kleidungsstück erstellen
9. Andere Listings entdecken
10. Tausch-Angebot senden/annehmen/ablehnen
11. Profil + Bewertungen
12. Push-Benachrichtigungen
13. Datenschutz + Accountlöschung

### Bewusst NICHT MVP-kritisch

- ⚪ Echter fotorealistischer 3D-Avatar
- ⚪ Vollständiges Virtual Try-On
- ⚪ Große Shop-Aggregation über viele Händler
- ⚪ Komplexe Social-Feed-Funktionen
- ⚪ Tailor-/Änderungsservice
- ⚪ Vollständige internationale Expansion

---

## Phase 1 – Produktarchitektur und User Journeys

### Ziel
Jede Hauptfunktion bekommt einen klaren Nutzerfluss.

### Kern-Journeys

#### Journey A – Erster Start

```text
App installieren
→ Onboarding
→ Konto erstellen
→ Datenschutz akzeptieren
→ Style-Fragen beantworten
→ erstes Kleidungsstück hinzufügen
→ erste Outfit-Empfehlung erhalten
```

#### Journey B – Kleidungsstück hinzufügen

```text
Schrank
→ +
→ Kamera/Galerie
→ Bild zuschneiden
→ Upload
→ KI-Analyse
→ Kategorie/Farbe/Marke/Material/Saison erkennen
→ Nutzer bestätigt/korrigiert
→ speichern
```

#### Journey C – Outfit finden

```text
Stylist
→ Anlass wählen
→ Wetter berücksichtigen
→ Outfit aus eigenem Schrank generieren
→ Begründung anzeigen
→ Alternative generieren
→ Outfit speichern
```

#### Journey D – OmniSwap

```text
Eigenes Kleidungsstück
→ Auf OmniSwap anbieten
→ Zustand/Größe/Versand oder Übergabe ergänzen
→ veröffentlichen
→ Interessent sendet Angebot
→ akzeptieren/ablehnen
→ Tausch abwickeln
→ beide bewerten sich
```

#### Journey E – Smart Shopping

```text
Schrank analysieren
→ Lücke erkennen
→ fehlendes Teil empfehlen
→ zeigen, welche Outfits dadurch möglich werden
→ OmniSwap zuerst prüfen
→ optional Partner-Shop anzeigen
```

---

# TEIL B – TECHNISCHE GRUNDLAGE

## Phase 2 – Tech-Stack festziehen

### Aktueller Stack

| Bereich | Technologie | Status |
|---|---|---|
| Mobile/Web | Expo + React Native | ✅ |
| Routing | Expo Router | ✅ |
| Styling | NativeWind / Tailwind | ✅ |
| Sprache | TypeScript | ✅ |
| Animation | React Native Reanimated / Animated | ✅ |
| Lokaler Speicher | AsyncStorage | ✅, aber nur lokal |
| Backend-SDK | Firebase | 🟡 eingebaut, nicht produktiv konfiguriert |
| Datenbank | Firestore geplant | 🔴 |
| Dateispeicher | Firebase Storage geplant | 🔴 |
| Auth | Firebase Auth geplant | 🔴 |
| Push | Expo Notifications / FCM / APNs | 🔴 |
| Analytics | noch nicht festgelegt | 🔴 |
| Crash Reporting | noch nicht festgelegt | 🔴 |
| CI/CD | noch nicht vorhanden | 🔴 |
| Store Build | EAS Build geplant | 🔴 |

### Versionsregel

Dieses Repo nutzt Expo SDK 57. Vor jeder technischen Änderung müssen die **versionierten Expo-57-Dokumente** geprüft werden:

- https://docs.expo.dev/versions/v57.0.0/

Keine Anleitung aus einer zufälligen älteren Expo-Version übernehmen.

---

## Phase 3 – Repository und Projekt-Hygiene

### Ziel
Das Repo muss für echte Entwicklung und spätere Zusammenarbeit sauber werden.

### Aufgaben

- [ ] README komplett auf Omni Fashion umschreiben.
- [ ] Diese Master-Roadmap im README verlinken.
- [ ] `.env.example` anlegen.
- [ ] Secrets niemals committen.
- [ ] Development / Staging / Production Umgebungen definieren.
- [ ] Namenskonventionen für Dateien, Komponenten und Hooks definieren.
- [ ] `src/services/` für Backend/API-Zugriffe anlegen.
- [ ] `src/features/` oder klare Feature-Grenzen definieren.
- [ ] `src/lib/` für gemeinsame Infrastruktur definieren.
- [ ] Fehlerbehandlung standardisieren.
- [ ] Logging standardisieren.
- [ ] ESLint aktiv einrichten.
- [ ] Formatter festlegen.
- [ ] Pre-commit Checks optional einrichten.
- [ ] GitHub Actions für Typecheck/Lint/Tests einrichten.

### Definition of Done

Ein Pull Request darf nur gemergt werden, wenn mindestens:

```text
TypeScript → PASS
Lint       → PASS
Tests      → PASS
Build      → PASS
keine Secrets im Repo
```

---

## Phase 4 – Designsystem statt Einzel-Screens

### Aktueller Stand

Omni Fashion besitzt bereits viele hochwertige UI-Elemente, aber Schrank, Stylist, Shop und OmniSwap wirken teilweise wie unterschiedliche Apps.

### Aufgaben

- [ ] Primäre Markenfarbe festlegen.
- [ ] Sekundäre Farben festlegen.
- [ ] Light/Dark Tokens definieren.
- [ ] Typografie-System definieren.
- [ ] Spacing-System definieren.
- [ ] Radius-System definieren.
- [ ] Schatten-System definieren.
- [ ] Button-Komponenten vereinheitlichen.
- [ ] Card-Komponenten vereinheitlichen.
- [ ] Input-Komponenten vereinheitlichen.
- [ ] Modal/Bottom-Sheet-System vereinheitlichen.
- [ ] Icon-System vereinheitlichen.
- [ ] Emojis langfristig durch konsistente Icons/Illustrationen ersetzen.
- [ ] Loading States definieren.
- [ ] Empty States definieren.
- [ ] Error States definieren.
- [ ] Skeleton States definieren.
- [ ] Deutsche und englische Texte nicht mehr mischen.

### Design-Grundsatz

Premium bedeutet nicht möglichst viele Effekte. Premium bedeutet:

```text
Konsistenz
+ gute Hierarchie
+ schnelle Bedienung
+ klare Zustände
+ hochwertige Bewegung
+ wenig visuelles Chaos
```

---

# TEIL C – AUTHENTIFIZIERUNG UND DATEN

## Phase 5 – Echte Benutzerkonten

### Aktueller Stand

🟡 Der Login-Screen existiert.

🔴 Der Login ist technisch noch nur eine Dummy-Session mit AsyncStorage. E-Mail und Passwort werden noch nicht wirklich geprüft.

### MVP-Funktionen

- [ ] Registrierung mit E-Mail + Passwort
- [ ] Login
- [ ] Logout
- [ ] E-Mail-Verifizierung
- [ ] Passwort vergessen
- [ ] Passwort zurücksetzen
- [ ] Session-Wiederherstellung
- [ ] Benutzerprofil
- [ ] Account löschen
- [ ] Auth-Fehler sauber anzeigen
- [ ] Rate-Limits / Missbrauch berücksichtigen

### Optional danach

- [ ] Google Login
- [ ] Sign in with Apple

### Datenmodell `users`

Beispiel:

```text
users/{uid}
  displayName
  email
  avatarUrl
  country
  city
  language
  createdAt
  updatedAt
  onboardingCompleted
  styleProfileId
  rating
  completedSwaps
```

---

## Phase 6 – Firebase-Projekt richtig einrichten

### Aktueller Stand

🟡 Firebase ist im Code eingebunden.

🔴 `firebaseConfig.ts` enthält noch Dummy-Werte.

### Aufgaben

- [ ] echtes Firebase-Projekt anlegen
- [ ] Development-Projekt anlegen
- [ ] Production-Projekt anlegen
- [ ] Android-App registrieren
- [ ] iOS-App registrieren
- [ ] Web-App registrieren, falls Web veröffentlicht wird
- [ ] Firebase Auth aktivieren
- [ ] Firestore aktivieren
- [ ] Firebase Storage aktivieren
- [ ] Firebase App Check prüfen/einrichten
- [ ] Umgebungsvariablen statt Dummy-Konfiguration verwenden
- [ ] Sicherheitsregeln erstellen
- [ ] Firestore-Indizes definieren
- [ ] Backup-/Recovery-Strategie definieren
- [ ] Budget-Alerts aktivieren

### Sehr wichtig

Frontend-Code darf niemals als Sicherheitsgrenze betrachtet werden.

Jede geschützte Aktion muss auch serverseitig bzw. durch Firebase Security Rules abgesichert sein.

---

## Phase 7 – Zentrales Datenmodell

### Ziel
Alle Tabs müssen dieselben Daten verwenden.

### Empfohlene Collections

```text
users
wardrobeItems
styleProfiles
outfits
swapListings
swapOffers
swapTransactions
favorites
reviews
notifications
reports
blocks
```

### Wichtigste Beziehung

Ein eigenes Kleidungsstück darf nicht für jeden Bereich neu erfunden werden.

```text
WardrobeItem
   ↓
optional
   ↓
SwapListing
```

Das Listing referenziert das Original-Kleidungsstück.

### Beispiel `wardrobeItems/{id}`

```text
ownerId
imageUrls[]
name
brand
category
subcategory
color[]
material[]
size
season[]
styleTags[]
condition
purchasePrice
estimatedValue
createdAt
updatedAt
aiMetadata
isListedForSwap
```

---

# TEIL D – DIGITALER KLEIDERSCHRANK

## Phase 8 – Wardrobe produktionsreif machen

### Aktueller Stand

✅ Kamera/Galerie-Auswahl existiert.

✅ Items können lokal hinzugefügt, geändert und gelöscht werden.

🟡 Daten werden nur über AsyncStorage gespeichert.

🔴 Cloud-Synchronisierung fehlt.

### Aufgaben

- [ ] Bild lokal auswählen
- [ ] Dateigröße validieren
- [ ] Bild komprimieren
- [ ] Bildformat validieren
- [ ] Upload-Fortschritt anzeigen
- [ ] Upload zu Firebase Storage
- [ ] Firestore-Dokument erstellen
- [ ] Offline-Zustand behandeln
- [ ] Retry bei Fehlern
- [ ] Item bearbeiten
- [ ] Item löschen
- [ ] zugehörige Bilder beim Löschen entfernen
- [ ] Kategorien filtern
- [ ] Suche
- [ ] Sortierung
- [ ] Favoriten
- [ ] Outfit-Verwendung zählen

---

## Phase 9 – Bild- und KI-Analyse-Pipeline

### Aktueller Stand

🔴 Die vermeintliche KI-Verarbeitung wird derzeit nur mit `setTimeout` simuliert.

### Ziel
Nach einem Upload soll aus einem Foto ein strukturiertes Kleidungsstück entstehen.

### Pipeline

```text
Foto
→ Upload
→ Bildprüfung
→ Hintergrund optional entfernen
→ Vision-Modell
→ strukturierte Antwort
→ Validierung
→ Nutzer bestätigt/korrigiert
→ Firestore
```

### Mögliche erkannte Felder

- Kategorie
- Unterkategorie
- Hauptfarbe
- Nebenfarben
- Muster
- Material
- Schnitt
- Stil
- Saison
- Formalitätsgrad
- Marke, nur wenn zuverlässig erkennbar
- mögliche Outfit-Tags

### Sicherheitsregel

KI-Ausgaben niemals ungeprüft direkt als Wahrheit speichern.

Immer:

```text
AI Output
→ Schema Validation
→ Confidence prüfen
→ Nutzer kann korrigieren
```

---

# TEIL E – STYLE-DNA UND KI-STYLIST

## Phase 10 – Style-Profil

### Aktueller Stand

🟡 Style-DNA-Oberfläche existiert.

🔴 Ergebnis wird aktuell zufällig aus Dummy-Profilen gewählt.

### MVP besser als nur Fotoanalyse

Das Style-Profil sollte mehrere Signale kombinieren:

1. kurze Onboarding-Fragen
2. bevorzugte Looks
3. Farben
4. vorhandener Kleiderschrank
5. gespeicherte/abgelehnte Outfits
6. optional Fotos

### Beispiel Style-Profil

```text
preferredStyles[]
preferredColors[]
avoidedColors[]
fitPreferences[]
formalVsCasual
minimalVsBold
budgetRange
favoriteBrands[]
climate
```

---

## Phase 11 – Echter Outfit-Engine

### Aktueller Stand

🟡 Stylist-UI existiert.

🔴 Outfits werden aktuell aus wenigen hardcodierten Beispiel-Outfits zufällig gewählt.

### Ziel
Der Stylist muss echte Kleidungsstücke des Nutzers kombinieren.

### Inputs

```text
Wardrobe
+ Style Profile
+ Anlass
+ Wetter
+ Temperatur
+ Saison
+ Nutzerfeedback
```

### Output

```text
Top
Bottom
Shoes
optional Layer
optional Accessory
Style Score
Warum dieses Outfit?
Alternativen
```

### Empfehlung
Nicht jede Aufgabe einem LLM überlassen.

Eine gute Architektur kombiniert:

```text
harte Filter
+ Ranking
+ Fashion-Regeln
+ Nutzerpräferenzen
+ KI für Erklärung/semantisches Matching
```

---

## Phase 12 – Wetter wirklich integrieren

### Aktueller Stand

🔴 Wetter wird aktuell zufällig gewählt.

### Aufgaben

- [ ] Standort nur mit Zustimmung verwenden
- [ ] Alternative: Stadt manuell eingeben
- [ ] Wetter-Provider festlegen
- [ ] Temperatur
- [ ] Regen
- [ ] Wind
- [ ] Tageszeit
- [ ] Forecast-Zeitfenster
- [ ] Daten cachen
- [ ] API-Ausfall behandeln

---

## Phase 13 – 3D/Virtual Try-On richtig einordnen

### Aktueller Stand

🟡 Es existiert eine visuelle 2D-Simulation mit verschiedenen Perspektiven.

🔴 Es ist noch kein echter 3D-Avatar und kein echtes Virtual Try-On.

### MVP-Entscheidung

Für Release 1:

- vorhandene Darstellung entweder als "Outfit Preview" bezeichnen
- oder deutlich vereinfachen

### Später mögliche echte Lösungen

- 3D-Body-Model
- Körpermaße
- Kleidungsmeshes
- Virtual Try-On Modell
- generative Try-On Bilder

Diese Funktion erst entwickeln, wenn Kernprodukt, Retention und Monetarisierung funktionieren.

---

# TEIL F – OMNISWAP

## Phase 14 – Listings

### Aktueller Stand

✅ sehr guter Swipe-/Discovery-Prototyp

✅ Trade Studio UI

✅ Accept/Decline UI

🔴 Daten sind Mockdaten und lokaler React-State

### Listing erstellen

```text
Wardrobe Item
→ "Auf OmniSwap anbieten"
→ Zustand prüfen
→ Größe
→ Beschreibung
→ Standort
→ Versand / persönliche Übergabe
→ geschätzter Wert
→ gewünschte Tauschart
→ veröffentlichen
```

### `swapListings`

```text
listingId
wardrobeItemId
ownerId
status
condition
size
location
shippingMethods[]
estimatedValue
wantedCategories[]
createdAt
updatedAt
```

---

## Phase 15 – Trade-System

### Statusmodell

```text
DRAFT
→ SENT
→ ACCEPTED / DECLINED
→ ADDRESS_OR_MEETUP
→ SHIPPED
→ RECEIVED
→ COMPLETED
→ REVIEWED
```

Zusätzlich:

```text
CANCELLED
DISPUTED
```

### Aufgaben

- [ ] Angebot erstellen
- [ ] Angebot an richtigen Besitzer senden
- [ ] Besitzer benachrichtigen
- [ ] Angebot annehmen
- [ ] Angebot ablehnen
- [ ] Angebot zurückziehen
- [ ] konkurrierende Angebote behandeln
- [ ] Item nach abgeschlossenem Trade sperren/entfernen
- [ ] Verlauf speichern
- [ ] Bewertung erlauben
- [ ] Meldung/Blockierung erlauben

---

## Phase 16 – Trust & Safety für Marketplace

Ein Peer-to-Peer-Marktplatz braucht mehr als schöne Karten.

### Pflichtfunktionen vor größerem Launch

- [ ] Nutzer melden
- [ ] Listing melden
- [ ] Nutzer blockieren
- [ ] unangemessene Bilder melden
- [ ] Moderationsprozess
- [ ] verbotene Artikel definieren
- [ ] Fake-/Betrugsprävention
- [ ] Bewertungsmanipulation verhindern
- [ ] Rate Limits
- [ ] verdächtige Accounts markieren
- [ ] Admin-/Moderationsoberfläche
- [ ] Support-Kanal

---

# TEIL G – SHOP UND MONETARISIERUNG

## Phase 17 – Smart Investment Advisor

### Aktueller Stand

🟡 starke Oberfläche und Produktidee

🔴 Match-Werte und "neue Outfits" sind noch hardcodiert

### Echte Berechnung

Beispiel:

```text
Kandidat X
→ mit jedem vorhandenen Item kombinieren
→ valide Outfit-Kombinationen zählen
→ Stil-/Farb-/Saison-Score
→ Preis berücksichtigen
→ Kosten pro neuem Outfit berechnen
```

Ein sinnvoller Score könnte z. B. aus folgenden Komponenten bestehen:

```text
Outfit Coverage
Style Match
Season Utility
Color Compatibility
Price Efficiency
Wardrobe Gap Importance
```

---

## Phase 18 – Monetarisierung

Vor Implementierung rechtlich und geschäftlich festlegen.

### Mögliche Modelle

1. Affiliate-Provision bei Shop-Käufen
2. Premium-Abo
3. OmniSwap Premium-Features
4. Boosted Listings
5. Markenkooperationen
6. später B2B-Insights nur datenschutzkonform und aggregiert

### Premium-Ideen

- unbegrenzte KI-Outfits
- erweiterte Style-DNA
- Reise-Kofferplaner
- Capsule Wardrobe
- detaillierte Wardrobe Analytics
- erweiterte Deal Alerts

### Wichtig

Kein Paywall-System bauen, bevor klar ist:

- welche Funktion Nutzer regelmäßig verwenden
- welche Funktion echten Mehrwert erzeugt
- welche Funktion für Premium geeignet ist

---

# TEIL H – BENACHRICHTIGUNGEN UND RETENTION

## Phase 19 – Push Notifications

### Sinnvolle Push-Arten

- neues Tausch-Angebot
- Angebot akzeptiert
- Angebot abgelehnt
- neue Nachricht
- Tauschstatus geändert
- gespeichertes Wunsch-Item verfügbar
- optional tägliche Outfit-Empfehlung

### Regeln

- Opt-in sauber einholen
- nicht spammen
- Kategorien abschaltbar machen
- Deep Links direkt in den relevanten Screen

---

# TEIL I – SICHERHEIT, DATENSCHUTZ UND RECHT

## Phase 20 – Security

### Pflicht

- [ ] Firestore Security Rules
- [ ] Storage Security Rules
- [ ] Nutzer darf nur eigene private Daten ändern
- [ ] Marketplace-Daten nur im erlaubten Umfang öffentlich
- [ ] serverseitige Validierung sensibler Aktionen
- [ ] App Check prüfen
- [ ] Rate Limiting
- [ ] keine Secrets im Client
- [ ] Dependency-Audits
- [ ] Input Validation
- [ ] sichere Dateitypen
- [ ] Upload-Limits
- [ ] Logging ohne sensible Daten

---

## Phase 21 – Datenschutz / DSGVO

Omni Fashion verarbeitet potenziell:

- Accountdaten
- E-Mail
- Profilbilder
- Kleidungsfotos
- Standort
- Style-Präferenzen
- Körpermaße
- mögliche Personenfotos/Videos
- Marketplace-Kommunikation
- Nutzungsverhalten

Deshalb vor Veröffentlichung mindestens:

- [ ] Datenschutzerklärung
- [ ] Impressum/Anbieterangaben, soweit erforderlich
- [ ] Nutzungsbedingungen
- [ ] Community-/Marketplace-Regeln
- [ ] Löschkonzept
- [ ] Aufbewahrungsfristen
- [ ] Export/Betroffenenrechte prüfen
- [ ] Auftragsverarbeiter dokumentieren
- [ ] Firebase/Google-Verarbeitung prüfen
- [ ] KI-Anbieter dokumentieren
- [ ] Analytics/Crash-Anbieter dokumentieren
- [ ] Cookie-/Web-Themen prüfen, falls Webversion
- [ ] Einwilligung für optionale Datenverarbeitung

### Accountlöschung ist Release-kritisch

Wenn Nutzer Accounts erstellen können:

- Apple verlangt eine Möglichkeit, die Accountlöschung in der App einzuleiten.
- Google Play verlangt bei Apps mit Account-Erstellung eine In-App-Möglichkeit und zusätzlich eine außerhalb der App erreichbare Web-Ressource für Löschanfragen.

Deshalb von Anfang an bauen:

```text
Profil
→ Einstellungen
→ Account
→ Account löschen
→ Bestätigung
→ Auth löschen
→ Firestore-Nutzerdaten löschen/anonymisieren
→ Storage-Dateien löschen
→ verbundene Daten nach definierter Policy behandeln
```

---

## Phase 22 – Store-Datenschutzangaben

### Apple

Vor Einreichung müssen die tatsächlichen Datenpraktiken inklusive integrierter Drittanbieter in App Store Connect korrekt angegeben werden.

### Google Play

Vor Veröffentlichung muss der Bereich "Datensicherheit" korrekt ausgefüllt werden.

### Regel

Store-Angaben müssen zur echten Implementierung passen.

Nicht angeben:

> "Wir sammeln keinen Standort"

wenn die App tatsächlich Standortdaten überträgt.

---

# TEIL J – QUALITÄT UND TESTS

## Phase 23 – Teststrategie

### Aktueller Stand

🟡 Es existieren viele Testdateien.

🔴 Die vorhandenen sogenannten E2E-Tests testen teilweise eigene Test-Implementierungen statt die tatsächlich laufende App.

### Neue Testpyramide

#### 1. Unit Tests

Für:

- Scoring
- Filter
- Datenkonvertierung
- Validierung
- Utilities

#### 2. Integration Tests

Für:

- Auth + Profil
- Firestore Services
- Wardrobe Services
- Listing-Erstellung
- Trade-Statuswechsel

#### 3. Component Tests

Für wichtige UI-Komponenten.

#### 4. Echte E2E-Tests

Beispiel:

```text
App öffnen
→ Account erstellen
→ Kleidungsstück hinzufügen
→ speichern
→ Listing veröffentlichen
→ zweiter Testnutzer sendet Angebot
→ erster Nutzer akzeptiert
→ Status aktualisiert sich
```

### Release-Blocker Tests

- [ ] Registrierung
- [ ] Login
- [ ] Passwort Reset
- [ ] Account löschen
- [ ] Bild Upload
- [ ] Wardrobe CRUD
- [ ] Offline/Netzwerkfehler
- [ ] OmniSwap Listing
- [ ] Angebot senden
- [ ] Angebot annehmen
- [ ] Push
- [ ] Datenschutzlinks
- [ ] Deep Links
- [ ] Android reale Geräte
- [ ] iPhone reale Geräte

---

## Phase 24 – Performance

### Prüfen

- [ ] Startzeit
- [ ] große Bilder
- [ ] Bildcaching
- [ ] Listenvirtualisierung
- [ ] unnötige Re-Renders
- [ ] Firestore Query-Kosten
- [ ] Pagination
- [ ] Swipe-Performance
- [ ] langsame Android-Geräte
- [ ] schlechtes Mobilfunknetz
- [ ] Offline-Verhalten
- [ ] Speicherverbrauch

---

## Phase 25 – Accessibility

### Mindeststandard

- [ ] Touch Targets ausreichend groß
- [ ] Screen Reader Labels
- [ ] dynamische Textgrößen prüfen
- [ ] Kontrast
- [ ] Informationen nicht nur über Farbe vermitteln
- [ ] Fokus-Reihenfolge
- [ ] Formulare verständlich beschriften
- [ ] reduzierte Bewegung berücksichtigen

Apple erlaubt inzwischen zusätzlich Angaben zur Accessibility-Unterstützung in App Store Connect. Diese sollten nur gesetzt werden, wenn die App die jeweilige Funktion wirklich unterstützt.

---

## Phase 26 – Analytics und Crash Reporting

Vor Launch müssen wir technische Probleme erkennen können.

### Ereignisse, die sinnvoll sind

```text
signup_completed
wardrobe_item_added
ai_analysis_completed
outfit_generated
outfit_saved
swap_listing_created
swap_offer_sent
swap_completed
shop_recommendation_clicked
```

### Nicht blind alles tracken

Jedes Event muss einen konkreten Produktzweck haben und datenschutzkonform sein.

### Zusätzlich

- [ ] Crash Reporting
- [ ] Non-fatal Errors
- [ ] Netzwerkfehler
- [ ] API-Latenz
- [ ] Release-Version mit jedem Fehler speichern

---

# TEIL K – RELEASE-VORBEREITUNG

## Phase 27 – Production-Konfiguration

### Aktuell fehlend

🔴 `eas.json`

🔴 echte Firebase Production Config

🔴 iOS Bundle Identifier

🔴 Android Package Identifier

🔴 Release-Versionierung

🔴 CI/CD

### Vor Release in `app.json`/App Config

Festlegen:

```text
name
slug
scheme
ios.bundleIdentifier
android.package
version
ios.buildNumber
android.versionCode
Icons
Splash
Permissions
```

Beispiel für Identifier:

```text
com.omnifashion.app
```

Vor endgültiger Festlegung prüfen, da Package/Bundle Identifier später wichtig und nicht beliebig austauschbar sind.

---

## Phase 28 – EAS Build einrichten

### Dateien

- [ ] `eas.json`

### Profile

Empfohlen:

```text
development
preview
production
```

### Typischer Ablauf

```bash
npm install --global eas-cli
eas login
eas build:configure
```

Danach Produktions-Builds:

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

Offizielle Expo-Dokumentation:

- https://docs.expo.dev/deploy/build-project/
- https://docs.expo.dev/build/

---

## Phase 29 – Staging / Beta

Vor öffentlichem Release niemals direkt von Entwicklung zu Produktion springen.

### Stufen

```text
Local Development
→ Internal Preview
→ Team Test
→ Closed Beta
→ Store Testing
→ Production
```

### Testdaten getrennt halten

Production-Nutzer und Testnutzer sollten nicht dieselbe Umgebung verwenden.

---

# TEIL L – GOOGLE PLAY STORE

## Phase 30 – Google Play Developer Setup

### Benötigt

- [ ] Google Play Developer Account
- [ ] Entwickleridentität verifizieren
- [ ] App in Play Console anlegen
- [ ] Package Name festlegen
- [ ] App-Signierung konfigurieren
- [ ] Store-Eintrag
- [ ] Datenschutzerklärung URL
- [ ] Data Safety Formular
- [ ] Content Rating
- [ ] Zielgruppe
- [ ] Werbung deklarieren
- [ ] App Access Informationen
- [ ] Account-Lösch-URL, falls Accounts vorhanden

### Wichtiger Stand 2026

Ab **31. August 2026** müssen neue normale Android-Apps und Updates für Google Play Android 16 / **API Level 36** oder höher targeten.

Expo SDK 57 verwendet laut Expo-Dokumentation bereits `targetSdkVersion 36`.

Vor dem tatsächlichen Release trotzdem immer die aktuelle Google-Play-Anforderung erneut prüfen.

Offizielle Quelle:

- https://support.google.com/googleplay/android-developer/answer/11926878

---

## Phase 31 – Google Closed Testing

Für **neu erstellte persönliche Entwicklerkonten nach dem 13. November 2023** gilt derzeit:

- mindestens 12 Tester
- mindestens 14 aufeinanderfolgende Tage im geschlossenen Test
- danach Produktionszugang beantragen

Dieser Punkt hängt vom Developer-Account-Typ und dessen Erstellungsdatum ab.

Offizielle Quelle:

- https://support.google.com/googleplay/android-developer/answer/14151465

### Deshalb frühzeitig erledigen

Nicht erst am geplanten Launch-Tag feststellen, dass die Testphase noch fehlt.

---

## Phase 32 – Android Build und Submission

### Production Build

```bash
eas build --platform android --profile production
```

Google Play verwendet für normale Store-Releases Android App Bundles (`.aab`).

### Submission

```bash
eas submit --platform android
```

Bei der allerersten Veröffentlichung kann zusätzlich manuelle Einrichtung in der Play Console notwendig bzw. sinnvoll sein.

Offizielle Expo-Übersicht:

- https://docs.expo.dev/deploy/submit-to-app-stores/

---

# TEIL M – APPLE APP STORE

## Phase 33 – Apple Developer Setup

### Benötigt

- [ ] Apple Developer Program Account
- [ ] App Store Connect App anlegen
- [ ] eindeutigen Bundle Identifier festlegen
- [ ] Signierung/Zertifikate konfigurieren
- [ ] App Privacy Angaben
- [ ] Altersfreigabe
- [ ] Screenshots
- [ ] Beschreibung
- [ ] Keywords
- [ ] Support URL
- [ ] Privacy Policy URL
- [ ] App Review Informationen
- [ ] Demo-Account für Review bereitstellen, falls Login nötig

---

## Phase 34 – iOS Build

Expo verlangt für die Einreichung einen Production-Build.

```bash
eas build --platform ios --profile production
```

Danach:

```bash
eas submit --platform ios
```

EAS Submit kann auch von Windows/Linux aus die iOS-Binary zu App Store Connect hochladen.

Offizielle Quelle:

- https://docs.expo.dev/submit/ios/

---

## Phase 35 – TestFlight

Vor App Review:

- [ ] internen Test durchführen
- [ ] verschiedene iPhone-Größen testen
- [ ] frische Installation testen
- [ ] Upgrade von Vorversion testen
- [ ] Login testen
- [ ] Accountlöschung testen
- [ ] Kamera/Fotos Berechtigungen testen
- [ ] Push testen
- [ ] langsames Netz testen
- [ ] Offline testen
- [ ] Review-Demo-Account prüfen

---

## Phase 36 – App Review

Vor "Submit for Review" müssen alle benötigten Metadaten und der richtige Build in App Store Connect hinterlegt sein.

Apple verlangt bei Apps mit Account-Erstellung auch eine Möglichkeit zur Accountlöschung innerhalb der App.

Offizielle Quellen:

- https://developer.apple.com/app-store/submitting/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/

---

# TEIL N – STORE ASSETS

## Phase 37 – Store Listing

Vor Veröffentlichung brauchen wir professionelle Assets.

### Beide Stores

- [ ] finaler App-Name
- [ ] App-Icon
- [ ] Untertitel/Short Description
- [ ] vollständige Beschreibung
- [ ] Screenshots
- [ ] Feature-Grafiken soweit gefordert
- [ ] Support-Webseite
- [ ] Datenschutzerklärung
- [ ] FAQ
- [ ] Kontakt

### Screenshot-Plan

Nicht einfach zufällige Screenshots hochladen.

Story:

```text
1. Dein smarter Kleiderschrank
2. Finde dein Outfit in Sekunden
3. KI versteht deinen Stil
4. Tausche Kleidung mit OmniSwap
5. Kaufe nur, was deinen Schrank wirklich verbessert
```

---

# TEIL O – LAUNCH

## Phase 38 – Release Candidate

Vor dem finalen Upload wird eine Version eingefroren.

Keine neuen Features mehr.

Nur:

- kritische Bugs
- Store-Blocker
- Security
- Datenschutz
- Crash Fixes

### Release Candidate Check

- [ ] TypeScript 0 Fehler
- [ ] Lint 0 Blocker
- [ ] Tests grün
- [ ] Production Build Android erfolgreich
- [ ] Production Build iOS erfolgreich
- [ ] Auth funktioniert
- [ ] Passwort Reset funktioniert
- [ ] Accountlöschung funktioniert
- [ ] Wardrobe funktioniert
- [ ] KI-Fehlerzustände funktionieren
- [ ] OmniSwap funktioniert
- [ ] Push funktioniert
- [ ] Privacy Policy erreichbar
- [ ] Support erreichbar
- [ ] keine Dummy-Daten im Produktionsfluss
- [ ] keine Dummy-Firebase-Konfiguration
- [ ] keine Test-API-Keys
- [ ] keine internen Debug Screens

---

## Phase 39 – Soft Launch

Nicht sofort 100 % aller Nutzer freischalten, wenn Store/Produkt es erlaubt.

### Beobachten

- Crash-Free Sessions
- Registrierungsrate
- Onboarding-Abbruch
- Zeit bis zum ersten Kleidungsstück
- Anzahl Items pro Nutzer
- Outfit Generations
- OmniSwap Listings
- Angebote pro Listing
- abgeschlossene Swaps
- Retention D1 / D7 / D30
- Support-Anfragen

---

## Phase 40 – Nach dem Launch

Veröffentlichung ist nicht das Ende.

### Laufende Aufgaben

- [ ] Bugs priorisieren
- [ ] Crash Reports prüfen
- [ ] Store Reviews lesen
- [ ] Support beantworten
- [ ] Sicherheitsupdates
- [ ] Dependencies aktualisieren
- [ ] Expo SDK Updates planen
- [ ] Store-Richtlinien regelmäßig prüfen
- [ ] Kosten überwachen
- [ ] Firebase Query-Kosten überwachen
- [ ] KI-Kosten überwachen
- [ ] Abuse/Moderation überwachen
- [ ] Datenschutzdokumente aktualisieren
- [ ] Backups prüfen

---

# TEIL P – AKTUELLER OMNI-FASHION-AUDIT

## Was schon gut vorhanden ist

| Bereich | Status |
|---|---|
| Expo / React Native Grundprojekt | ✅ |
| Expo Router | ✅ |
| TypeScript strict config | ✅ |
| NativeWind | ✅ |
| iOS/Android/Web Grundkonfiguration | ✅ |
| Digitaler Schrank UI | ✅ |
| Kamera/Galerie | ✅ |
| Wardrobe CRUD lokal | ✅ |
| Stylist UI | ✅ |
| Style-DNA UI | ✅ |
| Shop UI | ✅ |
| Smart Investment Advisor UI | ✅ |
| OmniSwap Swipe UI | ✅ |
| Trade Studio UI | ✅ |
| Peer Closet UI | ✅ |
| Dark Mode | ✅ |
| Responsive Web Navigation | ✅ |

## Was nur simuliert ist

| Bereich | Tatsächlicher Stand |
|---|---|
| Login | Dummy AsyncStorage Session |
| Firebase | Dummy-Konfiguration |
| Wardrobe Cloud | lokal statt Firestore |
| KI-Bildanalyse | `setTimeout` / Platzhalter |
| Style-DNA | Zufallsprofil |
| KI-Stylist | statische Outfit-Liste + Zufall |
| Wetter | Zufallswert |
| 3D Avatar | 2D-Simulation |
| Shop | hardcodierte Produkte |
| Investment Score | hardcodierte Werte |
| OmniSwap Nutzer | Mockdaten |
| Trades | lokaler State |
| Eco-Impact | Mockwerte |

## Release-kritische Lücken

1. 🔴 echte Authentifizierung
2. 🔴 echtes Firebase Backend
3. 🔴 Firestore Security Rules
4. 🔴 Storage Security Rules
5. 🔴 gemeinsames Datenmodell
6. 🔴 Cloud Wardrobe
7. 🔴 echte AI-Pipeline
8. 🔴 echter Stylist auf Nutzerdaten
9. 🔴 echter OmniSwap Marketplace
10. 🔴 Push Notifications
11. 🔴 Trust & Safety
12. 🔴 Accountlöschung
13. 🔴 Datenschutzerklärung
14. 🔴 Terms/Marketplace Regeln
15. 🔴 echte Tests
16. 🔴 Crash Reporting
17. 🔴 Analytics
18. 🔴 EAS Build Konfiguration
19. 🔴 Bundle Identifier / Android Package
20. 🔴 Store Accounts + Store Assets
21. 🔴 Beta-Test
22. 🔴 Release Candidate

---

# TEIL Q – EMPFOHLENE UMSETZUNGSREIHENFOLGE

Wir bauen ab jetzt in dieser Reihenfolge:

## Block 1 – Fundament

1. Repo aufräumen
2. README neu
3. Environment-System
4. Firebase Dev/Prod
5. echtes Auth
6. Account/Profile Datenmodell
7. Security Rules

## Block 2 – Kernprodukt

8. Cloud Wardrobe
9. Bild Upload
10. AI Kleidungsanalyse
11. Style-Profil
12. echter Outfit-Engine
13. echtes Wetter

## Block 3 – Netzwerk-Effekt

14. Wardrobe → OmniSwap Listing
15. Marketplace Feed
16. Trade Offers
17. Trade Status
18. Reviews
19. Reporting/Blocking
20. Push Notifications

## Block 4 – Monetarisierung

21. Smart Investment Algorithmus
22. Shop-/Affiliate-Integration
23. Premium-Strategie

## Block 5 – Produktionsreife

24. echte Test-Suite
25. Performance
26. Accessibility
27. Analytics
28. Crash Reporting
29. Datenschutz/Recht
30. Accountlöschung
31. CI/CD

## Block 6 – Veröffentlichung

32. EAS konfigurieren
33. Android/iOS Identifier
34. Preview Builds
35. Beta
36. Store Listings
37. Google Closed Test, falls für Account erforderlich
38. TestFlight
39. Release Candidate
40. App Review / Play Review
41. Soft Launch
42. Monitoring

---

# TEIL R – DEFINITION OF DONE FÜR DIE ERSTE VERÖFFENTLICHUNG

Omni Fashion ist erst dann "fertig für Release", wenn diese Aussagen alle wahr sind:

- [ ] Ein echter Nutzer kann sich registrieren.
- [ ] Der Nutzer kann sich später wieder anmelden.
- [ ] Passwort-Reset funktioniert.
- [ ] Der Nutzer kann seinen Account löschen.
- [ ] Der Nutzer kann echte Kleidungsstücke hochladen.
- [ ] Kleidungsstücke werden sicher in der Cloud gespeichert.
- [ ] Der Nutzer sieht dieselben Daten auf einem zweiten Gerät.
- [ ] Die KI analysiert reale Nutzerdaten und nicht Dummy-Daten.
- [ ] Outfit-Empfehlungen verwenden den echten Kleiderschrank.
- [ ] OmniSwap verwendet echte Nutzer und echte Listings.
- [ ] Ein vollständiger Tausch kann abgeschlossen werden.
- [ ] Nutzer können melden und blockieren.
- [ ] Push-Benachrichtigungen funktionieren.
- [ ] Keine Mock-Produkte werden als echte Shop-Angebote dargestellt.
- [ ] Datenschutzangaben stimmen mit der App überein.
- [ ] Security Rules verhindern unerlaubte Zugriffe.
- [ ] Kritische User Journeys sind automatisiert getestet.
- [ ] Android Production Build funktioniert.
- [ ] iOS Production Build funktioniert.
- [ ] TestFlight/Closed Beta wurde durchgeführt.
- [ ] Store Assets sind fertig.
- [ ] Support- und Privacy-URLs sind live.
- [ ] Keine Secrets befinden sich im Repo.
- [ ] Keine Dummy-Firebase-Konfiguration befindet sich im Release.
- [ ] Crash Reporting ist aktiv.
- [ ] Release Monitoring ist vorbereitet.

---

# TEIL S – OFFIZIELLE QUELLEN FÜR DEN RELEASE

Da Store- und SDK-Regeln sich ändern, müssen diese Quellen vor jedem Release erneut geprüft werden.

## Expo

- Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/
- EAS Build: https://docs.expo.dev/build/
- Build for stores: https://docs.expo.dev/deploy/build-project/
- Submit to stores: https://docs.expo.dev/deploy/submit-to-app-stores/
- iOS Submit: https://docs.expo.dev/submit/ios/

## Apple

- App Store Submission: https://developer.apple.com/app-store/submitting/
- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Store Connect Submission: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app
- Account Deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/

## Google Play

- Target API Requirements: https://support.google.com/googleplay/android-developer/answer/11926878
- Testing Requirements for new personal accounts: https://support.google.com/googleplay/android-developer/answer/14151465
- Account Deletion: https://support.google.com/googleplay/android-developer/answer/13327111

## Firebase

- Firebase Dokumentation: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- App Check: https://firebase.google.com/docs/app-check

---

# Letzte Regel

Wenn wir zukünftig an Omni Fashion arbeiten, soll vor jedem neuen Feature zuerst gefragt werden:

> **Hilft dieses Feature dem Kernfluss und ist die darunterliegende echte Funktion bereits fertig?**

Wenn die Antwort nein ist, bauen wir zuerst das Fundament fertig.
