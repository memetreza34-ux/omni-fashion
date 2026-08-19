# Omni Fashion – App-Entwicklung von A bis Z

> **Stand:** 18. August 2026  
> **Arbeitsprinzip:** Diese Datei ist der kompakte Master-Plan. Der verbindliche Live-Ist-Stand liegt in [`docs/00-governance/ROADMAP_STATUS.md`](./docs/00-governance/ROADMAP_STATUS.md). Technische Details liegen unter [`docs/`](./docs/README.md).

## Warum diese Datei neu strukturiert wurde

Die ursprüngliche Fassung vom 16. August 2026 enthielt gleichzeitig:

- den damaligen Prototype-Audit,
- Zielarchitektur,
- Aufgabenlisten,
- Release-Checklisten,
- und einen laufenden Implementierungsstatus.

Dadurch wurden Aussagen wie „Dummy Login“, „Mock OmniSwap“ oder „keine CI“ schnell falsch, obwohl der Code längst weiter war.

Ab jetzt gilt:

1. **Dieser Master beschreibt Richtung, Reihenfolge und Definition of Done.**
2. **`ROADMAP_STATUS.md` beschreibt den tatsächlichen Code-Stand.**
3. **Detaildokumente beschreiben die konkrete Implementierung.**
4. Ein Mock oder Konzept wird niemals als produktionsfertig markiert.

---

# A – Produktkern

Omni Fashion ist kein loses Bündel aus Fashion-Screens. Die zentrale Produktschleife lautet:

```text
OWN → STYLE → SWAP → BUY BETTER
```

## OWN

Der Nutzer baut einen privaten digitalen Kleiderschrank auf.

## STYLE

Omni Fashion versteht vorhandene Kleidung, Präferenzen, Anlass und Wetter und erstellt Outfits aus echten WardrobeItems.

## SWAP

Nicht mehr benötigte eigene Kleidung kann sicher über OmniSwap angeboten und getauscht werden.

## BUY BETTER

Erst wenn der eigene Schrank und OmniSwap eine echte Lücke nicht schließen, können später reale Partner-/Shopdaten helfen.

## Source of Truth

```text
WardrobeItem
  ↓
StyleProfile / Outfit Engine
  ↓
optional SwapListing
  ↓
optional später Shop Gap
```

Ein Kleidungsstück wird nicht in jedem Feature neu erfunden.

---

# B – MVP-Grenze

## Release-1-Kern

1. Account erstellen und anmelden
2. E-Mail bestätigen / Passwort zurücksetzen
3. Kleidungsstück fotografieren oder auswählen
4. sicher in der Cloud speichern
5. Kleidungsstück analysieren und korrigieren
6. Style-Profil pflegen
7. echte Outfits aus dem eigenen Schrank generieren
8. Outfits speichern und Feedback geben
9. OmniSwap Listing aus einem eigenen WardrobeItem erstellen
10. Listings entdecken
11. Angebot senden / annehmen / ablehnen / zurückziehen
12. Trade sicher abschließen
13. melden / blockieren / Streitfall eröffnen
14. abgeschlossenen Trade bewerten
15. In-App-Aktivität erhalten
16. native Push-Benachrichtigungen nach explizitem Opt-in
17. Daten exportieren
18. Account sicher löschen

## Bewusst später

- fotorealistischer 3D-Avatar
- echtes Virtual Try-On
- großer Multi-Retailer-Shop
- Social Feed
- komplexe Premium-/Abo-Logik
- Trust Score ohne belastbare Echtdaten
- internationale Expansion vor stabilem Kernprodukt

---

# C – Verbindliche Architektur

## Client

- Expo SDK 57
- React Native 0.86.2
- React 19.2.3
- Expo Router
- TypeScript strict
- NativeWind

## Backend

- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Functions 2nd Gen
- Node 22

## Architekturregeln

- Screens enthalten keine beliebig verteilte kritische Firebase-Businesslogik.
- Kritische Mutationen laufen über Feature-Services oder Trusted Backend Commands.
- Frontend-State ist keine Sicherheitsgrenze.
- Firestore/Storage verwenden Default-Deny.
- AI-Ausgaben werden validiert.
- Trade-/Push-/AI-Pfade sind idempotent bzw. gegen Doppelverarbeitung geschützt.
- Security und Privacy werden nicht ans Projektende verschoben.

Detail: [`docs/02-architecture/TARGET_ARCHITECTURE.md`](./docs/02-architecture/TARGET_ARCHITECTURE.md)

---

# D – Environments und Secrets

Mindestens:

```text
local development
Firebase development
EAS preview/internal
Firebase production
EAS production
```

## Client-Sichtbar

Nur `EXPO_PUBLIC_*` für Werte, die im Client sichtbar sein dürfen.

## Niemals im Client

- Gemini/API Provider Secrets
- Firebase Admin Credentials
- Service Accounts
- Signing Keys
- Admin Tokens
- private Backend-Secrets

Vorlage: [`.env.example`](./.env.example)

---

# E – Auth und UserProfile

Der produktive Auth-Fluss muss enthalten:

```text
Register
→ Verification
→ Login
→ Session
→ Password Reset
→ Re-Authentication für sensible Aktionen
→ Logout
→ Account Deletion
```

## Sicherheitsregeln

- Production darf ohne Firebase-Konfiguration nicht still auf Fake-Login fallen.
- Verification wird vor App-Zugang geprüft.
- sensible Löschung verlangt frische Authentifizierung.
- Auth-Fehler werden zentral normalisiert.

Detail: [`docs/04-auth/AUTH_IMPLEMENTATION.md`](./docs/04-auth/AUTH_IMPLEMENTATION.md)

---

# F – Cloud Wardrobe

Der Wardrobe ist das wichtigste Produktobjekt.

Ein Produktions-WardrobeItem enthält unter anderem:

```text
id
ownerId
imagePath
name
category
subcategory
color / secondaryColors
brand
material
size
condition
season
styleTags
AI lifecycle / confidence / versions
Swap references
createdAt / updatedAt
schemaVersion
```

## DoD Wardrobe

- private Storage-Pfade
- Firestore Live-Sync
- Upload-/CRUD-Fehler werden sichtbar
- keine öffentliche Marketplace-Freigabe des privaten Originalpfads
- echte Device-Tests für Kamera/Galerie
- später Resize/Compression/Offline-Härtung

Detail: [`docs/06-wardrobe/CLOUD_WARDROBE.md`](./docs/06-wardrobe/CLOUD_WARDROBE.md)

---

# G – Kleidungsanalyse

Pipeline:

```text
private Wardrobe image
→ Trusted Callable
→ Ownership/File Validation
→ Vision Provider
→ Structured Output
→ Runtime Validation
→ Confidence
→ persistierter Lifecycle
→ Nutzer kann korrigieren
```

## Regeln

- keine erfundete Marke bei niedriger Sicherheit
- Schema-/Prompt-/Modellversion speichern
- pending/completed/failed sauber unterscheiden
- keine parallelen Doppelanalysen
- Kosten-/Abuse-Limit serverseitig
- echte Evaluationsdaten vor Production

Detail: [`docs/07-ai/GARMENT_ANALYSIS.md`](./docs/07-ai/GARMENT_ANALYSIS.md)

---

# H – StyleProfile und Outfit Engine

Outfits müssen aus echten Wardrobe IDs entstehen.

Inputs:

```text
Wardrobe
+ StyleProfile
+ Anlass
+ Saison
+ Wetter
+ Nutzerfeedback
```

Mindestkombinationen:

```text
Top + Bottom + Shoes
oder
Dress + Shoes
```

Optional:

```text
Outerwear
Accessories
```

Ranking darf harte Fashion-/Datenregeln, Präferenzen und Wetter kombinieren. Ein LLM ist nicht die einzige Entscheidungsinstanz.

Detail: [`docs/08-stylist/`](./docs/08-stylist/)

---

# I – Wetter

Wetter ist ein Kontextsignal, kein eigener Show-Case.

Anforderungen:

- Trusted Backend
- kein Zufallswert
- Stadt/manueller Kontext als Fallback
- Ausfall darf Stylist nicht komplett zerstören
- Provider-/Quota-/Caching-Monitoring vor Launch

---

# J – OmniSwap Marketplace

## Grundregel

```text
private WardrobeItem
→ sichere reduzierte Listing-Projektion
→ öffentliche Listing-Medienkopie
```

Das private Wardrobe-Bild wird nicht direkt öffentlich gemacht.

## Listing

- erstellen
- pausieren
- reaktivieren
- entfernen
- nur Owner darf Lifecycle steuern
- systemkritische Statuswechsel nur Backend

## Offer

- echter Requester
- echter Listing Owner
- angebotenes WardrobeItem gehört Requester
- Locks gegen Mehrfachverwendung
- Offer Keys gegen Doppelangebote
- Blocks werden serverseitig berücksichtigt

## Trade

```text
sent
→ accepted
→ fulfilment mode
→ shipped / meetup progress
→ received
→ finalization
→ completed
```

Eigentumsübertragung erst nach erfolgreicher Storage-Migration und Verifikation.

Detail: [`docs/09-omniswap/`](./docs/09-omniswap/)

---

# K – Trust & Safety

Vor größerem Marketplace-Rollout Pflicht:

- Listing melden
- Nutzer melden
- Nutzer blockieren
- Dispute
- Moderationsqueue
- Audit Trail
- Reviews nur nach echten completed Trades
- Rate Limits
- Support/Recovery

Feature Flags dürfen Moderationsrechte niemals ersetzen.

Detail: [`docs/11-moderation/`](./docs/11-moderation/)

---

# L – Notifications und Push

## In-App

Persistente Notifications für relevante Offer-/Trade-/Dispute-Ereignisse.

## Remote Push

Push ist eine zusätzliche Delivery-Schicht, nicht die einzige Quelle der Wahrheit.

Anforderungen:

- Opt-in
- echte Expo Push Tokens
- deduplizierte Delivery Claims
- Tickets
- Receipts
- `DeviceNotRegistered` Cleanup
- native Android/iOS Permission-/Credential-Tests

Detail: [`docs/10-notifications/`](./docs/10-notifications/)

---

# M – Privacy und Account Lifecycle

Account-Löschung darf nicht einfach nur `deleteUser()` aufrufen.

Sicherer Ablauf:

```text
Fresh Auth
→ offene Swap-Blocker prüfen
→ private Daten löschen
→ privaten Storage löschen
→ gemeinsame historische Marketplace-Daten pseudonymisieren/redigieren
→ technische Userdaten entfernen
→ Audit minimal/pseudonym
→ Firebase Auth zuletzt löschen
```

Zusätzlich:

- Datenexport
- Retention Policy
- Privacy Policy
- Store Data Safety / Privacy Labels
- reale E2E-Löschtests

Detail: [`docs/13-privacy/`](./docs/13-privacy/)

---

# N – Feature Flags und Rollback

Aktuelle Kill-Switch-Grenzen:

```text
nativePushRegistration
internalModeratorUi
shopPartnerFeed
photorealisticTryOn
```

Alle sicheren Defaults sind `false`.

Remote Config läuft über Trusted Backend. Unbekannte/ungültige Werte dürfen kein Feature aktivieren.

Detail: [`docs/14-operations/FEATURE_FLAGS.md`](./docs/14-operations/FEATURE_FLAGS.md)

---

# O – Abuse und Cost Control

Aktuelle Startlimits:

| Aktion                  |               Grenze |
| ----------------------- | -------------------: |
| Kleidungsanalyse        | 20 / Nutzer / Stunde |
| Listing erstellen       | 30 / Nutzer / Stunde |
| Offer senden            | 60 / Nutzer / Stunde |
| Report senden           |  8 / Nutzer / Stunde |
| Push-Gerät registrieren | 20 / Nutzer / Stunde |

Rate-Limit-State ist server-only und wird bei Account-Löschung entfernt.

Detail: [`docs/14-operations/RATE_LIMITS.md`](./docs/14-operations/RATE_LIMITS.md)

---

# P – App Check

App Check wird nicht als web-only Scheinlösung in die native App eingebaut.

Ziel:

```text
Android → Play Integrity
Apple → App Attest / DeviceCheck
Web → reCAPTCHA Enterprise, falls Web öffentlich angeboten wird
```

Enforcement erst nach echtem EAS Development Build, gültigen Tokens, Metriken und Dev-E2E.

Detail: [`docs/05-backend/APP_CHECK_STRATEGY.md`](./docs/05-backend/APP_CHECK_STRATEGY.md)

---

# Q – Designsystem, Accessibility und Performance

## Design

Gemeinsame Primitives statt jedes Mal neue Button/Card/Status-Implementierungen.

## Accessibility

Vor Release auf echten Geräten prüfen:

- Touch Targets
- VoiceOver / TalkBack
- Dynamic Type
- Kontrast
- Fokus-Reihenfolge
- Form Labels
- Reduced Motion

## Performance

- große Listen virtualisieren
- Queries begrenzen/paginieren
- Bilder cachen/optimieren
- langsame Geräte testen
- schlechtes Netz testen
- Firestore-/Functions-Kosten beobachten

Detail: [`docs/03-design/`](./docs/03-design/) und [`docs/14-quality/`](./docs/14-quality/)

---

# R – Quality Gates

Der Arbeitsbranch muss mindestens diese automatisierten Gates bestehen:

```text
TypeScript strict + Zero-any
Expo Router Production Bundle
Functions Typecheck + Build + Unit Tests
Firebase Auth/Firestore/Storage Emulator Security Tests
```

Ein grüner Typecheck allein bedeutet nicht „Production fertig“.

Reale Android-/iOS-E2E-Tests bleiben zusätzlicher Release-Blocker.

---

# S – EAS und reale Infrastruktur

Intern vorbereitet:

- `eas.json`
- Preview/Production Trennung
- Release-Config-Validator
- Firebase/EAS Setup-Anleitung
- Release Checklist
- Rollback Runbook

Noch real einzurichten:

```text
Firebase Dev
Firebase Production
Rules / Storage Rules / Indizes
Functions
Secrets
RuntimeConfig
App Check
Expo/EAS Projekt
Android Package ID
iOS Bundle ID
Signing/Credentials
native Development Builds
native Push
```

Detail: [`docs/15-release/`](./docs/15-release/)

---

# T – Realer Zwei-Nutzer-E2E-Pfad

Vor Release muss mindestens dieser Ablauf auf echten Geräten funktionieren:

```text
Nutzer A registriert sich
→ bestätigt E-Mail
→ lädt Kleidung hoch
→ AI analysiert
→ Stylist nutzt das Item
→ A erstellt OmniSwap Listing

Nutzer B registriert sich
→ besitzt eigenes Item
→ sieht Listing von A
→ sendet Offer

A akzeptiert
→ beide wählen Fulfilment
→ beide bestätigen Fortschritt
→ beide bestätigen Empfang
→ Eigentum/Storage wird sicher übertragen
→ Trade completed
→ Review möglich
→ Notifications korrekt
```

Danach zusätzlich:

```text
Block / Report / Dispute
Account Export
Account Deletion
Offline / Reconnect
Push
```

---

# U – Monitoring und Operations

Vor Production erforderlich:

- Crash Reporting
- Non-fatal Errors
- Functions Error Rate / Latenz
- AI Kosten
- Firestore Reads/Writes
- Storage Kosten
- Rate-Limit Hits
- Abuse/Moderation Queue
- Push Delivery Fehler
- Release-Version in Telemetry
- Budget Alerts

Keine personenbezogenen oder sensiblen Daten unnötig loggen.

---

# V – Recht und Store

Vor Submission final prüfen:

- Datenschutzerklärung
- Anbieter-/Impressumsanforderungen
- Nutzungsbedingungen
- Marketplace-Regeln
- Retention Policy
- Auftragsverarbeiter / Provider
- KI-Verarbeitung
- Analytics/Crash Provider
- Apple App Privacy
- Google Play Data Safety
- Account-Löschanforderungen
- Support URL
- Privacy URL

Store-Regeln sind zeitabhängig und müssen unmittelbar vor dem Release erneut aus offiziellen Quellen verifiziert werden.

---

# W – Shop und Monetarisierung

Shop bleibt deaktiviert, solange keine echte Produktquelle existiert.

Kein:

- Fake-Preis
- Fake-Rabatt
- Fake-Zalando-/Nike-/Shop-Angebot
- erfundener Affiliate-Link

Erst später:

```text
Wardrobe Gap
→ OmniSwap prüfen
→ echte Partnerprodukte
→ Nutzen für neue Outfits berechnen
→ transparente Partner-/Tracking-Regeln
```

---

# X – Release Candidate

Ein RC wird erst erzeugt, wenn keine neuen Features mehr hineingeschoben werden.

Nur noch:

- Security
- Privacy
- Crash-/Blocker-Fixes
- Store-Blocker
- kritische Accessibility-/Performance-Probleme

Release Checklist: [`docs/15-release/`](./docs/15-release/)

---

# Y – Rollout

Empfohlene Reihenfolge:

```text
Local
→ Firebase Dev
→ EAS Development Build
→ internes Zwei-Nutzer-E2E
→ Preview/Internal Testing
→ Closed Beta / TestFlight
→ Release Candidate
→ kontrollierter Production Rollout
→ Monitoring
```

Nicht direkt vom lokalen Entwicklungsstand zu 100 % Production springen.

---

# Z – Definition of Done für Release 1

Omni Fashion ist erst dann Release-1-fertig, wenn **alle** relevanten Aussagen wahr sind:

- [ ] echte Firebase Dev- und Production-Umgebung existieren
- [ ] Auth läuft auf echten Geräten stabil
- [ ] Session-Persistenz ist auf Android/iOS validiert
- [ ] Wardrobe Upload/CRUD/Sync funktioniert auf zwei Geräten
- [ ] AI analysiert echte Bilder über deploytes Trusted Backend
- [ ] Outfit Engine verwendet echte WardrobeItems
- [ ] Wetterfehler werden sicher behandelt
- [ ] OmniSwap Zwei-Nutzer-Trade ist End-to-End getestet
- [ ] Trust & Safety funktioniert
- [ ] Reviews funktionieren nur nach completed Trade
- [ ] In-App Notifications funktionieren
- [ ] native Push funktioniert auf physischen Android-/iOS-Geräten
- [ ] Account Export funktioniert
- [ ] Account-Löschung ist real E2E getestet
- [ ] Security Rules sind deployed und getestet
- [ ] App Check ist auf echten Clients validiert und kontrolliert enforced
- [ ] Rate Limits und Abuse Monitoring sind aktiv
- [ ] Crash Reporting ist aktiv
- [ ] Cost/Budget Monitoring ist aktiv
- [ ] kritische Accessibility-Prüfungen sind auf Geräten erfolgt
- [ ] Performance ist auf realistischen Datenmengen geprüft
- [ ] keine Demo-/Mock-Produkte werden als echt dargestellt
- [ ] keine Secrets befinden sich im Client oder Repo
- [ ] Android Production Build funktioniert
- [ ] iOS Production Build funktioniert
- [ ] Store-Metadaten und Datenschutzangaben entsprechen der echten App
- [ ] Support-/Privacy-URLs sind live
- [ ] Beta/TestFlight bzw. erforderliche Store-Testphasen sind abgeschlossen
- [ ] Rollback-Plan wurde geprüft
- [ ] Release Monitoring ist bereit

---

# Aktuelle nächste Reihenfolge

Die aktuelle Implementierungsreihenfolge wird **nicht mehr** aus alten Checkboxes in diesem Master abgeleitet. Verbindlich ist der Live-Status:

[`docs/00-governance/ROADMAP_STATUS.md`](./docs/00-governance/ROADMAP_STATUS.md)

Der nächste große Pfad ist derzeit:

```text
Firebase Dev real anlegen
→ Rules / Indizes / Functions / Secrets deployen
→ RuntimeConfig + App Check vorbereiten
→ EAS + finale App-Identifier
→ native Builds + Push
→ reales Zwei-Nutzer-E2E
→ Monitoring + Recht + Store
→ Release Candidate
```

## Letzte Regel

Vor jedem neuen Feature fragen wir:

> **Verbessert es den Kernfluss – und ist die darunterliegende echte Funktion bereits zuverlässig?**

Wenn nein, wird zuerst das Fundament fertig gemacht.
