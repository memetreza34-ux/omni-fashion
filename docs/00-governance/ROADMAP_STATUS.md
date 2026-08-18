# Omni Fashion – Roadmap Status

**Stand:** 18. August 2026  
**Arbeitsbranch:** `docs/app-development-a-z`  
**Draft-PR:** #1  
**Prinzip:** Nur real implementierte und überprüfte Funktionen werden als erledigt markiert. Externe Firebase-/EAS-/Device-/Rechts-Blocker bleiben offen.

## Legende

- ✅ technischer Kern im Repo implementiert und über Quality-Gates abgesichert
- 🟡 belastbare Basis vorhanden, reale Production-/Device-/Betriebsvalidierung noch offen
- 🔴 noch nicht ausreichend umgesetzt
- ⚪ bewusst später / MVP+

---

## 0. Produktdefinition

**Status: ✅**

- [x] Produktloop `OWN → STYLE → SWAP → BUY BETTER`
- [x] Wardrobe als private Source of Truth
- [x] MVP Scope und Nicht-Ziele
- [x] zentrale User Journeys
- [x] Engineering Rules
- [x] Security und Privacy by Design
- [x] Trusted-Backend-Grenzen
- [x] keine Demo-Funktion wird als real ausgegeben

Offen:

- [ ] finaler Launch-Markt
- [ ] finales Monetarisierungsmodell

---

## 1. Architektur

**Status: ✅ Kernarchitektur**

- [x] Expo SDK 57 / React Native / Expo Router
- [x] React 19.2.3 / RN 0.86.2
- [x] TypeScript strict
- [x] Firebase Auth / Firestore / Storage / Functions
- [x] Functions 2nd Gen / Node 22
- [x] Feature-Domains statt Firebase-Zugriff aus beliebigen Screens
- [x] Trusted Backend für AI, Swap, Moderation, Push, Feature Flags und Privacy
- [x] kein Big-Bang-Rewrite

Offen:

- [ ] finaler Analytics-Anbieter
- [ ] finaler Crash-Reporting-Anbieter
- [ ] finales natives E2E-Tooling

---

## 2. Repo / CI / Build

**Status: ✅ interne Quality-Basis**

- [x] produktbezogenes README
- [x] Dokumentationssystem
- [x] `.env.example`
- [x] Secrets aus Git ausgeschlossen
- [x] typisierte Expo-Environment-Schicht
- [x] Dummy-Firebase-Werte entfernt
- [x] Node 22.13.x im CI
- [x] `npm ci`
- [x] TypeScript Gate
- [x] Zero-any Gate
- [x] Functions Typecheck + Build + Unit Tests
- [x] Firebase Emulator Security Tests
- [x] echter Expo Router Production-Webbundle-Smoke-Test
- [x] NativeWind-v4/Babel/Metro/Tailwind-Konfiguration repariert

Der letzte vollständige Runtime-/Security-Checkpoint des Rate-Limit-Blocks war auf allen vier Hauptjobs grün.

Offen:

- [ ] ESLint final konsolidieren
- [ ] Formatter festlegen
- [ ] Dependency-Audit paketweise bearbeiten
- [ ] native Development-/Preview-Builds in EAS ausführen

Kein `npm audit fix --force` ohne Expo-SDK-57-Kompatibilitätsprüfung.

---

## 3. Designsystem / Accessibility / Performance

**Status: 🟡 belastbare Grundlage**

Designsystem:

- [x] semantische Tokens
- [x] `AppButton`
- [x] `AppCard`
- [x] `StatusBanner`
- [x] Busy/Disabled Accessibility State
- [x] 48px Mindest-Controlhöhe für zentrale Buttons

Accessibility:

- [x] Privacy auf gemeinsame Primitives migriert
- [x] Login auf gemeinsame Primitives migriert
- [x] E-Mail-Verifikations-Gate migriert
- [x] Auth Inputs mit Accessibility Labels
- [x] ErrorBoundary semantisch gehärtet
- [x] Wardrobe-/Activity-Grundlabels und Progress-Semantik

Performance:

- [x] Wardrobe Grid virtualisiert
- [x] Activity Inbox virtualisiert
- [x] Notifications auf 100 neueste Datensätze begrenzt
- [x] Marketplace Feed und eigene Listings auf 100 begrenzt
- [x] Offer-/Transaction-Historien auf 100 begrenzt
- [x] serverseitige Sortierung + Firestore-Indizes
- [x] Cache für öffentliche Listing-Download-URLs

Offen:

- [ ] OmniSwap Controls vollständig auf Design-Primitives migrieren
- [ ] Stylist/Profile vollständig migrieren
- [ ] VoiceOver/TalkBack Device Audit
- [ ] Dynamic Type Audit
- [ ] Kontrast-Audit
- [ ] Keyboard/Web Focus Audit
- [ ] Reduced Motion
- [ ] natives Performance Profiling

---

## 4. Auth / UserProfile

**Status: 🟡 technischer Kern weitgehend fertig**

- [x] E-Mail/Passwort Login
- [x] Registrierung
- [x] DisplayName
- [x] E-Mail-Verifikation + Verification Gate
- [x] Verification erneut senden
- [x] 60-Sekunden Resend-Cooldown nach erfolgreichem Versand
- [x] Passwort-Reset
- [x] zentrale Fehlercodes
- [x] UserProfile Domain + Repair
- [x] Dev-Demo ausschließlich Development
- [x] Production fail-closed ohne Firebase
- [x] Passwort-Reauthentication für sensible Privacy-Aktion
- [x] zugängliche Auth-/Verification-Controls

Offen:

- [ ] reales Firebase Dev-Projekt validieren
- [ ] native Auth-Persistenz über App-Neustart validieren
- [ ] vollständiger Onboarding-State
- [ ] Auth E2E auf Android/iOS

---

## 5. Firebase / Security

**Status: 🟡 lokale/CI-Basis stark, reales Deployment offen**

- [x] Auth / Firestore / Storage / Functions Bootstrap
- [x] Default-Deny Firestore Rules
- [x] Default-Deny Storage Rules
- [x] UserProfile Validation
- [x] private Wardrobe
- [x] geschützte AI-/Swap-Systemfelder
- [x] server-only Offers / Transactions / Reports
- [x] server-only Push-/Moderations-/Rate-Limit-/RuntimeConfig-Daten
- [x] Security Emulator Suite in CI
- [x] benötigte Feed-Indizes im Repo

Production offen:

- [ ] echte Firebase Dev- und Prod-Projekte
- [ ] Auth Provider aktivieren
- [ ] Firestore Rules deployen
- [ ] Storage Rules deployen
- [ ] Firestore Indizes deployen
- [ ] Functions deployen
- [ ] Secrets setzen
- [ ] App Check konfigurieren und durchsetzen
- [ ] Budget Alerts / Quotas
- [ ] TTL für `rateLimits.expiresAt` aktivieren

---

## 6. Cloud Wardrobe

**Status: 🟡 produktionsorientierter Kern**

- [x] kanonisches `WardrobeItem`
- [x] Firestore Live-Sync
- [x] private Storage Uploads
- [x] runtime Download URLs
- [x] Cloud-aware Wardrobe Context
- [x] Development-Fallback ohne Fake-Production-State
- [x] echte Create/Update/Delete-Fehlerzustände
- [x] Brand / Material / Größe / Zustand
- [x] `Dress` als echte Kategorie
- [x] AI-/Swap-Felder clientseitig geschützt
- [x] virtualisiertes Wardrobe Grid

Offen:

- [ ] echte Kamera-/Galerie-Device-Tests
- [ ] HEIC/HEIF-Validierung
- [ ] Bild-Resize/Kompression
- [ ] Upload-Fortschritt/Cancel
- [ ] Offline/Reconnect-Verhalten
- [ ] reales Storage-Cleanup validieren

---

## 7. Kleidungsanalyse

**Status: 🟡 echter Trusted-Backend-Pfad**

- [x] Fake-AI entfernt
- [x] `analyzeWardrobeItem` Callable
- [x] Gemini Provider-Abstraktion
- [x] Structured Output
- [x] Runtime Validation
- [x] Confidence pro Feld
- [x] Modell-/Prompt-Versionierung
- [x] Brand-Halluzinationsschutz
- [x] Owner-/Storage-/Datei-Prüfung
- [x] pending/completed/failed Lifecycle
- [x] Idempotenz / Parallelaufrufschutz
- [x] Retry/Confidence/Fehlerstatus in UI
- [x] Functions Tests
- [x] serverseitiges Rate Limit: 20 Analysen pro Nutzer/Stunde

Offen:

- [ ] reales Gemini Secret im Dev-Projekt
- [ ] echtes Functions Deployment
- [ ] Evaluation Dataset
- [ ] Qualitäts-/Kostenmessung mit echten Wardrobe-Bildern
- [ ] finale Datenresidenz-/Privacy-Entscheidung

---

## 8. StyleProfile / Stylist / Wetter

**Status: ✅ technischer Stylist-Kern / 🟡 externe Wettervalidierung**

- [x] Fake Style Scan entfernt
- [x] echte Präferenzen + Wardrobe-Signale
- [x] deterministische StyleProfile Engine
- [x] echter Outfit Engine aus Wardrobe IDs
- [x] `Top + Bottom + Shoes`
- [x] `Dress + Shoes`
- [x] optionale Outerwear/Accessories
- [x] Style/Farbe/Anlass/Saison/Datenqualität Scoring
- [x] fehlende Kategorien statt erfundener Produkte
- [x] Saved Outfits
- [x] Like / Dislike / Worn Feedback
- [x] provider-neutraler Weather Context
- [x] Trusted Weather Backend
- [x] kein Fake-Wetter
- [x] Wetter-Signale im Outfit-Ranking

Offen:

- [ ] reale Nutzer-Evaluation der Outfit-Qualität
- [ ] Provider-/Quota-/Caching-Monitoring im echten Projekt

---

## 9. OmniSwap Marketplace / Trade

**Status: 🟡 echter End-to-End-Kern**

Marketplace:

- [x] alter Mock-Hub entfernt
- [x] private Wardrobe bleibt privat
- [x] reduzierte öffentliche Listing-Projektion
- [x] serverseitige öffentliche Medienkopie
- [x] Listing Create/Pause/Resume/Remove über Trusted Backend
- [x] echter Marketplace Feed
- [x] echte Offers
- [x] Locks + Offer Keys gegen Doppelangebote
- [x] Offer Accept/Decline/Cancel
- [x] konkurrierende Offers laufen ab
- [x] Query-Limits + Indizes + URL-Cache
- [x] Listing-Erstellung Rate Limit: 30/Stunde
- [x] Offer-Erstellung Rate Limit: 60/Stunde

Trade:

- [x] Transaction Schema v2
- [x] Tauschweg pro Teilnehmer
- [x] Versand und Empfang pro Teilnehmer
- [x] unit-testbare State Machine
- [x] Finalization Claim
- [x] Zwei-Wege-Storage-Kopie + Verifikation
- [x] atomarer `ownerId + imagePath` Tausch
- [x] Listing erst danach `traded`
- [x] Transaction erst danach `completed`
- [x] retry-fähige Finalization

Offen:

- [ ] reale Zwei-Nutzer-/Zwei-Geräte-E2E-Tests
- [ ] Shipping/Tracking nur falls Produktentscheidung

---

## 10. Trust & Safety / Reviews

**Status: ✅ technische Nutzerbasis**

- [x] Listing melden
- [x] Nutzer blockieren/entblocken
- [x] blockierte Konten aus Feed filtern
- [x] Offers zwischen blockierten Konten serverseitig verhindern
- [x] Disputes
- [x] Dispute stoppt normalen Trade-Fortschritt
- [x] Reports moderation-only
- [x] Report Rate Limit: 8/Stunde
- [x] completed-Trade Reviews 1–5 + Kommentar
- [x] Reviewee aus Gegenpartei bestimmt
- [x] genau eine Review pro Nutzer/Trade
- [x] persistierter Already-Reviewed-State

Später:

- [ ] aggregierte Reputation
- [ ] Review Appeals/Moderation
- [ ] Trust Score erst mit realem Datenvolumen

---

## 11. Notifications / Push

### In-App

**Status: ✅**

- [x] persistente Notification Domain
- [x] idempotente Dedup Keys
- [x] Offer/Trade/Dispute Trigger
- [x] Live-Inbox
- [x] Read State
- [x] Activity Tab
- [x] kein Fake-Demo-Fallback
- [x] 100 neueste Notifications + Index
- [x] virtualisierte Liste

### Remote Push Backend

**Status: 🟡 Backend fertig, Native extern offen**

- [x] Register/Unregister Push Device
- [x] Token Hash Device ID
- [x] server-only Push Collections
- [x] explizites `pushEnabled` Opt-in
- [x] Delivery Claim gegen Trigger-Duplikate
- [x] Expo Push Tickets
- [x] Receipt Worker
- [x] `DeviceNotRegistered` Cleanup
- [x] Stale Claim Markierung
- [x] Push Security Regression
- [x] Device-Registration Rate Limit: 20/Stunde

Native offen:

- [ ] echtes EAS Projekt
- [ ] Android Package / iOS Bundle ID
- [ ] SDK-57-kompatibles `expo-notifications`
- [ ] native Config
- [ ] Android Notification Channel
- [ ] Permission Flow
- [ ] echte EAS `projectId`
- [ ] echte Expo Push Tokens
- [ ] physische Android/iOS Tests

---

## 12. Moderation / Support / Recovery

**Status: 🟡 technische Betriebsbasis**

Moderation:

- [x] Custom Claim Guard `admin|moderator`
- [x] normale Nutzer serverseitig abgewiesen
- [x] Report-/Dispute-Queue
- [x] auditiertes Report Resolution
- [x] Dispute Vorzustand
- [x] `resume_trade`
- [x] `manual_recovery`
- [x] `moderationAudit`
- [x] interne Moderator-Oberfläche vorhanden
- [x] UI standardmäßig per `internalModeratorUi=false` deaktiviert
- [x] UI besitzt keine eigenen Privilegien; jeder Callable prüft Claims erneut

Recovery:

- [x] Moderator Recovery Queue
- [x] failed Finalizations sichtbar
- [x] Manual-Recovery Disputes sichtbar
- [x] Push send_failed / needs_review sichtbar
- [x] read-only interne Recovery-Oberfläche
- [x] täglicher Cleanup ausschließlich inaktiver öffentlicher Listing-Medien
- [x] Stale Push Claim Markierung
- [x] keine gefährliche automatische physische Trade-Rückabwicklung

Offen:

- [ ] Account Suspension/Ban Lifecycle
- [ ] Listing Takedown Moderationsaktion
- [ ] Appeals
- [ ] Evidence Attachments
- [ ] Support Case Domain
- [ ] echte Manual-Recovery-Aktionen + Runbooks
- [ ] Betriebs-SLA/Metriken

---

## 13. Privacy / Account Lifecycle

**Status: 🟡 technischer Lifecycle implementiert**

- [x] Trusted Datenexport
- [x] Sicherheits-Credentials aus Export ausgeschlossen
- [x] Deletion Readiness
- [x] offene Listings/Offers/Trades/Locks blockieren Löschung
- [x] Fresh Auth über `auth_time`
- [x] Passwort-Reauthentication
- [x] exakte `LÖSCHEN`-Bestätigung + zweite destruktive Bestätigung
- [x] private Firestore-Daten löschen
- [x] privater Storage Prefix `users/{uid}/` löschen
- [x] Push-Geräte/-Delivery/-Ticket-Daten löschen
- [x] Rate-Limit-State löschen
- [x] gemeinsame abgeschlossene Marketplace-Historie pseudonymisieren/redigieren
- [x] minimaler pseudonymer Deletion Audit
- [x] Firebase Auth zuletzt löschen
- [x] Privacy aus Profil erreichbar
- [x] zugängliche Privacy UI

Offen:

- [ ] reale Firebase Dev-E2E-Tests
- [ ] finale Retention Policy
- [ ] rechtliche Prüfung der historischen Pseudonymisierung
- [ ] finale Privacy Policy
- [ ] Store Data Safety / Privacy Labels

---

## 14. Feature Flags / Abuse Control / Observability

**Status: 🟡 starke Betriebsgrundlage**

Feature Flags:

- [x] typisierte Flag Boundary
- [x] alle lokalen Defaults `false`
- [x] Trusted `getPublicFeatureFlags`
- [x] Whitelist ausschließlich bekannter Boolean-Keys
- [x] ungültige/missing Remote Config fällt auf alle Flags `false`
- [x] direkter Client-Zugriff auf `runtimeConfig` verboten + Emulator-Test
- [x] reaktiver React Provider
- [x] Refresh bei Auth-Verfügbarkeit und App-Foreground
- [x] Shop/Moderation/Recovery nutzen reaktive Flags
- [x] `internalModeratorUi` ersetzt niemals serverseitige Claims

Rate Limits:

- [x] zentrale transaktionale Firestore-Primitive
- [x] Unit-Tests für Window/Increment/Block/Reset
- [x] AI, Listings, Offers, Reports und Push-Registrierung geschützt
- [x] `rateLimits` server-only + Emulator-Regression
- [x] Account Deletion entfernt Rate-Limit-State
- [x] `expiresAt` für späteres TTL vorbereitet

Observability:

- [x] provider-neutrale Telemetry Boundary
- [x] ErrorBoundary `captureException`
- [x] Raw Error Details nur Development

Offen:

- [ ] echter Crash Provider
- [ ] Analytics Provider
- [ ] Cost/Budget Monitoring
- [ ] Abuse-/Rate-Limit-Metriken
- [ ] App Check
- [ ] Firestore TTL auf `rateLimits.expiresAt` im echten Projekt aktivieren

---

## 15. Shop / Monetarisierung

**Status: ⚪ MVP+ / bewusst deaktiviert**

- [x] hartcodierter Demo-Shop entfernt
- [x] Shop Tab hinter `shopPartnerFeed=false`
- [x] direkter Screen zeigt keine Fake-Produkte/Preise
- [x] Remote Kill-Switch-Grenze vorhanden

Offen:

- [ ] echte Produktquelle
- [ ] Gap-to-Shop Verbindung
- [ ] Affiliate-/Partner-Regeln
- [ ] Tracking Consent
- [ ] Monetarisierungs-Evaluation

---

## 16. EAS / Release / Store

**Status: 🟡 intern vorbereitet, externe Konfiguration offen**

- [x] `eas.json` mit getrennten Preview-/Production-Environments
- [x] Firebase/EAS Setup-Anleitung
- [x] Release Candidate Checklist
- [x] Rollback Runbook
- [x] fail-closed Release-Config-Validator
- [x] Production-Webbundle als permanentes CI-Gate
- [x] Remote Feature Flags als Kill-Switch-Baustein

Extern offen:

- [ ] reales Expo/EAS Projekt
- [ ] finale Android Package ID
- [ ] finale iOS Bundle ID
- [ ] Signing / Credentials
- [ ] Firebase Dev/Prod Environment Variablen
- [ ] Gemini Secret
- [ ] echte Deployments
- [ ] Development Builds
- [ ] Internal Testing Builds
- [ ] native Push
- [ ] App Check
- [ ] Store Assets
- [ ] Data Safety / Privacy Labels
- [ ] Release Candidate auf realen Geräten
- [ ] kontrollierter Rollout + Monitoring

---

# Nächste Reihenfolge

Der größte verbleibende Sprung ist jetzt **nicht mehr ein weiterer Demo-Screen**, sondern reale Infrastruktur und Device-Validierung.

```text
1. Firebase Dev-Projekt real anlegen und konfigurieren
2. Firestore/Storage Rules + Indizes + Functions deployen
3. Gemini Secret und RuntimeConfig im Dev-Projekt setzen
4. App Check vorbereiten/aktivieren
5. Expo/EAS Projekt + finale App-Identifier festlegen
6. SDK-57-konforme native Push-/Development-Build-Abhängigkeiten installieren
7. echte Android/iOS Builds erzeugen
8. Zwei-Nutzer-E2E: Auth → Wardrobe → AI → Stylist → OmniSwap → Trade → Review → Privacy
9. Crash/Analytics/Cost Monitoring mit realen Daten aktivieren
10. rechtliche/Store-Angaben finalisieren
11. Release Candidate prüfen
12. kontrollierter Store-Rollout
```

## Release-Grenze

Der Draft-PR bleibt Draft, solange reale Firebase-/EAS-/Device-/Store-Validierung fehlt. Der technische Repo-Core ist weit fortgeschritten, aber das wird nicht mit einer produktionsveröffentlichten App gleichgesetzt.
