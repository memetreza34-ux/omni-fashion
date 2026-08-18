# Omni Fashion – Remote Feature Flags

## Ziel

Feature Flags dienen als kontrollierte Rollout- und Kill-Switch-Grenze. Sie ersetzen weder Authentifizierung noch serverseitige Autorisierung.

## Aktive Flag-Keys

- `nativePushRegistration`
- `internalModeratorUi`
- `shopPartnerFeed`
- `photorealisticTryOn`

Alle lokalen Defaults sind bewusst `false`.

## Trusted Backend

Die App liest den Firestore-Datensatz **nicht direkt**. Der Client ruft `getPublicFeatureFlags` auf. Der Callable:

1. verlangt Firebase Auth,
2. liest `runtimeConfig/publicFeatureFlags` mit dem Admin SDK,
3. akzeptiert nur `schemaVersion: 1`,
4. übernimmt ausschließlich bekannte Boolean-Keys,
5. ignoriert unbekannte Felder,
6. fällt bei fehlender/ungültiger Konfiguration auf alle Flags `false` zurück.

Firestore Security Rules lassen direkten Client-Zugriff auf `runtimeConfig` weiterhin über Default-Deny nicht zu. Ein eigener Emulator-Test schützt diese Grenze.

## Dokumentformat

```json
{
  "schemaVersion": 1,
  "flags": {
    "nativePushRegistration": false,
    "internalModeratorUi": false,
    "shopPartnerFeed": false,
    "photorealisticTryOn": false
  }
}
```

## Client-Verhalten

`FeatureFlagProvider` lädt Remote Flags:

- nach Auth-/Backend-Verfügbarkeit,
- erneut, wenn die App in den Vordergrund zurückkehrt.

Fehler, fehlende Firebase-Konfiguration oder Development-Demo führen zu sicheren lokalen Defaults. Die React-Consumer rendern bei Flag-Änderungen neu.

## Sicherheitsregel

Ein Feature Flag darf **niemals** eine Berechtigungsprüfung ersetzen.

Beispiel: `internalModeratorUi=true` macht die interne Oberfläche sichtbar. Die Moderations-Callables prüfen trotzdem bei jeder Anfrage erneut den serverseitigen Firebase Custom Claim `admin|moderator`.

## Rollout

Vor Production:

1. `runtimeConfig/publicFeatureFlags` im Firebase-Dev-Projekt mit allen Flags `false` anlegen.
2. Dev-Build gegen den Trusted Callable testen.
3. Ein Flag einzeln aktivieren.
4. App in Hintergrund/Vordergrund bewegen und Reaktion prüfen.
5. Flag wieder deaktivieren und Kill-Switch prüfen.
6. Erst danach dieselbe Struktur im Production-Projekt anlegen.

## Rollback

Bei einer fehlerhaften optionalen Funktion:

1. betroffenes Flag serverseitig auf `false` setzen,
2. keine Client-Regeln lockern,
3. Fehler-/Telemetry-Daten prüfen,
4. Codefix über normalen Release-Prozess ausrollen,
5. Flag erst nach bestätigtem Fix wieder aktivieren.

Für Core-Funktionen ohne Flag gilt weiterhin das allgemeine Rollback-Runbook.
