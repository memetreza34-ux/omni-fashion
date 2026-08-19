# Omni Fashion – Roadmap Status

**Stand:** 19. August 2026  
**Arbeitsbranch:** `docs/app-development-a-z`  
**Draft-PR:** #1  
**Prinzip:** Diese Datei ist die verbindliche Live-Statusquelle. Nur im Repo implementierte und durch passende Quality-Gates abgesicherte Arbeit wird als technisch erledigt markiert. Reale Firebase-/EAS-/Device-/Rechts-Blocker bleiben offen.

## Legende

- ✅ technischer Kern im Repo implementiert und automatisiert abgesichert
- 🟡 belastbare technische Basis, reale Cloud-/Device-/Betriebsvalidierung offen
- 🔴 noch nicht ausreichend umgesetzt
- ⚪ bewusst später / MVP+

---

## 0. Produkt / Architektur

**Status: ✅**

- Produktloop `OWN → STYLE → SWAP → BUY BETTER`
- privater Wardrobe als Source of Truth
- MVP Scope / Nicht-Ziele / User Journeys
- Expo SDK 57 / RN 0.86.2 / React 19.2.3 / TypeScript strict
- Firebase Auth / Firestore / Storage / Functions
- Trusted Backend für AI, Marketplace, Trade, Moderation, Push, Feature Flags und Privacy
- Security / Privacy by Design
- kein Big-Bang-Rewrite
- keine Demo-Funktion wird als echte Produktfunktion ausgegeben

Produktentscheidungen offen: finaler Launch-Markt und finales Monetarisierungsmodell.

---

## 1. Repo / CI / Dependencies

**Status: ✅ interne Quality-Basis**

Implementiert:

- produktbezogenes README + `docs/`-System
- `.env.example` + typisierte Environment-Schicht
- Secrets aus Git ausgeschlossen
- Dummy-Firebase-Konfiguration entfernt
- Node 22.13.x im CI
- Expo-SDK-Kompatibilitätsgate via `expo install --check`
- Expo-Pakete auf aktuell erwarteten SDK-57-Stand ausgerichtet
- AsyncStorage auf Expo-kompatibles `2.2.0` ausgerichtet
- TypeScript strict + Zero-any
- Production-Foundation-Preflight
- Functions Typecheck + Build + Unit Tests
- Firebase Auth/Firestore/Storage Emulator Security Tests
- Expo Router Production-Webbundle-Smoke-Test
- NativeWind-v4/Babel/Metro/Tailwind-Konfiguration repariert
- Dependabot für Root npm, Functions npm und GitHub Actions

Aktueller vollständig bestätigter Code-Checkpoint nach Dependency-Ausrichtung + Onboarding:

```text
Expo SDK compatibility ✅
TypeScript / Zero-any / Foundation ✅
Functions ✅
Firebase Security Emulator ✅
Production Web Bundle ✅
```

Offen:

- ESLint Flat Config final einrichten
- Formatter final festlegen
- Dependency-Audit paketweise bearbeiten
- echte EAS Development-/Preview-Builds

**Kein** `npm audit fix --force` ohne Expo-SDK-57-Kompatibilitätsprüfung.

---

## 2. Designsystem / Accessibility / Performance

**Status: 🟡 Kernflows im Code migriert, reale Device-Audits offen**

Im Code:

- `AppButton`, `AppCard`, `StatusBanner`, semantische Tokens
- Busy / Disabled / Selected / Checked / Progress / Error States
- zentrale Mindest-Controlhöhe
- Auth / Verification / Privacy
- Onboarding
- Wardrobe Grid + ItemDetailsModal
- Style-DNA / Profil
- Stylist / Wetter / Saved Outfits / Feedback
- OmniSwap `Listing → Offer → Trade → Dispute → Review`
- Activity Inbox
- Moderation / Recovery Grundzustände
- destruktive Wardrobe-Löschbestätigung

Performance-Basis:

- Wardrobe Grid virtualisiert
- Activity Inbox virtualisiert
- bounded Queries für Notifications / Marketplace / Offers / Transactions
- Firestore-Indizes
- öffentliche Listing-URL-Caches

Extern offen:

- VoiceOver iOS
- TalkBack Android
- Dynamic Type / große Systemschrift
- Kontrast
- Keyboard/Web Focus
- Reduced Motion
- natives Performance Profiling

Detail: [`../03-design/ACCESSIBILITY.md`](../03-design/ACCESSIBILITY.md)

---

## 3. Auth / UserProfile / Onboarding

**Status: 🟡 technischer Kern fertig, reale Firebase-/Device-Validierung offen**

Implementiert:

- E-Mail/Passwort Login
- Registrierung + DisplayName
- Verification Mail / Gate / Reload / Resend Cooldown
- Passwort Reset
- Logout / Auth State Listener
- typisierte Fehlercodes
- UserProfile + Repair
- reaktiver `UserProfileProvider`
- Development UserProfile-Persistenz
- Production fail-closed ohne Firebase
- Passwort-Reauthentication für sensible Privacy-Aktionen
- vollständiger Root-State:

```text
UNAUTHENTICATED
→ UNVERIFIED
→ PROFILE LOADING/ERROR
→ NEEDS ONBOARDING
→ READY
```

Style-Onboarding:

- zwei echte Schritte
- Style + Passform
- Farben optional
- Casual/Formal + Minimal/Bold
- schreibt reales StyleProfile
- `onboardingCompleted=true` erst nach erfolgreichem StyleProfile-Save
- Development-State bleibt über Neustarts erhalten
- Security Emulator Regression: nur Profilbesitzer darf Onboarding-State ändern

Extern offen:

- reales Firebase Dev-Projekt
- native Auth-Persistenz über App-Neustart Android/iOS
- vollständiges Auth-/Onboarding-E2E auf realen Geräten
- Deep-Link-Rückkehr für Verification/Reset

Detail: [`../04-auth/AUTH_IMPLEMENTATION.md`](../04-auth/AUTH_IMPLEMENTATION.md)

---

## 4. Firebase / Security

**Status: 🟡 lokale/CI-Sicherheitsbasis stark, echtes Deployment offen**

- Default-Deny Firestore/Storage Rules
- UserProfile Shape + Ownership
- private Wardrobe
- geschützte AI-/Swap-Systemfelder
- server-only Offers / Transactions / Reports
- server-only Push / Moderation / RuntimeConfig / RateLimits
- Security Emulator Suite
- benötigte Firestore-Indizes
- App-Check-Native-Strategie ohne web-only Scheinlösung
- guarded Firebase Deploy Commands mit expliziter Project-ID

Extern offen:

- Firebase Dev + Prod Projekte
- Auth Provider aktivieren
- Rules / Storage Rules / Indizes / Functions deployen
- Secrets setzen
- App Check auf echten Builds validieren und kontrolliert enforcen
- Budget Alerts / Quotas
- TTL für `rateLimits.expiresAt`

---

## 5. Cloud Wardrobe + AI Kleidungsanalyse

**Status: 🟡 produktionsorientierter Kern implementiert**

Wardrobe:

- kanonisches `WardrobeItem`
- Firestore Live-Sync
- private Storage Uploads
- Runtime Download URLs
- echte CRUD-Fehlerzustände
- Brand / Material / Größe / Zustand / Dress
- clientseitig geschützte AI-/Swap-Felder
- virtualisiertes Grid
- semantischer Editor

AI:

- Fake-AI entfernt
- Trusted `analyzeWardrobeItem`
- Gemini Provider-Abstraktion
- Structured Output + Runtime Validation
- Confidence pro Feld
- Modell-/Prompt-Versionierung
- Brand-Halluzinationsschutz
- Owner/Storage/File Checks
- pending/completed/failed Lifecycle
- Idempotenz / Parallelaufrufschutz
- Retry-/Fehlerzustände
- Rate Limit 20/Nutzer/Stunde

Extern offen:

- echtes Gemini Secret + Functions Deployment
- Kamera-/Galerie-Device-Tests
- HEIC/HEIF
- Bild-Resize/Kompression
- Upload-Fortschritt/Cancel
- Offline/Reconnect
- AI Evaluation Dataset + reale Qualitäts-/Kostenmessung

---

## 6. StyleProfile / Stylist / Wetter

**Status: ✅ technischer Kern / 🟡 reale Qualitäts- und Provider-Validierung offen**

- echte Präferenzen + Wardrobe-Signale
- deterministische StyleProfile Engine
- Outfit Engine ausschließlich aus eigenen Wardrobe IDs
- `Top + Bottom + Shoes`
- `Dress + Shoes`
- optionale Outerwear / Accessories
- Style/Farbe/Anlass/Saison/Datenqualität Scoring
- fehlende Kategorien statt erfundener Produkte
- Saved Outfits
- Like / Dislike / Worn
- Trusted Wetterkontext
- kein Fake-Wetter
- Wetter-Signale im Ranking
- Style-Onboarding nutzt dieselbe reale StyleProfile-Domain

Extern offen:

- Nutzer-Evaluation der Outfit-Qualität
- Wetter Provider-/Quota-/Caching-Monitoring

---

## 7. OmniSwap / Trade

**Status: 🟡 echter End-to-End-Kern, reale Zwei-Device-Tests offen**

Marketplace:

- alter Mock-Hub entfernt
- private Wardrobe bleibt privat
- reduzierte öffentliche Listing-Projektion
- serverseitige öffentliche Medienkopie
- Listing Create/Pause/Resume/Remove
- echter Feed
- echte Offers
- Locks + Offer Keys
- Block-Prüfungen
- Accept/Decline/Cancel
- Query-Limits + Indizes + URL-Cache
- Listing Rate Limit 30/Stunde
- Offer Rate Limit 60/Stunde

Trade:

- Transaction Schema v2
- Fulfilment Mode pro Teilnehmer
- Versand / Empfang pro Teilnehmer
- unit-testbare State Machine
- Finalization Claim
- Zwei-Wege-Storage-Kopie + Verifikation
- atomarer `ownerId + imagePath` Tausch
- Listing erst danach `traded`
- Transaction erst danach `completed`
- retry-fähige Finalization
- Disputes
- Reviews erst nach Completion

Extern offen:

- echte Zwei-Nutzer-/Zwei-Geräte-E2E-Tests
- Shipping/Tracking nur bei späterer Produktentscheidung

---

## 8. Trust & Safety / Reviews / Moderation / Recovery

**Status: 🟡 technische Nutzer- und Betriebsbasis**

- Reports
- Block/Unblock
- Block-Filter und serverseitige Offer-Prüfung
- Disputes
- Report Rate Limit 8/Stunde
- Trade Reviews 1–5 + Kommentar
- genau eine Review/Nutzer/Trade
- `admin|moderator` Custom Claim Guard
- Report-/Dispute-Queue
- auditiertes Resolution
- `resume_trade` / `manual_recovery`
- interne UI hinter `internalModeratorUi=false`
- Recovery Queue für failed Finalizations / Disputes / Push-Probleme
- keine automatische gefährliche physische Trade-Rückabwicklung

Offen:

- Suspension/Ban Lifecycle
- Listing Takedown
- Appeals
- Evidence Attachments
- Support Case Domain
- manuelle Recovery-Aktionen + operative SLAs

---

## 9. Notifications / Push

**In-App Status: ✅**

- persistente Notifications
- idempotente Trigger
- Live Inbox + Read State
- Activity Tab
- kein Fake-Fallback
- 100-neueste Query + Index + Virtualisierung

**Remote Backend Status: 🟡**

- Register/Unregister Device
- server-only Push Collections
- explizites `pushEnabled`
- Delivery Claims
- Expo Push Tickets
- Receipt Worker
- `DeviceNotRegistered` Cleanup
- Stale Claims
- Rate Limit 20 Registrierungen/Stunde

Extern offen:

- EAS Projekt + App-Identifier
- SDK-57-konformes `expo-notifications`
- native Config / Permission Flow / Android Channel
- echte Expo Push Tokens
- physische Android/iOS Tests

---

## 10. Privacy / Account Lifecycle

**Status: 🟡 technischer Lifecycle implementiert, Recht/E2E offen**

- Trusted Datenexport
- Credentials/Tokens aus Export ausgeschlossen
- Deletion Readiness
- aktive Marketplace-Zustände blockieren Löschung
- Fresh Auth
- Passwort-Reauthentication
- doppelte destruktive Bestätigung
- private Firestore-/Storage-/Push-/Rate-Limit-Daten löschen
- gemeinsame abgeschlossene Historie pseudonymisieren/redigieren
- minimaler pseudonymer Deletion Audit
- Firebase Auth zuletzt löschen

Extern offen:

- reales Firebase E2E
- Retention Policy
- rechtliche Prüfung
- finale Privacy Policy
- Store Data Safety / Privacy Labels

---

## 11. Operations / Feature Flags / Abuse / Observability

**Status: 🟡 starke Basis**

- Remote Flags mit lokalen Defaults `false`
- Trusted `getPublicFeatureFlags`
- Key-Whitelist + fail-closed Parsing
- App-Foreground Refresh
- Kill-Switches für Shop / interne UIs
- zentrale transaktionale Rate-Limit-Primitive
- AI / Listings / Offers / Reports / Push geschützt
- RateLimits server-only
- Account Delete entfernt RateLimit-State
- provider-neutrale Telemetry Boundary
- ErrorBoundary `captureException`

Extern offen:

- Crash Provider
- Analytics Provider
- Cost/Budget Monitoring
- Abuse-Metriken
- App Check Enforcement
- Firestore TTL

---

## 12. Shop / Monetarisierung

**Status: ⚪ MVP+ bewusst deaktiviert**

- Demo-Shop entfernt
- `shopPartnerFeed=false`
- keine Fake-Produkte / Fake-Preise
- Remote Kill-Switch vorhanden

Offen:

- echte Produktquelle
- Gap-to-Shop
- Affiliate-/Partner-Regeln
- Tracking Consent
- Monetarisierungs-Evaluation

---

## 13. Release / EAS / Store

**Status: 🟡 intern stark vorbereitet, reale Infrastruktur offen**

Im Repo:

- `eas.json` Preview / Production
- Firebase/EAS Setup
- Release Candidate Checklist
- `DEVICE_E2E_PLAN.md`
- Rollback Runbook
- fail-closed Release-Config-Validator
- Foundation Preflight
- Expo Dependency Gate
- guarded Firebase Commands
- Remote Kill-Switches
- App-Check-Strategie

Extern offen:

- Expo/EAS Projekt
- Android Package / iOS Bundle ID
- Signing / Credentials
- Firebase Dev/Prod Environments
- Secrets
- echte Deployments
- Development/Internal Builds
- native Push
- App Check
- Monitoring
- Store Assets / Data Safety / Privacy Labels
- Release Candidate auf realen Geräten
- kontrollierter Rollout

---

# Nächste verbindliche Reihenfolge

```text
1. ESLint Flat Config + Formatter im Repo finalisieren
2. Dependency-Audit paketweise klassifizieren
3. Firebase Dev-Projekt real anlegen
4. Auth / Firestore / Storage konfigurieren
5. guarded Rules / Indizes / Functions Deploy
6. Gemini Secret + RuntimeConfig setzen
7. App Check im echten Development Build validieren
8. Expo/EAS Projekt + finale App-Identifier
9. native Push-/Development-Build-Abhängigkeiten
10. Android/iOS Builds
11. DEVICE_E2E_PLAN mit zwei echten Konten/Geräten
12. VoiceOver/TalkBack/Dynamic-Type/Performance
13. Monitoring / Recht / Store
14. Release Candidate
15. kontrollierter Rollout
```

## Release-Grenze

Der PR bleibt **Draft**, solange reale Firebase-/EAS-/Device-/Store-Validierung fehlt. Der technische Repo-Core ist weit fortgeschritten; das wird weiterhin nicht mit einer produktionsveröffentlichten App gleichgesetzt.
