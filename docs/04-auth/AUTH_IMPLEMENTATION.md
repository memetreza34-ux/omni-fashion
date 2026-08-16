# Omni Fashion – Auth Implementation

## Ziel

Der frühere Dummy-Login wird schrittweise durch eine echte Omni-Fashion-Accountschicht ersetzt. Authentifizierung, Produktprofil, Verifizierung und spätere Accountlöschung werden bewusst getrennt behandelt.

---

# 1. Aktueller Code

```text
src/features/auth/types.ts
src/features/auth/services/auth-service.ts
src/features/auth/services/auth-errors.ts
src/features/auth/components/VerifyEmailScreen.tsx
src/features/profile/types.ts
src/features/profile/services/profile-service.ts
src/context/AuthContext.tsx
src/app/login.tsx
src/app/_layout.tsx
src/services/firebase/app.ts
```

Bereits umgesetzt:

- typisierter `AuthUser`
- kein `any` im AuthContext
- echtes Credential-Interface
- Firebase Auth State Listener
- E-Mail/Passwort Login
- Registrierung
- Display Name Update in Firebase Auth
- automatische Verification Mail
- Verification Mail erneut senden
- Auth User neu laden
- Passwort-Reset
- Logout
- zentrale Fehler-Normalisierung
- `UserProfile` in Firestore
- Profile Repair bei unvollständigem Profil
- Login/Register/Reset UI
- Verification Screen
- Root Gate: unverifizierte echte Nutzer gelangen nicht in die Haupt-App
- Development-Demo nur in `__DEV__`

---

# 2. Entwicklungs-Demo

Solange das echte Firebase-Development-Projekt noch nicht konfiguriert ist, bleibt ein lokaler Demo-Login verfügbar.

```text
__DEV__ + Firebase fehlt
→ lokaler Development Demo User möglich

Release + Firebase fehlt
→ kein stiller Fake Login
```

Registrierung, Verification und Passwort-Reset benötigen bewusst ein echtes Firebase-Projekt und werden nicht gefälscht.

---

# 3. Registrierungsflow

Aktuell implementierter Zielablauf:

```text
Name + E-Mail + Passwort
→ createUserWithEmailAndPassword
→ Auth displayName setzen
→ Verification Mail senden
→ UserProfile sicherstellen
→ Root zeigt Verification Screen
```

`createUserProfileIfMissing()` ist reparierbar: Sollte der Auth-State schneller feuern als das Profil vollständig aufgebaut ist, kann ein späterer Aufruf einen fehlenden Anzeigenamen nachtragen.

---

# 4. E-Mail-Verifizierung

```text
Account erstellt
→ Verification Screen
→ E-Mail öffnen
→ Link bestätigen
→ "Ich habe bestätigt"
→ Firebase User reload
→ emailVerified == true
→ Haupt-App / später Onboarding-State
```

Vor Release noch ergänzen:

- Resend Cooldown
- bessere Deep-Link-Rückkehr in die App
- finaler Onboarding-State nach erfolgreicher Verification

---

# 5. Passwort-Reset

```text
Login
→ Passwort vergessen
→ E-Mail
→ sendPasswordResetEmail
→ neutrale Erfolgsmeldung
```

Die Erfolgsmeldung ist bewusst neutral formuliert, damit die UI nicht unnötig verrät, ob eine bestimmte E-Mail als Konto existiert.

---

# 6. Auth vs UserProfile

Firebase Auth ist Identität:

```text
uid
email
displayName
emailVerified
```

Firestore `users/{uid}` ist das Omni-Fashion-Produktprofil:

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

Später werden StyleProfile, Reputation und Privacy Settings bewusst getrennt modelliert.

---

# 7. Ziel-State-Machine

Die Root-UI kennt aktuell praktisch:

```text
LOADING
UNAUTHENTICATED
AUTHENTICATED_UNVERIFIED
READY / DEV_DEMO
```

Später erweitern auf:

```text
BOOTING
UNAUTHENTICATED
AUTHENTICATED_UNVERIFIED
AUTHENTICATED_NEEDS_PROFILE
AUTHENTICATED_NEEDS_ONBOARDING
READY
```

Die Onboarding-Stufen werden erst ergänzt, wenn deren Datenmodell definiert ist.

---

# 8. Routing-Ziel

Die jetzige direkte Root-Gate-Struktur wird zunächst beibehalten, damit während der Fundament-Migration kein unnötiger Router-Rewrite entsteht.

Späteres Ziel:

```text
src/app/
├── (auth)/
│   ├── login.tsx
│   ├── register.tsx
│   ├── forgot-password.tsx
│   └── verify-email.tsx
├── (app)/
│   ├── index.tsx
│   ├── stylist.tsx
│   ├── swap.tsx
│   ├── shop.tsx
│   └── profile.tsx
└── _layout.tsx
```

Router-Gruppen erst migrieren, wenn Auth gegen Firebase real validiert ist.

---

# 9. Fehlercodes

Aktuell normalisiert:

```text
INVALID_CREDENTIALS
EMAIL_ALREADY_IN_USE
INVALID_EMAIL
WEAK_PASSWORD
TOO_MANY_ATTEMPTS
NETWORK_UNAVAILABLE
USER_DISABLED
BACKEND_NOT_CONFIGURED
UNKNOWN
```

Provider-Fehler werden nicht roh an Nutzer ausgegeben.

---

# 10. Native Session Persistence – offener Integrationspunkt

Firebase dokumentiert für React Native `initializeAuth(...getReactNativePersistence(...))`. Im aktuellen Projekt-Typecheck mit Firebase 12 ist dieser Export jedoch nicht konsistent über `firebase/auth` typisiert, obwohl die öffentliche Firebase-Referenz ihn listet.

Entscheidung:

- kein `@ts-ignore`
- kein erfundener Type Patch nur um CI grün zu machen
- aktueller Bootstrap verwendet `getAuth(app)`
- sobald das echte Firebase-Dev-Projekt existiert, wird Session Restore auf echten Android-/iOS-Builds getestet
- falls Persistenz fehlt, wird eine versionskompatible native Initialisierung anhand der dann installierten Firebase-/Expo-Kombination implementiert und in CI + Device Test abgesichert

**Auth ist deshalb noch nicht DONE.**

---

# 11. Security

Auth allein schützt keine Daten.

Bereits vorbereitet:

- Firestore Rules
- Storage Rules
- private UserProfile/Wardrobe-Struktur
- kritische SwapOffer-/Trade-Schreibzugriffe nicht direkt für Client geöffnet

Noch erforderlich:

- Rules Tests
- App Check
- Re-Authentication vor sensiblen Aktionen
- Trusted Backend für Account Delete / Trade Commands
- Abuse/Rate-Limit-Konzept

---

# 12. Accountlöschung

Geplanter produktiver Flow:

```text
Account löschen
→ Re-Authentication
→ aktive Trades prüfen
→ neue Trades blockieren
→ Trusted Backend Cleanup
→ Wardrobe Images löschen
→ private Daten löschen/anonymisieren
→ Auth User löschen
→ lokale Session löschen
```

Nicht nur `deleteUser()` aufrufen, weil sonst abhängige Daten zurückbleiben können.

---

# 13. Testplan

## Unit

- Auth User Mapping
- Fehler-Mapping
- State Machine
- Profile Mapping / Repair

## Integration

- Registrierung + Profile Creation
- Login + Session Restore
- Verification / Reload
- Reset Mail
- Firestore Rules

## E2E

```text
Register
→ Verify
→ Onboarding
→ Logout
→ Login
→ Account Delete
```

---

# 14. Definition of Done

- [ ] echtes Firebase Dev-Projekt verbunden
- [x] Login Service
- [x] Registrierung Service
- [x] Verification Mail
- [x] Verification Gate UI
- [x] Password Reset Service/UI
- [x] Logout
- [x] Auth State Listener
- [x] typed AuthContext
- [x] UserProfile Domain
- [x] UserProfile Firestore Service
- [x] Profile Repair
- [x] Auth Error Mapping
- [ ] native Session Restore auf Android getestet
- [ ] native Session Restore auf iOS getestet
- [ ] Onboarding State integriert
- [ ] Account Delete Backend
- [ ] Auth/Rules Tests grün
- [ ] finale Router-Gruppen, falls weiterhin sinnvoll
