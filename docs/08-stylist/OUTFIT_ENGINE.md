# Omni Fashion – Outfit Engine

## Ziel

Der Stylist kombiniert ausschließlich Kleidungsstücke, die der Nutzer wirklich im digitalen Schrank besitzt.

```text
Wardrobe
+ StyleProfile
+ Anlass
+ Saison/Wetter
→ vollständige Kombinationen
→ Ranking
→ nachvollziehbarer Match-Score
```

## Kein Zufalls-Stylist mehr

Entfernt wurde der alte Produktpfad aus:

- hardcodierten Unsplash-Outfits
- Zufallsauswahl
- zufälligem Wetter
- separatem StyleDecider-Demo-Flow

Wenn ein vollständiges Outfit nicht möglich ist, zeigt Omni Fashion fehlende Kategorien statt ein Demo-Outfit zu erfinden.

## Unterstützte Basis-Outfits

### Separates

```text
Top
+ Bottom
+ Shoes
+ optional Outerwear
+ optional Accessory
```

### Dress

```text
Dress
+ Shoes
+ optional Outerwear
+ optional Accessory
```

`Dress` wurde deshalb als echte Wardrobe-Kategorie ergänzt.

## Score

Der aktuelle Score besteht aus:

```text
32 % Style-DNA Match
24 % Farbharmonie
24 % Anlass-Fit
12 % Saison-Fit
 8 % Datenqualität
```

Diese Gewichtung ist Version 1 des deterministischen Engines und wird später mit realem Nutzerfeedback evaluiert.

## Style-DNA Match

Verwendet:

- bevorzugte Styles
- Top-Styles aus StyleProfile
- erkannte Style-Tags der Kleidungsstücke

Explizite Nutzerpräferenzen bleiben wichtiger als automatisch erkannte Tags.

## Farbe

Berücksichtigt:

- Lieblingsfarben
- Avoid-Farben
- neutrale Farben
- Paarharmonie innerhalb des Outfits

Die aktuelle Logik ist bewusst konservativ und behauptet keine wissenschaftlich exakte Farbtheorie.

## Anlass

Aktuelle MVP-Anlässe:

- Alltag
- Büro
- Date
- Sport
- Party

Style-Tags, Subcategory, Name und Material können Anlasssignale liefern.

## Saison

Bis die echte Wetterintegration fertig ist, wählt der Nutzer die Saison selbst.

Es gibt **kein Zufallswetter** mehr.

Regel:

```text
item.season == gewählte Saison
oder item.season == All
→ hoher Saison-Fit
```

## Datenqualität

Ein Outfit bekommt etwas höhere Zuverlässigkeit, wenn Items:

- erfolgreich analysiert wurden
- echte Farbe besitzen
- Material besitzen
- Style-Tags besitzen

Datenqualität darf niemals einen schlechten Style-/Anlass-Fit überstimmen.

## Kombinatorik

Um bei großen Kleiderschränken keine unkontrollierte Explosion zu erzeugen, werden zunächst die besten Kandidaten pro Kategorie vorselektiert.

Danach entstehen Kombinationen aus den Top-Kandidaten.

MVP-Limit:

```text
max. 10 Kandidaten pro Kategorie vor Kombination
max. 30 Resultate auf Engine-Ebene
UI aktuell max. 12 Resultate
```

## Optional Layers

Outerwear und Accessory sind optional.

Der Engine wählt pro Basisoutfit die beste Ergänzung anhand von:

- Item-PreScore
- Farbharmonie zum Basisoutfit
- Anlass

Für Sport wird aktuell keine normale Outerwear automatisch ergänzt.

## Fehlende Kategorien

Beispiele:

```text
keine Shoes
→ Shoes fehlt

kein Dress und kein Top
→ Top fehlt

kein Dress und kein Bottom
→ Bottom fehlt
```

Damit kann später Smart Shopping / OmniSwap direkt an echte Wardrobe-Gaps anschließen.

## UI

Der echte Stylist zeigt:

- reale Wardrobe-Bilder
- Gesamt-Match
- Style-DNA Score
- Farbharmonie
- Anlass-Fit
- Saison-Fit
- Datenqualität
- kurze Gründe
- echte Alternativen

## Bewusste Grenzen von V1

Noch nicht enthalten:

- Live-Wetter
- Körper-/Fit-Maße
- Outfit-Historie
- gespeicherte Outfits
- Like/Dislike/Worn-Feedback
- Konfliktregeln für Muster
- komplexe Materialkombinationen
- Anlass-Untertypen
- Reise/Koffer-Kontext
- KI-Erklärungstext

Diese Punkte werden schrittweise auf dem deterministischen Fundament ergänzt.

## Definition of Done V1

- [x] echte Wardrobe als Input
- [x] echtes StyleProfile als Input
- [x] Dress- und Separates-Flow
- [x] Anlassfilter/-ranking
- [x] manuelle Saison
- [x] Match-Breakdown
- [x] fehlende Kategorien
- [x] reale Bilder
- [x] Alternativen
- [x] kein Zufallswetter
- [x] keine hardcodierten Produkt-Outfits
- [ ] CI auf aktuellem Engine-Stand vollständig grün bestätigen
- [ ] Dress durch Security Rules/Editor vollständig ziehen
- [ ] Engine Unit Tests ergänzen
- [ ] Outfits speichern
- [ ] Feedbacksignale
- [ ] echtes Wetter
