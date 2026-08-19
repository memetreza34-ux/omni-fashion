# Omni Fashion – echtes OmniSwap

Stand: 16. August 2026

Dieses Dokument beschreibt den realen OmniSwap-Unterbau im aktuellen Arbeitsbranch. Es ersetzt die frühere Mock-/Local-State-Interpretation des Swap-Screens.

## 1. Grundregel

OmniSwap darf den privaten Kleiderschrank nicht zu einem öffentlichen Marktplatz machen.

Die Architektur ist deshalb:

```text
Privates WardrobeItem
        ↓
Trusted Backend
        ↓
öffentliche, reduzierte SwapListing-Projektion
        ↓
SwapOffer
        ↓
serverseitige Locks
        ↓
SwapTransaction
```

`wardrobeItems` bleiben private Source of Truth.

## 2. Öffentliche Listing-Projektion

Ein Listing wird ausschließlich über die Callable Function `createSwapListing` erstellt.

Der normale Client darf kein `swapListings`-Dokument direkt schreiben.

Ablauf:

1. Nutzer ist authentifiziert.
2. Backend lädt das angegebene `wardrobeItems/{itemId}`.
3. `ownerId` muss dem authentifizierten Nutzer entsprechen.
4. Das Item darf noch nicht gelistet sein.
5. Der private Storage-Pfad muss zum Nutzer gehören.
6. Backend kopiert das Bild aus dem privaten Wardrobe-Pfad nach:

```text
public/listings/{listingId}/original.<ext>
```

7. Erst danach wird in einer Firestore-Transaktion:
   - das `swapListings/{listingId}` erzeugt,
   - `isListedForSwap=true` gesetzt,
   - `swapListingId` am WardrobeItem gesetzt.
8. Falls Firestore fehlschlägt, wird das öffentliche Bild wieder entfernt.

Das private Wardrobe-Bild wird niemals für Fremde freigegeben.

## 3. Listing-Felder

Aktuell enthält ein Listing nur die Marketplace-relevante Projektion:

```text
ownerId
wardrobeItemId
title
description
category
subcategory
color
brand
size
condition
publicImagePath
city
shippingEnabled
meetupEnabled
estimatedValueCents
status
createdAt
updatedAt
schemaVersion
```

Keine privaten AI-Metadaten, keine private Storage-URI, keine E-Mail-Adresse, keine Wohnadresse.

## 4. Listing-Lifecycle

Aktuelle Zustände:

```text
active
paused
reserved
traded
removed
```

Normale Nutzer ändern den Status nicht mit `updateDoc`.

Erlaubte Trusted-Backend-Aktionen:

```text
active → paused
paused → active
active → removed
paused → removed
active → reserved   nur durch angenommenes SwapOffer
reserved → traded  erst durch späteren Trade-Abschluss
```

`reserved`, `traded` und Trade-Zustände werden niemals über die normale Listing-UI gefälscht.

Beim Entfernen eines Listings:

1. öffentliches Listing-Bild entfernen,
2. Listing auf `removed`,
3. Wardrobe-Verknüpfung zurücksetzen,
4. offene Angebote auf diesem Listing ablaufen lassen,
5. deren Locks freigeben.

## 5. SwapOffer

Ein Nutzer darf kein `swapOffers`-Dokument direkt schreiben.

`sendSwapOffer` prüft:

- Authentifizierung,
- Ziel-Listing existiert,
- Listing ist `active`,
- Nutzer ist nicht der Listing-Owner,
- angebotenes WardrobeItem gehört dem Nutzer,
- das angebotene Item ist nicht selbst gelistet,
- das angebotene Item ist nicht bereits in einem aktiven Offer gelockt,
- pro Nutzer und Listing existiert nicht bereits ein offenes Angebot.

## 6. Server-Locks

Zwei server-only Collections sichern die Invarianten:

```text
swapLocks/{offeredWardrobeItemId}
swapOfferKeys/{listingId}_{requesterId}
```

### `swapLocks`

Verhindert, dass dasselbe Kleidungsstück gleichzeitig in mehreren offenen Tauschangeboten steckt.

### `swapOfferKeys`

Verhindert mehrere gleichzeitig offene Angebote desselben Nutzers auf dasselbe Listing.

Beide Collections sind clientseitig komplett gesperrt.

## 7. Angebot zurückziehen

Nur die anfragende Person darf ein noch `sent` befindliches Angebot über `cancelSwapOffer` zurückziehen.

Backend:

```text
sent → cancelled
```

und entfernt atomar:

- `swapLocks/{itemId}`
- `swapOfferKeys/{listingId}_{requesterId}`

Bereits akzeptierte Angebote können nicht über diesen Flow storniert werden.

## 8. Angebot ablehnen

Nur der Listing-Owner kann über `respondSwapOffer` ablehnen.

```text
sent → declined
```

Der Lock des angebotenen Items wird danach wieder freigegeben.

## 9. Angebot annehmen

Nur der Listing-Owner kann ein offenes Angebot annehmen.

Vor Annahme werden Listing, angebotenes Item, Lock und Offer-Key erneut geprüft.

Danach atomar:

```text
SwapListing: active → reserved
SwapOffer: sent → accepted
SwapTransaction: neu, status=accepted
```

Konkurrierende offene Angebote auf das reservierte Listing werden anschließend auf `expired` gesetzt und deren Locks freigegeben.

## 10. SwapTransaction

Eine akzeptierte Transaktion enthält aktuell:

```text
offerId
listingId
participantIds
requesterId
listingOwnerId
requestedWardrobeItemId
offeredWardrobeItemId
status
fulfilmentMode
createdAt
updatedAt
completedAt
schemaVersion
```

Die Collection ist nur für die beiden Teilnehmer lesbar und clientseitig nicht beschreibbar.

## 11. Wichtig: Noch keine Eigentumsübertragung bei `accepted`

`accepted` bedeutet nur:

> Beide Seiten haben sich auf den Tausch geeinigt und die beiden Gegenstände sind für diesen Trade reserviert.

Es bedeutet nicht:

- Paket wurde versendet,
- Gegenstand wurde erhalten,
- Eigentum wurde im digitalen Schrank übertragen,
- Trade ist abgeschlossen.

Das verhindert, dass ein Klick auf „Annehmen“ bereits private Wardrobe-Daten verändert.

## 12. Warum der Abschluss schwieriger ist

Ein echter 1:1-Swap bewegt zwei Gegenstände in Gegenrichtung.

Deshalb reicht ein globales Feld wie `shipped=true` nicht.

Die nächste Stufe benötigt Teilnehmer-spezifische Bestätigungen, z. B.:

```text
fulfilmentMode
modeConfirmedByIds
shippedByIds
receivedByIds
```

Für persönliche Übergabe entsprechend beidseitige Handoff-/Received-Bestätigung.

## 13. Sichere Eigentumsübertragung

Die beiden privaten Wardrobe-Bilder liegen aktuell unter dem jeweiligen alten Eigentümer:

```text
users/{oldOwnerId}/wardrobe/{itemId}/...
```

Nur `ownerId` in Firestore zu ändern wäre falsch.

Beim echten Abschluss muss Trusted Backend für beide Gegenstände:

1. neuen privaten Zielpfad bestimmen,
2. privates Bild in den neuen Owner-Pfad kopieren,
3. beide Kopien verifizieren,
4. erst dann in einer Firestore-Transaktion:
   - beide `ownerId` tauschen,
   - beide `imagePath` aktualisieren,
   - Swap-Verknüpfungen bereinigen,
   - Listing `traded` setzen,
   - Transaction `completed` setzen,
5. danach alte private Bilder löschen,
6. öffentliches Listing-Medium löschen,
7. Locks/temporäre Keys bereinigen.

Für Teilfehler ist ein Recovery-/Maintenance-Pfad erforderlich.

Bis das implementiert und getestet ist, darf die App keinen Trade als abgeschlossen markieren.

## 14. Security-Grenzen

Normaler Client darf nicht direkt schreiben nach:

```text
swapListings
swapOffers
swapTransactions
swapLocks
swapOfferKeys
```

Marketplace- und Trade-Statusänderungen laufen über Trusted Backend Commands.

WardrobeItem-Löschung ist blockiert, wenn:

- `isListedForSwap == true`, oder
- `swapLocks/{itemId}` existiert.

## 15. Aktuelle UI

Der alte Mock-Hub wurde ersetzt.

Cloud-Nutzer sehen echte Daten:

- Marketplace Feed,
- eigene Listings,
- Listing erstellen,
- Listing pausieren,
- Listing reaktivieren,
- Listing entfernen,
- Angebot senden,
- Angebot annehmen/ablehnen,
- eigenes offenes Angebot zurückziehen,
- echte SwapTransactions.

Im Development-Demo-Modus werden keine erfundenen Marketplace-Nutzer oder Trades mehr angezeigt.

## 16. Nächste Reihenfolge

```text
1. Transaction-Fulfilment-Domain
2. Versand vs. persönliche Übergabe
3. beidseitige Statusbestätigung
4. sichere Zwei-Wege-Storage-Migration
5. atomare Eigentumsübertragung
6. Trade Completion
7. Reviews
8. Reports / Blocks / Disputes
9. Notifications
10. Admin Moderation
```

## 17. Definition of Done für echten Tausch

Ein OmniSwap-Trade gilt erst als technisch fertig, wenn:

- zwei reale Nutzer beteiligt sind,
- reale WardrobeItems referenziert werden,
- Angebot serverseitig validiert wurde,
- doppelte Nutzung der Items verhindert wird,
- Annahme atomar reserviert,
- beide Seiten den Fulfilment-Fortschritt bestätigen,
- private Medien sicher migriert werden,
- Eigentum erst nach Abschluss übertragen wird,
- alte Medien sicher bereinigt werden,
- Listing danach nicht mehr aktiv ist,
- Locks entfernt sind,
- beide neuen Wardrobes den korrekten Gegenstand anzeigen,
- der Vorgang durch Integration/E2E-Tests abgesichert ist.
