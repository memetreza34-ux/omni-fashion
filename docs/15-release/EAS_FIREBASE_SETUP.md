# Omni Fashion – Firebase + EAS Setup Runbook

Status: **repository prepared; real cloud projects, identifiers and credentials still external**

This runbook is the exact next operational sequence for moving the current green branch from local/CI infrastructure into real Preview and Production environments.

## 1. Keep environments separated

Use two Firebase projects:

```text
omni-fashion-dev
omni-fashion-prod
```

Do not point Preview and Production builds at the same Firebase project.

Recommended mapping:

```text
EAS preview environment    -> Firebase dev project
EAS production environment -> Firebase prod project
```

`eas.json` already binds the build profiles explicitly to `preview` and `production` environments.

## 2. Final app identifiers before native builds

Choose permanent identifiers before the first real store-targeted native build:

```text
Android package:    <decide permanent reverse-DNS id>
iOS bundle id:      <decide permanent reverse-DNS id>
```

Do not invent temporary identifiers in source control. Once store/backend integrations depend on these values, changing them becomes expensive.

After the identifiers are chosen, add them to `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "..."
    },
    "android": {
      "package": "..."
    }
  }
}
```

## 3. Create or link the EAS project

From a clean checkout of this branch:

```bash
npx eas-cli@latest init
```

This creates/links the Expo project and writes the real EAS project identity into app config when required by Expo tooling.

Do not manually fabricate an EAS project id.

## 4. Firebase client applications

For each Firebase project register only the clients that Omni Fashion actually ships:

- Android app using the final Android package
- iOS app using the final iOS bundle id
- Web app for the Expo/Firebase JS client configuration

The current app uses the Firebase JS SDK client configuration through Expo public environment variables.

## 5. Required public client variables

The repository expects:

```text
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
```

`EXPO_PUBLIC_APP_ENV` is already supplied by the EAS build profile.

These Firebase client configuration values are not server secrets, but every `EXPO_PUBLIC_*` value is bundled into the client and must therefore never contain private server credentials.

## 6. Create EAS Preview values

Create the Preview values with the Firebase **development** project configuration.

Example pattern:

```bash
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_API_KEY --value "<dev-value>" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "<dev-value>" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "<dev-value>" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "<dev-value>" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "<dev-value>" --visibility plaintext
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_FIREBASE_APP_ID --value "<dev-value>" --visibility plaintext
```

If a newer EAS CLI changes prompts/options, use `eas env:create --help` and keep the same environment/name/value intent.

## 7. Create EAS Production values

Repeat for Production using the Firebase **production** project configuration:

```bash
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_API_KEY --value "<prod-value>" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "<prod-value>" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "<prod-value>" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "<prod-value>" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "<prod-value>" --visibility plaintext
npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_FIREBASE_APP_ID --value "<prod-value>" --visibility plaintext
```

Verify values before any Production build:

```bash
npx eas-cli@latest env:list --environment production
```

## 8. Firebase Authentication

In both Firebase projects:

1. enable Email/Password Authentication,
2. verify authorized domains for the intended web environment,
3. do not enable extra providers until they are actually implemented and tested.

## 9. Firestore and Storage

Create Firestore and Storage in both projects.

Deploy the repository-controlled rules and indexes only after confirming the selected Firebase project:

```bash
firebase use <dev-project-id>
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Repeat for Production only from a reviewed release candidate.

Never deploy Production rules by relying on whichever project happened to be active in a previous terminal session.

## 10. Firebase Functions

The repository Functions package is independent under `functions/` and already has its own lockfile and Quality gate.

Before deployment:

```bash
cd functions
npm ci
npm run verify
cd ..
```

Then deploy only to the intended Firebase project:

```bash
firebase use <dev-project-id>
firebase deploy --only functions
```

Production deployment happens later from the reviewed release candidate.

## 11. AI provider credential

The Gemini/API provider credential is a server credential and must **not** use `EXPO_PUBLIC_*` or be stored in the mobile app.

Configure the provider secret using the final Firebase Functions secret/config mechanism used by the provider implementation. Validate the exact Functions secret binding before the first cloud AI call.

The app must continue to fail clearly if the server provider is not configured rather than silently simulate AI.

## 12. App Check

Before public Production launch:

1. configure App Check for the real Firebase clients,
2. validate Preview first,
3. inspect legitimate traffic,
4. only then enforce App Check on Production services/functions that support it.

Do not enable strict enforcement before legitimate Preview/Production clients have been validated or the app can lock itself out.

## 13. Preview build

Current `eas.json` contains an internal Preview profile.

After final native identifiers and EAS linking:

```bash
npx eas-cli@latest build --profile preview --platform android
```

and later:

```bash
npx eas-cli@latest build --profile preview --platform ios
```

Use Preview builds for real Firebase/Auth/Wardrobe/OmniSwap/Privacy testing before any Production build.

## 14. Development client – intentionally not configured yet

The repository currently does not include `expo-dev-client`.

When native debugging outside Expo Go is required, install the SDK-57-compatible dependency with Expo tooling:

```bash
npx expo install expo-dev-client
```

Only after that add a `development` EAS profile with `developmentClient: true`.

Do not add a development-client profile that cannot actually run.

## 15. Native push – intentionally not completed yet

The server push backend exists, but the mobile client does not yet install `expo-notifications`.

After the real EAS project exists:

```bash
npx expo install expo-notifications
```

Then:

1. add the Expo Notifications config plugin,
2. configure Android notification channel,
3. configure Android/iOS push credentials,
4. create a fresh native build,
5. obtain the real EAS `projectId`,
6. request permission on a physical device,
7. obtain the real Expo push token,
8. call `registerPushDevice`,
9. enable `notificationPreferences.pushEnabled` only after explicit user opt-in,
10. verify send ticket + receipt on both platforms.

No fake token should ever be inserted into Firestore.

## 16. Required Preview E2E matrix before Production

Use at least two real accounts and physical devices.

### Auth

- registration
- verification
- logout/login
- app restart session persistence
- password reset
- reauthentication

### Wardrobe

- camera
- gallery
- upload
- cloud sync
- AI analysis
- update/delete
- app restart/reconnect

### Stylist

- StyleProfile
- outfit recommendation
- saved outfit
- feedback
- real weather failure/fallback

### OmniSwap

- Account A lists item
- Account B sees listing
- B sends offer
- A accepts
- both choose fulfilment mode
- shipping/meetup confirmations
- both receive
- ownership and private image paths swap correctly
- review after completion
- block/report/dispute flows

### Privacy

- open listing blocks deletion
- sent offer blocks deletion
- open/disputed transaction blocks deletion
- completed trade permits deletion
- private Firestore documents removed
- private `users/{uid}/` Storage removed
- historical counterpart data remains consistent and pseudonymized
- Firebase Auth user removed last

## 17. Production build gate

Do not build/submit Production until all are true:

- four GitHub Quality jobs green
- Preview Firebase deployment validated
- real two-user OmniSwap E2E passes
- Privacy deletion E2E passes
- App Check plan validated
- native Push validated if enabled
- Accessibility device audit complete
- Performance device audit complete
- Privacy Policy / Retention Policy approved
- Store Data Safety / Privacy Labels prepared
- rollback owner and procedure defined

Then:

```bash
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest build --profile production --platform ios
```

Submission remains a separate reviewed step.
