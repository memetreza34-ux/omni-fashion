# Omni Fashion – Product Foundation

## Status

**Arbeitsstand:** verbindliche Produktbasis für die nächste Entwicklungsphase.

Diese Datei darf später angepasst werden, aber Änderungen an Kernpositionierung, MVP oder Hauptjourneys müssen bewusst dokumentiert werden.

---

## 1. Das Problem

Viele Nutzer besitzen genügend Kleidung, nutzen aber nur einen Teil davon effektiv.

Typische Probleme, die Omni Fashion lösen soll:

- „Was soll ich heute anziehen?“
- vorhandene Kleidungsstücke werden vergessen
- neue Käufe passen nicht gut zum bestehenden Schrank
- Outfits werden nicht systematisch aus dem eigenen Bestand gebaut
- ungenutzte Kleidung liegt herum
- Second-Hand/Swap ist von der eigenen Wardrobe getrennt
- klassische Fashion-Apps lösen nur einzelne Teile des Problems

Omni Fashion soll diese Probleme nicht als getrennte Tools lösen, sondern über **einen gemeinsamen digitalen Kleiderschrank**.

---

## 2. Produktversprechen

### Kurzform

> **Omni Fashion macht aus deinem Kleiderschrank ein intelligentes System: besser kombinieren, gezielter ergänzen und ungenutzte Kleidung tauschen.**

### Technische Übersetzung

Ein gemeinsamer Wardrobe-Datensatz versorgt:

1. Outfit-Empfehlungen
2. Style-Profil
3. OmniSwap
4. Smart Shopping
5. Wardrobe Analytics

---

## 3. Haupt-USP

Nicht nur „KI-Stylist“ und nicht nur „digitaler Schrank“.

Der Haupt-USP ist die Verbindung:

```text
OWN
→ STYLE
→ SWAP
→ BUY BETTER
```

### Bedeutet konkret

- **OWN:** Kleidung digitalisieren und verstehen
- **STYLE:** aus dem eigenen Bestand Outfits bauen
- **SWAP:** ungenutzte Teile direkt aus dem eigenen Schrank anbieten
- **BUY BETTER:** nur Lücken ergänzen, die tatsächlich neue Outfits ermöglichen

Die Stärke entsteht aus der gemeinsamen Datenbasis.

---

## 4. Produktprinzipien

### 4.1 Wardrobe First

Der digitale Kleiderschrank ist das Fundament der App.

### 4.2 Real before Fancy

Echte Logik vor zusätzlichen Demo-Effekten.

### 4.3 Circular First

Vor einem Neukauf kann OmniSwap eine passende Alternative anbieten.

### 4.4 Explainable Recommendations

Empfehlungen sollen begründen können, warum sie passen.

### 4.5 User Control

KI darf Vorschläge machen; Nutzer können korrigieren, ablehnen und Präferenzen steuern.

### 4.6 Premium but Clear

Hochwertiges Design ohne unnötige visuelle Komplexität.

### 4.7 Privacy by Design

Fotos, Standort, Körperdaten und Marketplace-Daten werden nur verarbeitet, wenn sie für einen klaren Zweck nötig sind.

---

## 5. Primäre Nutzerprobleme nach Priorität

### P1 – Outfit-Entscheidung

Nutzer will schnell ein gutes Outfit aus bereits vorhandenen Teilen finden.

### P2 – Wardrobe Memory

Nutzer will wissen, was er besitzt und welche Teile wenig genutzt werden.

### P3 – Ungenutzte Kleidung

Nutzer will Kleidung sinnvoll weitergeben oder tauschen.

### P4 – Fehlkäufe

Nutzer will erkennen, welches neue Kleidungsstück den vorhandenen Schrank wirklich verbessert.

### P5 – Stil verstehen

Nutzer will sein eigenes Stilprofil besser verstehen und weiterentwickeln.

---

## 6. Zielgruppen – Produktsegmente

Die App wird zunächst nicht über starre Altersgruppen definiert, sondern über Probleme und Verhalten.

### Segment A – Outfit Seeker

Besitzt viele Kleidungsstücke, hat aber regelmäßig Entscheidungsprobleme.

Wichtigste Funktionen:

- Wardrobe
- Stylist
- Wetter/Anlass
- gespeicherte Outfits

### Segment B – Style Improver

Will einen konsistenteren Stil aufbauen.

Wichtigste Funktionen:

- Style-Profil
- Outfit Feedback
- Smart Investment
- Wardrobe Gaps

### Segment C – Circular Fashion User

Will ungenutzte Kleidung tauschen statt wegwerfen oder neu kaufen.

Wichtigste Funktionen:

- OmniSwap
- Reputation
- Wunschkategorien
- Circular Impact

### Segment D – Intentional Shopper

Will weniger Fehlkäufe machen.

Wichtigste Funktionen:

- Gap Analysis
- Outfit Unlock Score
- Swap-before-Shop
- Preis-/Nutzen-Verhältnis

---

## 7. Launch-Markt

Der endgültige kommerzielle Launch-Markt ist noch nicht formal beschlossen.

Der aktuelle Prototyp ist überwiegend deutschsprachig. Deshalb gilt technisch:

- Deutsch kann erste Produktsprache sein.
- Keine Architektur darf Deutschland als einzigen möglichen Markt hart codieren.
- Währung, Maße, Sprache, Standort und rechtliche Texte müssen später lokalisierbar sein.

---

## 8. Kernschleife

```text
1. Nutzer fügt Kleidung hinzu
2. App versteht die Kleidung besser
3. Stylist erzeugt nützliche Outfit-Vorschläge
4. Nutzer speichert / lehnt ab / nutzt Empfehlung
5. Präferenzen werden besser
6. selten genutzte Teile werden sichtbar
7. OmniSwap bietet Weiterverwendung
8. Wardrobe Gaps werden erkannt
9. Nutzer tauscht oder ergänzt gezielt
10. der Kleiderschrank verbessert sich
```

Das ist die wichtigste Schleife des Produkts.

---

## 9. Warum OmniSwap strategisch wichtig ist

OmniSwap soll kein separater Marktplatz-Tab bleiben.

Er wird aus dem Kleiderschrank gespeist:

```text
Wardrobe Item
→ wenig genutzt / Nutzer möchte es abgeben
→ Listing
→ Match / Angebot
→ Trade
→ Item verlässt Wardrobe
```

Dadurch verbindet Omni Fashion Styling mit Circular Fashion.

---

## 10. Warum Smart Shopping strategisch wichtig ist

Shop-Empfehlungen sollen nicht einfach Produkte anzeigen.

Die Kernfrage lautet:

> **Welches fehlende Teil erhöht den Nutzwert meines vorhandenen Kleiderschranks am stärksten?**

Beispiel:

```text
Weiße Sneaker
→ passen zu 12 vorhandenen Kombinationen
→ hoher Style Match
→ ganzjährig nutzbar
→ kein ähnliches Item vorhanden
```

Dann ist die Empfehlung besser begründbar als ein generischer Fashion Feed.

---

## 11. Was Omni Fashion NICHT sein soll

Omni Fashion soll vor dem ersten stabilen Release nicht zu Folgendem werden:

- allgemeines soziales Netzwerk
- TikTok für Outfits
- kompletter E-Commerce-Marktplatz mit eigenem Zahlungsverkehr
- 3D-Metaverse
- vollwertige virtuelle Anprobe als Kernfeature
- beliebiger Fashion-News-Feed
- riesige Sammlung voneinander unabhängiger KI-Gimmicks

Diese Dinge können später geprüft werden, aber sie dürfen die Kernschleife nicht verdrängen.

---

## 12. North-Star-Logik

Eine einzige Kennzahl reicht nicht für alle Phasen, aber die wichtigste Produktfrage lautet:

> **Erzeugt Omni Fashion regelmäßig eine nützliche Aktion aus dem echten Kleiderschrank des Nutzers?**

Geeignete Kernmetriken:

- Nutzer mit mindestens einem echten Wardrobe Item
- Nutzer mit erfolgreicher Outfit-Empfehlung
- Outfit Save Rate
- Outfit Regenerate/Reject Rate
- aktive Wardrobe Items pro Nutzer
- Swap Listings aus echten Wardrobe Items
- abgeschlossene Swaps
- Wiederkehr D1 / D7 / D30

Später kann daraus eine konkrete North-Star-Metric abgeleitet werden.

---

## 13. Erfolg für Release 1

Release 1 ist produktseitig erfolgreich, wenn ein echter Nutzer ohne interne Hilfe diese Kette durchführen kann:

```text
registrieren
→ Style-Profil anlegen
→ echte Kleidung hochladen
→ KI-Daten bestätigen
→ echtes Outfit aus dem eigenen Schrank erhalten
→ Item auf OmniSwap anbieten
→ mit echtem zweiten Nutzer ein Angebot austauschen
→ Benachrichtigung erhalten
→ Vorgang abschließen
→ Account und Daten kontrollieren/löschen können
```

Wenn diese Kette nicht zuverlässig funktioniert, sind zusätzliche Features sekundär.

---

## 14. Aktuelle Produktentscheidung

Der nächste Entwicklungsmodus lautet:

> **Vom überzeugenden Prototyp zur echten, zusammenhängenden Anwendung.**

Das bedeutet für alle vorhandenen Bereiche:

```text
Mock UI
→ echte Domain Models
→ Backend
→ echte Nutzerdaten
→ Security
→ Tests
→ Telemetrie
→ Release Readiness
```
