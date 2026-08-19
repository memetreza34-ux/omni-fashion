# Omni Fashion – Auth & Onboarding Implementation

**Stand:** 19. August 2026  
**Status:** technischer Kern implementiert; reales Firebase-/Device-E2E bleibt offen.

## Ziel

Omni Fashion trennt Identität, Produktprofil und Style-DNA bewusst:

```text
Firebase Auth
→ UserProfile
→ StyleProfile / Onboarding
→ Haupt-App
```

Ein Nutzer gelangt nicht allein deshalb in die Haupt-App, weil ein Firebase-Account existiert.

## Aktueller Root-Gate

```text
BOOTING
→ kein Nutzer: Login/Register/Reset
→ echter Nutzer unverifiziert: E-Mail-Verifikation
→ verifiziert, UserProfile lädt: Loading
→ UserProfile fehlt/Fehler: Retry oder Logout
→ onboardingCompleted == false: Style-DNA-Onboarding
→ onboardingCompleted == true: Haupt-App
```

Development-Demo bleibt ausschließlich in `__DEV__`. Fehlt Firebase in Production, wird kein Fake-Login erzeugt.

## Auth-Funktionen

Implementiert:

- E-Mail/Passwort Login
- Registrierung + DisplayName
- E-Mail-Verifikationsmail
- Verification Gate
- Verification Reload
- Verification Resend + 60-Sekunden-Cooldown
- Passwort-Reset mit neutraler Erfolgsmeldung
- Logout
- Firebase Auth State Listener
- zentrale, typisierte Fehlernormalisierung
- Passwort-Reauthentication für sensible Privacy-Aktionen

Wichtige Grenze: Passwörter werden nicht in Firestore, Analytics oder eigenen App-Daten gespeichert.

## UserProfile

Firestore:

```text
users/{uid}
```

Aktuelle Felder:

```text
displayName
avatarUrl
locale
country
city
onboardingCompleted
createdAt
updatedAt
schemaVersion
```

Implementiert:

- `UserProfile` Domain Type
- zentraler `USER_PROFILE_SCHEMA_VERSION`
- `createUserProfileIfMissing()`
- DisplayName-Repair bei Auth/Profile-Race
- `getUserProfile()`
- `updateUserProfile()`
- reaktiver `UserProfileProvider`
- Development-Persistenz über AsyncStorage
- Production vollständig cloud-backed

Firestore Rules erlauben nur dem jeweiligen Nutzer Zugriff auf `users/{uid}`. Der Emulator-Test bestätigt zusätzlich:

- Besitzer darf `onboardingCompleted` ändern
- fremder Nutzer darf es nicht ändern
- falscher Datentyp wird abgewiesen

## Style-DNA-Onboarding

Das Onboarding ist kein Demo-Screen. Es schreibt die bereits produktiv verwendeten StyleProfile-Daten.

### Schritt 1

- mindestens eine Stilrichtung
- maximal fünf Stilrichtungen
- mindestens eine Passform

### Schritt 2

- Lieblingsfarben optional
- Casual ↔ Formal
- Minimal ↔ Bold

Accessibility:

- Checkbox-/Radio-Semantik
- 48px Mindest-Controlhöhe
- Progressbar `Schritt 1 von 2` / `Schritt 2 von 2`
- Busy-/Disabled-State
- zugänglicher Fehlerzustand

### Atomare Produktlogik auf Anwendungsebene

Der Abschluss erfolgt bewusst in dieser Reihenfolge:

```text
1. StyleProfile speichern
2. erst danach onboardingCompleted = true
```

Wenn StyleProfile-Speichern oder Profile-Update fehlschlägt, wird das Onboarding nicht fälschlich als abgeschlossen markiert. Ein Retry kann die bereits gespeicherten Style-Daten erneut sicher verwenden.

## Development-Demo

Ohne echtes Firebase-Dev-Projekt:

```text
__DEV__
→ lokaler Demo-AuthUser
→ lokales UserProfile in AsyncStorage
→ lokales StyleProfile
→ Onboarding bleibt über App-Neustarts erhalten
```

Production ohne Firebase:

```text
kein stiller Demo-Fallback
→ fail closed
```

## Native Session Persistence

Dieser Punkt bleibt bewusst offen.

Der aktuelle Firebase-JS-SDK-Typecheck hatte zuvor einen Konflikt um `getReactNativePersistence`. Deshalb wurde kein `@ts-ignore` und kein erfundener Type-Patch eingebaut. Der Bootstrap nutzt weiterhin `getAuth(app)`.

Vor Release muss auf echten Android-/iOS-Development-Builds validiert werden:

```text
Login
→ App vollständig schließen
→ App erneut öffnen
→ erwartete Session vorhanden
→ Logout
→ Neustart
→ Session entfernt
```

Falls das nicht zuverlässig funktioniert, wird die native Persistenz erst anhand der dann tatsächlich installierten Firebase-/Expo-Kombination ergänzt.

## Privacy / Account Lifecycle

Der technische Account-Lifecycle ist inzwischen separat umgesetzt:

- Deletion Readiness
- Fresh-Auth-Grenze
- Passwort-Reauthentication
- explizite Löschbestätigung
- Trusted Backend Cleanup
- private Firestore-/Storage-/Push-/Rate-Limit-Daten entfernen
- abgeschlossene gemeinsame Marketplace-Historie pseudonymisieren/redigieren
- Firebase Auth zuletzt löschen

Detail: [`../13-privacy/`](../13-privacy/)

## Security

Auth allein schützt keine Daten. Zusätzlich vorhanden:

- Default-Deny Firestore Rules
- Default-Deny Storage Rules
- Security Emulator Tests
- private UserProfile/Wardrobe-Struktur
- server-only kritische Marketplace-/Trade-/Moderationsdaten
- Rate Limits
- App-Check-Strategie für reale Native Builds

## Aktueller E2E-Pfad

```text
Register
→ Verify E-Mail
→ Style-DNA-Onboarding
→ Haupt-App
→ Logout
→ Login
→ Session-Restore testen
→ Privacy Export/Delete testen
```

Der vollständige Zwei-Geräte-Testplan liegt unter [`../15-release/DEVICE_E2E_PLAN.md`](../15-release/DEVICE_E2E_PLAN.md).

## Definition of Done

### Im Repo bestätigt

- [x] Login / Registrierung
- [x] DisplayName
- [x] Verification Mail / Gate / Resend Cooldown
- [x] Passwort Reset
- [x] Logout / Auth State Listener
- [x] typisierter AuthContext
- [x] UserProfile + Repair
- [x] UserProfile State Provider
- [x] vollständiger Onboarding-State
- [x] echtes StyleProfile-Onboarding
- [x] Development-Onboarding-Persistenz
- [x] Security Regression für `onboardingCompleted`
- [x] Privacy-/Account-Delete-Backend
- [x] aktuelle TypeScript-/Bundle-/Security-Gates

### Extern noch offen

- [ ] echtes Firebase Dev-Projekt
- [ ] native Session Restore Android
- [ ] native Session Restore iOS
- [ ] komplette Auth-/Onboarding-E2E auf zwei echten Geräten
- [ ] Deep-Link-Rückkehr aus Verification/Reset final validieren
- [ ] finale Router-Gruppen nur falls sie nach realem Device-E2E weiterhin Mehrwert bieten
