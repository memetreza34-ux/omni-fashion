# Omni Fashion – Roadmap Status

**Stand:** 16. August 2026  
**Arbeitsbranch:** `docs/app-development-a-z`  
**Prinzip:** Diese Datei beschreibt den tatsächlichen Code-Stand. Kein Mock oder Konzept wird als produktionsfertig markiert.

## Legende

- ✅ Kern im Repo implementiert und durch aktuelle Quality-Gates abgesichert
- 🟡 technische Basis vorhanden, reale Production-/Device-Validierung oder Restarbeit offen
- 🔴 noch nicht ausreichend implementiert
- ⚪ bewusst später / MVP+

---

## Phase 0 – Produktdefinition

**Status: ✅**

- [x] Produktkern `OWN → STYLE → SWAP → BUY BETTER`
- [x] Wardrobe als Source of Truth
- [x] MVP Scope
- [x] Nicht-Ziele
- [x] User Journeys
- [x] Engineering Rules
- [x] Security/Privacy-by-Design-Prinzip
- [x] Trusted-Backend-Grenze

Offen bleibt die kommerzielle Entscheidung zu Launch-Markt und finaler Monetarisierung.

---

## Phase 1 – Zielarchitektur

**Status: ✅ Kernarchitektur**

- [x] Expo / React Native / Expo Router
- [x] TypeScript strict
- [x] Firebase Auth / Firestore / Storage / Functions
- [x] Firebase Functions 2nd Gen / Node 22
- [x] Feature-Domains statt beliebiger Firebase-Zugriffe in Screens
- [x] Trusted Backend für AI, Marketplace, Trade, Moderation und Push
- [x] kein Big-Bang-Rewrite

Noch festzulegen:

- [ ] Analytics-Anbieter
- [ ] Crash-Reporting-Anbieter
- [ ] finale Feature-Flag-Technik
- [ ] finales E2E-Tooling

---

## Phase 2 – Repo, Environments und CI

**Status: 🟡 weit fortgeschritten**

Erledigt:

- [x] Omni-Fashion-README
- [x] `.env.example`
- [x] Environment-Dateien aus Git ausgeschlossen
- [x] typisierte Expo-Public-Environment-Schicht
- [x] Dummy-Firebase-Werte entfernt
- [x] GitHub Actions Quality Workflow
- [x] Node 22.13.x
- [x] `npm ci`
- [x] TypeScript
- [x] Zero-any-Gate
- [x] Functions Typecheck + Build + Unit Tests
- [x] Firebase Auth/Firestore/Storage Emulator Security Tests
- [x] Trust-&-Safety-Regressions
- [x] Push-Infrastruktur-Regressions

Offen:

- [ ] ESLint finalisieren
- [ ] Formatter festlegen
- [ ] Build-Smoke-Test ergänzen
- [ ] echte EAS Development/Staging/Production Environments
- [ ] Dependency-Audit paketweise aufarbeiten

Bekannte Dependency-Schuld bleibt bewusst ohne `npm audit fix --force`.

---

## Phase 3 – Designsystem

**Status: 🔴**

Die bestehende Premium-UI bleibt erhalten, aber ein verbindliches Designsystem ist noch nicht fertig:

- [ ] Tokens
- [ ] gemeinsame Buttons/Inputs/Cards
- [ ] Zustandskomponenten
- [ ] einheitliche Abstände/Typografie
- [ ] Accessibility-Kontraste und Fokuszustände
- [ ] UI-Sprache konsolidieren

---

## Phase 4 – Auth und UserProfile

**Status: 🟡 Codebasis weitgehend vorhanden**

Erledigt:

- [x] echtes E-Mail/Passwort Login
- [x] Registrierung
- [x] DisplayName
- [x] E-Mail-Verifikation
- [x] Verification Gate
- [x] Verification erneut senden
- [x] Passwort-Reset
- [x] zentrale Fehlercodes
- [x] UserProfile Domain + Firestore Service
- [x] Profile Repair
- [x] Development-Demo ausschließlich Dev-only
- [x] Production fail-closed ohne Firebase

Offen:

- [ ] reale Firebase-Dev-Validierung
- [ ] native Auth-Persistenz über App-Neustart validieren
- [ ] Verification Resend Cooldown
- [ ] vollständiger Onboarding-State
- [ ] Re-Authentication für sensible Aktionen
- [ ] Trusted Account Deletion
- [ ] Auth E2E auf Android/iOS

---

## Phase 5 – Firebase Backend und Security

**Status: 🟡 lokale/CI-Sicherheitsbasis sehr weit**

Erledigt:

- [x] Firebase Service Bootstrap
- [x] Firestore / Storage / Functions
- [x] Default-Deny Rules
- [x] UserProfile Validation
- [x] private Wardrobe
- [x] geschützte AI-Systemfelder
- [x] geschützte Swap-Systemfelder
- [x] server-only Offers / Transactions
- [x] server-only Reports / Push-Infrastruktur / Moderation Audit
- [x] Storage Owner-Grenzen
- [x] Emulator-Security-Tests in CI

Production-Blocker:

- [ ] echte Firebase Dev-/Prod-Projekte
- [ ] Auth Provider in Console aktivieren
- [ ] Rules deployen
- [ ] Functions deployen
- [ ] App Check
- [ ] Budget Alerts
- [ ] reale Query-Indizes anhand Deployment validieren

---

## Phase 6 – Cloud Wardrobe

**Status: 🟡 produktionsorientierter Kern implementiert**

Erledigt:

- [x] kanonisches `WardrobeItem`
- [x] Firestore Live-Sync
- [x] private Storage Uploads
- [x] runtime Download URLs
- [x] Development-Fallback ohne Fake-Production-State
- [x] Cloud-aware Wardrobe Context
- [x] echte Create/Update/Delete-Fehlerzustände
- [x] Brand / Material / Größe / Zustand
- [x] `Dress` als echte Kategorie
- [x] AI-/Swap-Felder clientseitig geschützt

Offen:

- [ ] reale Android/iOS Kamera-/Galerie-Tests
- [ ] HEIC/HEIF-Validierung
- [ ] Bildkompression/Resize
- [ ] Upload-Fortschritt/Cancel
- [ ] Offline/Reconnect
- [ ] reales Storage-Cleanup validieren

---

## Phase 7 – Kleidungsanalyse

**Status: 🟡 echter Backendpfad implementiert**

Erledigt:

- [x] Fake-AI entfernt
- [x] `analyzeWardrobeItem` Trusted Callable
- [x] Functions-Paket mit Lockfile
- [x] Provider-Abstraktion
- [x] Gemini Development Provider
- [x] Structured Output
- [x] Runtime Validation
- [x] Confidence pro Feld
- [x] Modell-/Prompt-Versionierung
- [x] Brand-Halluzinationsschutz
- [x] Owner/Storage/Datei-Prüfungen
- [x] pending/completed/failed Lifecycle
- [x] Idempotenz/Parallelaufrufschutz
- [x] UI Retry/Confidence/Fehlerstatus
- [x] Functions Tests

Offen:

- [ ] reales Gemini Secret im Dev-Projekt
- [ ] echtes Functions Deployment
- [ ] Evaluation Dataset
- [ ] Kosten-/Qualitätsmessung mit echten Wardrobe-Bildern
- [ ] Datenschutz-/Datenresidenzentscheidung für Production

---

## Phase 8 – StyleProfile und echter Stylist

**Status: ✅ technischer Kern**

- [x] Fake Style Scan entfernt
- [x] echte Nutzerpräferenzen
- [x] Wardrobe-Signale
- [x] deterministische StyleProfile Engine
- [x] Cloud + Development-Persistenz
- [x] echter Outfit Engine aus Wardrobe IDs
- [x] `Top + Bottom + Shoes`
- [x] `Dress + Shoes`
- [x] optionale Outerwear/Accessories
- [x] Style-/Farb-/Anlass-/Saison-/Datenqualitäts-Scoring
- [x] fehlende Kategorien statt erfundener Produkte
- [x] Saved Outfits
- [x] Like / Dislike / Worn Feedback

Offen bleibt reale Produkt-/Qualitäts-Evaluation mit Nutzern.

---

## Phase 9 – Wetter

**Status: 🟡 Backend und Stylist-Integration vorhanden**

- [x] provider-neutraler Weather Context
- [x] Trusted Backend
- [x] Stadt -> Geocoding -> Wetter
- [x] kein Fake-Wetter
- [x] manueller Saison-Fallback
- [x] Wetter-Signale im Outfit-Ranking
- [x] Normalisierungs-Tests

Offen:

- [ ] reales Provider-/Quota-Monitoring
- [ ] Production-Fehler-/Cachingstrategie verifizieren

---

## Phase 10 – OmniSwap Marketplace

**Status: 🟡 echter End-to-End-Kern implementiert**

- [x] alter Mock-Hub entfernt
- [x] private Wardrobe bleibt privat
- [x] reduzierte öffentliche Listing-Projektion
- [x] serverseitige öffentliche Medienkopie
- [x] Listing erstellen / pausieren / reaktivieren / entfernen
- [x] echter Marketplace Feed
- [x] echte Offers
- [x] Locks + Offer Keys
- [x] Doppelangebote verhindert
- [x] Offer annehmen / ablehnen / zurückziehen
- [x] konkurrierende Offers laufen ab
- [x] echte Transactions

Offen:

- [ ] reale Zwei-Nutzer-E2E-Tests
- [ ] Versand-/Tracking-Provider nur falls Produktentscheidung dafür fällt

---

## Phase 11 – Zwei-Parteien-Trade und Eigentumsübertragung

**Status: ✅ technischer Kern**

- [x] Transaction Schema v2
- [x] beide Teilnehmer bestätigen Tauschweg
- [x] Versandstatus pro Teilnehmer
- [x] Empfang pro Teilnehmer
- [x] unit-testbare State Machine
- [x] Finalization Claim
- [x] sichere Zwei-Wege-Storage-Kopie
- [x] Verifikation vor Ownership Update
- [x] atomarer `ownerId + imagePath` Tausch
- [x] Listing -> traded
- [x] Transaction -> completed erst nach erfolgreicher Migration
- [x] retry-fähiger Finalization-Fehler

Production offen:

- [ ] reale Zwei-Geräte-Tests
- [ ] Recovery für seltene Storage-/Cleanup-Orphans

---

## Phase 12 – Trust & Safety und Reviews

**Status: ✅ technische Nutzerbasis**

Trust & Safety:

- [x] Listing melden
- [x] Nutzer blockieren/entblocken
- [x] Blockierte Konten aus Marketplace filtern
- [x] Offers zwischen blockierten Konten serverseitig verhindern
- [x] echte Disputes
- [x] Dispute stoppt normalen Trade-Fortschritt
- [x] Reports moderation-only
- [x] Trust-&-Safety Security Tests

Reviews:

- [x] nur nach vollständig `completed` Trade
- [x] Reviewee serverseitig aus Gegenpartei abgeleitet
- [x] genau eine Review pro Nutzer/Trade
- [x] 1–5 Rating + optionaler Kommentar
- [x] persistierter Already-Reviewed-State
- [x] Client kann Review-Dokument nicht direkt schreiben
- [x] gemeinsamer Quality-Checkpoint grün

Später:

- [ ] aggregierte Reputation
- [ ] Review-Moderation / Appeals
- [ ] Trust Score erst nach echtem Datenvolumen

---

## Phase 13 – Notifications und Push

### In-App

**Status: ✅**

- [x] persistente Notification Domain
- [x] idempotente Dedup-Keys
- [x] Swap Offer/Trade/Dispute Firestore Trigger
- [x] Live-Inbox
- [x] Ungelesen-State
- [x] serverseitiges `markNotificationRead`
- [x] Activity Tab
- [x] kein Fake-Demo-Fallback

### Remote Push Backend

**Status: 🟡 serverseitig implementiert, Native Client extern blockiert**

- [x] `registerPushDevice`
- [x] `unregisterPushDevice`
- [x] Token Hash als Device-ID
- [x] server-only Push-Infrastruktur
- [x] `pushEnabled` Opt-in-Grenze
- [x] Delivery Claim gegen Trigger-Duplikate
- [x] Expo Push Ticket Speicherung
- [x] 15-Minuten Receipt Worker
- [x] `DeviceNotRegistered` deaktiviert Token
- [x] Push-Security-Regression im Emulator
- [x] Push-Backend Quality-Checkpoint grün

Native offen:

- [ ] echtes EAS Projekt
- [ ] Android Package / iOS Bundle ID final
- [ ] SDK-57-kompatibles `expo-notifications` per `expo install`
- [ ] Config Plugin
- [ ] Android Notification Channel
- [ ] reale Permission Flow
- [ ] reale `projectId`
- [ ] echte Expo Push Token Registrierung
- [ ] physische Android/iOS Tests

---

## Phase 14 – Admin Moderation

**Status: 🟡 Trusted Backend Foundation aktiv in Arbeit**

Erledigt:

- [x] Custom-Claim Guard `admin|moderator`
- [x] Unit-Test: normale Nutzer erhalten keinen Moderationszugriff
- [x] offene Reports/Disputes serverseitig listen
- [x] Reports auditiert auflösen
- [x] Dispute speichert Vorzustand
- [x] Dispute sicher fortsetzen oder für Manual Recovery einfrieren
- [x] `moderationAudit`
- [x] kein versteckter Admin-Schalter in der Nutzer-App

Offen:

- [ ] aktueller gemeinsamer CI-Checkpoint des Moderationsblocks
- [ ] interne Moderator-Oberfläche
- [ ] Account Suspension/Ban Lifecycle
- [ ] Listing Takedown Moderationsaktion
- [ ] Appeals
- [ ] Evidence/Attachments
- [ ] Moderation Monitoring/SLA

---

## Phase 15 – Support und Recovery

**Status: 🔴 nächster Block**

- [ ] Manual-Recovery-Queue
- [ ] Storage-Cleanup-Orphans
- [ ] Push Delivery Stale-State Recovery
- [ ] Support-Fallmodell
- [ ] Trade-Recovery-Prozeduren
- [ ] Account-/Privacy-Support

---

## Phase 16 – Privacy / GDPR / Account Lifecycle

**Status: 🔴**

- [ ] Re-Authentication für sensible Aktionen
- [ ] Trusted Account Deletion
- [ ] Datenexport
- [ ] Retention Policy
- [ ] Löschung von Storage/Firestore/Push-Geräten
- [ ] Privacy Policy final
- [ ] Store Privacy Angaben

---

## Phase 17 – Shop / Monetarisierung

**Status: ⚪ MVP+ / noch nicht produktionsreif**

Die vorhandene Shop-UI ist nicht die Priorität, bevor OWN/STYLE/SWAP real deployed und validiert sind.

- [ ] echte Produktquelle
- [ ] Gap-to-Shop Verbindung
- [ ] Affiliate/Partner Regeln
- [ ] Tracking Consent
- [ ] Monetarisierungs-Evaluation

---

## Phase 18 – Qualität, Performance, Accessibility, Observability

**Status: 🔴 / teilweise**

- [x] TypeScript/Zero-any Gate
- [x] Functions Tests
- [x] Security Emulator Tests

Offen:

- [ ] E2E Tests
- [ ] Performance Profiling
- [ ] Bild-/Listen-Performance
- [ ] Accessibility Audit
- [ ] Crash Reporting
- [ ] Analytics
- [ ] Cost Monitoring
- [ ] Abuse/Rate Monitoring
- [ ] Feature Flags
- [ ] Rollback-Runbook

---

## Phase 19 – EAS / Store / Release

**Status: 🔴**

- [ ] reale Firebase Dev/Prod Environments
- [ ] EAS Projekt
- [ ] Android Package
- [ ] iOS Bundle ID
- [ ] Development Builds
- [ ] Internal Testing
- [ ] App Check
- [ ] Signing / Credentials
- [ ] Store Assets
- [ ] Privacy Labels / Data Safety
- [ ] Release Candidate
- [ ] Rollout / Monitoring / Rollback

---

# Aktuelle Reihenfolge

```text
1. Moderations-CI final grün bekommen
2. Support / Recovery
3. Privacy + Account Deletion / Datenexport
4. Designsystem + Accessibility / Performance
5. Analytics + Crash Reporting + Feature Flags
6. echte Firebase Dev-/Prod-Projekte
7. EAS + native Push-Registrierung
8. reale Android/iOS Zwei-Nutzer-E2E-Tests
9. Store-/Privacy-Vorbereitung
10. Release Candidate
```

Die Roadmap darf weiter angepasst werden, aber nur anhand des realen Omni-Fashion-Codes und realer externer Voraussetzungen.
