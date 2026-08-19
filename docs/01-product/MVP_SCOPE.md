# Omni Fashion – MVP Scope

## Ziel

Diese Datei friert den Umfang für die erste wirklich veröffentlichbare Version ein.

Der MVP soll nicht maximal viele Screens enthalten, sondern eine vollständige, zuverlässige Kernschleife.

---

# 1. MVP-Kern

## MUST HAVE

### A. Account & Onboarding

- Registrierung mit E-Mail + Passwort
- Login / Logout
- E-Mail-Verifizierung
- Passwort vergessen / Reset
- Session-Wiederherstellung
- grundlegendes Nutzerprofil
- Style-Onboarding
- Datenschutz-/Terms-Verlinkung
- Account löschen

### B. Digitaler Kleiderschrank

- Foto aus Kamera oder Galerie
- Upload in Cloud Storage
- AI-/Regel-basierte Kleidungsanalyse
- Nutzer bestätigt oder korrigiert erkannte Daten
- Item speichern
- Item bearbeiten
- Item löschen
- Kategorien / Suche / Filter
- Cloud Sync über mehrere Geräte
- Loading / Empty / Error States

### C. Outfit Stylist

- Anlass auswählen
- Wetter/Temperatur berücksichtigen
- echte Wardrobe Items verwenden
- mindestens ein valides Outfit generieren
- erklären, warum das Outfit passt
- Alternative generieren
- Outfit speichern
- Feedback geben: gefällt / gefällt nicht

### D. OmniSwap

- vorhandenes Wardrobe Item als Listing veröffentlichen
- Listing bearbeiten / pausieren / löschen
- andere Listings entdecken
- Listing speichern
- Tausch-Angebot senden
- Angebot annehmen / ablehnen / zurückziehen
- Trade-Status nachvollziehen
- abgeschlossenen Trade markieren
- Nutzer bewerten
- Nutzer / Listing melden
- Nutzer blockieren

### E. Notifications

- neues Swap-Angebot
- Angebot angenommen / abgelehnt
- Trade Status
- mindestens Deep Link zum relevanten Screen

### F. Profil & Kontrolle

- Profil ansehen / bearbeiten
- Style-Präferenzen ansehen / bearbeiten
- Swap Reputation
- Datenschutzeinstellungen
- Accountlöschung

### G. Sicherheit / Betrieb

- Firestore Security Rules
- Storage Security Rules
- serverseitige Validierung kritischer Aktionen
- Crash Reporting
- grundlegende Analytics
- Release Monitoring
- Produktionskonfiguration

---

# 2. SHOULD HAVE für Release 1, falls Kern stabil ist

Diese Punkte dürfen Release 1 verbessern, aber keinen instabilen Kern kaschieren.

- Favoriten im Wardrobe
- Outfit-Historie
- Outfit-Kategorien / gespeicherte Looks
- manuelle Stadt statt GPS
- einfache Wardrobe Analytics
- „wenig genutzt“-Hinweise
- Circular Impact nach echten Swaps
- Wunschkategorien im OmniSwap
- einfache Recommendation „OmniSwap zuerst prüfen“

---

# 3. NICHT MVP-KRITISCH

Diese Funktionen bleiben Backlog, bis die Kernschleife stabil ist.

## 3D / Try-On

- echter 3D-Avatar
- fotorealistisches Virtual Try-On
- vollständige Körpervermessung
- AR-Anprobe

## Shop

- große Händler-Aggregation
- Preisvergleich über viele Shops
- komplexe Affiliate Engine
- Echtzeit-Deals über viele Händler

## Social

- öffentlicher Outfit Feed
- Follower-System
- Kommentare
- Creator Profiles
- Challenges

## Monetarisierung

- Premium-Abo
- Boosted Listings
- bezahlte Platzierungen

Diese Dinge werden erst umgesetzt, wenn Retention und Kernnutzen messbar sind.

---

# 4. MVP-Scope nach vorhandenen Screens

| Bestehender Bereich | Release-Entscheidung                                    |
| ------------------- | ------------------------------------------------------- |
| Schrank             | **MVP Kern – komplett real machen**                     |
| Stylist             | **MVP Kern – komplett real machen**                     |
| OmniSwap            | **MVP Kern – komplett real machen**                     |
| Profil              | **MVP Kern – Account/Style/Privacy real machen**        |
| Shop                | **UI kann bleiben, aber nicht Release-kritisch**        |
| Smart Investment    | **später / MVP+**                                       |
| 3D Avatar           | **als Preview kennzeichnen oder für MVP zurückstellen** |
| Eco Impact          | **nur mit echten Daten anzeigen**                       |

---

# 5. Was aus dem aktuellen Prototyp entfernt oder entschärft werden muss

Vor Production dürfen folgende Dinge nicht als echte Funktion wirken:

- zufällige Style-DNA-Ergebnisse
- zufälliges Wetter
- statische Outfit-Empfehlungen, die nicht aus dem Wardrobe kommen
- hardcodierte Smart-Investment-Scores
- Mock-Swap-User als echte Community
- Mock-Eco-Zähler als Live-Daten
- 2D-Perspektive als echter 3D-Avatar vermarkten
- Dummy Login, der beliebige Credentials akzeptiert

Optionen:

1. Funktion echt machen.
2. klar als Demo/Preview markieren.
3. aus Production ausblenden.

---

# 6. MVP-Release Gate

Ein Release Candidate darf erst erstellt werden, wenn diese End-to-End-Journeys auf realen Testgeräten funktionieren:

## Journey 1 – neuer Nutzer

```text
Install
→ Registrieren
→ E-Mail bestätigen
→ Onboarding
→ erstes Item
→ AI Analyse
→ speichern
```

## Journey 2 – Outfit

```text
Stylist
→ Anlass
→ Wetter
→ echtes Outfit aus Wardrobe
→ speichern
```

## Journey 3 – Swap

```text
Wardrobe Item
→ Listing
→ zweiter Account
→ Angebot
→ akzeptieren
→ Status
→ abgeschlossen
→ Review
```

## Journey 4 – Sicherheit

```text
Nutzer B versucht private Daten von Nutzer A zu ändern
→ Zugriff wird serverseitig abgelehnt
```

## Journey 5 – Accountkontrolle

```text
Profil
→ Account löschen
→ Auth entfernt
→ personenbezogene Daten nach Policy gelöscht/anonymisiert
→ erneuter Login nicht möglich
```

---

# 7. Definition of MVP Complete

MVP ist **nicht** vollständig, nur weil alle Screens vorhanden sind.

MVP Complete bedeutet:

- [ ] keine Kernjourney benötigt Mockdaten
- [ ] Daten bleiben nach App-Neustart erhalten
- [ ] Daten sind auf zweitem Gerät verfügbar
- [ ] Security Rules sind getestet
- [ ] kritische Fehler werden erfasst
- [ ] Offline-/Fehlerzustände blockieren die App nicht dauerhaft
- [ ] reale Nutzer können OmniSwap vollständig durchlaufen
- [ ] Datenschutz- und Löschpfade funktionieren
- [ ] echte Store-Builds laufen auf Android und iOS
- [ ] Beta wurde mit echten Testnutzern durchgeführt

---

# 8. Scope Change Regel

Neue Idee während MVP-Entwicklung?

Dann prüfen:

```text
Ist sie nötig, damit eine MUST-HAVE-Journey funktioniert?
```

Wenn nein:

```text
→ Backlog
```

Wenn ja:

```text
→ Roadmap aktualisieren
→ Daten-/Security-Auswirkung prüfen
→ dann implementieren
```
