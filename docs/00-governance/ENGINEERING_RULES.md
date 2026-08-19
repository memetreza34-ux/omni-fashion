# Omni Fashion – Engineering Rules

Diese Regeln gelten für alle weiteren Arbeiten an Omni Fashion. Sie ergänzen die Master-Roadmap und machen aus der bisherigen Prototyp-Entwicklung einen kontrollierten Produktentwicklungsprozess.

## 1. Definition von „fertig“

Ein Feature ist erst **DONE**, wenn alle zutreffenden Punkte erfüllt sind:

- Produktzweck ist dokumentiert.
- User Journey ist definiert.
- Datenmodell ist definiert.
- UI ist implementiert.
- echte Logik ist implementiert.
- keine produktkritische Mock-/Zufallslogik steckt im Release-Pfad.
- Loading State existiert.
- Empty State existiert.
- Error State existiert.
- Offline-/Retry-Verhalten ist definiert, wenn relevant.
- Auth-/Berechtigungsregeln sind definiert.
- Security Rules / serverseitige Validierung sind implementiert, wenn relevant.
- Datenschutzwirkung ist geprüft.
- Analytics Events sind bewusst festgelegt oder bewusst nicht nötig.
- Unit-/Integration-/E2E-Testabdeckung ist angemessen.
- Dokumentation ist aktualisiert.
- keine TypeScript-/Lint-/Build-Blocker.

Eine schöne Demo zählt als **UI COMPLETE**, nicht als **FEATURE COMPLETE**.

---

## 2. Source-of-Truth-Regel

Omni Fashion darf keine getrennten Datenwelten für denselben Gegenstand führen.

### Kleidung

```text
WardrobeItem
  ├── wird vom Stylisten verwendet
  ├── kann in Outfits referenziert werden
  ├── kann als SwapListing veröffentlicht werden
  ├── fließt in Wardrobe Analytics ein
  └── beeinflusst Smart Shopping
```

Kein separates echtes `SwapItem` mit duplizierten Kleidungsdaten, wenn das Kleidungsstück dem Nutzer bereits als `WardrobeItem` gehört.

### Nutzer

```text
Auth User
  ↓
User Profile
  ├── Style Profile
  ├── Reputation
  ├── Preferences
  └── Privacy / Settings
```

---

## 3. Architekturgrenzen

Geplante Zielstruktur:

```text
src/
├── app/                  # Routing / Screens
├── features/
│   ├── auth/
│   ├── wardrobe/
│   ├── stylist/
│   ├── swap/
│   ├── profile/
│   └── shop/
├── services/
│   ├── firebase/
│   ├── ai/
│   ├── weather/
│   ├── notifications/
│   └── analytics/
├── components/           # wirklich gemeinsam genutzte UI
├── config/
├── schemas/
├── hooks/
├── types/
└── utils/
```

Feature-Code bleibt möglichst im Feature. Externe Systeme werden über Services gekapselt, damit Firebase, KI-Provider oder Wetteranbieter später austauschbar bleiben.

---

## 4. Client ist keine Vertrauensgrenze

Die React-Native-App ist ein nicht vertrauenswürdiger Client.

Folgende Dinge dürfen nicht allein durch UI-Checks geschützt werden:

- fremde Nutzerdaten ändern
- Trade-Status verändern
- Moderationsaktionen
- Reputation verändern
- Accountdaten löschen
- sensible KI- oder Admin-Endpunkte
- bezahlte/Premium-Entitlements

Schutz erfolgt je nach Fall durch:

- Firebase Auth
- Firestore Security Rules
- Storage Security Rules
- App Check
- serverseitige Funktionen
- Schema-/Input-Validierung
- Rate Limits

---

## 5. Trusted Backend

Für Omni Fashion wird eine serverseitige Schicht vorgesehen. Nicht alles läuft direkt Client → Firestore.

Typische serverseitige Aufgaben:

- KI-Aufrufe mit geheimen API-Keys
- Bild-/Inhaltsmoderation
- kritische Trade-Transitions
- Push-Versand
- Accountlöschung / Daten-Cleanup
- Admin-/Moderationsaktionen
- geplante Jobs
- Kosten-/Abuse-Limits
- spätere Subscription-/Entitlement-Prüfung

Die genaue Technologie wird in der Architekturphase festgelegt; Firebase Functions / Cloud Run sind naheliegende Optionen, aber noch keine irreversible Entscheidung.

---

## 6. Security by Design

Security wird nicht erst kurz vor Release ergänzt.

Bei jeder neuen Collection oder Storage-Struktur werden gleichzeitig definiert:

1. Eigentümer
2. Leser
3. Schreiber
4. öffentliche Felder
5. private Felder
6. zulässige Zustandsänderungen
7. Validierungsregeln
8. Abuse-Limits

Vor Release folgt zusätzlich ein eigener Security Audit.

---

## 7. Privacy by Design

Vor Speicherung eines neuen Datentyps beantworten:

- Warum brauchen wir ihn?
- Ist er für das Feature wirklich erforderlich?
- Wie lange wird er gespeichert?
- Darf der Nutzer ihn löschen?
- Ist er öffentlich, privat oder intern?
- Wird er an Drittanbieter übertragen?
- Kann weniger präzise Information reichen?

Besonders sensibel bei Omni Fashion:

- Personen-/Kleidungsfotos
- Videos
- Körpermaße
- Standort
- Adressen
- Marketplace-Kommunikation
- Style-/Nutzungsprofile

---

## 8. KI-Regeln

KI-Ausgaben sind Vorschläge, keine Wahrheit.

Jede produktive KI-Funktion braucht, soweit relevant:

- klaren Provider-/Modellvertrag
- serverseitigen API-Aufruf
- versionierten Prompt oder Algorithmus
- strukturiertes Output-Schema
- Schema Validation
- Confidence/Unsicherheitsbehandlung
- Nutzerkorrektur
- Timeout
- Retry-Regel
- Fallback
- Kostenlimit
- Latenzziel
- Logging ohne unnötige personenbezogene Daten
- Evaluationsdatensatz

### Modellwechsel

UI und Fachlogik dürfen nicht direkt von einem einzelnen KI-Anbieter abhängen. Der Provider wird über eine Service-Schicht abstrahiert.

---

## 9. Datenversionierung und Migrationen

Produktionsdaten verändern sich über die Zeit.

Deshalb erhalten wichtige Dokumente bei Bedarf eine Schema-Version, z. B.:

```text
schemaVersion: 1
```

Jede inkompatible Datenmodelländerung braucht:

- Migrationsplan
- Rückwärtskompatibilität
- Test auf bestehenden Beispieldaten
- Rollback-Überlegung

Eine neue App-Version darf nicht voraussetzen, dass alle Nutzer sofort aktualisieren.

---

## 10. Feature Flags und Kill Switches

Riskante oder teure Funktionen sollen später remote deaktivierbar sein, z. B.:

- KI-Stylist
- neuer Outfit-Ranker
- OmniSwap
- Shop-Integration
- neue AI-Analyse

Ziel:

```text
Problem in Produktion
→ Feature deaktivieren
→ App bleibt nutzbar
→ Fix ausrollen
```

---

## 11. Rollback-Regel

Jede produktionskritische Änderung berücksichtigt:

- Kann der Client zurückgerollt werden?
- Kann das Backend alte App-Versionen weiter bedienen?
- Sind Datenmigrationen rückwärtskompatibel?
- Gibt es einen Kill Switch?
- Was passiert bei halb abgeschlossenen Trades?

---

## 12. Marketplace-Regeln

OmniSwap ist kein normaler Feed. Jeder Trade ist ein Zustandsautomat.

Statusänderungen müssen validiert sein. Beispiel:

```text
DRAFT
→ SENT
→ ACCEPTED
→ ARRANGING_EXCHANGE
→ SHIPPED / MEETUP_CONFIRMED
→ RECEIVED
→ COMPLETED
→ REVIEWED
```

Sonderfälle:

```text
DECLINED
WITHDRAWN
CANCELLED
DISPUTED
```

Nicht jede Rolle darf jeden Status setzen.

---

## 13. Admin und Moderation

Vor einem größeren OmniSwap-Launch braucht Omni Fashion interne Werkzeuge für mindestens:

- User suchen
- Listing ansehen/entfernen
- Reports ansehen
- User sperren/entsperren
- verdächtige Trades prüfen
- Moderationsgrund dokumentieren
- Audit Trail

Admin-Rechte dürfen nie durch ein Client-Flag allein vergeben werden.

---

## 14. Internationalisierung

Texte werden langfristig nicht hart in Screens verteilt.

Startsprache kann Deutsch sein, aber Architektur muss spätere Sprachen erlauben.

Mindestens trennen:

- UI-Texte
- Fehlermeldungen
- Notification-Texte
- Store-Texte
- rechtliche Texte

---

## 15. Observability

Produktionsfehler müssen nachvollziehbar sein.

Benötigt werden später:

- Crash Reporting
- Non-Fatal Error Reporting
- Release-/Build-Version
- API-Latenzen
- AI-Latenzen
- AI-Fehlerraten
- Upload-Fehlerraten
- Trade-Fehlerraten
- Kostenkennzahlen

Keine sensiblen Rohdaten unkontrolliert loggen.

---

## 16. Kosten als Architekturmerkmal

Für teure Services messen wir perspektivisch:

- Kosten pro aktivem Nutzer
- Kosten pro Wardrobe Upload
- Kosten pro AI Analyse
- Kosten pro Outfit Generation
- Storage pro Nutzer
- Firestore Reads/Writes pro Kernjourney

Eine Funktion kann technisch funktionieren und trotzdem wirtschaftlich ungeeignet sein.

---

## 17. Qualitäts-Gates

Vor Merge produktionsrelevanter Änderungen sollen langfristig automatisiert laufen:

```text
TypeScript
Lint
Unit Tests
Integration Tests
Security Rules Tests
Build
```

Vor Release zusätzlich:

```text
E2E Kernjourneys
real-device smoke tests
privacy check
security audit
store compliance check
```

---

## 18. Entscheidungsregel für neue Ideen

Vor jedem neuen Feature:

1. Unterstützt es die zentrale Omni-Fashion-Schleife?
2. Ist die darunterliegende echte Datenbasis fertig?
3. Gibt es bereits ein unfertiges Feature mit höherer Priorität?
4. Brauchen wir es für MVP, Retention oder Monetarisierung?
5. Können wir Erfolg messen?

Wenn nicht, kommt es ins Backlog statt sofort in den Code.
