# Omni Fashion – Firebase Setup

Diese Anleitung ist auf den aktuellen Repo-Stand zugeschnitten. Sie beschreibt die noch notwendige Einrichtung, damit die vorbereitete Firebase-Schicht tatsächlich gegen echte Development-/Production-Projekte läuft.

---

# 1. Zielarchitektur

Mindestens zwei getrennte Firebase-Projekte:

```text
omni-fashion-dev
omni-fashion-prod
```

Optional später:

```text
omni-fashion-staging
```

Keine lokalen Tests gegen Production-Daten.

---

# 2. Benötigte Firebase-Produkte

Für MVP:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- App Check
- später Functions / Cloud Run für Trusted Backend
- optional Analytics / Crashlytics nach separater Entscheidung

---

# 3. Firebase-Projekt anlegen

In der Firebase Console:

1. Development-Projekt erstellen.
2. Production-Projekt separat erstellen.
3. Keine Production-Secrets in GitHub committen.
4. Billing/Budget Alerts vor teuren Backend-/AI-Funktionen einrichten.

---

# 4. Client Apps registrieren

Für das Development-Projekt mindestens registrieren:

- Web App für Firebase JS SDK-Konfiguration
- Android App, sobald `android.package` final ist
- iOS App, sobald `ios.bundleIdentifier` final ist

Die Client-Konfiguration enthält Werte wie:

```text
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

Diese Firebase-Clientwerte sind keine geheimen Server-Credentials. In Expo werden sie über `EXPO_PUBLIC_*` eingebunden. **Private Admin-/AI-/Service-Account-Secrets dürfen trotzdem niemals dort landen.**

---

# 5. Lokale Environment-Datei

Repo:

```text
.env.example
```

Für lokale Entwicklung:

```bash
cp .env.example .env
```

Dann ausfüllen:

```dotenv
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

`.env` ist im Repo ignoriert.

---

# 6. Codepfad

Aktuelle Dateien:

```text
src/config/env.ts
src/services/firebase/app.ts
src/firebaseConfig.ts         # Compatibility Export / deprecated
```

`src/config/env.ts`:

- liest Environment
- normalisiert Werte
- erkennt, ob Firebase vollständig konfiguriert ist

`src/services/firebase/app.ts`:

- initialisiert Firebase App
- initialisiert Firebase Auth
- verwendet auf React Native persistente Auth-Session
- stellt Firestore und Storage bereit

Neue Features sollen **nicht** direkt neue Firebase-Initialisierung bauen.

---

# 7. Authentication aktivieren

In Firebase Console:

```text
Authentication
→ Sign-in method
→ Email/Password aktivieren
```

Für MVP zuerst nur E-Mail/Passwort.

Danach können geprüft werden:

- Sign in with Apple
- Google Sign-In

Nicht gleichzeitig fünf Auth-Provider bauen.

---

# 8. Firestore aktivieren

Firestore Datenbank anlegen.

Wichtig:

> Nicht dauerhaft im offenen Testmodus betreiben.

Das Repo enthält bereits:

```text
firestore.rules
firestore.indexes.json
```

Die Rules starten bewusst restriktiv.

---

# 9. Storage aktivieren

Storage Bucket aktivieren.

Repo enthält:

```text
storage.rules
```

Geplante Pfade:

```text
users/{uid}/wardrobe/{itemId}/{fileName}
users/{uid}/avatars/{fileName}
public/listings/{listingId}/{fileName}
```

Private Wardrobe-Bilder sind nur für Besitzer lesbar.

Public Listing Media darf später nur durch Trusted Backend erzeugt werden.

---

# 10. Firebase CLI

Für Deployment/Emulator wird Firebase CLI benötigt.

Typischer Ablauf:

```bash
npm install --global firebase-tools
firebase login
firebase init
```

Bei `firebase init` nicht automatisch bestehende Repo-Dateien überschreiben.

Dieses Repo besitzt bereits:

```text
firebase.json
firestore.rules
storage.rules
firestore.indexes.json
```

---

# 11. Projektzuordnung

Keine feste Production-Projekt-ID blind in Source Code schreiben.

Lokal kann Firebase CLI über Projektalias arbeiten, z. B.:

```text
default → development
prod    → production
```

Die konkrete `.firebaserc` erst anlegen, wenn die echten Projekt-IDs bekannt sind.

---

# 12. Rules deployen

Nach Konfiguration:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

Vor Production erst im Dev-Projekt testen.

---

# 13. Emulator Suite

Vor echtem Marketplace-Backend soll eine lokale Rules-Testumgebung eingerichtet werden.

Mindestens:

- Auth Emulator
- Firestore Emulator
- Storage Emulator
- Functions Emulator, sobald Backend Commands existieren

Ziel:

```text
User A darf eigenen Schrank lesen
User B darf ihn nicht lesen
Owner darf eigenes Listing verwalten
fremder Nutzer darf es nicht ändern
Client darf Trade nicht direkt akzeptieren
```

---

# 14. App Check

App Check wird vor Production eingerichtet, damit nicht jeder beliebige Script-Client ungebremst auf Firebase APIs zugreifen kann.

App Check ersetzt **keine Security Rules**.

Beides wird benötigt.

---

# 15. Trusted Backend

Folgende Funktionen dürfen später nicht nur Client → Firestore sein:

```text
analyzeWardrobeImage
createSwapOffer
acceptSwapOffer
advanceSwapTransaction
completeSwapTransaction
sendTransactionalNotification
deleteAccountData
moderateListing
```

Der Admin SDK Zugriff auf Firestore umgeht Client Security Rules; deshalb muss Trusted Backend selbst Input, Auth und Rollen streng validieren.

---

# 16. Production Environment

Production erhält eigene:

- Firebase Project ID
- Storage Bucket
- Auth User Base
- Firestore Daten
- Rules Deployment
- Backend Secrets
- AI Secrets
- Budgets
- Monitoring

Keine Development-Nutzer in Production kopieren.

---

# 17. EAS Environment

Später werden die Client-Werte pro EAS Environment gepflegt:

```text
development
preview
production
```

Expo SDK 57 verwendet `EXPO_PUBLIC_*` für Werte, die in Client-Code verfügbar sein müssen.

Server-Secrets bleiben außerhalb des Client-Bundles.

---

# 18. Definition of Done

Firebase-Grundlage ist erst abgeschlossen, wenn:

- [ ] Dev Firebase Projekt existiert
- [ ] Prod Firebase Projekt existiert
- [ ] Email/Password Auth aktiv
- [ ] lokale `.env` funktioniert
- [ ] App verbindet sich mit Dev Firebase
- [ ] Auth Session über Neustart bleibt
- [ ] Firestore aktiv
- [ ] Storage aktiv
- [ ] Rules deployed
- [ ] Rules Emulator Tests vorhanden
- [ ] App Check vor Production aktiv
- [ ] Budget Alerts eingerichtet
- [ ] Production-Konfiguration getrennt

---

# Aktueller Repo-Status

Bereits umgesetzt:

- [x] `.env.example`
- [x] typisierte Environment Config
- [x] Firebase Bootstrap Service
- [x] React-Native Auth Persistence vorbereitet
- [x] Firestore Rules Baseline
- [x] Storage Rules Baseline
- [x] Index Manifest

Externer Blocker:

- [ ] echte Firebase-Projektwerte
