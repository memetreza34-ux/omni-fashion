# Omni Fashion – Roadmap Status

**Stand:** 16. August 2026  
**Arbeitsbranch:** `docs/app-development-a-z`  
**Prinzip:** Nur realer Code wird als umgesetzt markiert. Externe Firebase-/EAS-/Device-/Rechts-Blocker bleiben offen.

## Legende

- ✅ technischer Kern implementiert und durch Quality-Gates abgesichert
- 🟡 belastbare Basis vorhanden, Production-/Device-/Restarbeit offen
- 🔴 noch nicht ausreichend umgesetzt
- ⚪ bewusst später / MVP+

---

## 0. Produktdefinition

**Status: ✅**

- [x] `OWN → STYLE → SWAP → BUY BETTER`
- [x] Wardrobe als Source of Truth
- [x] MVP Scope / Nicht-Ziele
- [x] User Journeys
- [x] Engineering Rules
- [x] Security/Privacy by Design
- [x] Trusted-Backend-Grenzen

Offen: finaler Launch-Markt und Monetarisierungsmodell.

---

## 1. Zielarchitektur

**Status: ✅ Kernarchitektur**

- [x] Expo SDK 57 / React Native / Expo Router
- [x] TypeScript strict
- [x] Firebase Auth / Firestore / Storage / Functions
- [x] Functions 2nd Gen / Node 22
- [x] Feature-Domains
- [x] Trusted Backend für AI, Swap, Moderation, Push und Privacy
- [x] kein Big-Bang-Rewrite

Offen:

- [ ] finaler Analytics-Anbieter
- [ ] finaler Crash-Anbieter
- [ ] finales E2E-Tooling

---

## 2. Repo / CI / Build

**Status: 🟡 weit fortgeschritten**

- [x] README / Docs-System
- [x] `.env.example`
- [x] Dummy-Firebase-Konfiguration entfernt
- [x] typisierte Expo-Environment-Schicht
- [x] Node 22.13.x
- [x] `npm ci`
- [x] TypeScript Gate
- [x] Zero-any Gate
- [x] Functions Typecheck + Build + Unit Tests
- [x] Firebase Emulator Security Tests
- [x] Trust-&-Safety Regression
- [x] Push Regression
- [x] echter Expo Router Production-Webbundle-Smoke-Test
- [x] NativeWind-v4/Babel/Metro/Tailwind-Fehler durch Smoke-Test gefunden und behoben

Offen:

- [ ] ESLint finalisieren
- [ ] Formatter festlegen
- [ ] EAS Development/Staging/Production Environments
- [ ] Dependency Audit paketweise aufarbeiten

Kein `npm audit fix --force` ohne Expo-SDK-57-Kompatibilitätsprüfung.

---

## 3. Designsystem / Accessibility

**Status: 🟡 Grundlage implementiert**

- [x] semantische Design Tokens
- [x] `AppButton`
- [x] `AppCard`
- [x] `StatusBanner`
- [x] 48px normale Mindest-Controlhöhe
- [x] Busy/Disabled Accessibility State
- [x] Privacy auf Primitives migriert
- [x] ErrorBoundary auf Primitives + Telemetry migriert
- [x] Wardrobe-/Activity-Grundlabels und Progress-Semantik

Offen:

- [ ] OmniSwap Controls migrieren
- [ ] Auth Controls migrieren
- [ ] Stylist/Profile Controls migrieren
- [ ] vollständiger VoiceOver/TalkBack Audit
- [ ] Dynamic Type
- [ ] Farbkontrast-Audit
- [ ] Keyboard/Web Focus
- [ ] Reduced Motion

---

## 4. Auth / UserProfile

**Status: 🟡 Codebasis weitgehend vorhanden**

- [x] Login
- [x] Registrierung
- [x] DisplayName
- [x] E-Mail-Verifikation + Gate
- [x] Verification erneut senden
- [x] Passwort-Reset
- [x] zentrale Fehlercodes
- [x] UserProfile + Repair
- [x] Dev-Demo nur Development
- [x] Production fail-closed ohne Firebase
- [x] Passwort-Reauthentication für sensible Privacy-Aktion

Offen:

- [ ] reales Firebase Dev-Projekt validieren
- [ ] native Auth-Persistenz über Neustart
- [ ] Verification Resend Cooldown
- [ ] vollständiger Onboarding-State
- [ ] Auth E2E Android/iOS

---

## 5. Firebase / Security

**Status: 🟡 lokale/CI-Sicherheitsbasis stark**

- [x] Auth / Firestore / Storage / Functions Bootstrap
- [x] Default-Deny Firestore
- [x] Default-Deny Storage
- [x] private Wardrobe
- [x] geschützte AI-/Swap-Systemfelder
- [x] server-only Offers / Transactions
- [x] server-only Reports / Push / Moderation Audit
- [x] Security Emulator Suite
- [x] benötigte Feed-Indizes im Repo

Production offen:

- [ ] echte Dev-/Prod-Projekte
- [ ] Rules deployen
- [ ] Functions deployen
- [ ] App Check
- [ ] Budget Alerts
- [ ] reale Indizes nach Deployment validieren

---

## 6. Cloud Wardrobe

**Status: 🟡 produktionsorientierter Kern**

- [x] kanonisches WardrobeItem
- [x] Firestore Live-Sync
- [x] private Storage Uploads
- [x] runtime Download URLs
- [x] Cloud-aware Context
- [x] echte Fehlerzustände
- [x] Brand / Material / Größe / Zustand
- [x] `Dress`
- [x] AI-/Swap-Felder geschützt
- [x] virtualisiertes 2-Spalten-Grid

Offen:

- [ ] reale Kamera-/Galerie-Device-Tests
- [ ] HEIC/HEIF
- [ ] Resize/Compression
- [ ] Upload Progress/Cancel
- [ ] Offline/Reconnect

---

## 7. Kleidungsanalyse

**Status: 🟡 echter Backendpfad**

- [x] Fake-AI entfernt
- [x] Trusted Callable
- [x] Provider-Abstraktion
- [x] Gemini Development Provider
- [x] Structured Output
- [x] Runtime Validation
- [x] Confidence pro Feld
- [x] Modell-/Prompt-Versionierung
- [x] Brand-Halluzinationsschutz
- [x] Owner/Storage/Datei-Prüfung
- [x] pending/completed/failed
- [x] Idempotenz
- [x] Retry/Confidence UI
- [x] Functions Tests

Offen:

- [ ] echtes Gemini Secret im Dev-Projekt
- [ ] Functions Deployment
- [ ] Eval Dataset
- [ ] Kosten-/Qualitätsmessung
- [ ] finale Datenresidenz-/Privacy-Entscheidung

---

## 8. StyleProfile / Stylist

**Status: ✅ technischer Kern**

- [x] Fake Style Scan entfernt
- [x] echte Präferenzen
- [x] Wardrobe-Signale
- [x] deterministische StyleProfile Engine
- [x] echter Outfit Engine aus Wardrobe IDs
- [x] Top + Bottom + Shoes
- [x] Dress + Shoes
- [x] Outerwear/Accessories optional
- [x] Style/Farbe/Anlass/Saison/Datenqualität
- [x] fehlende Kategorien statt erfundener Produkte
- [x] Saved Outfits
- [x] Like / Dislike / Worn

Offen: reale Nutzer-Evaluation der Outfit-Qualität.

---

## 9. Wetter

**Status: 🟡**

- [x] provider-neutraler Context
- [x] Trusted Backend
- [x] Stadt → Geocoding → Wetter
- [x] kein Fake-Wetter
- [x] manueller Saison-Fallback
- [x] Outfit-Ranking-Signale
- [x] Normalisierungs-Tests

Offen: reales Provider-/Quota-/Caching-Monitoring.

---

## 10. OmniSwap Marketplace

**Status: 🟡 echter End-to-End-Kern**

- [x] Mock-Hub entfernt
- [x] private Wardrobe bleibt privat
- [x] öffentliche Listing-Projektion
- [x] serverseitige öffentliche Medienkopie
- [x] Listing Create/Pause/Resume/Remove
- [x] echter Feed
- [x] echte Offers
- [x] Locks + Offer Keys
- [x] Offer Accept/Decline/Cancel
- [x] konkurrierende Offers laufen ab
- [x] aktive Marketplace-Query auf 100 neueste begrenzt
- [x] eigene Listings auf 100 begrenzt
- [x] serverseitige Sortierung + Indizes
- [x] Cache für öffentliche Storage Download URLs

Offen:

- [ ] reale Zwei-Nutzer-E2E-Tests
- [ ] Offer-/Transaction-Historie später paginieren/begrenzen
- [ ] Tracking/Shipping nur falls Produktentscheidung

---

## 11. Zwei-Parteien-Trade

**Status: ✅ technischer Kern**

- [x] Transaction Schema v2
- [x] Tauschweg pro Teilnehmer
- [x] Versand pro Teilnehmer
- [x] Empfang pro Teilnehmer
- [x] unit-testbare State Machine
- [x] Finalization Claim
- [x] Zwei-Wege-Storage-Kopie + Verifikation
- [x] atomarer ownerId/imagePath-Tausch
- [x] Listing erst danach traded
- [x] Transaction erst danach completed
- [x] retry-fähige Finalization

Offen:

- [ ] reale Zwei-Geräte-Tests
- [ ] Manual Recovery Runbooks

---

## 12. Trust & Safety / Reviews

**Status: ✅ technische Nutzerbasis**

- [x] Listing melden
- [x] Nutzer blockieren/entblocken
- [x] blockierte Konten aus Feed filtern
- [x] Offers zwischen blockierten Konten serverseitig verhindern
- [x] Disputes
- [x] Dispute stoppt normalen Trade
- [x] Reports moderation-only
- [x] completed-Trade Reviews
- [x] Reviewee aus Gegenpartei
- [x] genau eine Review pro Nutzer/Trade
- [x] persistierter Already-Reviewed-State

Später:

- [ ] aggregierte Reputation
- [ ] Review Appeals/Moderation
- [ ] Trust Score erst mit realem Datenvolumen

---

## 13. Notifications / Push

### In-App

**Status: ✅**

- [x] persistente Domain
- [x] Dedup Keys
- [x] Offer/Trade/Dispute Trigger
- [x] Live-Inbox
- [x] Read State
- [x] Activity Tab
- [x] kein Fake-Demo-Fallback
- [x] Feed auf 100 neueste Notifications begrenzt
- [x] serverseitige Sortierung + Index
- [x] FlatList statt unlimitierter ScrollView

### Remote Push Backend

**Status: 🟡 serverseitig fertig, Native extern blockiert**

- [x] Register/Unregister Push Device
- [x] Token Hash Device ID
- [x] server-only Push Collections
- [x] explizites `pushEnabled` Opt-in
- [x] Delivery Claim
- [x] Expo Tickets
- [x] Receipt Worker
- [x] DeviceNotRegistered Cleanup
- [x] Stale Claim Markierung
- [x] Security Regression

Native offen:

- [ ] EAS Projekt
- [ ] Android Package / iOS Bundle ID
- [ ] SDK-57-kompatibles `expo-notifications`
- [ ] Config Plugin
- [ ] Android Channel
- [ ] Permission Flow
- [ ] echte projectId / Tokens
- [ ] physische Device-Tests

---

## 14. Admin Moderation

**Status: 🟡 Trusted Backend Foundation**

- [x] Custom Claim Guard admin|moderator
- [x] Unit-Test gegen normale Nutzer
- [x] Report-/Dispute-Queue
- [x] auditiertes Report Resolution
- [x] Dispute Vorzustand
- [x] resume_trade
- [x] manual_recovery
- [x] moderationAudit
- [x] gemeinsame CI-Checkpoints grün

Offen:

- [ ] interne Moderator-UI
- [ ] Account Suspension/Ban Lifecycle
- [ ] Listing Takedown
- [ ] Appeals
- [ ] Evidence Attachments
- [ ] SLA/Monitoring

---

## 15. Support / Recovery

**Status: 🟡 technische Basis**

- [x] Moderator Recovery Queue
- [x] failed Finalizations sichtbar
- [x] Manual-Recovery Disputes sichtbar
- [x] Push send_failed / needs_review sichtbar
- [x] täglicher Cleanup ausschließlich öffentlicher inaktiver Listing-Medien
- [x] Stale Push Claim Markierung
- [x] keine gefährliche automatische Trade-Rückabwicklung

Offen:

- [ ] Support Case Domain
- [ ] interne Support-UI
- [ ] Manual Trade Recovery Runbooks
- [ ] Nutzerkommunikation / SLA
- [ ] Recovery-Metriken

---

## 16. Privacy / Account Lifecycle

**Status: 🟡 technischer Lifecycle implementiert**

- [x] Trusted Datenexport
- [x] Push/Auth/Server Credentials vom Export ausgeschlossen
- [x] Deletion Readiness
- [x] offene Listings / sent Offers / offene Trades / Locks blockieren Löschung
- [x] Fresh Auth via Firebase auth_time
- [x] Passwort-Reauthentication
- [x] `LÖSCHEN` + zweite destructive Confirmation
- [x] private Firestore-Daten löschen
- [x] privater Storage Prefix `users/{uid}/` löschen
- [x] gemeinsame abgeschlossene Marketplace-Historie pseudonymisieren/redigieren
- [x] minimaler pseudonymer Deletion Audit
- [x] Firebase Auth zuletzt löschen
- [x] Privacy aus Profil erreichbar
- [x] Privacy UI auf Accessible Design Primitives migriert

Offen:

- [ ] reale Firebase Dev-E2E-Tests
- [ ] finale Retention Policy
- [ ] rechtliche Prüfung der Historien-Pseudonymisierung
- [ ] finale Privacy Policy
- [ ] Store Data Safety / Privacy Labels

---

## 17. Shop / Monetarisierung

**Status: ⚪ MVP+ / deaktiviert**

- [x] hartcodierter Demo-Shop entfernt
- [x] Shop Tab hinter `shopPartnerFeed=false` verborgen
- [x] direkter Screen-Zugriff zeigt keine Fake-Produkte/Preise

Offen:

- [ ] echte Produktquelle
- [ ] Gap-to-Shop-Verbindung
- [ ] Affiliate/Partner-Regeln
- [ ] Tracking Consent
- [ ] Monetarisierungs-Evaluation

---

## 18. Performance / Observability / Feature Flags

**Status: 🟡 Grundlage aktiv**

Performance:

- [x] Wardrobe FlatList
- [x] Activity FlatList + Query Limit
- [x] Marketplace Query Limits
- [x] Marketplace Image URL Cache
- [x] Feed Composite Indizes
- [x] Production Bundle Smoke

Observability:

- [x] provider-neutrale Telemetry Boundary
- [x] ErrorBoundary captureException
- [x] Production versteckt Raw Error Details

Feature Flags:

- [x] typed Flag Boundary
- [x] `nativePushRegistration=false`
- [x] `internalModeratorUi=false`
- [x] `shopPartnerFeed=false`
- [x] `photorealisticTryOn=false`
- [x] Shop Flag tatsächlich in Navigation verwendet

Offen:

- [ ] echter Crash Provider
- [ ] Analytics Provider
- [ ] Remote Config / serverseitige Flags
- [ ] Cost Monitoring
- [ ] Abuse/Rate Monitoring
- [ ] Device Performance Profiling
- [ ] Offers/Transactions pagination
- [ ] Bildkompression/Thumbnail-Strategie
- [ ] Rollback Runbook

---

## 19. EAS / Production / Store

**Status: 🔴 externe Hauptphase**

- [ ] echte Firebase Dev/Prod Environments
- [ ] EAS Projekt
- [ ] Android Package
- [ ] iOS Bundle ID
- [ ] Development Builds
- [ ] Internal Testing
- [ ] App Check
- [ ] Signing / Credentials
- [ ] native Push-Registrierung
- [ ] reale Android/iOS Zwei-Nutzer-E2E-Tests
- [ ] Store Assets
- [ ] Privacy Labels / Data Safety
- [ ] Release Candidate
- [ ] gestufter Rollout
- [ ] Monitoring / Rollback

---

# Aktuelle Reihenfolge

```text
1. aktuellen Performance/Shop-Head vollständig grün validieren
2. verbleibende Accessibility-Migration an kritischen Controls
3. Offers/Transactions skalierbarer machen
4. Analytics/Crash-Provider + Remote Feature Flags entscheiden
5. echte Firebase Dev-/Prod-Projekte
6. EAS Projekt + Bundle IDs + Development Builds
7. App Check + native Push
8. reale Android/iOS Zwei-Nutzer-E2E- und Privacy-E2E-Tests
9. Store Privacy / Data Safety / Assets
10. Release Candidate + Rollout/Monitoring/Rollback
```

Die Roadmap darf weiter angepasst werden, aber nur anhand des realen Omni-Fashion-Codes und realer externer Voraussetzungen.
