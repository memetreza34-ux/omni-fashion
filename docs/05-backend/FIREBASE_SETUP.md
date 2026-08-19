# Omni Fashion – Firebase Setup

Diese Anleitung ist auf den aktuellen Omni-Fashion-Repo-Stand zugeschnitten. Sie beschreibt, wie die bereits vorbereitete Firebase-Schicht gegen echte Development-/Production-Projekte aktiviert und anschließend validiert wird.

---

# 1. Umgebungen

Mindestens:

```text
omni-fashion-dev
omni-fashion-prod
```

Optional später:

```text
omni-fashion-staging
```

Keine lokale Entwicklung direkt gegen Production-Daten.

---

# 2. Firebase-Produkte für MVP

- Authentication
- Cloud Firestore
- Firebase Storage
- App Check
- später Trusted Backend über Functions / Cloud Run
- Analytics / Crash Reporting nach separater Architekturentscheidung

---

# 3. Projekte anlegen

In Firebase Console:

1. Development-Projekt erstellen.
2. Production-Projekt separat erstellen.
3. Billing/Budget Alerts vor teuren Backend-/AI-Funktionen einrichten.
4. Keine Admin-/Service-Account-Secrets in den Client oder GitHub committen.

---

# 4. Client Apps registrieren

Für Development mindestens:

- Web App für Firebase JS SDK-Konfiguration
- Android App, sobald `android.package` final ist
- iOS App, sobald `ios.bundleIdentifier` final ist

Benötigte Clientwerte:

```text
apiKey
authDomain
projectId
storageBucket
messagingSenderId
appId
```

Sie werden über die in `.env.example` dokumentierten `EXPO_PUBLIC_*`-Variablen eingebunden. Diese Werte sind Client-Konfiguration; echte Admin-, AI- oder Server-Secrets dürfen **nicht** als `EXPO_PUBLIC_*` eingebaut werden.

---

# 5. Lokale Environment-Datei

```bash
cp .env.example .env
```

Danach:

```dotenv
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

`.env` bleibt durch `.gitignore` außerhalb des Repos.

---

# 6. Aktueller Codepfad

```text
src/config/env.ts
src/services/firebase/app.ts
src/firebaseConfig.ts       # deprecated compatibility export
```

`src/config/env.ts`:

- liest Client Environment
- normalisiert Werte
- erkennt unvollständige Firebase-Konfiguration

`src/services/firebase/app.ts`:

- initialisiert/reused Firebase App
- stellt Auth bereit
- stellt Firestore bereit
- stellt Storage bereit
- wirft bei fehlender Konfiguration bewusst einen Fehler statt Dummy-Credentials zu benutzen

Neue Features dürfen nicht jeweils eigene Firebase-Initialisierungen anlegen.

---

# 7. Wichtiger Auth-Persistenzpunkt

Firebase dokumentiert für React Native eine explizite AsyncStorage-Persistenz über `getReactNativePersistence`. Der aktuelle Firebase-12-Typecheck dieses Repos liefert diesen Export über `firebase/auth` jedoch nicht konsistent, obwohl die Firebase-Referenz ihn dokumentiert.

Deshalb gilt aktuell:

```text
Bootstrap → getAuth(app)
```

und **native Session-Persistenz ist noch nicht als abgeschlossen markiert**.

Sobald das echte Dev-Projekt existiert:

1. Android Development Build testen.
2. Einloggen.
3. App vollständig beenden.
4. App neu öffnen.
5. Session Restore prüfen.
6. Dasselbe auf iOS.
7. Falls Persistenz nicht funktioniert, versionskompatible React-Native-Initialisierung implementieren.
8. Danach automatisierte und Device-Tests dokumentieren.

Kein `@ts-ignore` nur zum Verbergen des Problems.

---

# 8. Authentication aktivieren

```text
Firebase Console
→ Authentication
→ Sign-in method
→ Email/Password aktivieren
```

MVP zuerst nur E-Mail/Passwort.

Der Code enthält bereits:

- Login
- Registrierung
- Verification Mail
- Verification Reload/Resend
- Passwort-Reset
- Logout

Google/Apple Sign-In erst nach stabiler Basis.

---

# 9. Firestore aktivieren

Firestore anlegen und **nicht dauerhaft in offenem Testmodus** betreiben.

Repo enthält:

```text
firestore.rules
firestore.indexes.json
```

Aktuelle Rules-Strategie:

- Default deny
- `users/{uid}` privat
- StyleProfile privat
- Wardrobe privat
- Outfits privat
- aktive Marketplace Listings bewusst lesbar
- Swap Offers nur für Teilnehmer lesbar
- Offers/Transactions nicht direkt client-writable
- Reviews nicht frei client-writable
- Reports für Moderation vorgesehen

---

# 10. Storage aktivieren

Repo enthält:

```text
storage.rules
```

Zielpfade:

```text
users/{uid}/wardrobe/{itemId}/{fileName}
users/{uid}/avatars/{fileName}
public/listings/{listingId}/{fileName}
```

Regeln aktuell:

- private Wardrobe-Medien nur Owner
- Bildtyp und Uploadgröße begrenzt
- Avatar vom Owner schreibbar
- öffentliche Listing-Medien clientseitig nur lesbar
- nicht definierte Pfade: deny

---

# 11. Firebase CLI

```bash
npm install --global firebase-tools
firebase login
```

Beim späteren `firebase init` vorhandene Dateien nicht blind überschreiben.

Bereits im Repo:

```text
firebase.json
firestore.rules
storage.rules
firestore.indexes.json
```

---

# 12. Projekt-Aliase

Erst mit echten Projekt-IDs eine `.firebaserc` anlegen, z. B.:

```text
default → omni-fashion-dev
prod    → omni-fashion-prod
```

Keine Production-ID hart in Fachcode einbauen.

---

# 13. Emulator Suite

Vor echten Marketplace-Commands mindestens testen:

- Auth Emulator
- Firestore Emulator
- Storage Emulator
- Functions Emulator, sobald Trusted Backend existiert

Pflichttests:

```text
User A liest eigenen Wardrobe      → allow
User B liest Wardrobe von A        → deny
User B ändert Wardrobe von A       → deny
Owner verwaltet eigenes Listing    → allow gemäß Status
Fremder ändert Listing             → deny
Client akzeptiert Trade direkt     → deny
```

---

# 14. Rules deployen

Erst Dev:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

Production erst nach Rules Tests und Review.

---

# 15. App Check

Vor Production einrichten.

App Check ist zusätzliche Missbrauchshürde und **ersetzt niemals Security Rules**.

---

# 16. Trusted Backend

Geplante Commands:

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

Admin SDK umgeht Client Security Rules. Jeder Command muss deshalb selbst Auth, Rolle, Eingaben und Zustandsübergang validieren.

---

# 17. Production-Trennung

Production erhält eigene:

- Firebase Project ID
- Auth User Base
- Firestore-Daten
- Storage Bucket
- Rules Deployment
- Backend Secrets
- AI Secrets
- Budgets
- Monitoring

Keine Dev/Test-Accounts automatisch nach Production kopieren.

---

# 18. EAS Environments

Später:

```text
development
preview
production
```

Client-Konfiguration pro Environment; Server-Secrets bleiben außerhalb des Client-Bundles.

---

# 19. Definition of Done

- [ ] Dev Firebase Projekt existiert
- [ ] Prod Firebase Projekt existiert
- [ ] Email/Password Auth aktiv
- [ ] `.env` verbindet App mit Dev Firebase
- [ ] Registrierung real getestet
- [ ] Verification real getestet
- [ ] Passwort-Reset real getestet
- [ ] Session Restore Android real getestet
- [ ] Session Restore iOS real getestet
- [ ] Firestore aktiv
- [ ] Storage aktiv
- [ ] Rules Emulator Tests vorhanden
- [ ] Rules ins Dev-Projekt deployed
- [ ] App Check vor Production aktiv
- [ ] Budget Alerts eingerichtet
- [ ] Production-Konfiguration getrennt

---

# Aktueller Repo-Status

Bereits umgesetzt:

- [x] `.env.example`
- [x] typed Environment Config
- [x] Firebase Bootstrap Service
- [x] Dummy-Konfiguration entfernt
- [x] Auth-/Profile-Code vorbereitet
- [x] Firestore Rules Baseline
- [x] Storage Rules Baseline
- [x] Index Manifest
- [x] GitHub Actions Type/Zero-any Gate

Noch extern notwendig:

- [ ] echte Firebase Development-/Production-Projektwerte
