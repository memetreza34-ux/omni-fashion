# Omni Fashion – Dependency Audit

**Stand:** 19. August 2026  
**Scope:** Root-App + Firebase Functions  
**Regel:** Kein `npm audit fix --force` ohne explizite Expo-SDK-/Functions-Kompatibilitätsprüfung.

## Warum dieses Dokument existiert

`npm audit` bewertet bekannte Advisory-Pfade, aber der vorgeschlagene automatische Fix kann in einem Expo-Projekt eine technisch falsche Version wählen. Für Omni Fashion gilt deshalb:

1. Findings werden sichtbar gehalten.
2. sichere non-force Lockfile-Fixes werden simuliert und getestet.
3. Major-/SDK-Downgrades werden nicht nur wegen eines Audit-Vorschlags übernommen.
4. ein Finding wird erst geschlossen, wenn eine mit Expo SDK 57 bzw. dem Functions-Stack kompatible Abhängigkeitskette verfügbar und über die Quality-Gates bestätigt ist.

## Root-App

Aktueller Audit-Stand:

```text
critical: 0
high:     14
moderate:  8
low:       0
total:    22
```

Direkte betroffene Pakete laut npm-Audit-Kette:

- `expo`
- `expo-splash-screen`
- `react-native`
- `react-native-reanimated`
- `react-native-worklets`

Wichtige transitive Pfade enthalten unter anderem Expo CLI/Metro, React-Native-Metro, `image-size`, `uuid` und `xcode`.

### Safe-Fix-Ergebnis

`npm audit fix --package-lock-only` wurde in einem isolierten CI-Lauf simuliert. Danach:

- Expo-Kompatibilitätsprüfung: bestanden
- ESLint: bestanden
- TypeScript / Zero-any / Foundation: bestanden
- Vulnerabilities: unverändert 22
- `package.json`: keine Änderung
- `package-lock.json`: keine sichere Änderung

Die von npm angebotenen Force-Fixes würden unter anderem auf ältere/incompatible Linien wie Expo 53 bzw. React Native 0.72 zurückgehen. Das widerspricht der bestätigten Expo-SDK-57-Basis und wird nicht angewendet.

## Firebase Functions

Aktueller Audit-Stand:

```text
critical: 0
high:      0
moderate:  7
low:       0
total:     7
```

Direkt betroffen:

- `firebase-admin`
- `firebase-functions`

Transitive Pfade enthalten unter anderem:

- `@google-cloud/storage`
- `gaxios`
- `retry-request`
- `teeny-request`
- `uuid`

### Safe-Fix-Ergebnis

Die non-force Lockfile-Simulation erzeugte keine sichere Änderung. Functions Typecheck, Build und 27 Unit Tests blieben grün. Die angebotenen Force-Fixes würden ältere Major-Versionen von `firebase-admin` bzw. `firebase-functions` installieren und werden deshalb nicht automatisch übernommen.

## Aktuelle Risikobehandlung

Diese Findings sind **nicht als behoben markiert**. Sie werden als kompatibilitätsgebundene Dependency-Debt behandelt.

Mitigations:

- Dependabot bleibt für Root npm und Functions npm aktiv.
- `expo install --check` verhindert inkompatible Expo-Abhängigkeitsstände.
- `Dependency Audit` dokumentiert die Advisory-Pfade bei jedem PR.
- `Dependency Fix Plan` simuliert non-force Updates vor einer Änderung.
- `Apply Safe Audit Fix` darf ausschließlich Lockfile-only non-force Änderungen übernehmen und lehnt Manifeständerungen ab.
- TypeScript, ESLint, Prettier, Functions Tests, Security Emulator und Production-Bundle bleiben unabhängige Gates.
- Force-Downgrades sind verboten.

## Wann erneut handeln

Dependency-Updates werden erneut bewertet, wenn mindestens eines zutrifft:

- Expo veröffentlicht einen SDK-57-kompatiblen Patch mit bereinigter Kette.
- React Native / Metro veröffentlicht einen kompatiblen Patch.
- Firebase Admin / Functions veröffentlicht eine kompatible Version, die die betroffenen Transitiven aktualisiert.
- Dependabot schlägt einen innerhalb der bestätigten Kompatibilitätsgrenzen liegenden Patch vor.
- ein Advisory wird aufgrund realer Omni-Fashion-Nutzung als unmittelbar ausnutzbar eingestuft.
- vor jedem Release Candidate.

Nach jeder Änderung müssen mindestens laufen:

```text
npm ci
npm run verify:expo
npm run lint
npm run format:check
npm run verify:quality
npm --prefix functions run verify
Firebase Security Emulator
Expo production web bundle
```

## Release-Regel

Ein Release Candidate darf die offenen Findings nicht stillschweigend ignorieren. Sie müssen vor RC erneut geprüft und in der Release-Entscheidung ausdrücklich dokumentiert werden. Ein automatischer Versions-Downgrade ist keine akzeptable Sicherheitsbehebung.
