# Omni Fashion – AI Provider Decision

**Entscheidungsstand:** 16. August 2026

Diese Entscheidung gilt für die **erste Development-Implementierung** der Kleidungsanalyse. Sie ist bewusst hinter einem Provider-Adapter gekapselt und kann später geändert werden.

## Auswahl

```text
Provider: Google Gemini API
SDK: @google/genai
Modell: gemini-3.6-flash
Verwendung: serverseitig im Trusted Backend
```

## Warum dieses Modell für den ersten Versuch

Für Omni Fashion benötigen wir bei der Kleidungsanalyse:

- Bildverständnis statt Bildgenerierung
- strukturierte JSON-Ausgabe
- gute multimodale Erkennung
- niedrige genug Latenz für einen Upload-Flow
- ein stabiles Produktionsmodell statt Preview/Experimental
- serverseitige Nutzung mit austauschbarer Provider-Schicht

`gemini-3.6-flash` ist zum Entscheidungszeitpunkt ein stabiles GA-Modell mit Bild-Input und Structured Outputs.

## Warum NICHT das Image-Generation-Modell

Omni Fashion will in diesem Schritt ein vorhandenes Kleidungsfoto **analysieren**, nicht ein neues Bild erzeugen.

Deshalb ist z. B. ein Nano-Banana-Bildgenerierungsmodell nicht die Standardwahl für diesen Analysepfad.

Virtual Try-On / generative Outfit-Vorschauen sind ein separates späteres Feature.

## SDK

Für JavaScript/TypeScript verwenden wir die aktuelle Google-GenAI-Linie:

```text
@google/genai
```

Keine neue Implementierung auf der alten, nicht mehr aktiv gepflegten `@google/generative-ai`-Bibliothek beginnen.

Zum Entscheidungszeitpunkt recherchierte Paketstände:

```text
@google/genai       2.15.0
firebase-functions  7.3.2
firebase-admin      14.2.0
```

Diese Versionen werden **erst mit dem tatsächlichen Functions-Paket und Lockfile verbindlich**. Vor Installation erneut prüfen, falls später weitergearbeitet wird.

## Sicherheitsregel

Der Gemini API Key wird niemals als:

```text
EXPO_PUBLIC_*
```

in die App gelegt.

Er gehört in das Secret Management des Trusted Backends.

## Provider Interface

Die Business-Logik darf später nicht direkt überall `GoogleGenAI` importieren.

Ziel:

```text
GarmentVisionProvider
  analyze(image, contract)
```

Erste Implementierung:

```text
GeminiGarmentVisionProvider
```

Später könnte ohne Client-Umbau eine andere Implementierung getestet werden.

## Modellstring

Wir verwenden einen konkreten stabilen Modellstring:

```text
gemini-3.6-flash
```

Kein `latest`-Alias für produktive Auswertungen, weil ein Alias still auf eine andere Modellversion wechseln kann.

## Structured Output

Der Provider wird auf ein festes JSON-Schema beschränkt.

Trotzdem gilt weiterhin:

```text
Gemini Structured Output
→ Server Runtime Validation
→ Domain Normalization
→ erst danach Firestore
```

Structured Output ersetzt keine eigene Validierung.

## Datenschutz / kommerzieller Launch

Die Provider-Auswahl für Development ist **noch keine finale Datenschutz-/Datenresidenz-Freigabe für den kommerziellen Launch**.

Vor Production werden separat geprüft:

- Vertrags-/DPA-Situation
- tatsächliche Datenregion und Übertragung
- Aufbewahrung / Logging
- welche Nutzerdaten neben dem Bild übertragen werden
- Datenschutzerklärung / Store Privacy Angaben
- ob für den Launch eine Vertex-/Enterprise-Konfiguration besser geeignet ist

## Wechselkriterien

Wir wechseln oder vergleichen den Provider, wenn mindestens einer dieser Punkte nicht ausreichend ist:

- Kategorie-Erkennung
- Farb-Erkennung
- Material-Erkennung
- Halluzinationen bei Marken
- Latenz
- Kosten
- Ausfallrate
- Datenschutz-/Datenresidenzanforderungen

Die Entscheidung wird mit einem echten Omni-Fashion-Evaluation-Dataset getroffen, nicht anhand einzelner schöner Demo-Bilder.
