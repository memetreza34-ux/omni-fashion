# OmniSwap – Trust & Safety

Stand: 16. August 2026

Trust & Safety ist keine spätere Support-Funktion, sondern Teil des Marketplace-Kerns. Dieses Dokument beschreibt die aktuelle technische Sicherheitsgrenze.

## 1. Prinzip

Normale Clients dürfen keine Moderationszustände direkt schreiben.

Trusted Backend Commands erzeugen und verändern:

```text
blocks
reports
swapDisputes
```

Firestore Rules verhindern direkte Client-Mutationen.

## 2. Nutzer blockieren

Callable:

`setUserBlock`

Deterministischer Datensatz:

```text
blocks/{blockerId}_{blockedId}
```

Das Backend verhindert Selbstblockierung und prüft beim Blockieren, ob das Zielkonto existiert.

Der Client darf nur seine eigene Blockliste lesen.

### Wirkung im Marketplace

`SwapContext` blendet Listings von Konten aus, die der aktuelle Nutzer blockiert hat.

Das ist eine UX-/Feed-Filterung. Die eigentliche Sicherheitsgrenze liegt zusätzlich im Backend:

`sendSwapOffer` prüft beide Richtungen:

```text
requester blocks owner
ODER
owner blocks requester
```

Wenn eine der beiden Blockierungen existiert, kann kein neues Tauschangebot erstellt werden.

### Aktive Trades

Eine Blockierung beendet einen bereits akzeptierten Trade nicht automatisch. Dafür existiert die separate Dispute-/Moderationsstrecke, damit ein laufender Eigentumsprozess nicht durch einen einfachen Block-Klick inkonsistent wird.

## 3. Marketplace melden

Callable:

`submitReport`

Unterstützte Ziele:

```text
listing
user
transaction
```

Aktuelle Report-Gründe:

- Spam
- Betrug
- Fälschung
- verbotener Artikel
- Belästigung
- unsichere Übergabe
- sonstiges

Das Backend validiert das Ziel. Eigene Listings oder das eigene Konto können nicht als fremdes Ziel gemeldet werden.

Bei Transaction-Reports muss die meldende Person Teilnehmer des Trades sein.

Reports werden als private Moderationsfälle gespeichert und sind für normale Nutzer anschließend nicht lesbar oder manipulierbar.

## 4. Streitfall bei aktivem Trade

Callable:

`openSwapDispute`

Nur Teilnehmer der Transaction dürfen einen Streitfall öffnen.

Gründe:

- Artikel nicht erhalten
- Artikel anders als beschrieben
- falscher Artikel
- beschädigter Artikel
- unsichere Interaktion
- sonstiges

Pro Transaction existiert maximal ein aktiver initialer Dispute-Datensatz:

```text
swapDisputes/{transactionId}
```

Beim Öffnen:

```text
SwapTransaction.status → disputed
```

Damit stoppt die normale Trade-State-Machine.

## 5. Wann kein Dispute mehr geöffnet werden darf

Ein neuer Streitfall wird abgewiesen bei:

```text
completed
cancelled
disputed
finalizationState=processing
finalizationState=completed
```

So kann ein bereits laufender atomarer Eigentumswechsel nicht gleichzeitig durch einen neuen Moderationsstatus überschrieben werden.

## 6. Firestore-Regeln

### Reports

```text
read: false
create: false
update: false
delete: false
```

Normale Nutzer arbeiten ausschließlich über Trusted Backend Commands.

### Blocks

Lesen nur, wenn:

```text
resource.data.blockerId == request.auth.uid
```

Schreiben/Löschen nur Backend.

### SwapDisputes

Lesen nur für Teilnehmer:

```text
request.auth.uid in resource.data.participantIds
```

Mutationen nur Backend.

## 7. UI

Marketplace-Listings besitzen echte Aktionen:

- `Melden`
- `Blockieren`

Report-Gründe werden in der UI ausgewählt und als privater Moderationsfall gesendet.

Blockierung wird erst nach Backend-Erfolg wirksam. Danach aktualisiert das Blocklisten-Live-Abo den Feed.

Aktive Transactions besitzen:

- `Problem melden / Klärungsfall öffnen`

Sobald eine Transaction `disputed` ist, zeigt der Screen keine normalen Trade-Fortschrittsaktionen mehr.

## 8. Security Regression Tests

`tests/security/trust-safety.rules.integration.mjs` prüft unter Firebase Emulator:

- Client kann keinen Report direkt erstellen,
- Client kann Reports nicht direkt lesen,
- Client kann keinen Block direkt erstellen,
- eigener Blocklisten-Query ist zulässig,
- fremde Blockliste kann nicht enumeriert werden,
- Client kann keinen SwapDispute direkt erstellen.

Der Test ist Teil des permanenten `Quality`-Workflows.

## 9. Noch offen vor Production

Trust & Safety ist als technische Nutzerstrecke vorhanden. Noch erforderlich:

- Admin-Moderationsoberfläche für offene Reports/Disputes,
- Moderationsentscheidungen und Audit Log,
- Suspend/Ban-Workflow,
- Policy für verbotene Artikel,
- konkrete Counterfeit-Policy,
- Eskalations-/Supportprozess,
- Recovery für strittige bereits versendete Gegenstände,
- Alters-/Minderjährigenregeln,
- klare persönliche-Übergabe-Sicherheitshinweise,
- Notifications bei Report-/Dispute-Statusänderungen,
- Abuse-/Rate-Limits für Report- und Block-Commands.

## 10. Nächste technische Reihenfolge

```text
Trust & Safety Basis
  ↓
Notifications
  ↓
Admin Moderation Queue
  ↓
Reviews nach completed Trade
  ↓
Support / Recovery / Audit
```
