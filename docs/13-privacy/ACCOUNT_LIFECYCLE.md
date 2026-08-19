# Omni Fashion – Privacy & Account Lifecycle

Status: **technischer Export-/Löschpfad implementiert; rechtliche Retention-Entscheidungen und reale Firebase-E2E-Validierung vor Production offen**

## Grundprinzip

Account Lifecycle ist kein einfacher `deleteUser()`-Button.

Omni Fashion besitzt:

- private Wardrobe-/Profil-Daten,
- private Bilder,
- Push-Geräte,
- gemeinsame abgeschlossene OmniSwap-Historie mit einer Gegenpartei,
- Moderations-/Reportdaten.

Darum trennt der Löschpfad:

1. private Daten löschen,
2. gemeinsame historische Datensätze pseudonymisieren/redigieren,
3. Firebase Auth erst ganz am Ende löschen.

---

## Datenexport

Trusted Callable:

```text
exportMyData
```

Exportiert die dem angemeldeten Nutzer zugeordneten Produktdaten, unter anderem:

- UserProfile
- StyleProfile
- Wardrobe Items
- Saved Outfits
- Swap Listings
- Swap Offers
- Swap Transactions
- Swap Disputes
- Reviews
- Blocks
- In-App Notifications
- Notification Preferences
- eigene Reports
- Push-Geräte-Metadaten

Firestore Timestamps werden in ISO-Zeitstrings umgewandelt.

### Nicht exportiert

Sicherheits-Credentials werden absichtlich ausgelassen:

- rohe Expo Push Tokens
- Firebase Auth Credentials
- Server Secrets

Die aktuelle App stellt den JSON-Export über die native Share-Funktion bereit.

---

## Deletion Readiness

Trusted Callable:

```text
getAccountDeletionReadiness
```

Blockiert eine Löschung bei:

- aktivem / pausiertem / reserviertem Swap Listing
- offenem `sent` Swap Offer
- nicht abgeschlossenem/nicht storniertem Trade
- aktivem Swap Lock

Ein historisches `accepted` Offer blockiert nicht automatisch: Der tatsächliche Transaction-Status ist dafür die Source of Truth.

---

## Frische Authentifizierung

Sensible Kontolöschung verlangt eine kürzlich bestätigte Anmeldung.

Der Backend-Workflow prüft den verifizierten Firebase-ID-Token-Claim `auth_time` gegen ein kurzes Zeitfenster von aktuell fünf Minuten.

In der aktuellen E-Mail/Passwort-App reauthentifiziert sich die Nutzerin oder der Nutzer im Privacy-Screen mit dem aktuellen Passwort über Firebase Auth.

---

## Guarded Account Deletion

Trusted Callable:

```text
deleteMyAccount
```

### 1. Vorbedingungen

- authentifiziert
- frische Authentifizierung
- keine aktiven OmniSwap-Blocker

### 2. Private Daten löschen

Gelöscht werden unter anderem:

- Wardrobe Items
- Saved Outfits
- StyleProfile
- Blocks
- In-App Notifications
- Notification Preferences
- Push Devices
- Push Deliveries
- Push Tickets
- Offer Keys

### 3. Private Storage-Medien

Der komplette Prefix:

```text
users/{uid}/
```

wird gelöscht.

Damit werden nach den aktuellen Storage-Regeln sowohl private Wardrobe-Bilder als auch Avatar-Dateien erfasst.

Öffentliche `public/listings/...` Medien werden nicht aus einem privaten User-Prefix heraus geraten, sondern durch den separaten Inactive-Listing-Cleanup entfernt.

### 4. Gemeinsame historische Marketplace-Daten

Abgeschlossene/stornierte Datensätze können auch zur Gegenpartei gehören und werden deshalb nicht blind vernichtet.

Stattdessen wird eine nicht rückrechenbare interne Pseudonym-ID erzeugt:

```text
deleted_<hash-prefix>
```

Diese ersetzt die Nutzer-ID in historischen:

- Listings
- Offers
- Transactions
- Disputes
- Reviews
- relevanten Reports

Freie personenbezogene Texte wie Beschreibungen, Review-Kommentare und Dispute-/Report-Details werden entfernt oder redigiert.

### 5. Minimaler Lösch-Audit

`privacyDeletionAudit` speichert nur einen pseudonymisierten technischen Nachweis mit Zählwerten und Zeitpunkt.

Kein Klarname, keine E-Mail und kein Push Token werden dort gespeichert.

### 6. Firebase Auth zuletzt

Der Firebase-Auth-Nutzer wird erst nach den vorherigen Cleanup-Schritten serverseitig gelöscht.

Das reduziert das Risiko, dass ein früher technischer Fehler das Login zerstört, bevor der Workflow erneut ausgeführt werden kann.

---

## App UI

Im Profil ist ein eigener Bereich **Datenschutz & Konto** erreichbar.

Funktionen:

- Datenexport
- Lösch-Readiness und Blocker anzeigen
- Passwort-Reauthentication
- exakte Bestätigung `LÖSCHEN`
- zweite destruktive Bestätigung
- kein Fake-Verhalten im Development-Demo-Modus

---

## Noch vor Production offen

### Recht / Retention

Die pseudonymisierte Aufbewahrung gemeinsamer Marketplace-Historie ist eine technische Produktentscheidung und muss vor kommerziellem Launch gegen die finale Datenschutz-/Aufbewahrungspolitik rechtlich geprüft werden.

Festzulegen sind insbesondere:

- konkrete Retention-Zeiten
- rechtliche Grundlage je Datensatzklasse
- Löschfristen für Moderation/Audit
- Datenexportformat und Bereitstellung
- Privacy Policy
- Store Data Safety / Privacy Labels

### Technische E2E-Validierung

Mit echtem Firebase Dev-Projekt testen:

1. Konto ohne Trades löschen
2. aktives Listing blockiert Löschung
3. offenes Offer blockiert Löschung
4. offener/disputed Trade blockiert Löschung
5. completed Trade erlaubt Löschung
6. private Wardrobe-/Avatar-Medien verschwinden
7. historische Gegenparteidaten bleiben konsistent pseudonymisiert
8. Push-Geräte/Notifications verschwinden
9. Firebase Auth Nutzer ist danach entfernt
10. wiederholter/teilweise fehlgeschlagener Cleanup verhält sich kontrolliert

---

## Sicherheitsregel

Ein Konto darf nicht gelöscht werden, indem offene physische OmniSwap-Verpflichtungen oder die Datenrechte der Gegenpartei stillschweigend ignoriert werden.
