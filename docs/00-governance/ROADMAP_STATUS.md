# Omni Fashion – Roadmap Status

**Stand:** 18. August 2026  
**Arbeitsbranch:** `docs/app-development-a-z`  
**Draft-PR:** #1  
**Prinzip:** Diese Datei ist die verbindliche Live-Statusquelle. Detailimplementierungen stehen in den jeweiligen `docs/`-Bereichen. Kein Mock, Konzept oder externer Blocker wird als produktionsfertig markiert.

## Legende

- ✅ technischer Kern im Repo implementiert und über aktuelle Quality-Gates abgesichert
- 🟡 belastbare Basis vorhanden, reale Production-/Device-/Betriebsvalidierung offen
- 🔴 noch nicht ausreichend umgesetzt
- ⚪ bewusst später / MVP+

---

## 0. Produkt und Architektur

**Status: ✅**

- Produktloop `OWN → STYLE → SWAP → BUY BETTER`
- Wardrobe als private Source of Truth
- MVP Scope / Nicht-Ziele / User Journeys
- Expo SDK 57 / React Native / Expo Router / TypeScript strict
- Firebase Auth / Firestore / Storage / Functions
- Trusted Backend für AI, Marketplace, Trade, Moderation, Push, Feature Flags und Privacy
- Security/Privacy by Design
- kein Big-Bang-Rewrite
- keine Demo-Funktion wird als echte Produktfunktion ausgegeben

Offen bleiben Produktentscheidungen zu finalem Launch-Markt und Monetarisierung.

---

## 1. Repo / CI / Build

**Status: ✅ interne Quality-Basis**

Implementiert:

- produktbezogenes README + Dokumentationssystem
- `.env.example` + typisierte Environment-Schicht
- Secrets aus Git ausgeschlossen
- Dummy-Firebase-Konfiguration entfernt
- Node 22.13.x
- TypeScript strict + Zero-any Gate
- Functions Typecheck + Build + Unit Tests
- Firebase Auth/Firestore/Storage Emulator Security Tests
- Expo Router Production-Webbundle-Smoke-Test
- NativeWind-v4/Babel/Metro/Tailwind-Konfiguration repariert

Der kombinierte Kern-UI-Head `00f2a385a331e075c5c104fcb6f9b74006dcc4f2` war auf allen vier Hauptjobs grün.

Offen:

- ESLint final konsolidieren
- Formatter festlegen
- Dependency-Audit paketweise bearbeiten
- echte EAS Development-/Preview-Builds

**Kein** `npm audit fix --force` ohne Expo-SDK-57-Kompatibilitätsprüfung.

---

## 2. Designsystem / Accessibility / Performance

**Status: 🟡 Kernflows im Code migriert, reale Device-Audits offen**

Designsystem:

- `AppButton`
- `AppCard`
- `StatusBanner`
- semantische Tokens
- Busy/Disabled States
- zentrale Mindest-Controlhöhe

Accessibility im Code umgesetzt für:

- Auth / Registrierung / Passwort Reset
- E-Mail-Verifikations-Gate
- Privacy / Account Lifecycle
- Wardrobe Grid und ItemDetailsModal
- Style-DNA / Profil
- Stylist / Wetter / Saved Outfits / Feedback
- OmniSwap Listing → Offer → Trade → Dispute → Review
- Aktivitäts-Inbox
- Moderation / Recovery Grundzustände

Zusätzliche Safety-Härtung:

- Wardrobe-Item-Löschung verlangt explizite destruktive Bestätigung
- kritische Marketplace-Aktionen melden Busy/Disabled/Selected/Checked/Progress semantisch

Performance:

- Wardrobe Grid virtualisiert
- Activity Inbox virtualisiert
- Notifications auf 100 neueste Datensätze begrenzt
- Marketplace + eigene Listings auf 100 begrenzt
- Offer-/Transaction-Historien auf 100 begrenzt
- serverseitige Sortierung + Firestore-Indizes
- Cache für öffentliche Listing-Download-URLs

Noch offen vor Production:

- VoiceOver End-to-End auf iOS
- TalkBack End-to-End auf Android
- Dynamic Type / große Systemschrift
- Kontrast-Audit
- Keyboard/Web Focus Audit
- Reduced Motion
- natives Performance Profiling

Detail: [`../03-design/ACCESSIBILITY.md`](../03-design/ACCESSIBILITY.md)

---

## 3. Auth / UserProfile

**Status: 🟡 technischer Kern fertig, reale Firebase-/Device-Validierung offen**

Implementiert:

- E-Mail/Passwort Login
- Registrierung + DisplayName
- E-Mail-Verifikation + Verification Gate
- Verification Resend + 60-Sekunden-Cooldown
- Passwort-Reset
- zentrale Fehlercodes
- UserProfile + Repair
- Dev-Demo ausschließlich Development
- Production fail-closed ohne Firebase
- Passwort-Reauthentication für sensible Privacy-Aktionen

Offen:

- reales Firebase Dev-Projekt
- native Auth-Persistenz über App-Neustart
- vollständiger Onboarding-State
- Android/iOS Auth E2E

---

## 4. Firebase / Security

**Status: 🟡 lokale/CI-Sicherheitsbasis stark, echtes Deployment offen**

Implementiert:

- Auth / Firestore / Storage / Functions Bootstrap
- Default-Deny Firestore Rules
- Default-Deny Storage Rules
- private Wardrobe
- geschützte AI-/Swap-Systemfelder
- server-only Offers / Transactions / Reports
- server-only Push / Moderation / RuntimeConfig / RateLimits
- Security Emulator Suite
- benötigte Firestore Feed-Indizes
- App-Check-Migrationsstrategie ohne web-only Scheinlösung

Extern offen:

- Firebase Dev + Production Projekte
- Auth Provider aktivieren
- Rules / Storage Rules / Indizes deployen
- Functions deployen
- Secrets setzen
- App Check auf echten Android-/iOS-Builds validieren
- App Check kontrolliert enforcen
- Budget Alerts / Quotas
- TTL für `rateLimits.expiresAt`

Detail: [`../05-backend/APP_CHECK_STRATEGY.md`](../05-backend/APP_CHECK_STRATEGY.md)

---

## 5. Cloud Wardrobe + Kleidungsanalyse

**Status: 🟡 produktionsorientierter Kern implementiert**

Wardrobe:

- kanonisches `WardrobeItem`
- Firestore Live-Sync
- private Storage Uploads
- Runtime Download URLs
- echte Create/Update/Delete-Fehlerzustände
- Brand / Material / Größe / Zustand / Dress
- AI-/Swap-Felder clientseitig geschützt
- virtualisiertes Grid
- semantischer Item-Editor

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
- Rate Limit 20 Analysen pro Nutzer/Stunde

Offen:

- echtes Gemini Secret + Functions Deployment
- Kamera-/Galerie-Device-Tests
- HEIC/HEIF-Validierung
- Bild-Resize/Kompression
- Upload-Fortschritt/Cancel
- Offline/Reconnect
- AI Evaluation Dataset + Kosten-/Qualitätsmessung

---

## 6. StyleProfile / Stylist / Wetter

**Status: ✅ technischer Stylist-Kern / 🟡 reale Qualitäts- und Provider-Validierung offen**

Implementiert:

- Fake Style Scan entfernt
- echte Präferenzen + Wardrobe-Signale
- deterministische StyleProfile Engine
- echte Outfit Engine aus Wardrobe IDs
- `Top + Bottom + Shoes`
- `Dress + Shoes`
- optionale Outerwear/Accessories
- Style/Farbe/Anlass/Saison/Datenqualität Scoring
- fehlende Kategorien statt erfundener Produkte
- Saved Outfits
- Like / Dislike / Worn Feedback
- Trusted Wetterkontext
- kein Fake-Wetter
- Wetter-Signale im Ranking
- vollständige Kern-Control-A11y-Migration

Offen:

- reale Nutzer-Evaluation der Outfit-Qualität
- Wetter Provider-/Quota-/Caching-Monitoring

---

## 7. OmniSwap Marketplace / Trade

**Status: 🟡 echter End-to-End-Kern, reale Zwei-Nutzer-Device-Tests offen**

Marketplace:

- Mock-Hub entfernt
- private Wardrobe bleibt privat
- reduzierte öffentliche Listing-Projektion
- serverseitige öffentliche Medienkopie
- Listing Create/Pause/Resume/Remove
- echter Marketplace Feed
- echte Offers
- Locks + Offer Keys
- Block-Prüfungen
- Offer Accept/Decline/Cancel
- Query-Limits + Indizes + URL-Cache
- Listing Rate Limit 30/Stunde
- Offer Rate Limit 60/Stunde

Trade:

- Transaction Schema v2
- Tauschweg pro Teilnehmer
- Versand/Empfang pro Teilnehmer
- unit-testbare State Machine
- Finalization Claim
- sichere Zwei-Wege-Storage-Kopie + Verifikation
- atomarer `ownerId + imagePath` Tausch
- Listing erst danach `traded`
- Transaction erst danach `completed`
- retry-fähige Finalization

Kern-A11y technisch bestätigt für:

```text
Listing → Offer → Trade → Dispute → Review
```

Offen:

- reale Zwei-Nutzer-/Zwei-Geräte-E2E-Tests
- Shipping/Tracking nur falls spätere Produktentscheidung

---

## 8. Trust & Safety / Reviews / Moderation / Recovery

**Status: 🟡 technische Nutzer- und Betriebsbasis**

Trust & Safety:

- Listing/User melden
- Nutzer blockieren/entblocken
- Blockfilter im Marketplace
- serverseitige Offer-Blockprüfung
- Disputes stoppen normalen Trade-Fortschritt
- Reports moderation-only
- Report Rate Limit 8/Stunde

Reviews:

- nur nach vollständig abgeschlossenem Trade
- Reviewee aus Gegenpartei
- 1–5 + optionaler Kommentar
- genau eine Review pro Nutzer/Trade

Moderation:

- Custom Claim Guard `admin|moderator`
- Report-/Dispute-Queue
- auditiertes Resolution
- `resume_trade`
- `manual_recovery`
- `moderationAudit`
- interne UI hinter `internalModeratorUi=false`
- UI ersetzt niemals serverseitige Claims

Recovery:

- failed Finalizations sichtbar
- Manual-Recovery Disputes sichtbar
- Push-Probleme sichtbar
- read-only interne Recovery-UI
- Cleanup ausschließlich inaktiver öffentlicher Listing-Medien
- keine gefährliche automatische physische Rückabwicklung

Offen:

- Account Suspension/Ban Lifecycle
- Listing Takedown
- Appeals
- Evidence Attachments
- Support Case Domain
- echte manuelle Recovery-Aktionen + Betriebs-Runbooks

---

## 9. Notifications / Push

### In-App

**Status: ✅**

- persistente Notification Domain
- idempotente Offer/Trade/Dispute Trigger
- Live-Inbox
- Read State
- Activity Tab
- kein Fake-Demo-Fallback
- 100-neueste Query + Index
- virtualisierte Liste

### Remote Push Backend

**Status: 🟡 Backend implementiert, Native extern offen**

- Register/Unregister Push Device
- Token Hash Device ID
- server-only Push Collections
- `pushEnabled` Opt-in
- Delivery Claim
- Expo Push Tickets
- Receipt Worker
- `DeviceNotRegistered` Cleanup
- Stale Claim Markierung
- Rate Limit 20 Registrierungen/Stunde

Native offen:

- EAS Projekt
- Android Package / iOS Bundle ID
- SDK-57-konformes `expo-notifications`
- Notification Channel / Permission Flow
- echte EAS `projectId`
- physische Android/iOS Tests

---

## 10. Privacy / Account Lifecycle

**Status: 🟡 technischer Lifecycle implementiert, Recht/E2E offen**

Implementiert:

- Trusted Datenexport
- Sicherheits-Credentials aus Export ausgeschlossen
- Deletion Readiness
- aktive Listings/Offers/Trades/Locks blockieren Löschung
- Fresh Auth über `auth_time`
- Passwort-Reauthentication
- exakte Löschbestätigung + zweite destruktive Bestätigung
- private Firestore-Daten löschen
- privater Storage Prefix löschen
- Push-/Rate-Limit-State löschen
- gemeinsame abgeschlossene Marketplace-Historie pseudonymisieren/redigieren
- minimaler pseudonymer Deletion Audit
- Firebase Auth zuletzt löschen

Offen:

- reale Firebase Dev-E2E-Tests
- finale Retention Policy
- rechtliche Prüfung der historischen Pseudonymisierung
- finale Privacy Policy
- Store Data Safety / Privacy Labels

---

## 11. Feature Flags / Abuse Control / Observability

**Status: 🟡 starke Operations-Grundlage**

Feature Flags:

- typisierte Keys
- alle lokalen Defaults `false`
- Trusted `getPublicFeatureFlags`
- Whitelist bekannter Boolean-Keys
- invalid/missing → alles `false`
- direkter Client-Zugriff auf `runtimeConfig` verboten
- React Provider
- Refresh bei App-Foreground
- Shop/Moderation/Recovery reaktiv verdrahtet

Rate Limits:

- zentrale transaktionale Firestore-Primitive
- Unit Tests für Window/Increment/Block/Reset
- AI / Listings / Offers / Reports / Push-Registrierung geschützt
- `rateLimits` server-only + Emulator-Test
- Account Deletion entfernt Rate-Limit-State
- `expiresAt` für spätere TTL vorbereitet

Observability:

- provider-neutrale Telemetry Boundary
- ErrorBoundary `captureException`
- Raw Error Details nur Development

Offen:

- echter Crash Provider
- Analytics Provider
- Cost/Budget Monitoring
- Abuse-/Rate-Limit-Metriken
- App Check
- Firestore TTL aktivieren

---

## 12. Shop / Monetarisierung

**Status: ⚪ MVP+ / bewusst deaktiviert**

- hartcodierter Demo-Shop entfernt
- Shop Tab hinter `shopPartnerFeed=false`
- direkter Screen zeigt keine Fake-Produkte/Preise
- Remote Kill-Switch vorhanden

Offen:

- echte Produktquelle
- Gap-to-Shop Verbindung
- Affiliate-/Partner-Regeln
- Tracking Consent
- Monetarisierungs-Evaluation

---

## 13. EAS / Release / Store

**Status: 🟡 intern vorbereitet, reale Infrastruktur offen**

Im Repo:

- `eas.json` mit Preview-/Production-Environments
- Firebase/EAS Setup-Anleitung
- Release Candidate Checklist
- Rollback Runbook
- fail-closed Release-Config-Validator
- Production-Webbundle CI Gate
- Remote Feature Flags als Kill-Switch
- Rate-Limit-/Abuse-Doku
- App-Check-Strategie

Extern offen:

- reales Expo/EAS Projekt
- finale Android Package ID
- finale iOS Bundle ID
- Signing / Credentials
- Firebase Dev/Prod Environment Variablen
- Gemini Secret
- echte Deployments
- Development-/Internal Builds
- native Push
- App Check
- Monitoring
- Store Assets
- Data Safety / Privacy Labels
- Release Candidate auf realen Geräten
- kontrollierter Rollout

---

# Nächste verbindliche Reihenfolge

Der größte verbleibende Sprung ist **reale Infrastruktur und Device-Validierung**, nicht ein weiterer Demo-Screen.

```text
1. Firebase Dev-Projekt real anlegen
2. Auth + Firestore + Storage konfigurieren
3. Rules / Indizes / Functions deployen
4. Gemini Secret + RuntimeConfig setzen
5. App Check im echten Development Build validieren
6. Expo/EAS Projekt + finale App-Identifier festlegen
7. native Push-/Development-Build-Abhängigkeiten installieren
8. echte Android/iOS Builds erzeugen
9. Zwei-Nutzer-E2E:
   Auth → Wardrobe → AI → Stylist → OmniSwap → Trade → Review → Privacy
10. VoiceOver/TalkBack/Dynamic-Type/Performance Device-Audits
11. Crash/Analytics/Cost Monitoring aktivieren
12. Recht / Store-Metadaten finalisieren
13. Release Candidate
14. kontrollierter Store-Rollout
```

## Release-Grenze

Der PR bleibt **Draft**, solange reale Firebase-/EAS-/Device-/Store-Validierung fehlt. Der technische Repo-Core ist weit fortgeschritten, aber das ist nicht gleichbedeutend mit einer produktionsveröffentlichten App.
