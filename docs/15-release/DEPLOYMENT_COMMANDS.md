# Omni Fashion – Guarded Firebase Deployment Commands

## Ziel

Firebase-Deployments sollen **niemals** davon abhängen, welches Projekt zufällig zuletzt mit `firebase use` ausgewählt war.

Die Repo-Skripte verlangen deshalb immer:

```text
OMNI_FIREBASE_PROJECT_ID
OMNI_FIREBASE_ENV
```

Für Production zusätzlich:

```text
OMNI_CONFIRM_PRODUCTION_PROJECT
```

Der Bestätigungswert muss exakt derselben Production Project ID entsprechen.

---

# 1. Interner Foundation Check

Vor jedem Firebase-/Release-Schritt:

```bash
npm run verify:foundation
```

Der Check prüft unter anderem:

- Firebase-Konfigurationsdateien
- Rules / Indizes / Functions Source
- Emulator-Portkonsistenz
- EAS Preview-/Production-Trennung
- Expo-/React-Native-/React-Versionen
- Release- und E2E-Dokumente
- Entfernung des alten Mock-Daten-Integritätsskripts

Der normale Befehl

```bash
npm run verify:quality
```

führt Foundation Check + Zero-any + TypeScript gemeinsam aus.

---

# 2. Lokale Emulator Suite

Keine reale Firebase Project ID erforderlich:

```bash
npm run firebase:emulators
```

Das Script verwendet absichtlich:

```text
demo-omni-fashion-local
```

und startet:

- Auth Emulator: 9099
- Functions Emulator: 5001
- Firestore Emulator: 8080
- Storage Emulator: 9199
- Emulator UI: 4000

Damit kann ein lokaler Emulator-Test nicht versehentlich ein echtes Dev-/Prod-Projekt auswählen.

---

# 3. Firebase Development Project

## PowerShell

```powershell
$env:OMNI_FIREBASE_PROJECT_ID="DEINE_DEV_PROJECT_ID"
$env:OMNI_FIREBASE_ENV="development"

npm run firebase:preflight
```

Danach gezielt deployen:

```powershell
npm run firebase:deploy:firestore
npm run firebase:deploy:storage
npm run firebase:deploy:functions
```

Oder alles gemeinsam:

```powershell
npm run firebase:deploy:all
```

## Bash / zsh

```bash
export OMNI_FIREBASE_PROJECT_ID="DEINE_DEV_PROJECT_ID"
export OMNI_FIREBASE_ENV="development"

npm run firebase:preflight
npm run firebase:deploy:all
```

---

# 4. Firebase Production Project

Production verlangt eine zusätzliche explizite Bestätigung.

## PowerShell

```powershell
$env:OMNI_FIREBASE_PROJECT_ID="DEINE_PRODUCTION_PROJECT_ID"
$env:OMNI_FIREBASE_ENV="production"
$env:OMNI_CONFIRM_PRODUCTION_PROJECT=$env:OMNI_FIREBASE_PROJECT_ID

npm run firebase:preflight
```

Erst wenn der Preflight exakt das erwartete Production-Projekt ausgibt:

```powershell
npm run firebase:deploy:firestore
npm run firebase:deploy:storage
npm run firebase:deploy:functions
```

oder:

```powershell
npm run firebase:deploy:all
```

## Bash / zsh

```bash
export OMNI_FIREBASE_PROJECT_ID="DEINE_PRODUCTION_PROJECT_ID"
export OMNI_FIREBASE_ENV="production"
export OMNI_CONFIRM_PRODUCTION_PROJECT="$OMNI_FIREBASE_PROJECT_ID"

npm run firebase:preflight
npm run firebase:deploy:all
```

---

# 5. Warum Rules getrennt deploybar bleiben

Für sicherheitskritische Änderungen kann zuerst gezielt deployed werden:

```bash
npm run firebase:deploy:firestore
npm run firebase:deploy:storage
```

`firestore` deployt die im Repo definierten Firestore Rules und Indizes. `storage` deployt die Storage Rules.

Die Firebase Console ist **nicht** Source of Truth. CLI-Deployments können Console-Regeln überschreiben; deshalb müssen geprüfte Regeln zuerst ins Repo.

---

# 6. Functions

Vor Functions Deployment läuft über `firebase.json` der konfigurierte Predeploy-Build für die Functions-Codebase.

Zusätzlich kann separat geprüft werden:

```bash
cd functions
npm ci
npm run verify
```

Erst danach:

```bash
npm run firebase:deploy:functions
```

Secrets wie `GEMINI_API_KEY` gehören nicht in `EXPO_PUBLIC_*` und nicht ins Repo.

---

# 7. Release Config Validator

Sobald EAS-Projekt-ID und permanente native App-Identifier real festgelegt sind:

```bash
npm run validate:release-config
```

Der Validator bleibt vorher absichtlich rot/fail-closed, wenn unter anderem fehlen:

- `android.package`
- `ios.bundleIdentifier`
- `extra.eas.projectId`
- Production Firebase Client Environment

Ein fehlgeschlagener Validator wird **nicht** durch Dummywerte umgangen.

---

# 8. Deployment-Reihenfolge für Omni Fashion Dev

```text
verify:quality
→ Firebase Dev Project auswählen
→ firebase:preflight
→ Firestore Rules + Indizes
→ Storage Rules
→ Functions
→ Gemini Secret
→ runtimeConfig/publicFeatureFlags
→ TTL-Konfiguration für rateLimits
→ App Check Development Spike
→ EAS Development Build
→ DEVICE_E2E_PLAN.md
```

---

# 9. Production-Regel

Kein Production Deployment, wenn einer dieser Punkte unklar ist:

- welche Project ID Ziel ist
- welcher Commit deployt wird
- ob CI auf diesem Commit grün ist
- welche Functions Revision dazugehört
- ob Rules/Indizes zum App-Build passen
- ob Rollback-Pfad bekannt ist

Production wird niemals nur aufgrund eines erfolgreichen lokalen Starts freigegeben.
