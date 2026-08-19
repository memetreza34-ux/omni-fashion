# Omni Fashion – In-App Notifications

Stand: 16. August 2026

## Ziel

Notifications werden aus echten Backend-Ereignissen erzeugt. Es gibt keine zufälligen oder lokal simulierten Marketplace-Meldungen.

## Architektur

```text
Trusted Swap Command
  ↓
Firestore-Zustandsänderung
  ↓
Firestore v2 Trigger
  ↓
idempotenter Notification Writer
  ↓
notifications/{notificationId}
  ↓
Live Query des betroffenen Nutzers
  ↓
Aktivität-Tab
```

## Warum Trigger statt Notification-Code in jedem Command

Trade-Commands sollen nur ihre Domain-Invarianten sichern. Notification-Erzeugung ist ein Nebenprozess und darf einen erfolgreichen Trade nicht zurückrollen.

Firestore-Trigger reagieren auf den tatsächlich gespeicherten Zustand. Dadurch funktioniert die Inbox unabhängig davon, welcher Backend-Command die Änderung ausgelöst hat.

## Idempotenz

`createUserNotification` verwendet aus `userId + dedupeKey` eine stabile SHA-256-basierte Dokument-ID.

Vor dem Erstellen wird in einer Firestore-Transaktion geprüft, ob die Notification bereits existiert.

Ein Retry desselben Events erzeugt daher nicht mehrere identische Inbox-Einträge.

## Aktuelle Eventtypen

```text
swap_offer_received
swap_offer_accepted
swap_offer_declined
swap_offer_cancelled
swap_mode_confirmed
swap_item_shipped
swap_item_received
swap_completed
swap_disputed
```

## SwapOffer Trigger

### Neues Offer

`swapOffers/{offerId}` created:

- Listing-Owner erhält `swap_offer_received`.

### Statuswechsel

`swapOffers/{offerId}` updated:

- accepted → Requester
- declined → Requester
- cancelled → Listing-Owner

## SwapTransaction Trigger

Der Trigger vergleicht Before/After-Arrays und erkennt neu hinzugekommene Teilnehmer-IDs.

### Modus bestätigt

Neuer Eintrag in `modeConfirmedByIds`:

- Gegenpartei erhält `swap_mode_confirmed`.

### Versand bestätigt

Neuer Eintrag in `shippedByIds`:

- Gegenpartei erhält `swap_item_shipped`.

### Empfang bestätigt

Neuer Eintrag in `receivedByIds`:

- Gegenpartei erhält `swap_item_received`.

### Completed

Wenn `status` erstmalig `completed` wird:

- beide Teilnehmer erhalten `swap_completed`.

Damit entsteht die Completion-Notification erst nach erfolgreicher Zwei-Wege-Eigentumsübertragung.

## Dispute Trigger

Bei neuem `swapDisputes/{transactionId}`:

- die andere Partei erhält `swap_disputed`.

## Notification-Dokument

```text
userId
type
title
body
relatedOfferId
relatedTransactionId
relatedListingId
readAt
createdAt
schemaVersion
```

## Client Security

Normale Clients dürfen Notification-Dokumente nicht erstellen oder verändern.

Lesen ist nur erlaubt, wenn:

```text
resource.data.userId == request.auth.uid
```

`readAt` wird über den Trusted Backend Command `markNotificationRead` gesetzt.

## Client

`NotificationProvider`:

- Live-Subscription der eigenen Inbox
- strikt validierte Firestore-Dokumente
- `unreadCount`
- Cloud-only
- kein Fake-Demo-Fallback

Der neue `Aktivität`-Tab zeigt:

- Eventtyp
- Titel
- Nachricht
- Zeitpunkt
- ungelesenen Zustand

## Push Notifications

Push ist bewusst die zweite Stufe.

Vor Push müssen mindestens geklärt sein:

- exakte Expo-SDK-57-Notifications-Integration,
- reales EAS Project ID,
- reale Android/iOS Credentials,
- Device Push Token Lifecycle,
- opt-in / Notification Preferences,
- Token-Rotation und Token-Löschung,
- Production Datenschutzangaben,
- echte Device-Tests.

Die In-App-Inbox bleibt auch nach Push die Source of Truth für die sichtbare Aktivität. Push ist nur ein Zustellkanal für ausgewählte Ereignisse.
