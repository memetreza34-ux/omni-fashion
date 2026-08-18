# Omni Fashion – Rate Limits und Abuse Control

## Ziel

Trusted Backend Callables werden zusätzlich zu Auth, Rules und später App Check gegen automatisierten Missbrauch und unnötige Kosten begrenzt.

Rate Limits sind **kein Ersatz** für Autorisierung, Ownership-Prüfungen, App Check oder Budget Monitoring.

## Aktuelle serverseitige Limits

| Aktion | Scope | Grenze | Fenster |
|---|---|---:|---:|
| Kleidungsanalyse | `analyze_wardrobe_item` | 20 | 1 Stunde |
| OmniSwap Listing erstellen | `create_swap_listing` | 30 | 1 Stunde |
| OmniSwap Angebot senden | `send_swap_offer` | 60 | 1 Stunde |
| Trust-&-Safety-Meldung | `submit_report` | 8 | 1 Stunde |
| Push-Gerät registrieren | `register_push_device` | 20 | 1 Stunde |

Die Werte sind Startwerte. Sie müssen nach echten Dev-/Beta-Daten anhand normaler Nutzung, Abuse-Mustern und Kosten angepasst werden.

## Technische Umsetzung

`functions/src/security/rate-limit.ts` stellt eine zentrale Firestore-basierte Primitive bereit.

Eigenschaften:

- pro Firebase-User und Scope,
- SHA-256-basierte Dokument-ID,
- transaktionale Zählung,
- feste Zeitfenster,
- `resource-exhausted` bei Überschreitung,
- `retryAfterSeconds` in den Fehlerdetails,
- ungültige/veraltete Zeitfenster werden sicher neu gestartet,
- Unit-Tests prüfen Start, Increment, Limit und Window Reset.

Collection:

```text
rateLimits/{hashedUserAndScope}
```

Gespeichert werden unter anderem:

- `userId`
- `scope`
- `count`
- `windowStartedAtMs`
- `expiresAt`
- `updatedAt`
- `schemaVersion`

## Security

`rateLimits` besitzt absichtlich keine Client-Regel. Firestore Default-Deny verhindert direkte Reads, Writes, Resets und Deletes durch die App.

Der Emulator-Test `tests/security/rate-limits.rules.integration.mjs` schützt diese Grenze dauerhaft.

## Privacy

`deleteMyAccount` sucht `rateLimits` über `userId` und löscht diese technischen Nutzerdaten zusammen mit den übrigen privaten Account-Daten.

## TTL / Cleanup

`expiresAt` ist bereits Teil der Dokumente, aber **Firestore TTL ist noch nicht als Production-Infrastruktur aktiviert**.

Beim echten Firebase-Setup:

1. TTL für Collection `rateLimits` auf Feld `expiresAt` aktivieren.
2. Im Dev-Projekt prüfen, dass abgelaufene Zähler später automatisch verschwinden.
3. Erst danach identisch im Production-Projekt konfigurieren.
4. TTL nicht als Sicherheitsmechanismus behandeln: Ein abgelaufener Datensatz wird von der Rate-Limit-Logik auch dann als neues Fenster behandelt, wenn der physische Cleanup noch nicht erfolgt ist.

## App Check

Vor öffentlichem Production-Rollout zusätzlich App Check aktivieren und für relevante Functions/Firestore/Storage-Pfade durchsetzen.

Reihenfolge:

```text
Auth + Server Authorization
→ Rate Limits
→ App Check
→ Cost/Budget Alerts
→ Telemetry/Abuse Monitoring
```

## Monitoring vor Launch

Zu beobachten:

- Anzahl `resource-exhausted` pro Scope,
- AI-Aufrufe pro aktivem Nutzer,
- Report-Spitzen,
- ungewöhnliche Listing-/Offer-Erstellung,
- Push-Registrierungs-Spikes,
- Function Invocations / Laufzeit / Fehlerrate,
- AI-Provider-Kosten.

Erst mit realen Daten werden die Grenzwerte nachjustiert.
