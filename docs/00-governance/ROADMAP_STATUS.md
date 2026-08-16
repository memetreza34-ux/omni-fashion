# Omni Fashion – Roadmap Status

**Stand:** 16. August 2026

Diese Datei ist der tatsächliche Arbeitsstand. Dokumentation und Code werden gemeinsam aktualisiert.

## Status-Legende

- ✅ abgeschlossen / ausreichend definiert
- 🟡 in Arbeit / teilweise
- 🔴 offen
- ⚪ später / nicht MVP-kritisch

---

# Phase 0 – Produktdefinition

**Status: ✅ Arbeitsbasis abgeschlossen**

- [x] Hauptproblem definiert
- [x] Produktversprechen definiert
- [x] Haupt-USP `OWN → STYLE → SWAP → BUY BETTER`
- [x] Produktprinzipien definiert
- [x] Nutzersegmente nach Bedarf definiert
- [x] MVP Scope eingefroren
- [x] Nicht-Ziele definiert
- [x] Kernmetriken vorgeschlagen

Dokumente:

- `docs/01-product/PRODUCT_FOUNDATION.md`
- `docs/01-product/MVP_SCOPE.md`

Bewusst später zu entscheiden:

- [ ] endgültiger kommerzieller Launch-Markt
- [ ] finale Monetarisierung anhand echter Nutzung

---

# Phase 1 – Produktarchitektur und User Journeys

**Status: ✅ Produkt-/Systementwurf vorhanden**

- [x] Kernjourneys detailliert
- [x] Wardrobe als Source of Truth festgelegt
- [x] Wardrobe → Stylist / Swap / Shopping Verbindung definiert
- [x] Client-/Server-Vertrauensgrenze definiert
- [x] Marketplace-Statuslogik konzeptionell definiert
- [x] KI-Provider-Abstraktion vorgesehen
- [x] Privacy/Security by Design definiert
- [x] Feature Flags / Migration / Rollback ergänzt
- [x] Admin-/Moderationsbedarf ergänzt

Dokumente:

- `docs/01-product/USER_JOURNEYS.md`
- `docs/02-architecture/TARGET_ARCHITECTURE.md`
- `docs/00-governance/ENGINEERING_RULES.md`

---

# Phase 2 – Tech Stack / Zielarchitektur

**Status: 🟡 weitgehend festgelegt**

Festgelegt:

- [x] Expo + React Native bleibt bestehen
- [x] Expo Router bleibt bestehen
- [x] TypeScript strict bleibt bestehen
- [x] Firebase bleibt vorerst Ziel-Backend
- [x] Backendzugriffe werden gekapselt
- [x] Trusted Backend für kritische Commands vorgesehen
- [x] Trusted Backend: Firebase Cloud Functions 2nd Gen + TypeScript + Node.js 22
- [x] KI-Provider wird abstrahiert
- [x] kein Big-Bang-Rewrite

Offen:

- [ ] Analytics-Anbieter festlegen
- [ ] Crash-Reporting-Anbieter festlegen
- [ ] Feature-Flag-Technik festlegen
- [ ] E2E-/Integration-Testtools final festlegen

---

# Phase 3 – Repo-Hygiene / Environments / CI

**Status: 🟡 weit fortgeschritten**

Erledigt:

- [x] Standard-Expo-README durch Omni-Fashion-README ersetzt
- [x] `.env.example` angelegt
- [x] `.gitignore` für Environment-Dateien gehärtet
- [x] typisierte Environment-Konfiguration angelegt
- [x] Dokumentationsstruktur aufgebaut
- [x] Dummy-Firebase-Werte aus `firebaseConfig.ts` entfernt
- [x] GitHub Actions Quality Workflow angelegt
- [x] `npm ci` läuft reproduzierbar in CI
- [x] `check-no-any` läuft automatisch
- [x] TypeScript Typecheck läuft automatisch
- [x] Firebase Security Emulator Job in CI
- [x] Firestore + Storage Security Tests laufen im Emulator
- [x] Java 21 für Emulator-Job
- [x] GitHub Actions auf aktuelle Node-24-basierte Majors gehoben
- [x] letzter vollständiger Quality-Lauf: TypeScript/Zero-any + Firebase Security grün
- [x] vorhandene `as any`-Altlasten im Wardrobe-Modal entfernt
- [x] dabei gefundene instabile Hook-Reihenfolge im Modal behoben

Noch offen:

- [ ] ESLint-Konfiguration prüfen/finalisieren
- [ ] Formatter festlegen
- [ ] Build-Smoke-Test in CI ergänzen
- [ ] Development/Staging/Production EAS Environments real einrichten
- [ ] Dependency-/Security-Audit kontrolliert aufarbeiten

### Gefundene Dependency-Schuld

Der `npm ci`/Audit-Lauf meldet derzeit 23 bekannte Dependency-Hinweise (8 moderate, 15 high). Diese werden **nicht** blind mit `npm audit fix --force` behoben, sondern paketweise auf Expo-Kompatibilität geprüft.

---

# Phase 4 – Designsystem

**Status: 🔴 offen**

Die vorhandene Premium-UI bleibt bestehen. Tokens, gemeinsame Komponenten, Sprache und Zustände werden nach dem technischen Fundament konsolidiert.

---

# Phase 5 – Auth & UserProfile

**Status: 🟡 aktiv in Umsetzung**

Erledigt:

- [x] `any` aus AuthContext entfernt
- [x] `AuthUser` Domain-Typ eingeführt
- [x] zentraler Firebase Auth Service
- [x] Auth State Subscription
- [x] echtes E-Mail/Passwort-Login vorbereitet
- [x] Registrierung mit E-Mail/Passwort implementiert
- [x] Auth-DisplayName wird gesetzt
- [x] Verifizierungs-Mail wird nach Registrierung gesendet
- [x] Verifizierungs-Mail kann erneut gesendet werden
- [x] Auth-User kann neu geladen werden
- [x] Passwort-Reset Service implementiert
- [x] zentrale Auth-Fehlercodes / nutzerfreundliche Meldungen
- [x] Login/Register/Reset UI vorhanden
- [x] nicht verifizierte echte Nutzer werden vor der App abgefangen
- [x] Verification Screen vorhanden
- [x] `UserProfile` Domain-Modell vorhanden
- [x] Firestore Profile Service vorhanden
- [x] fehlendes/halb erzeugtes UserProfile kann repariert werden
- [x] Development-Demo explizit Dev-only
- [x] Release darf ohne Firebase nicht still auf Fake-Login wechseln

Offen:

- [ ] echtes Firebase-Projekt verbinden und Flows real testen
- [ ] native Auth-Persistenz über App-Neustart finalisieren und auf Android/iOS validieren
- [ ] Resend-Cooldown für Verification
- [ ] vollständiger Onboarding-State nach Verification
- [ ] Re-Authentication für sensible Aktionen
- [ ] Accountlöschung über Trusted Backend
- [ ] Auth Unit-/Integration-/E2E-Tests
- [ ] Router-Gruppen `(auth)` / `(app)` erst nach stabiler Auth-Basis migrieren

### Bekannter Firebase-Integrationspunkt

Die Firebase-Dokumentation beschreibt `getReactNativePersistence`, aber die im Projekt aufgelösten Firebase-12-TypeScript-Exports liefern diese Funktion im aktuellen CI nicht konsistent. Deshalb wurde bewusst **kein `@ts-ignore`-Workaround** eingebaut. Der Bootstrap verwendet vorerst `getAuth()`; native Session-Persistenz wird mit echtem Firebase-Projekt und Device-Build gezielt finalisiert.

---

# Phase 6 – Firebase Backend & Security

**Status: 🟡 Sicherheitsbasis + automatisierte Tests grün**

Erledigt:

- [x] Firebase Initialisierung in Service-Schicht
- [x] Firestore Bootstrap
- [x] Storage Bootstrap
- [x] Functions Client Bootstrap + konfigurierbare Region
- [x] `firebase.json`
- [x] Emulator-Konfiguration für Auth/Firestore/Storage
- [x] `firestore.indexes.json`
- [x] Firestore Rules Baseline
- [x] Storage Rules Baseline
- [x] Default-Deny-Prinzip
- [x] private Wardrobe-Zugriffe auf Owner begrenzt
- [x] Wardrobe-Dokumentform und Werte validiert
- [x] komplette AI-Systemmetadaten clientseitig geschützt
- [x] Swap-Link-Systemfelder clientseitig geschützt
- [x] Marketplace Public Snapshot architektonisch getrennt
- [x] Swap Offers für Client-Schreibzugriff gesperrt
- [x] Trade Transactions für Client-Schreibzugriff gesperrt
- [x] Reviews/Reputation clientseitig nicht frei manipulierbar
- [x] Reports als moderationspflichtige Daten vorgesehen
- [x] UserProfile-Felder in Rules validiert
- [x] Firestore Rules Integration Tests
- [x] Storage Rules Integration Tests
- [x] Security Tests in GitHub Actions
- [x] Emulator-Security-Tests erfolgreich durchgelaufen

Externer Blocker:

- [ ] echte Firebase Development-/Production-Projekte und Werte

Danach zwingend:

- [ ] Firebase Auth Email/Password in Console aktivieren
- [ ] Firestore/Storage im Dev-Projekt aktivieren
- [ ] Rules ins Dev-Projekt deployen
- [ ] App Check
- [ ] benötigte Firestore-Indizes anhand echter Queries
- [ ] Budget Alerts
- [ ] echtes Functions Deployment

Dokument:

- `docs/05-backend/FIREBASE_SETUP.md`

---

# Phase 7 – Cloud Wardrobe

**Status: 🟡 Kernmigration im Code + CI/Security validiert, reale Cloud-/Device-Validierung offen**

Erledigt:

- [x] zentrales produktionsorientiertes `WardrobeItem` Domain-Modell
- [x] bestehende UI-Felder kompatibel gehalten
- [x] `ownerId` / Schema-Version / AI-/Swap-Systemfelder ergänzt
- [x] AI-Modell-/Prompt-/Analyse-/Fehlermetadaten ergänzt
- [x] Firestore Wardrobe Service
- [x] Owner-basierte Live-Subscription
- [x] Storage Upload Service
- [x] Storage Download-URL nur zur Laufzeit auflösen
- [x] private Storage-Pfade pro User/Item
- [x] alter AsyncStorage-Schrank wird im Dev-Pfad auf V2 normalisiert
- [x] echter Firebase User nutzt Cloud-Pfad
- [x] Development Demo User nutzt lokalen Fallback
- [x] `WardrobeContext` auf Cloud-aware Architektur umgestellt
- [x] Fake-`setTimeout` für Upload/KI entfernt
- [x] echte Fehlerzustände beim Speichern/Ändern/Löschen
- [x] Item Editor um Marke/Material/Größe/Zustand erweitert
- [x] Firestore Rules an neues Wardrobe-Schema angepasst
- [x] Security Tests für private Wardrobe-Zugriffe
- [x] TypeScript/Zero-any auf aktuellem Wardrobe-Code grün
- [x] Firestore-/Storage-Security-Tests grün

Noch offen:

- [ ] echte Firebase-Dev-Verbindung
- [ ] Android Kamera/Galerie Upload real testen
- [ ] iOS Kamera/Galerie Upload real testen
- [ ] HEIC/HEIF Verhalten testen
- [ ] Bildkompression/Resize vor Upload
- [ ] Upload-Fortschritt
- [ ] Retry/Cancel
- [ ] Offline/Reconnect validieren
- [ ] Firestore-Service-Integrationtests gegen echte/emulierte Services
- [ ] Cloud Delete + Storage Cleanup real validieren

Dokument:

- `docs/06-wardrobe/CLOUD_WARDROBE.md`

---

# Phase 8 – AI-Kleidungsanalyse

**Status: 🟡 Contract, Security und erster Provider entschieden; Trusted Backend offen**

Erledigt:

- [x] Fake-AI-Verarbeitung entfernt
- [x] Request-/Response-Contract
- [x] Runtime Response Validation
- [x] Schema-Versionierung
- [x] Confidence + Field Confidence modelliert
- [x] Modell-Versionierung
- [x] Prompt-Versionierung
- [x] Analysezeitpunkt + stabiler Fehlercode im Wardrobe-Modell
- [x] AI-Systemfelder durch Firestore Rules geschützt
- [x] Callable Functions Client Service
- [x] Functions Region konfigurierbar
- [x] Trusted-Backend-Ziel: Firebase Functions 2nd Gen / TypeScript / Node 22
- [x] erster Development-Provider: Google Gemini API
- [x] erstes Modell: stabiler `gemini-3.6-flash`
- [x] Provider-Abstraktion bleibt Pflicht
- [x] Security Tests verhindern gefälschten AI-State vom Client
- [x] vollständiger Server-Lifecycle dokumentiert
- [x] Idempotenz-/Retry-/Kosten-/Evaluation-Prinzipien dokumentiert

Offen:

- [ ] echtes `functions/` Paket mit Lockfile
- [ ] `analyzeWardrobeItem` Function implementieren
- [ ] `GarmentVisionProvider` Interface
- [ ] `GeminiGarmentVisionProvider`
- [ ] Gemini Secret Management
- [ ] serverseitiges Structured-Output-Schema + Runtime Validation
- [ ] pending/completed/failed Admin-Updates
- [ ] Timeout / Idempotenz / Rate Limit
- [ ] Backend Unit-/Emulator-Tests
- [ ] Analyse-UI + Retry
- [ ] Nutzerkorrektur für unsichere Felder
- [ ] Evaluation Dataset
- [ ] Datenschutz-/Datenresidenzprüfung vor kommerziellem Launch

Dokumente:

- `docs/07-ai/GARMENT_ANALYSIS.md`
- `docs/07-ai/PROVIDER_DECISION.md`

---

# Phase 9+ – Kernprodukt danach

1. StyleProfile / Style-DNA
2. echter Outfit Engine
3. echtes Weather
4. OmniSwap auf echte Wardrobe Items umstellen
5. Trusted Trade Backend
6. Reviews / Trust & Safety
7. Notifications
8. Smart Shopping / Shop als MVP+

---

# Aktueller nächster technischer Schritt

```text
1. Functions-Paket reproduzierbar aufsetzen
2. analyzeWardrobeItem Trusted Backend implementieren
3. Gemini Provider Adapter + Structured Output
4. Backend Emulator Tests
5. AI Analyse-UI anbinden
6. danach StyleProfile + Outfit Engine
```

Die Roadmap darf jederzeit angepasst werden, aber jede Änderung muss den realen Omni-Fashion-Code widerspiegeln und darf keine Demo-Funktion als produktionsfertig markieren.
