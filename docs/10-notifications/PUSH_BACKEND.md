# Push Notifications – Backend Foundation

Status: **server-side foundation implemented; native client registration still blocked by EAS/device setup**

## Principle

Omni Fashion keeps In-App Notifications as the source event. Remote push is an optional delivery channel on top of the same notification record.

```text
OmniSwap event
  -> notifications/{id}
  -> user sees Activity inbox
  -> if pushEnabled === true and an enabled device exists
       -> Expo Push Service
       -> push ticket
       -> later push receipt check
```

This prevents business state from depending on a push provider.

## Opt-in

Remote push is sent only if:

```text
notificationPreferences/{userId}.pushEnabled === true
```

If the document is missing or `pushEnabled` is not true, the notification remains In-App only.

## Device registration

Trusted callables:

- `registerPushDevice`
- `unregisterPushDevice`

The registration callable accepts only Expo push-token shaped values and `ios|android`.

Device ids are SHA-256 hashes of the token, so raw push tokens are not used as Firestore document ids.

`pushDevices/{deviceId}` is server-only through the Firestore default-deny boundary.

## Idempotent delivery

`onNotificationCreatedPushDelivery` runs from new In-App notification documents.

Before contacting Expo, it claims:

```text
pushDeliveries/{notificationId}_{deviceId}
```

If that document already exists, the trigger does not send the same notification to the same registered device again.

## Expo tickets

Successful Expo ticket responses create:

```text
pushTickets/{expoTicketId}
```

The delivery document keeps the ticket id as well.

Immediate `DeviceNotRegistered` errors disable the device.

## Receipt processing

`processExpoPushReceipts` runs every 15 minutes and checks pending Expo ticket ids.

Outcomes:

- receipt ok -> ticket/delivery become `receipt_ok`
- receipt error -> ticket/delivery become `receipt_error`
- `DeviceNotRegistered` -> corresponding device is disabled
- temporary network/HTTP failure -> ticket remains pending for a later run

Cloud Scheduler / scheduled Functions deployment is therefore a production prerequisite for the receipt worker.

## Security

Normal clients cannot directly read or write:

- `pushDevices`
- `pushDeliveries`
- `pushTickets`

A permanent Firebase Emulator test verifies this default-deny boundary.

## Native client blocker

The repository currently does not install `expo-notifications` and does not yet contain a real EAS project id / production push credentials.

The native client step must be completed with the Expo SDK 57 compatible package/version using `expo install`, followed by a new native Development/Release build.

Do not manually invent a token or mark the device as registered in development.

## Native client completion checklist

1. Create/connect the real EAS project.
2. Add stable Android package and iOS bundle identifier.
3. Install Expo SDK 57 compatible `expo-notifications` using Expo tooling so package-lock stays consistent.
4. Add the `expo-notifications` config plugin.
5. Configure Android notification channel before token permission flow.
6. Request notification permission on a physical device.
7. Read the EAS `projectId` from app config/Constants.
8. Call `getExpoPushTokenAsync({ projectId })`.
9. Call `registerPushDevice` only after a real token is returned.
10. Set `pushEnabled=true` only as an explicit user choice.
11. On logout/account switch, unregister or reassign the physical device token safely.
12. Validate delivery + receipt on real Android and iOS devices.

## Production hardening still open

- optional Expo Push access-token security if enabled for the project
- retry/recovery worker for stale `send_failed` / `claimed` delivery records
- retention policy for old push tickets/deliveries
- monitoring for delivery and receipt error rate
- rate/abuse monitoring
- deep-link behavior from push taps
