# OmniSwap – Zwei-Wege-Trade und Eigentumsübertragung

Stand: 16. August 2026

Dieses Dokument beschreibt die im Arbeitsbranch implementierte Trade-Strecke nach Annahme eines echten OmniSwap-Angebots.

## 1. Warum `accepted` nicht `completed` bedeutet

Ein 1:1-Swap bewegt zwei reale Kleidungsstücke in Gegenrichtung. Deshalb darf ein Klick auf „Annehmen“ niemals bereits digitales Eigentum übertragen.

```text
Offer accepted
  ↓
SwapTransaction reserved
  ↓
beide wählen/akzeptieren Tauschweg
  ↓
Versand oder persönliche Übergabe
  ↓
beide bestätigen Empfang
  ↓
sichere Zwei-Wege-Medienmigration
  ↓
atomarer Wardrobe-Eigentumswechsel
  ↓
completed
```

## 2. Transaction Schema v2

`swapTransactions` enthält unter anderem:

```text
participantIds
requesterId
listingOwnerId
requestedWardrobeItemId
offeredWardrobeItemId
shippingEnabled
meetupEnabled
fulfilmentMode
modeConfirmedByIds
shippedByIds
receivedByIds
status
finalizationState
finalizationErrorCode
completedAt
schemaVersion = 2
```

Alle Trade-Mutationen sind clientseitig gesperrt und laufen über Trusted Backend Commands.

## 3. Zustandsmaschine

Die reine Domainlogik liegt in:

`functions/src/swap/transaction-state.ts`

Sie ist unabhängig von UI, Firestore und Storage testbar.

### Versand

```text
accepted
  ↓ beide bestätigen shipping
address_or_meetup
  ↓ Teilnehmer A bestätigt Versand
address_or_meetup
  ↓ Teilnehmer B bestätigt Versand
shipped
  ↓ A bestätigt Erhalt des Pakets von B
shipped
  ↓ B bestätigt Erhalt des Pakets von A
received + finalizationState=ready
```

Eine Person kann den Empfang beim Versand erst bestätigen, nachdem die Gegenseite ihren Versand bestätigt hat.

### Persönliche Übergabe

```text
accepted
  ↓ beide bestätigen meetup
address_or_meetup
  ↓ A bestätigt erhaltene Übergabe
address_or_meetup
  ↓ B bestätigt erhaltene Übergabe
received + finalizationState=ready
```

Es gibt bei persönlicher Übergabe keinen künstlichen `shipped`-Schritt.

## 4. Moduskonflikte

Sobald eine Person `shipping` oder `meetup` gewählt hat, kann die andere Person nicht still einen anderen Modus auswählen.

Der Backend-State-Machine-Test deckt diesen Konflikt explizit ab.

## 5. Finalization Claim

Sobald beide Empfänge bestätigt sind, startet `finalizeSwapTransaction`.

Zuerst wird in Firestore atomar geclaimt:

```text
finalizationState: ready → processing
```

Dadurch können zwei fast gleichzeitige Requests nicht dieselbe Eigentumsübertragung parallel ausführen.

## 6. Vorbedingungen vor Eigentumswechsel

Der Finalizer prüft erneut:

- beide Teilnehmer,
- beide Empfangsbestätigungen,
- Listing weiterhin `reserved`,
- Listing gehört noch zum ursprünglichen Owner,
- angefragtes WardrobeItem gehört noch zum Listing-Owner,
- angebotenes WardrobeItem gehört noch zum Requester,
- angefragtes Item ist noch korrekt mit dem Listing verknüpft,
- angebotenes Item wurde nicht zwischenzeitlich gelistet,
- beide privaten Originalbilder existieren.

## 7. Sichere private Medienmigration

Vor dem Firestore-Eigentumswechsel werden beide privaten Bilder in den neuen Eigentümerpfad kopiert:

```text
users/{oldOwner}/wardrobe/{itemId}/original.ext
        ↓ copy
users/{newOwner}/wardrobe/{itemId}/original.ext
```

Beide Zielkopien müssen existieren, bevor Firestore Eigentum ändert.

## 8. Atomarer Eigentumswechsel

Erst nach erfolgreicher Medienkopie führt Firestore in einer Transaktion aus:

### Angefragtes Kleidungsstück

```text
ownerId → requesterId
imagePath → neuer privater Requester-Pfad
isListedForSwap → false
swapListingId → null
```

### Angebotenes Kleidungsstück

```text
ownerId → listingOwnerId
imagePath → neuer privater Listing-Owner-Pfad
isListedForSwap → false
swapListingId → null
```

### Listing

```text
reserved → traded
```

### Transaction

```text
received → completed
finalizationState → completed
completedAt → server timestamp
```

Zusätzlich werden der Item-Lock und der Offer-Key entfernt.

## 9. Cleanup nach erfolgreicher Transaktion

Erst nach der erfolgreichen Firestore-Transaktion werden best-effort entfernt:

- altes privates Bild des angefragten Items,
- altes privates Bild des angebotenen Items,
- öffentliches Listing-Bild.

Cleanup-Fehler machen einen bereits korrekt übertragenen Trade nicht wieder rückgängig; sie werden geloggt und benötigen später einen Maintenance-/Recovery-Job.

## 10. Fehler und Retry

Wenn Finalisierung vor dem atomaren Eigentumswechsel fehlschlägt:

```text
finalizationState → failed
finalizationErrorCode → stabiler Fehlercode
```

Neu kopierte Zielbilder werden best-effort entfernt.

Der Nutzer bekommt keinen falschen `completed`-Status.

Wenn beide Empfangsbestätigungen weiterhin vorhanden sind, kann `retry_finalize` den Finalizer erneut starten.

## 11. Streitfall

Ein offener `swapDispute` setzt die Transaction auf:

```text
status = disputed
```

Die normale Zustandsmaschine betrachtet `disputed` als geschlossen. Während eines offenen Streitfalls gibt es keinen normalen Versand-/Empfangsfortschritt und keine automatische Eigentumsübertragung.

Ein Streitfall kann nicht mehr geöffnet werden, sobald Finalisierung bereits `processing` oder `completed` ist.

## 12. Tests

Die reine Zwei-Parteien-Zustandsmaschine hat Unit-Tests für:

- vollständigen Versandablauf,
- persönliche Übergabe,
- Empfang vor Gegenseiten-Versand wird verhindert,
- Moduskonflikt wird verhindert,
- Finalization-Retry nur im gültigen Zustand.

Zusätzlich laufen Root-TypeScript, Functions-Build/Tests und Firebase-Security-Emulator im Quality-Workflow.

## 13. Noch externe Validierung nötig

Die Architektur und der Code sind implementiert, aber vor Production fehlen weiterhin:

- reales Firebase Dev-/Prod-Deployment,
- echter Zwei-Nutzer-E2E-Test auf Geräten,
- reale Netzunterbrechungs-/Retry-Tests,
- Storage-Recovery/Maintenance-Job für seltene Cleanup-Orphans,
- finaler Versand-/Tracking-Provider, falls Versandlabels integriert werden,
- App Check und Production Monitoring.
