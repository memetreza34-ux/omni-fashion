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

**Status: 🟡 in Arbeit**

Festgelegt:

- [x] Expo + React Native bleibt bestehen
- [x] Expo Router bleibt bestehen
- [x] TypeScript strict bleibt bestehen
- [x] Firebase bleibt vorerst Ziel-Backend
- [x] Backendzugriffe werden gekapselt
- [x] Trusted Backend für kritische Commands vorgesehen
- [x] KI-Provider wird abstrahiert
- [x] kein Big-Bang-Rewrite

Offen:

- [ ] genaue Trusted-Backend-Technologie festziehen
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
- [x] vorhandene `as any`-Altlasten im Wardrobe-Modal entfernt
- [x] dabei gefundene instabile Hook-Reihenfolge im Modal behoben

Noch offen:

- [ ] ESLint-Konfiguration prüfen/finalisieren
- [ ] Formatter festlegen
- [ ] Build-Smoke-Test in CI ergänzen
- [ ] Development/Staging/Production EAS Environments real einrichten
- [ ] Dependency-/Security-Audit kontrolliert aufarbeiten

### Gefundene Dependency-Schuld

Der erste `npm ci`/Audit-Lauf meldet derzeit 23 bekannte Dependency-Hinweise (8 moderate, 15 high). Diese werden **nicht** blind mit `npm audit fix --force` behoben, sondern paketweise auf Expo-Kompatibilität geprüft.

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

**Status: 🟡 Bootstrap + Sicherheitsbasis vorhanden**

Erledigt:

- [x] Firebase Initialisierung in Service-Schicht
- [x] Firestore Bootstrap
- [x] Storage Bootstrap
- [x] `firebase.json`
- [x] `firestore.indexes.json`
- [x] Firestore Rules Baseline
- [x] Storage Rules Baseline
- [x] Default-Deny-Prinzip
- [x] private Wardrobe-Zugriffe auf Owner begrenzt
- [x] Marketplace Public Snapshot architektonisch getrennt
- [x] Swap Offers für Client-Schreibzugriff gesperrt
- [x] Trade Transactions für Client-Schreibzugriff gesperrt
- [x] Reviews/Reputation clientseitig nicht frei manipulierbar
- [x] Reports als moderationspflichtige Daten vorgesehen
- [x] UserProfile-Felder in Rules validiert

Externer Blocker:

- [ ] echte Firebase Development-/Production-Projekte und Werte

Danach zwingend:

- [ ] Firebase Auth Email/Password in Console aktivieren
- [ ] Firestore/Storage im Dev-Projekt aktivieren
- [ ] Rules im Emulator testen
- [ ] Rules ins Dev-Projekt deployen
- [ ] App Check
- [ ] benötigte Firestore-Indizes anhand echter Queries
- [ ] Budget Alerts
- [ ] Trusted Backend aufsetzen

Dokument:

- `docs/05-backend/FIREBASE_SETUP.md`

---

# Phase 7 – Cloud Wardrobe

**Status: 🔴 nächster großer Produktblock nach Auth/Firebase**

Geplante Reihenfolge:

1. bestehendes `WardrobeItem` in neues Domain-Modell überführen
2. Firestore Wardrobe Service
3. Owner-basierte Queries
4. Storage Upload Service
5. bestehende lokale Items migrieren/Development-Fallback behandeln
6. `WardrobeContext` auf Server State umstellen
7. Loading / Error / Empty / Offline
8. Rules Tests
9. echte Geräteprüfung

---

# Phase 8+ – Kernprodukt danach

1. AI-Kleidungsanalyse
2. StyleProfile
3. echter Outfit Engine
4. echtes Weather
5. OmniSwap auf echte Wardrobe Items umstellen
6. Trusted Trade Backend
7. Reviews / Trust & Safety
8. Notifications
9. Smart Shopping / Shop als MVP+

---

# Aktueller nächster technischer Schritt

```text
1. aktuellen CI-Typecheck grün bekommen
2. Auth-Flows mit echtem Firebase-Dev-Projekt validierbar machen
3. Security Rules Tests vorbereiten
4. Wardrobe Domain Modell konsolidieren
5. Cloud Wardrobe Service bauen
6. WardrobeContext kontrolliert von AsyncStorage migrieren
```

Die Roadmap darf jederzeit angepasst werden, aber jede Änderung muss den realen Omni-Fashion-Code widerspiegeln und darf keine Demo-Funktion als produktionsfertig markieren.
