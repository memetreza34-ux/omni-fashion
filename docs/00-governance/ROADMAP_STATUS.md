# Omni Fashion – Roadmap Status

**Stand:** 16. August 2026

Diese Datei zeigt den tatsächlichen Arbeitsstand. Sie wird bei jeder größeren Änderung aktualisiert.

## Status-Legende

- ✅ abgeschlossen / ausreichend definiert
- 🟡 in Arbeit / teilweise
- 🔴 offen
- ⚪ später / nicht MVP-kritisch

---

# Phase 0 – Produktdefinition

**Status: ✅ abgeschlossen als Arbeitsbasis**

Erledigt:

- [x] Hauptproblem definiert
- [x] Produktversprechen definiert
- [x] Haupt-USP definiert
- [x] Produktprinzipien definiert
- [x] Zielgruppen nach Bedarf statt willkürlicher Demografie segmentiert
- [x] MVP Scope festgelegt
- [x] klare Nicht-Ziele definiert
- [x] Kernmetriken vorgeschlagen

Dokumente:

- `docs/01-product/PRODUCT_FOUNDATION.md`
- `docs/01-product/MVP_SCOPE.md`

Noch bewusst offen:

- [ ] endgültiger kommerzieller Launch-Markt
- [ ] finale Monetarisierungsentscheidung nach Nutzungsdaten

---

# Phase 1 – Produktarchitektur und User Journeys

**Status: ✅ Produkt-/Systementwurf vorhanden**

Erledigt:

- [x] Kernjourneys detailliert
- [x] Source-of-Truth-Prinzip definiert
- [x] Wardrobe → Stylist / Swap / Shopping Verbindung definiert
- [x] Client-/Server-Vertrauensgrenze definiert
- [x] Marketplace-Statuslogik konzeptionell definiert
- [x] AI-Architekturprinzip definiert
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

Bereits entschieden:

- [x] Expo + React Native bleibt bestehen
- [x] Expo Router bleibt bestehen
- [x] TypeScript strict bleibt bestehen
- [x] Firebase bleibt vorerst Ziel-Backend
- [x] Backendzugriffe werden gekapselt
- [x] Trusted Backend wird für kritische Commands vorgesehen
- [x] KI-Provider wird abstrahiert

Noch offen:

- [ ] genaue Server-Technologie festziehen
- [ ] Analytics-Anbieter festlegen
- [ ] Crash-Reporting-Anbieter festlegen
- [ ] Feature-Flag-Technik festlegen
- [ ] echte Testtools festlegen

---

# Phase 3 – Repo-Hygiene / Environment

**Status: 🟡 begonnen**

Erledigt:

- [x] Standard-Expo-README durch Omni-Fashion-README ersetzt
- [x] `.env.example` angelegt
- [x] `.gitignore` für Environment-Dateien gehärtet
- [x] typisierte Environment-Konfiguration angelegt
- [x] Dokumentationsstruktur begonnen
- [x] Dummy-Firebase-Werte aus `firebaseConfig.ts` entfernt

Offen:

- [ ] ESLint-Konfiguration prüfen/finalisieren
- [ ] Formatter festlegen
- [ ] CI Workflow anlegen
- [ ] Environment Setup für development/staging/production real einrichten
- [ ] Secrets-/Dependency-Audit automatisieren

---

# Phase 4 – Designsystem

**Status: 🔴 offen**

Vorhandene UI bleibt bestehen, aber Design Tokens und gemeinsame Komponenten müssen später vereinheitlicht werden.

---

# Phase 5 – Auth

**Status: 🟡 technische Migration begonnen**

Erledigt:

- [x] `any` aus AuthContext entfernt
- [x] `AuthUser` Domain-Typ eingeführt
- [x] Login API nimmt echte Credentials entgegen
- [x] Firebase Auth Service vorbereitet
- [x] Auth State Subscription vorbereitet
- [x] React-Native-Persistenz vorbereitet
- [x] Entwicklungs-Demo ist explizit als Dev-only markiert
- [x] Release-Build darf ohne Backend nicht still auf Demo wechseln

Offen:

- [ ] echtes Firebase-Projekt konfigurieren
- [ ] Registrierung
- [ ] E-Mail-Verifizierung
- [ ] Passwort-Reset
- [ ] UserProfile in Firestore
- [ ] Auth-Fehlercodes sauber lokalisieren
- [ ] Login/Register UX finalisieren
- [ ] Accountlöschung
- [ ] Auth Integration Tests

---

# Phase 6 – Firebase Backend

**Status: 🟡 Bootstrap begonnen**

Erledigt:

- [x] Firebase Initialisierung in Service-Schicht vorbereitet
- [x] Web/Native Auth Initialisierung getrennt
- [x] Firestore/Storage Bootstrap vorbereitet

Blocker:

- [ ] echte Firebase Dev-/Prod-Projekte und Werte fehlen

Danach:

- [ ] Firestore Collections
- [ ] Storage Pfade
- [ ] Security Rules
- [ ] Rules Tests
- [ ] App Check
- [ ] Indizes
- [ ] Budget Alerts

---

# Phase 7+ – Kernprodukt

**Status: 🔴 noch nicht produktiv migriert**

Reihenfolge nach Auth/Backend:

1. Cloud Wardrobe
2. Upload Pipeline
3. AI Kleidungsanalyse
4. StyleProfile
5. Outfit Engine
6. echtes Weather
7. OmniSwap auf echte Wardrobe Items umstellen
8. Trade Backend
9. Trust & Safety
10. Notifications

---

# Aktueller nächster technischer Schritt

```text
1. Auth Flow vervollständigen
2. UserProfile Modell + Firestore Service
3. Firebase Security Rules Grundgerüst
4. Wardrobe Domain Modell konsolidieren
5. WardrobeContext aus AsyncStorage heraus migrieren
```

Bis echte Firebase-Projektwerte vorhanden sind, können Code, Datenmodelle, Rules und Tests vorbereitet werden; echte Cloud-Integration kann erst mit einem konfigurierten Projekt vollständig validiert werden.
