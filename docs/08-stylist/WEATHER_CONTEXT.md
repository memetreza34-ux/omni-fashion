# Omni Fashion – Wetterkontext für Outfit-Ranking

## Ziel

Wetter soll echte Outfit-Entscheidungen beeinflussen, aber nicht die App-Architektur kontrollieren.

Darum gilt:

```text
Wetteranbieter
→ Trusted Backend
→ normalisierter WeatherContext
→ Outfit Engine
```

Der Outfit-Engine kennt keinen anbieterspezifischen JSON-Aufbau.

## MVP-Eingabe

Für den ersten produktiven Flow wird die Stadt manuell eingegeben.

Vorteile:

- keine Standortberechtigung nötig
- Nutzer kann bewusst einen anderen Ort planen
- weniger Privacy-/Permission-Komplexität
- GPS kann später optional ergänzt werden

Beispiel:

```text
Berlin
→ Geocoding
→ aktuelle Wetterdaten
→ WeatherContext
```

## WeatherContext

Normalisierte Felder:

- city
- countryCode
- latitude / longitude
- observedAt
- temperatureC
- apparentTemperatureC
- precipitationMm
- rainMm
- windSpeedKmh
- weatherCode
- precipitationProbabilityPercent
- temperatureBand
- outerwearNeed
- rainProtectionRecommended
- schemaVersion

## Kleidungsrelevante Signale

### Temperaturband

```text
very-cold
cold
cool
mild
warm
hot
```

### Outerwear Need

```text
required
recommended
optional
avoid
```

### Regen

`rainProtectionRecommended` kombiniert aktuellen Niederschlag und Tageswahrscheinlichkeit zu einem einfachen Ranking-Signal.

## Outfit-Integration

Wetter erzeugt zuerst einen Temperatur-/Saisonkontext.

Danach wird das normale deterministische Outfit-Ranking ausgeführt.

Zusätzliche Anpassung:

- kaltes Wetter ohne Outerwear → deutlicher Abzug
- kaltes Wetter mit Outerwear → Bonus
- heißes Wetter mit unnötiger Outerwear → Abzug
- Regenrisiko → Schutzsignale fließen in Saison-/Wetter-Fit ein

Die anderen Score-Bereiche bleiben unverändert:

- Style-DNA
- Farbharmonie
- Anlass
- Datenqualität

Wetter darf ein stilistisch schlechtes Outfit nicht künstlich perfekt machen.

## Privacy

Die App überträgt für diesen MVP-Schritt eine vom Nutzer eingegebene Stadt an das Trusted Backend.

GPS-Koordinaten werden nicht aus dem Gerät abgefragt.

Vor kommerziellem Launch müssen Anbieterbedingungen, Datenverarbeitung, Datenschutzangaben und ggf. Production-Endpunkt erneut geprüft werden.

## Development Fallback

Wenn kein echter Trusted Backend verfügbar ist:

```text
kein Fake-Wetter
→ manuelle Saison bleibt aktiv
```

## Backend

Callable:

```text
getOutfitWeather({ city })
```

Ablauf:

```text
Auth prüfen
→ Stadt validieren
→ Geocoding
→ Forecast laden
→ Runtime Validation
→ WeatherContext normalisieren
→ Response
```

Der Command speichert aktuell keinen Standort dauerhaft in Firestore.

## Tests

Backend Unit Tests prüfen mindestens:

- Temperaturbänder
- kalte Bedingungen → Outerwear required
- Regen → Outerwear recommended
- starker Wind → Outerwear recommended
- heiß/trocken → Outerwear avoid
- Regenwahrscheinlichkeit → rainProtectionRecommended

## Definition of Done

- [x] provider-neutraler WeatherContext
- [x] Trusted Backend Callable
- [x] Geocoding + Forecast Adapter
- [x] Timeout / Input Validation
- [x] Weather Normalization
- [x] Backend Unit Tests
- [x] Client Runtime Validation
- [x] Stylist Weather Panel
- [x] wetterabhängiger Outfit-Ranking Wrapper
- [x] manueller Saison-Fallback
- [ ] Functions Export/Stylist-Patch im gemeinsamen Branch final CI-verifizieren
- [ ] kommerzielle Provider-/Datenschutzprüfung vor Release
- [ ] GPS nur später optional prüfen
