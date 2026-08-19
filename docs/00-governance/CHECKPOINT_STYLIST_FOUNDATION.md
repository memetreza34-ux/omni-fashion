# Omni Fashion – Checkpoint: Wardrobe, AI und Stylist Foundation

**Stand:** 16. August 2026

Dieser Checkpoint ergänzt den laufenden `ROADMAP_STATUS.md` und hält den aktuell gebauten Produktstand fest.

## Fertig gebaut / strukturell vorhanden

### Produkt

- Wardrobe als Source of Truth
- StyleProfile als strukturierte Nutzerpräferenz
- deterministischer Outfit Engine
- Trusted Backend für sensible KI-/Wetterpfade

### Wardrobe

- Cloud-/Development-Pfade getrennt
- Firestore Live-Sync
- private Storage-Bilder
- erweiterte Kleidungsmetadaten
- `Dress` als eigene Outfit-Kategorie im Zielmodell

### AI Garment Analysis

- Callable Function
- Gemini Provider Adapter
- Structured Output
- Runtime Validation
- Confidence + Field Confidence
- stabile AI-Fehlercodes
- servergeschützter AI-Lifecycle
- UI Status + Retry

### Style-DNA

- echte Präferenzabfrage statt Zufallsscan
- Style-, Farb-, Fit- und Achsen-Signale
- Wardrobe Intelligence
- Cloud-/Development-Persistenz
- Security Tests

### Outfit Engine

- reale Wardrobe IDs
- Top + Bottom + Shoes
- Dress + Shoes
- optionale Outerwear / Accessories
- Anlass
- manuelle Saison
- Score Breakdown
- fehlende Kategorien
- echte Alternativen

### Saved Outfits

Codebasis vorhanden für:

- SavedOutfit Model
- Cloud Service
- Development Service
- Context
- Saved-Outfits UI
- Like / Dislike / Worn
- Security-Testdatei

### Wetter

Codebasis vorhanden für:

- provider-neutralen WeatherContext
- Trusted Backend Callable
- Stadt-Geocoding
- aktuelle Wetterdaten
- Temperaturband
- Outerwear-Signal
- Regen-Signal
- Client Runtime Validation
- Weather-Aware Ranking Wrapper
- Stylist Weather Panel
- Backend Unit Tests

## Aktuell laufende Integrationskante

Die letzten Patch-Schritte verbinden auf demselben Branch:

1. `Dress` mit Editor + Firestore Rules
2. SavedOutfitsProvider mit App-Layout und Stylist
3. Saved-Outfit Security Rules mit CI
4. `getOutfitWeather` Export mit Stylist
5. Wetterranking mit echtem Outfit Engine
6. Entfernung des alten `StyleDeciderModal` Demo-Pfads

Diese Punkte werden erst nach gemeinsamem CI-Head als vollständig abgeschlossen markiert.

## Externe Blocker

Noch nicht innerhalb des Repos lösbar:

- Firebase Dev-Projektwerte
- Firebase Prod-Projektwerte
- Gemini Secret für echtes Deployment
- reales Functions Deployment
- Android Device Test
- iOS Device Test
- App Check Production Setup

## Nächster großer Produktblock nach grünem Checkpoint

```text
Wardrobe Item
→ Auf OmniSwap anbieten
→ Trusted Listing Publisher
→ öffentliche Listing-Snapshot-Daten
→ Marketplace Feed
→ Trusted Swap Offer
→ Accept / Decline
→ Trade Transaction
→ Trust & Safety
```

Dabei gilt weiterhin:

> OmniSwap darf kein zweites Kleidungs-Datenmodell neben Wardrobe aufbauen.
