# Omni Fashion – Support & Recovery

Status: **technischer Recovery-Unterbau implementiert; interne Support-Oberfläche und manuelle Runbooks noch offen**

## Ziel

Recovery darf keine unsichere Automatik sein. Besonders bei OmniSwap kann ein physisches Kleidungsstück bereits versendet oder übergeben worden sein. Deshalb unterscheidet Omni Fashion klar zwischen:

1. automatisch sicher behebbaren technischen Restzuständen,
2. moderatorseitig prüfbaren Recovery-Fällen,
3. Fällen, die eine echte manuelle Supportentscheidung benötigen.

---

## Recovery Queue

`listRecoveryQueue` ist moderator-/admin-only und bündelt aktuell:

- `swapTransactions` mit `finalizationState === failed`
- `swapDisputes` mit `resolution === manual_recovery`
- Push-Deliveries mit `send_failed` oder `needs_review`

Normale Nutzer können diese internen Betriebsdaten nicht direkt lesen.

---

## Swap Finalization Recovery

Eine fehlgeschlagene Zwei-Wege-Eigentumsübertragung bleibt ausdrücklich:

```text
finalizationState = failed
```

Sie wird nicht als `completed` dargestellt.

Die bestehende Trade-UI kann den serverseitigen Finalizer erneut starten. Falls der Fall nicht automatisch sicher lösbar ist, erscheint er in der Recovery Queue.

### Keine automatische Trade-Umkehr

Omni Fashion führt keine pauschale automatische Rückabwicklung durch, sobald physische Teile bewegt worden sein könnten.

Ein Dispute kann durch Moderation entweder:

- sicher in den gespeicherten Vorzustand zurückgesetzt werden (`resume_trade`), oder
- in `manual_recovery` überführt werden.

`manual_recovery` lässt die Transaction absichtlich blockiert, bis ein definierter Supportprozess existiert.

---

## Öffentliche Listing-Medien

`cleanupInactiveSwapListingMedia` läuft täglich.

Es verarbeitet ausschließlich:

- Listings mit `removed` oder `traded`
- die älter als 24 Stunden sind
- deren `publicImagePath` mit `public/listings/` beginnt

Der Job löscht **niemals** private Wardrobe-/Avatar-Pfade.

Nach erfolgreichem Cleanup setzt er `publicMediaCleanedAt`.

---

## Push Recovery

Ein Push-Delivery-Claim schützt vor Trigger-Duplikaten. Wenn ein Prozess nach dem Claim hängen bleibt, wäre ein blindes erneutes Senden jedoch riskant.

Darum markiert `flagStalePushDeliveryClaims` Claims nach einer Stunde nur als:

```text
status = needs_review
errorCode = STALE_CLAIM
```

Es erfolgt **kein automatisches Resend**.

Fehlerhafte Deliveries sind anschließend über die Recovery Queue sichtbar.

---

## Aktuelle sichere Automationen

- Expo Push Receipt Worker
- Deaktivierung von `DeviceNotRegistered` Tokens
- Cleanup inaktiver öffentlicher Listing-Medien
- Markierung festhängender Push-Claims
- retry-fähige Swap-Finalisierung

---

## Noch offen

### Support Case Domain

Noch benötigt:

- eigener `supportCases`-Datensatz
- Owner/Assignee/Priority
- Verlauf / interne Notizen
- Nutzerkommunikation
- SLA / Eskalation
- Anhänge / Beweise nur mit klarer Retention Policy

### Manual Trade Recovery

Vor Production müssen Runbooks definieren:

- nur eine Seite hat versendet
- beide Seiten haben versendet, eine Seite bestreitet Empfang
- falsches oder beschädigtes Teil
- technischer Ownership-/Storage-Fehler nach physischer Übergabe
- verlorene Sendung
- Moderations-/Abuse-Fall

### Betriebsmetriken

Benötigt:

- failed finalizations
- offene Disputes
- Alter von Recovery-Fällen
- Push send/receipt error rate
- Storage cleanup failures

---

## Nicht verhandelbare Regel

Recovery darf einen Trade niemals als erfolgreich, rückabgewickelt oder zugestellt markieren, nur um einen technischen Fehlerzustand zu beseitigen.
