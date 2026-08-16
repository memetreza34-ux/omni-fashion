# Omni Fashion – Auth Implementation

## Ziel

Der aktuelle Dummy-Login wird kontrolliert in ein echtes Firebase-Auth-System überführt, ohne die App während der Entwicklung unbenutzbar zu machen.

---

# 1. Aktueller Stand

Bereits im Repo:

```text
src/features/auth/types.ts
src/features/auth/services/auth-service.ts
src/context/AuthContext.tsx
src/app/login.tsx
src/services/firebase/app.ts
```

Bereits verbessert:

- `any` aus AuthContext entfernt
- `AuthUser` Domain-Typ eingeführt
- Credentials werden wirklich an Auth Service übergeben
- Firebase `onAuthStateChanged` vorbereitet
- Firebase E-Mail/Passwort-Login vorbereitet
- Firebase Logout vorbereitet
- React-Native Session-Persistenz vorbereitet
- lokaler Demo-Zugang nur im Development-Fall
- Release-Build ohne Firebase darf nicht still auf Dummy Auth zurückfallen

---

# 2. Warum der Dev-Demo-Modus noch existiert

Ohne echte Firebase-Projektwerte könnte die restliche Prototyp-App sonst nicht mehr geöffnet werden.

Der Dev-Demo-Modus ist daher nur ein Entwicklungswerkzeug.

Regel:

```text
__DEV__ + Firebase fehlt
→ lokaler Development Demo User möglich

Production + Firebase fehlt
→ Fehler / kein Fake Login
```

Vor Release wird geprüft, ob dieser Pfad in Production wirklich unerreichbar ist.

---

# 3. Nächster Auth-Schritt – Registrierung

Service ergänzen um:

```text
registerWithEmail(email, password)
```

Ablauf:

```text
createUserWithEmailAndPassword
→ UserProfile erzeugen
→ Verification Mail senden
→ UI zeigt Verification State
```

Wichtig:

Wenn Auth User erstellt wurde, aber Firestore Profile-Erstellung fehlschlägt, muss der Zustand wiederherstellbar sein.

Darum soll Login später prüfen:

```text
Auth User vorhanden
→ UserProfile vorhanden?
→ wenn nein: Profile Repair / ensureUserProfile
```

---

# 4. E-Mail-Verifizierung

Nach Registrierung:

```text
Account erstellt
→ sendEmailVerification
→ Verification Screen
→ Nutzer bestätigt Link
→ App lädt User neu
→ emailVerified == true
→ Onboarding
```

Entscheidung für Release 1:

- Wardrobe/Stylist erst nach bestätigter E-Mail freigeben.
- Resend Button mit Cooldown.
- Abmelden muss auf Verification Screen möglich sein.

---

# 5. Passwort vergessen

Flow:

```text
Login
→ Passwort vergessen
→ E-Mail eingeben
→ sendPasswordResetEmail
→ neutrale Erfolgsmeldung
```

Die UI sollte nicht unnötig verraten, ob eine E-Mail registriert ist.

---

# 6. UserProfile

Auth und Produktprofil sind getrennt.

Firebase Auth liefert:

```text
uid
email
displayName
emailVerified
```

Firestore `users/{uid}` liefert Omni-Fashion-spezifische Daten:

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

Repo enthält dafür bereits:

```text
src/features/profile/types.ts
src/features/profile/services/profile-service.ts
```

---

# 7. Auth State Machine

Langfristig soll Root UI nicht nur `user / no user` kennen.

Empfohlene Zustände:

```text
BOOTING
UNAUTHENTICATED
AUTHENTICATED_UNVERIFIED
AUTHENTICATED_NEEDS_PROFILE
AUTHENTICATED_NEEDS_ONBOARDING
READY
```

Dadurch lassen sich Login, Verification und Onboarding sauber trennen.

---

# 8. Routing-Ziel

Aktuell rendert `_layout.tsx` bei fehlendem User direkt `LoginScreen`.

Zielstruktur:

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

Diese Router-Migration erfolgt kontrolliert, weil aktuell eigene Tab-Komponenten verwendet werden.

---

# 9. Fehlercodes

Firebase-Fehler werden nicht roh angezeigt.

Geplante App-Fehler:

```text
INVALID_CREDENTIALS
EMAIL_ALREADY_IN_USE
WEAK_PASSWORD
TOO_MANY_ATTEMPTS
NETWORK_UNAVAILABLE
EMAIL_NOT_VERIFIED
BACKEND_NOT_CONFIGURED
UNKNOWN
```

UI erhält lokalisierte Texte.

---

# 10. Security

Auth schützt Identität, nicht automatisch Daten.

Zusätzlich notwendig:

- Firestore Rules
- Storage Rules
- serverseitige Trade Commands
- Re-Authentication vor sensiblen Aktionen
- Rate Limits / Abuse Schutz

---

# 11. Accountlöschung

Späterer Flow:

```text
Account löschen
→ Re-Authentication
→ aktive Trades prüfen
→ neue Trades blockieren
→ Backend Cleanup Job
→ Wardrobe Bilder löschen
→ private Firestore Daten löschen/anonymisieren
→ Auth User löschen
→ lokale Session löschen
```

Nicht einfach nur `deleteUser(auth.currentUser)` aufrufen, weil sonst abhängige Daten zurückbleiben könnten.

---

# 12. Tests

Mindestens:

### Unit

- Auth User Mapping
- Fehler-Mapping
- State Machine

### Integration

- Registrierung + Profile Creation
- Login + Session Restore
- Reset Mail
- Verification

### E2E

```text
Register
→ Verify
→ Onboarding
→ Logout
→ Login
→ Account Delete
```

---

# 13. Definition of Done

- [ ] echtes Firebase Projekt verbunden
- [x] Login Service vorbereitet
- [x] Logout Service vorbereitet
- [x] Auth State Listener vorbereitet
- [x] typed AuthContext
- [ ] Registrierung implementiert
- [ ] Verification Flow implementiert
- [ ] Reset Flow implementiert
- [x] UserProfile Domain vorbereitet
- [x] UserProfile Firestore Service vorbereitet
- [ ] Root Auth State Machine implementiert
- [ ] Auth Router Gruppen implementiert
- [ ] Account Delete Backend implementiert
- [ ] Auth Tests grün
