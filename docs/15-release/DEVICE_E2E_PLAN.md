# Omni Fashion – Real Device E2E Plan

**Ziel:** Der produktionsorientierte Core gilt erst dann als real validiert, wenn zwei echte Nutzerkonten auf realen Android-/iOS-Builds den wichtigsten Produktpfad ohne Emulator-/Demo-Abkürzungen durchlaufen.

## Voraussetzungen

Vor Teststart müssen vorhanden sein:

- Firebase Dev-Projekt
- E-Mail/Passwort Auth aktiv
- Firestore Rules deployed
- Storage Rules deployed
- Firestore Indizes deployed
- Functions deployed
- Gemini Secret gesetzt
- `runtimeConfig/publicFeatureFlags` mit allen optionalen Flags initial `false`
- EAS Development/Preview Build
- finale Test-Package-/Bundle-Identifier
- zwei physische Geräte oder mindestens ein Android- und ein iOS-Gerät über mehrere Testläufe
- zwei getrennte Testkonten

## Testkonten

Keine persönlichen Produktivkonten verwenden.

```text
User A – Listing Owner
User B – Requester
```

Beide Accounts müssen getrennte Firebase UIDs besitzen.

## Beweispflicht

Für jeden Block erfassen:

- Build-Version / Commit SHA
- Plattform / OS-Version / Gerät
- Nutzer A UID
- Nutzer B UID
- relevante Firestore Dokument-IDs
- relevante Storage-Pfade
- erwarteter Zustand
- tatsächlicher Zustand
- Screenshot nur wenn keine sensiblen Daten enthalten sind
- PASS / FAIL

Secrets, Push Tokens und private Storage Download URLs niemals in Testdokumente kopieren.

---

# E2E-01 – Auth und Session

Für Nutzer A und B getrennt:

1. Konto registrieren.
2. Verifikationsmail erhalten.
3. Vor Verification darf Main App nicht geöffnet werden.
4. E-Mail bestätigen.
5. Verification Gate aktualisieren.
6. Main App öffnet.
7. App vollständig beenden.
8. App erneut starten.
9. Session-Verhalten prüfen.
10. Logout.
11. Login erneut durchführen.
12. Passwort Reset anfordern und E-Mail-Flow prüfen.

Erwartung:

- keine Dev-Demo in Production/Preview Build
- UserProfile existiert genau einmal
- DisplayName korrekt
- unverified User bleibt vor Main App blockiert
- Session-Persistenz entspricht dem final validierten Native-Auth-Pfad

---

# E2E-02 – Wardrobe Upload

Nutzer A:

1. Foto über Kamera aufnehmen.
2. zweites Item aus Galerie auswählen.
3. Upload bis Cloud-Speicherung abschließen.
4. App zwischenzeitlich in Hintergrund/Vordergrund bewegen.
5. Items öffnen und bearbeiten.
6. Kategorie/Farbe/Größe/Zustand ändern.
7. App auf zweitem Login/anderen Gerät öffnen, falls verfügbar.

Erwartung:

```text
Firestore wardrobeItems.ownerId = A
Storage path beginnt mit users/{A}/wardrobe/
anderer Nutzer kann private Dokumente/Bilder nicht lesen
UI zeigt keine lokale Fake-Erfolgsmeldung bei fehlgeschlagenem Upload
```

Negativtest:

- Netzwerk während Upload unterbrechen
- Upload darf nicht als erfolgreich markiert werden

---

# E2E-03 – Kleidungsanalyse

Für mindestens zwei echte Kleidungsbilder:

1. Analyse starten.
2. `pending` sichtbar.
3. Function-Aufruf beobachten.
4. `completed` oder sauberer `failed` State.
5. Confidence prüfen.
6. erkannte Werte manuell korrigieren.
7. dieselbe Analyse erneut auslösen und Idempotenz/Caching prüfen.
8. Rate-Limit-Verhalten in separatem kontrolliertem Test prüfen, ohne unnötige Providerkosten zu erzeugen.

Erwartung:

- nur Owner kann analysieren
- kein frei erfundener Brand bei unsicherem Ergebnis
- Providerfehler hinterlässt kein dauerhaftes falsches `pending`
- UI-Korrekturen bleiben nach AI-Ergebnis möglich

---

# E2E-04 – Style-DNA / Stylist

Nutzer A:

1. Style-Präferenzen auswählen.
2. Farben / Fit / Achsen setzen.
3. speichern.
4. Wardrobe neu auswerten.
5. Anlass auswählen.
6. manuelle Saison testen.
7. Wetter für reale Stadt laden.
8. Outfit erzeugen.
9. Outfit speichern.
10. Like / Dislike / Worn setzen.

Erwartung:

- Outfit referenziert ausschließlich echte WardrobeItem IDs
- fehlende Kategorien werden genannt statt erfundener Produkte
- Wetterausfall fällt auf manuelle Saison zurück
- Saved Outfit bleibt persistent

---

# E2E-05 – OmniSwap Listing

Nutzer A:

1. verfügbares WardrobeItem listen.
2. Versand und/oder Übergabe wählen.
3. Listing veröffentlichen.
4. öffentliche Projektion prüfen.
5. privates Originalbild darf für Nutzer B nicht über Wardrobe-Storage-Pfad lesbar sein.
6. Listing pausieren.
7. Nutzer B darf pausiertes Listing nicht im aktiven Feed sehen.
8. Listing reaktivieren.

Erwartung:

- `swapListingId` und `isListedForSwap` konsistent
- öffentliche Medienkopie unter `public/listings/...`
- privater Source-of-Truth Datensatz bleibt privat

---

# E2E-06 – Offer

Nutzer B:

1. eigenes verfügbares WardrobeItem besitzen.
2. Listing von A öffnen.
3. Tauschangebot senden.

Prüfen:

- Offer enthält echte Teilnehmer-IDs
- angebotenes Item gehört B
- `swapLocks` reserviert das angebotene Item
- `swapOfferKeys` verhindert Doppelangebot
- B kann dasselbe Item nicht parallel erneut verwenden
- A erhält In-App Notification

Negativtests:

- B blockiert A → neues Offer muss serverseitig scheitern
- A blockiert B → neues Offer muss serverseitig scheitern

---

# E2E-07 – Offer Accept / Decline / Cancel

Mindestens drei separate Testläufe:

### Decline

A lehnt Offer ab.

Erwartung:

- Offer `declined`
- Lock gelöst
- B kann Item wieder verwenden

### Cancel

B zieht eigenes offenes Offer zurück.

Erwartung:

- Offer `cancelled`
- Lock gelöst

### Accept

A akzeptiert Offer.

Erwartung:

- genau eine SwapTransaction entsteht
- konkurrierende Offers laufen entsprechend aus
- Listing wird reserviert
- Teilnehmer sind exakt A und B

---

# E2E-08 – Trade Shipping

A und B:

1. beide bestätigen Versand als Tauschweg.
2. A bestätigt Versand.
3. B bestätigt Versand.
4. A bestätigt Empfang von B.
5. B bestätigt Empfang von A.
6. Finalization läuft.

Vor Finalization Zustand dokumentieren:

```text
A owns item_A
B owns item_B
```

Nach erfolgreicher Finalization:

```text
A owns item_B
B owns item_A
private image paths liegen in den neuen Owner-Prefixes
Listing = traded
Transaction = completed
```

Wichtig:

- Ownership darf **nicht** vor sicherer Storage-Kopie wechseln
- keine Doppel-Finalisierung bei wiederholtem Client-Call

---

# E2E-09 – Trade Meetup

Separater Trade:

1. beide wählen persönliche Übergabe.
2. beide bestätigen Empfang.
3. Finalization prüfen.

Erwartung wie beim Shipping-Flow, ohne künstlichen Shipping-State.

---

# E2E-10 – Finalization Failure / Retry

Nur im Dev-Projekt kontrolliert einen reproduzierbaren Failure erzeugen.

Prüfen:

- Transaction wird nicht fälschlich `completed`
- Ownership bleibt konsistent
- `finalizationState = failed`
- Retry-Action sichtbar
- Retry kann den Trade sicher abschließen
- Recovery Queue zeigt nicht aufgelöste technische Fälle

Keine künstliche Manipulation im Production-Projekt.

---

# E2E-11 – Dispute

Vor completed Trade:

1. Nutzer öffnet Klärungsfall.
2. normalen Fortschritt erneut versuchen.
3. Moderator Queue prüfen.
4. `resume_trade` in einem Dev-Fall testen.
5. `manual_recovery` in separatem Fall testen.

Erwartung:

- `disputed` stoppt normale Trade-Aktionen
- kein automatischer Ownership-Wechsel während Dispute
- Moderator-Aktionen verlangen echte Claims
- normaler Nutzer darf Moderator-Callables nicht ausführen

---

# E2E-12 – Reviews

Nach `completed` + `finalizationState=completed`:

1. A bewertet B.
2. B bewertet A.
3. erneute Bewertung versuchen.

Erwartung:

- Reviewee wird serverseitig aus Gegenpartei bestimmt
- genau eine Review pro Nutzer/Trade
- vor completed Trade kein Review möglich

---

# E2E-13 – Notifications

Während der gesamten Swap-Strecke prüfen:

- Offer received
- accepted / declined / cancelled
- Mode confirmed
- shipped
- received
- completed
- disputed

Erwartung:

- keine doppelten fachlichen Notifications bei Trigger-Retry
- Read State persistent
- Inbox zeigt maximal die neueste begrenzte Historie

---

# E2E-14 – Native Push

Erst nach realer nativer Push-Konfiguration:

1. Push Permission ablehnen → App bleibt vollständig nutzbar.
2. Permission erlauben.
3. echte Expo Push Token Registrierung.
4. `pushEnabled=true` setzen.
5. reales Swap-Ereignis erzeugen.
6. Push empfangen.
7. App öffnen.
8. Ticket/Receipt prüfen.
9. invaliden/uninstallierten Device-Flow kontrolliert testen.

Erwartung:

- Push ist Zusatzkanal, In-App Notification bleibt Source of Truth
- kein Token wird erfunden
- DeviceNotRegistered deaktiviert Token

---

# E2E-15 – Block / Report

1. B meldet Listing von A.
2. Report erscheint nur in Moderator Queue.
3. B blockiert A.
4. A verschwindet aus Bs Feed.
5. neues Offer zwischen beiden wird serverseitig verhindert.
6. B entblockiert A.

Rate-Limit-Negativtest für Reports separat und kontrolliert durchführen.

---

# E2E-16 – Feature Flag Kill Switch

Im Firebase Dev-Projekt:

1. alle Flags `false`.
2. `internalModeratorUi=true` für internen Test.
3. App in Hintergrund/Vordergrund bewegen.
4. UI reagiert.
5. normaler Nutzer versucht Moderator-Callable → muss trotzdem scheitern.
6. Flag wieder `false`.
7. App foreground → UI verschwindet/deaktiviert sich.
8. ungültiges Config-Schema setzen → Client muss auf alle sicheren Defaults `false` fallen.

---

# E2E-17 – App Check

Erst nach nativer Attestation:

- Android Play Integrity Token validieren
- iOS App Attest/DeviceCheck validieren
- legitime Requests mit Token prüfen
- ungültigen/unattestierten Client im Dev-Projekt prüfen
- Enforcement zuerst Dev, dann Preview/Internal
- Production erst nach bestätigter Metrik

Siehe [`../05-backend/APP_CHECK_STRATEGY.md`](../05-backend/APP_CHECK_STRATEGY.md).

---

# E2E-18 – Datenexport

Nutzer mit:

- Wardrobe
- StyleProfile
- Saved Outfits
- abgeschlossener Swap-Historie
- Reviews
- Notifications

führt Export aus.

Prüfen:

- erwartete Produktdaten enthalten
- keine Expo Push Tokens
- keine Admin-/Secret-Daten

---

# E2E-19 – Account Deletion

### Blockierter Löschversuch

Nutzer mit offenem Listing/Offer/Trade/Lock versucht Löschung.

Erwartung:

- Löschung verweigert
- konkrete Blocker zurückgegeben

### Erlaubte Löschung

Nach Abschluss aller Blocker:

1. Re-Authentication.
2. Readiness prüfen.
3. exakte Bestätigung.
4. Account löschen.

Prüfen:

- private Wardrobe-/Profil-/Outfit-/Notification-Daten gelöscht
- `users/{uid}/` Storage gelöscht
- Push-/RateLimit-State gelöscht
- gemeinsame completed Marketplace-Historie pseudonymisiert statt zerstört
- Auth User zuletzt gelöscht
- ehemaliger Login funktioniert nicht mehr

---

# E2E-20 – Accessibility Device Audit

Mit Release-Candidate-Build:

### iOS

- VoiceOver
- Dynamic Type Maximum Accessibility Sizes
- Modal Focus / Focus Return
- kritische Delete-/Trade-Confirmations

### Android

- TalkBack
- große Systemschrift
- Back Navigation
- kritische Marketplace-Aktionen

### Web, falls öffentlich

- Keyboard Only
- Focus Indicator
- Tab Order
- Modal Focus Trap

Siehe [`../03-design/ACCESSIBILITY.md`](../03-design/ACCESSIBILITY.md).

---

# Release Gate

Der Zwei-Nutzer-E2E-Block gilt nur dann als bestanden, wenn:

- keine kritischen FAILs offen sind
- Firestore/Storage Ownership konsistent bleibt
- kein Security-Negativtest unerwartet erlaubt wird
- kein Fake-/Demo-Fallback im Preview/Production Build aktiv ist
- Crash-/Error-Telemetry für den Testbuild vorhanden ist
- getesteter Commit SHA exakt dem Release-Candidate-Quellstand entspricht

Ein lokaler Simulator-/Emulator-Erfolg allein erfüllt dieses Gate nicht.
